<!-- @component
Bar chart drawn with chart.js. Pass `data` as `{ labels, datasets: [{ label, data, color? }] }`: one label per category, one value per label in every series. Bars are vertical, or horizontal with `horizontal` (then the chart grows with the number of rows, `--bar-chart-row-height` each); several series stand side by side, or on top of each other with `stacked`. A series with `type: 'line'` is drawn as a line over the bars, and `axis: 'right'` gives it a second value axis with its own `format`. Colors come from the theme (`--global-color-data-1…6`, a gradient when one series has no `color`) and follow light and dark mode and theme changes by themselves; `color` takes any CSS color, also `var(--…)`, or an array for one color per bar. `format` writes values with `Intl.NumberFormat` (short form on the axis, full in the tooltip). The legend appears with two or more series and hides a series on click. Drag on the chart to zoom (Ctrl + drag to pan); a "Reset zoom" icon appears in the top-right corner of the plot while zoomed, and a double click also resets the zoom. `onitemclick` receives the clicked bar. `options` takes any other chart.js option and wins over the defaults. Screen readers get `label` and a hidden table with the values. The chart fills the height of `--bar-chart-height` (16rem; `100%` fills a sized container).
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './BarChart.css';
	import type { Chart, ChartOptions } from 'chart.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ChartBase from './ChartBase.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import type { ChartSpec, ChartTheme } from '../../../utils/chart/theme.js';
	import {
		barColors,
		cartesianScales,
		cartesianTable,
		legendOf,
		lineDataset,
		passthrough,
		prepareSeries,
		swatchOf,
		tooltipCallbacks
	} from '../../../utils/chart/series.js';
	import type {
		ChartData,
		ChartFormat,
		ChartItemClick,
		ChartLegendItem,
		ChartTooltip
	} from '../../../utils/chart/types.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** The categories (`labels`) and the series (`datasets`), with one value per label. Svelte state can be passed as it is. */
		data: ChartData;
		/** Name of the chart for screen readers, also the caption of the hidden table of values. */
		label?: string;
		/** Horizontal bars: categories on the vertical axis, one row each (`--bar-chart-row-height`); the chart grows with the rows and scrolls when `--bar-chart-height` is smaller. */
		horizontal?: boolean;
		/** Puts the series on top of each other instead of side by side. */
		stacked?: boolean;
		/** How values are written: options of `Intl.NumberFormat` (for example `{ style: 'currency', currency: 'EUR' }`) or a function. Axes use the short form (`€1.2M`). A series can have its own `format`. */
		format?: ChartFormat;
		/** Where the legend goes. `auto` shows it below the chart when there are two or more series. */
		legend?: 'auto' | false | 'top' | 'bottom' | 'right';
		/** Drag on the chart to zoom on the categories, Ctrl + drag to pan; a "Reset zoom" icon appears in the top-right corner of the plot while zoomed, and a double click also resets the zoom. */
		zoom?: boolean;
		/** Any other chart.js option, merged over the defaults of the library (for example `scales.y.max`, `scales.y.type: 'logarithmic'`). */
		options?: ChartOptions<'bar'>;
		/** BCP 47 locale of the texts and of the numbers (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Text of the button that resets the zoom. Defaults to "Reset zoom", in the language of `locale`. */
		resetZoomLabel?: string;
		/** The chart.js instance, to call its methods (`resetZoom()`, `toBase64Image()`). */
		chart?: Chart;
		/** The root `<div>` element. */
		barChartElement?: HTMLDivElement;
		/** Extra classes on the root `<div>` element. */
		class?: string;
		/** Called with the bar (or point) clicked; the pointer becomes a hand over the bars. */
		onitemclick?: (item: ChartItemClick) => void;
		/** Replaces the content of the tooltip. */
		tooltipSnippet?: Snippet<[ChartTooltip]>;
		/** Replaces the legend; `toggle(key)` hides or shows a series. */
		legendSnippet?: Snippet<[{ items: ChartLegendItem[]; toggle: (key: string) => void }]>;
	}

	let {
		data,
		label,
		horizontal = false,
		stacked = false,
		format,
		legend = 'auto',
		zoom = true,
		options,
		locale: localeProp,
		resetZoomLabel,
		chart = $bindable(),
		barChartElement = $bindable(),
		class: clazz = '',
		onitemclick,
		tooltipSnippet,
		legendSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).chart);

	const palette = { palette: (index: number) => `var(--global-color-data-${(index % 6) + 1})` };
	let prepared = $derived(prepareSeries(data, 'bar', palette));

	function build(theme: ChartTheme): ChartSpec {
		const valueAxis = horizontal ? 'xAxisID' : 'yAxisID';
		const datasets = prepared.map((p) => {
			const axis = { [valueAxis]: p.series.axis === 'right' ? (horizontal ? 'x1' : 'y1') : horizontal ? 'x' : 'y' };
			const common = { label: p.label, data: [...p.series.data], hidden: theme.hidden(p.key) };
			if (p.line) return { ...common, type: 'line', order: 0, ...lineDataset(theme, p, 3), ...axis, ...passthrough(p.series) };
			return {
				...common,
				type: 'bar',
				order: 1,
				...barColors(theme, p, horizontal),
				borderRadius: theme.length('bar-radius'),
				borderSkipped: stacked ? 'middle' : 'start',
				maxBarThickness: 48,
				categoryPercentage: 0.72,
				barPercentage: 0.86,
				...axis,
				...passthrough(p.series)
			};
		});
		return {
			type: 'bar',
			data: { labels: [...data.labels], datasets } as ChartSpec['data'],
			options: {
				indexAxis: horizontal ? 'y' : 'x',
				interaction: { mode: 'index', intersect: false, axis: horizontal ? 'y' : 'x' },
				scales: cartesianScales(theme, prepared, { horizontal, stacked, format, locale, beginAtZero: true }),
				plugins: { tooltip: { callbacks: tooltipCallbacks(prepared, format, locale) } }
			}
		};
	}
