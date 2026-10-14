import { Chart } from 'chart.js';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import BarChart from '#lib/components/simple/charts/BarChart.svelte';
import { setMode } from '#lib/theme.svelte.js';
import type { ChartData, ChartItemClick, ChartTooltip } from '#lib/utils/chart/types.js';
import { renderWithDefaultLocale } from '../helpers.js';
import { cssColor, dragAcross, elementCenter, hover, rgbaOf } from '../charts.js';

const months: ChartData = {
	labels: ['Jan', 'Feb', 'Mar'],
	datasets: [{ label: 'Revenue', data: [1200, 2400, 1800] }]
};

const days: ChartData = { labels: ['A', 'B', 'C', 'D', 'E', 'F'], datasets: [{ data: [1, 2, 3, 4, 5, 6] }] };

const years: ChartData = {
	labels: ['Q1', 'Q2'],
	datasets: [
		{ label: '2025', data: [10, 20] },
		{ label: '2026', data: [15, 25] }
	]
};

function withChart(props: Record<string, unknown>) {
	const box: { chart?: Chart } = {};
	return {
		box,
		props: {
			...props,
			get chart() {
				return box.chart;
			},
			set chart(value: Chart | undefined) {
				box.chart = value;
			}
		}
	};
}

async function renderChart(props: Record<string, unknown>) {
	const { box, props: all } = withChart(props);
	const screen = await render(BarChart, all as unknown as ComponentProps<typeof BarChart>);
	await expect.poll(() => box.chart).toBeDefined();
	return { screen, chart: () => box.chart!, root: screen.container.querySelector<HTMLElement>('.aurora-bar-chart')! };
}

afterEach(() => setMode('system'));

