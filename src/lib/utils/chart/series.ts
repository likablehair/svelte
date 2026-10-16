import type { Chart, Plugin, ScriptableContext, TooltipItem } from 'chart.js';
import type { ChartTheme, ChartTable } from './theme.js';
import { axisFormatter, valueFormatter } from './format.js';
import type { ChartData, ChartFormat, ChartLegendItem, ChartSeries } from './types.js';

export interface PreparedSeries {
	series: ChartSeries;
	index: number;
	key: string;
	label: string;
	css: string | string[];
	gradient: boolean;
	line: boolean;
}

const LIBRARY_KEYS = ['label', 'data', 'color', 'type', 'axis', 'format', 'dashed', 'area'] as const;

export function passthrough(series: ChartSeries): Record<string, unknown> {
	const extra: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(series)) {
		if (!(LIBRARY_KEYS as readonly string[]).includes(key)) extra[key] = value;
	}
	return extra;
}

export function prepareSeries(data: ChartData, kind: 'bar' | 'line', theme: { palette(index: number): string }): PreparedSeries[] {
	const withoutColor = data.datasets.filter((series) => series.color === undefined);
	let palette = 0;
	return data.datasets.map((series, index) => {
		const line = kind === 'line' || series.type === 'line';
		const gradient =
			series.color === undefined && withoutColor.length === 1 && (kind === 'line' ? true : series.type !== 'line');
		let css: string | string[];
		if (series.color !== undefined) css = series.color;
		else if (gradient)
			css = line
				? 'linear-gradient(90deg, var(--_gradient-from), var(--_gradient-via), var(--_gradient-to))'
				: 'linear-gradient(0deg, var(--_gradient-from), var(--_gradient-to))';
		else css = theme.palette(palette++);
		return {
			series,
			index,
			key: `${index}-${series.label ?? ''}`,
			label: series.label ?? `${index + 1}`,
			css,
			gradient,
			line
		};
	});
}

export function swatchOf(prepared: PreparedSeries[], datasetIndex: number, index: number): string {
	const css = prepared[datasetIndex]?.css ?? '';
	return Array.isArray(css) ? (css[index % css.length] ?? '') : css;
}

export function legendOf(prepared: PreparedSeries[]): Omit<ChartLegendItem, 'hidden'>[] {
	return prepared.map((p) => ({ key: p.key, label: p.label, color: Array.isArray(p.css) ? (p.css[0] ?? '') : p.css }));
}

export function solidOf(theme: ChartTheme, p: PreparedSeries): string {
	if (p.gradient) return theme.color(theme.value(p.line ? 'gradient-via' : 'gradient-to'));
	return theme.color(Array.isArray(p.css) ? (p.css[0] ?? '') : p.css);
}

type Area = { left: number; right: number; top: number; bottom: number };

function linear(chart: Chart, area: Area, horizontal: boolean, stops: [number, string][]) {
	const gradient = horizontal
		? chart.ctx.createLinearGradient(area.left, 0, area.right, 0)
		: chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
	for (const [offset, color] of stops) gradient.addColorStop(offset, color);
	return gradient;
}

export function barColors(theme: ChartTheme, p: PreparedSeries, horizontal: boolean) {
	if (p.gradient) {
		const from = theme.value('gradient-from');
		const to = theme.value('gradient-to');
		const fill = (alpha: number) => {
			const stops: [number, string][] = [
				[0, theme.alpha(from, alpha)],
				[1, theme.alpha(to, alpha)]
			];
			return (context: ScriptableContext<'bar'>) =>
				context.chart.chartArea ? linear(context.chart, context.chart.chartArea, horizontal, stops) : stops[0][1];
		};
		return { backgroundColor: fill(1), hoverBackgroundColor: fill(0.82) };
	}
	if (Array.isArray(p.css))
		return {
			backgroundColor: p.css.map((c) => theme.color(c)),
			hoverBackgroundColor: p.css.map((c) => theme.alpha(c, 0.82))
		};
	return { backgroundColor: theme.color(p.css), hoverBackgroundColor: theme.alpha(p.css, 0.82) };
}

export function lineColors(theme: ChartTheme, p: PreparedSeries) {
	const solid = solidOf(theme, p);
	const base = p.gradient ? theme.value('gradient-from') : Array.isArray(p.css) ? (p.css[0] ?? '') : p.css;
	const areaStops: [number, string][] = [
		[0, theme.alpha(base, 0)],
		[1, theme.alpha(base, 0.35)]
	];
	const area = (context: ScriptableContext<'line'>) =>
		context.chart.chartArea ? linear(context.chart, context.chart.chartArea, false, areaStops) : areaStops[1][1];
	let stroke: string | ((context: ScriptableContext<'line'>) => CanvasGradient | string) = solid;
	if (p.gradient) {
		const stops: [number, string][] = [
			[0, theme.color(theme.value('gradient-from'))],
			[0.6, theme.color(theme.value('gradient-via'))],
			[1, theme.color(theme.value('gradient-to'))]
		];
		stroke = (context) =>
			context.chart.chartArea ? linear(context.chart, context.chart.chartArea, true, stops) : solid;
	}
	return {
		borderColor: stroke,
		backgroundColor: p.series.area ? area : solid,
		fill: p.series.area ? 'start' : false,
		pointBackgroundColor: solid,
		pointBorderColor: solid,
		pointHoverBackgroundColor: theme.color(theme.value('point-background')),
		pointHoverBorderColor: solid
	};
}