</script>

<ChartBase
	{...rest}
	kind="bar"
	{label}
	{build}
	{options}
	{legend}
	autoLegendPosition="bottom"
	legendItems={() => legendOf(prepared)}
	legendMode="dataset"
	swatch={(datasetIndex, index) => swatchOf(prepared, datasetIndex, index)}
	labels={() => data.labels}
	table={() => cartesianTable(data, prepared, format, locale)}
	{zoom}
	zoomAxis={horizontal ? 'y' : 'x'}
	resetZoomLabel={resetZoomLabel ?? texts.resetZoom}
	rows={horizontal ? data.labels.length : undefined}
	{onitemclick}
	bind:chart
	bind:element={barChartElement}
	class={clazz}
	{tooltipSnippet}
	{legendSnippet}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-bar-chart) {
			--_width: var(--bar-chart-width, var(--bar-chart-default-width));
			--_min-width: var(--bar-chart-min-width, var(--bar-chart-default-min-width));
			--_height: var(--bar-chart-height, var(--bar-chart-default-height));
			--_row-height: var(--bar-chart-row-height, var(--bar-chart-default-row-height));
			--_axis-size: var(--bar-chart-axis-size, var(--bar-chart-default-axis-size));
			--_gap: var(--bar-chart-gap, var(--bar-chart-default-gap));
			--_grid-color: var(--bar-chart-grid-color, var(--bar-chart-default-grid-color));
			--_tick-color: var(--bar-chart-tick-color, var(--bar-chart-default-tick-color));
			--_tick-font-family: var(--bar-chart-tick-font-family, var(--bar-chart-default-tick-font-family));
			--_tick-font-size: var(--bar-chart-tick-font-size, var(--bar-chart-default-tick-font-size));
			--_bar-radius: var(--bar-chart-bar-radius, var(--bar-chart-default-bar-radius));
			--_gradient-from: var(--bar-chart-gradient-from, var(--bar-chart-default-gradient-from));
			--_gradient-to: var(--bar-chart-gradient-to, var(--bar-chart-default-gradient-to));
			--_line-width: var(--bar-chart-line-width, var(--bar-chart-default-line-width));
			--_point-background: var(--bar-chart-point-background, var(--bar-chart-default-point-background));
			--_reset-background: var(--bar-chart-reset-background, var(--bar-chart-default-reset-background));
			--_zoom-color: var(--bar-chart-zoom-color, var(--bar-chart-default-zoom-color));
			--_legend-gap: var(--bar-chart-legend-gap, var(--bar-chart-default-legend-gap));
			--_legend-font-size: var(--bar-chart-legend-font-size, var(--bar-chart-default-legend-font-size));
			--_legend-color: var(--bar-chart-legend-color, var(--bar-chart-default-legend-color));
			--_legend-swatch-size: var(--bar-chart-legend-swatch-size, var(--bar-chart-default-legend-swatch-size));
			--_legend-swatch-radius: var(--bar-chart-legend-swatch-radius, var(--bar-chart-default-legend-swatch-radius));
			--_legend-hidden-opacity: var(--bar-chart-legend-hidden-opacity, var(--bar-chart-default-legend-hidden-opacity));
			--_legend-detail-color: var(--bar-chart-legend-detail-color, var(--bar-chart-default-legend-detail-color));
			--_legend-detail-font-family: var(--bar-chart-legend-detail-font-family, var(--bar-chart-default-legend-detail-font-family));
			--_legend-min-width: var(--bar-chart-legend-min-width, var(--bar-chart-default-legend-min-width));
			--_tooltip-background: var(--bar-chart-tooltip-background, var(--bar-chart-default-tooltip-background));
			--_tooltip-border-color: var(--bar-chart-tooltip-border-color, var(--bar-chart-default-tooltip-border-color));
			--_tooltip-border-width: var(--bar-chart-tooltip-border-width, var(--bar-chart-default-tooltip-border-width));
			--_tooltip-radius: var(--bar-chart-tooltip-radius, var(--bar-chart-default-tooltip-radius));
			--_tooltip-shadow: var(--bar-chart-tooltip-shadow, var(--bar-chart-default-tooltip-shadow));
			--_tooltip-padding: var(--bar-chart-tooltip-padding, var(--bar-chart-default-tooltip-padding));
			--_tooltip-min-width: var(--bar-chart-tooltip-min-width, var(--bar-chart-default-tooltip-min-width));
			--_tooltip-color: var(--bar-chart-tooltip-color, var(--bar-chart-default-tooltip-color));
			--_tooltip-title-color: var(--bar-chart-tooltip-title-color, var(--bar-chart-default-tooltip-title-color));
			--_tooltip-title-font-family: var(--bar-chart-tooltip-title-font-family, var(--bar-chart-default-tooltip-title-font-family));
			--_tooltip-title-font-size: var(--bar-chart-tooltip-title-font-size, var(--bar-chart-default-tooltip-title-font-size));
			--_tooltip-label-color: var(--bar-chart-tooltip-label-color, var(--bar-chart-default-tooltip-label-color));
			--_tooltip-label-font-size: var(--bar-chart-tooltip-label-font-size, var(--bar-chart-default-tooltip-label-font-size));
			--_tooltip-value-font-family: var(--bar-chart-tooltip-value-font-family, var(--bar-chart-default-tooltip-value-font-family));
			--_tooltip-value-font-size: var(--bar-chart-tooltip-value-font-size, var(--bar-chart-default-tooltip-value-font-size));
		}
	}
</style>