describe('BarChart', () => {
	test('root with class and native attributes, canvas named by label, hidden table of formatted values', async () => {
		const { screen, root } = await renderChart({
			data: months,
			label: 'Revenue per month',
			format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
			class: 'app-chart',
			id: 'revenue'
		});
		expect(root).toHaveClass('aurora-chart', 'aurora-bar-chart', 'app-chart');
		expect(root).toHaveAttribute('id', 'revenue');
		await expect.element(screen.getByRole('img', { name: 'Revenue per month' })).toBeInTheDocument();
		const table = screen.getByRole('table', { name: 'Revenue per month' });
		await expect.element(table.getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument();
		await expect.element(table.getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
		await expect.element(table.getByRole('cell', { name: '€2,400' })).toBeInTheDocument();
	});

	test('one series without color gets the gradient; several take the data palette, resolved for the canvas', async () => {
		const single = await renderChart({ data: months });
		expect(typeof single.chart().data.datasets[0].backgroundColor).toBe('function');
		single.screen.unmount();

		const { chart, root } = await renderChart({ data: years });
		const [first, second] = chart().data.datasets.map((d) => d.backgroundColor as string);
		expect(first).toBe(rgbaOf(cssColor(root, 'var(--global-color-data-1)')));
		expect(second).toBe(rgbaOf(cssColor(root, 'var(--global-color-data-2)')));
	});

	test('color takes any CSS color, also tokens and arrays, and follows dark mode', async () => {
		const { chart, root } = await renderChart({
			data: {
				labels: ['A', 'B'],
				datasets: [
					{ label: 'One', data: [1, 2], color: 'var(--global-color-error)' },
					{ label: 'Two', data: [3, 4], color: ['#ff0000', 'var(--global-color-success)'] }
				]
			}
		});
		setMode('light');
		await expect.poll(() => chart().data.datasets[0].backgroundColor).toBe(rgbaOf(cssColor(root, 'var(--global-color-error)')));
		const light = chart().data.datasets[0].backgroundColor;
		expect(chart().data.datasets[1].backgroundColor).toEqual([
			'#ff0000',
			rgbaOf(cssColor(root, 'var(--global-color-success)'))
		]);
		setMode('dark');
		await expect.poll(() => chart().data.datasets[0].backgroundColor).not.toBe(light);
		expect(chart().data.datasets[0].backgroundColor).toBe(rgbaOf(cssColor(root, 'var(--global-color-error)')));
	});

	test('horizontal: categories on the vertical axis, one row each, and the chart grows with the rows', async () => {
		const { chart, root } = await renderChart({
			data: { labels: ['A', 'B', 'C', 'D', 'E', 'F'], datasets: [{ label: 'X', data: [1, 2, 3, 4, 5, 6] }] },
			horizontal: true,
			style: '--bar-chart-row-height: 30px; --bar-chart-axis-size: 20px'
		});
		expect(chart().options.indexAxis).toBe('y');
		expect(root).toHaveAttribute('data-rows');
		expect(root.querySelector('.aurora-chart-plot')!.getBoundingClientRect().height).toBe(200);
	});

	test('stacked puts the series on top of each other', async () => {
		const { chart } = await renderChart({ data: years, stacked: true });
		const scales = chart().options.scales as Record<string, { stacked?: boolean }>;
		expect(scales.x.stacked).toBe(true);
		expect(scales.y.stacked).toBe(true);
	});

	test('a series with type line and axis right is a line on a second axis with its own format', async () => {
		const { chart } = await renderChart({
			data: {
				labels: ['Q1', 'Q2'],
				datasets: [
					{ label: 'Total', data: [1000, 2000] },
					{ label: 'Share', data: [10, 20], type: 'line', axis: 'right', format: (v: number) => `${v}%` }
				]
			},
			format: { style: 'currency', currency: 'EUR' }
		});
		const line = chart().data.datasets[1] as { type?: string; yAxisID?: string };
		expect(line.type).toBe('line');
		expect(line.yAxisID).toBe('y1');
		const scales = chart().options.scales as Record<string, { position?: string; ticks: { callback: (v: number) => string } }>;
		expect(scales.y1.position).toBe('right');
		expect(scales.y1.ticks.callback(15)).toBe('15%');
		expect(scales.y.ticks.callback(1500)).toBe('€1.5K');
	});

	test('format: short on the value axis, full in the tooltip; the locale writes the numbers', async () => {
		const { chart, root } = await renderChart({
			data: months,
			format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
			locale: 'it'
		});
		const scales = chart().options.scales as Record<string, { ticks: { callback: (v: number) => string } }>;
		expect(scales.y.ticks.callback(1_200_000).replace(/\s/g, ' ')).toBe('1,2 Mln €');
		await expect
			.poll(() => {
				hover(chart(), 0, 1);
				return root.querySelector('.aurora-chart-tooltip-value')?.textContent?.replace(/\s/g, ' ');
			})
			.toBe('2400 €');
	});

	test('the tooltip is a card with the category and one row per series', async () => {
		const { chart, root } = await renderChart({ data: years });
		await expect
			.poll(() => {
				hover(chart(), 0, 1);
				return root.querySelector('.aurora-chart-tooltip-title')?.textContent;
			})
			.toBe('Q2');
		expect([...root.querySelectorAll('.aurora-chart-tooltip-item')].map((i) => i.textContent?.trim())).toEqual([
			'2025 20',
			'2026 25'
		]);
		expect(root.querySelector('.aurora-chart-tooltip')).toHaveAttribute('aria-hidden', 'true');
	});

	test('the tooltip lists the series in the order of datasets, also when a line is drawn over the bars', async () => {
		const { chart, root } = await renderChart({
			data: {
				labels: ['Q1', 'Q2'],
				datasets: [
					{ label: 'Total', data: [10, 20] },
					{ label: 'Share', data: [5, 6], type: 'line', axis: 'right' }
				]
			}
		});
		await expect
			.poll(() => {
				hover(chart(), 0, 1);
				return [...root.querySelectorAll('.aurora-chart-tooltip-label')].map((l) => l.textContent);
			})
			.toEqual(['Total', 'Share']);
	});

	test('tooltipSnippet replaces the content of the tooltip', async () => {
		const tooltipSnippet = createRawSnippet((tip: () => ChartTooltip) => ({
			render: () => `<b class="custom">${tip().title}: ${tip().items.map((i) => i.raw).join('+')}</b>`
		}));
		const { chart, root } = await renderChart({ data: years, tooltipSnippet });
		await expect
			.poll(() => {
				hover(chart(), 0, 0);
				return root.querySelector('.custom')?.textContent;
			})
			.toBe('Q1: 10+15');
	});

	test('legend: hidden with one series, shown with two; a click hides the series', async () => {
		const one = await renderChart({ data: months });
		expect(one.root.querySelector('.aurora-chart-legend')).toBeNull();
		one.screen.unmount();

		const { screen, chart, root } = await renderChart({ data: years });
		expect(root).toHaveAttribute('data-legend', 'bottom');
		const entry = screen.getByRole('button', { name: '2026' });
		await expect.element(entry).toHaveAttribute('aria-pressed', 'true');
		await entry.click();
		await expect.element(entry).toHaveAttribute('aria-pressed', 'false');
		await expect.poll(() => chart().isDatasetVisible(1)).toBe(false);
		await entry.click();
		await expect.poll(() => chart().isDatasetVisible(1)).toBe(true);
	});

	test('legend position and legend={false}', async () => {
		const top = await renderChart({ data: years, legend: 'top' });
		expect(top.root).toHaveAttribute('data-legend', 'top');
		expect(top.root.firstElementChild).toHaveClass('aurora-chart-legend');
		top.screen.unmount();
		const none = await renderChart({ data: years, legend: false });
		expect(none.root.querySelector('.aurora-chart-legend')).toBeNull();
	});

	test('legendSnippet replaces the legend and gets toggle', async () => {
		const legendSnippet = createRawSnippet(() => ({ render: () => '<p class="custom-legend">Legend</p>' }));
		const { root } = await renderChart({ data: years, legendSnippet });
		expect(root.querySelector('.custom-legend')).not.toBeNull();
		expect(root.querySelector('.aurora-chart-legend')).toBeNull();
	});

	test('onitemclick receives the clicked bar', async () => {
		const onitemclick = vi.fn<(item: ChartItemClick) => void>();
		const { chart } = await renderChart({ data: years, onitemclick });
		const { x, y } = elementCenter(chart(), 1, 0);
		chart().canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
		await expect.poll(() => onitemclick.mock.calls.length).toBe(1);
		const item = onitemclick.mock.calls[0][0];
		expect(item).toMatchObject({ index: 0, datasetIndex: 1, label: 'Q1', value: 15 });
		expect(item.event).toBeInstanceOf(MouseEvent);
	});

	test('dragging zooms and shows "Reset zoom", which brings back the whole chart', async () => {
		const { screen, chart } = await renderChart({ data: days });
		await expect.poll(() => typeof chart().resetZoom).toBe('function');
		dragAcross(chart(), 0.2, 0.6);
		const reset = screen.getByRole('button', { name: 'Reset zoom' });
		await expect.element(reset).toBeInTheDocument();
		expect(chart().isZoomedOrPanned()).toBe(true);
		await reset.click();
		await expect.element(reset).not.toBeInTheDocument();
		expect(chart().isZoomedOrPanned()).toBe(false);
	});

	test('the reset icon sits in the top-right corner of the plot area, inside the axes, and the height does not change', async () => {
		const { root, chart } = await renderChart({
			data: { labels: days.labels, datasets: [{ label: 'X', data: [1, 2, 3, 4, 5, 6] }, { label: 'Y', data: [1, 2, 3, 4, 5, 6], type: 'line', axis: 'right' }] }
		});
		await expect.poll(() => typeof chart().resetZoom).toBe('function');
		const plot = root.querySelector('.aurora-chart-plot')!;
		const before = plot.getBoundingClientRect();
		dragAcross(chart(), 0.2, 0.6);
		await expect.poll(() => root.querySelector('.aurora-chart-reset')).not.toBeNull();
		expect(root).toHaveAttribute('data-zoomed');
		expect(plot.getBoundingClientRect()).toEqual(before);
		const canvas = chart().canvas.getBoundingClientRect();
		const area = chart().chartArea;
		const button = root.querySelector('.aurora-chart-reset button')!.getBoundingClientRect();
		expect(button.right).toBeLessThanOrEqual(canvas.left + area.right);
		expect(button.top).toBeGreaterThanOrEqual(canvas.top + area.top);
		expect(button.width).toBe(button.height);
	});

	test('a double click resets the zoom; a drag that changes nothing shows no icon, and chart.resetZoom() from code hides it', async () => {
		const { root, chart } = await renderChart({ data: days });
		await expect.poll(() => typeof chart().resetZoom).toBe('function');
		dragAcross(chart(), 0.2, 0.6);
		await expect.poll(() => root.querySelector('.aurora-chart-reset')).not.toBeNull();
		chart().canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
		await expect.poll(() => root.querySelector('.aurora-chart-reset')).toBeNull();
		expect(chart().isZoomedOrPanned()).toBe(false);
		dragAcross(chart(), 0.2, 0.6);
		await expect.poll(() => root.querySelector('.aurora-chart-reset')).not.toBeNull();
		chart().resetZoom();
		await expect.poll(() => root.querySelector('.aurora-chart-reset')).toBeNull();
		dragAcross(chart(), 0.01, 0.99);
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(chart().isZoomedOrPanned()).toBe(false);
		expect(root.querySelector('.aurora-chart-reset')).toBeNull();
	});

	test('zoom={false} turns dragging off', async () => {
		const { screen, chart } = await renderChart({ data: years, zoom: false });
		const plugins = chart().options.plugins as { zoom: { zoom: { drag: { enabled: boolean } }; pan: { enabled: boolean } } };
		expect(plugins.zoom.zoom.drag.enabled).toBe(false);
		expect(plugins.zoom.pan.enabled).toBe(false);
		dragAcross(chart(), 0.2, 0.6);
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(screen.container.querySelector('.aurora-chart-reset')).toBeNull();
	});

	test('the reset button follows locale and resetZoomLabel', async () => {
		const it = await renderChart({ data: days, locale: 'it' });
		await expect.poll(() => typeof it.chart().resetZoom).toBe('function');
		dragAcross(it.chart(), 0.2, 0.6);
		await expect.element(it.screen.getByRole('button', { name: 'Reimposta zoom' })).toBeInTheDocument();
		it.screen.unmount();

		const custom = await renderChart({ data: days, resetZoomLabel: 'All data' });
		await expect.poll(() => typeof custom.chart().resetZoom).toBe('function');
		dragAcross(custom.chart(), 0.2, 0.6);
		await expect.element(custom.screen.getByRole('button', { name: 'All data' })).toBeInTheDocument();
	});

	test('setDefaultLocale sets the texts; the locale prop wins', async () => {
		for (const [locale, name] of [
			[undefined, 'Reimposta zoom'],
			['en', 'Reset zoom']
		] as const) {
			const screen = await renderWithDefaultLocale('it', BarChart, { data: days, locale });
			const canvas = screen.container.querySelector('canvas')!;
			await expect.poll(() => typeof Chart.getChart(canvas)?.resetZoom).toBe('function');
			dragAcross(Chart.getChart(canvas)!, 0.2, 0.6);
			await expect.element(screen.getByRole('button', { name })).toBeInTheDocument();
			screen.unmount();
		}
	});

	test('options are merged over the defaults, and an option removed later goes away (v4 bug: lodash.merge kept it)', async () => {
		let options = $state<Record<string, unknown> | undefined>({ scales: { y: { max: 100 } } });
		const box: { chart?: Chart } = {};
		await render(BarChart, {
			data: years,
			get options() {
				return options;
			},
			get chart() {
				return box.chart;
			},
			set chart(value) {
				box.chart = value;
			}
		});
		await expect.poll(() => box.chart).toBeDefined();
		const scales = () => box.chart!.options.scales as Record<string, { max?: number; grid: { display?: boolean } }>;
		expect(scales().y.max).toBe(100);
		expect(scales().x.grid.display).toBe(false);
		options = undefined;
		flushSync();
		await expect.poll(() => scales().y.max).toBeUndefined();
	});

	test('v4 bug: new data recreated the chart; now the same instance updates, also from Svelte state', async () => {
		const data = $state<ChartData>({ labels: ['A', 'B'], datasets: [{ label: 'X', data: [1, 2] }] });
		const box: { chart?: Chart } = {};
		await render(BarChart, {
			data,
			get chart() {
				return box.chart;
			},
			set chart(value) {
				box.chart = value;
			}
		});
		await expect.poll(() => box.chart).toBeDefined();
		const first = box.chart;
		data.labels.push('C');
		data.datasets[0].data.push(3);
		flushSync();
		await expect.poll(() => box.chart!.data.datasets[0].data).toEqual([1, 2, 3]);
		expect(box.chart).toBe(first);
		expect(box.chart!.data.labels).toEqual(['A', 'B', 'C']);
	});

	test('v4 bug: ticks were hidden by default; now both axes show them', async () => {
		const { chart } = await renderChart({ data: years });
		const scales = chart().options.scales as Record<string, { ticks: { display?: boolean } }>;
		expect(scales.x.ticks.display).not.toBe(false);
		expect(scales.y.ticks.display).not.toBe(false);
	});

	test('CSS variables per instance: size and canvas colors', async () => {
		const { chart, root } = await renderChart({
			data: years,
			style: '--bar-chart-height: 300px; --bar-chart-grid-color: rgb(255, 0, 0); --bar-chart-tick-color: rgb(0, 0, 255)'
		});
		expect(root.getBoundingClientRect().height).toBe(300);
		const scales = chart().options.scales as Record<string, { grid: { color: string }; ticks: { color: string } }>;
		expect(scales.y.grid.color).toBe('rgb(255, 0, 0)');
		expect(scales.x.ticks.color).toBe('rgb(0, 0, 255)');
	});
});