export function lineDataset(theme: ChartTheme, p: PreparedSeries, pointRadius: number) {
	return {
		...lineColors(theme, p),
		borderWidth: theme.length('line-width'),
		borderDash: p.series.dashed ? [6, 5] : [],
		borderCapStyle: 'round',
		tension: 0.35,
		cubicInterpolationMode: 'monotone',
		pointRadius,
		pointHoverRadius: 6,
		pointHoverBorderWidth: 3,
		pointHitRadius: 12
	};
}

export function formatOf(p: PreparedSeries | undefined, format: ChartFormat | undefined) {
	return p?.series.format ?? format;
}

export function tooltipCallbacks(prepared: PreparedSeries[], format: ChartFormat | undefined, locale: string) {
	const formatters = prepared.map((p) => valueFormatter(formatOf(p, format), locale));
	return {
		title: (items: TooltipItem<'bar' | 'line'>[]) => items[0]?.label ?? '',
		label: (item: TooltipItem<'bar' | 'line'>) => {
			const value = item.raw;
			return typeof value === 'number' ? formatters[item.datasetIndex](value) : '—';
		}
	};
}

export function cartesianScales(
	theme: ChartTheme,
	prepared: PreparedSeries[],
	options: { horizontal: boolean; stacked: boolean; format: ChartFormat | undefined; locale: string; beginAtZero: boolean }
) {
	const { horizontal, stacked, format, locale, beginAtZero } = options;
	const tick = {
		color: theme.color(theme.value('tick-color')),
		font: { family: theme.value('tick-font-family'), size: theme.length('tick-font-size') }
	};
	const grid = theme.color(theme.value('grid-color'));
	const right = prepared.find((p) => p.series.axis === 'right');
	const left = prepared.find((p) => p.series.axis !== 'right');
	const valueAxis = (fmt: ChartFormat | undefined, main: boolean) => ({
		type: 'linear',
		position: main ? (horizontal ? 'bottom' : 'left') : horizontal ? 'top' : 'right',
		stacked: main && stacked,
		beginAtZero,
		grid: main ? { color: grid, drawTicks: false } : { display: false },
		border: { display: false, dash: [3, 4] },
		ticks: { ...tick, padding: 8, maxTicksLimit: 5, callback: axisFormatter(fmt, locale) }
	});
	const category = {
		type: 'category',
		stacked,
		grid: { display: false },
		border: { display: false },
		ticks: { ...tick, padding: 6, maxRotation: 0, autoSkipPadding: 12 }
	};
	const main = valueAxis(format ?? left?.series.format, true);
	const scales: Record<string, unknown> = horizontal ? { y: category, x: main } : { x: category, y: main };
	if (right) scales[horizontal ? 'x1' : 'y1'] = valueAxis(right.series.format ?? format, false);
	return scales;
}

export function cartesianTable(data: ChartData, prepared: PreparedSeries[], format: ChartFormat | undefined, locale: string): ChartTable {
	const formatters = prepared.map((p) => valueFormatter(formatOf(p, format), locale));
	return {
		head: ['', ...prepared.map((p) => p.label)],
		rows: data.labels.map((label, row) => [
			label,
			...prepared.map((p, i) => {
				const value = p.series.data[row];
				return typeof value === 'number' ? formatters[i](value) : '—';
			})
		])
	};
}

export const glowPlugin: Plugin = {
	id: 'auroraGlow',
	beforeDatasetDraw(chart, args, options: { index?: number; color?: string; blur?: number }) {
		if (options.index !== args.index || !options.blur) return;
		chart.ctx.save();
		chart.ctx.shadowColor = options.color ?? 'transparent';
		chart.ctx.shadowBlur = options.blur;
	},
	afterDatasetDraw(chart, args, options: { index?: number; blur?: number }) {
		if (options.index !== args.index || !options.blur) return;
		chart.ctx.restore();
	}
};

export const crosshairPlugin: Plugin = {
	id: 'auroraCrosshair',
	beforeDatasetsDraw(chart, _args, options: { color?: string }) {
		const active = chart.tooltip?.getActiveElements() ?? [];
		if (!active.length || !options.color) return;
		const x = active[0].element.x;
		const { top, bottom } = chart.chartArea;
		chart.ctx.save();
		chart.ctx.strokeStyle = options.color;
		chart.ctx.lineWidth = 1;
		chart.ctx.beginPath();
		chart.ctx.moveTo(x, top);
		chart.ctx.lineTo(x, bottom);
		chart.ctx.stroke();
		chart.ctx.restore();
	}
};
