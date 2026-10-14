<!-- @component
Line chart drawn with chart.js. Pass `data` as `{ labels, datasets: [{ label, data, color? }] }`: one label per point on the horizontal axis, one value per label in every series (`null` leaves a gap). Lines are smooth; a series with `area` fills the space below it with a fading gradient, `dashed` draws it dashed (for example the previous year), `axis: 'right'` gives it a second value axis with its own `format`, and `stacked` puts the series on top of each other. Colors come from the theme (`--global-color-data-1…6`; when only one series has no `color` it gets the brand gradient with a soft glow) and follow light and dark mode and theme changes by themselves; `color` takes any CSS color, also `var(--…)`. While hovering, a vertical line marks the point and the tooltip lists every series. `format` writes values with `Intl.NumberFormat` (short form on the axis, full in the tooltip). The legend appears with two or more series and hides a series on click. Drag on the chart to zoom (Ctrl + drag to pan); a "Reset zoom" icon appears in the top-right corner of the plot while zoomed, and a double click also resets the zoom. `onitemclick` receives the clicked point. `options` takes any other chart.js option and wins over the defaults. Screen readers get `label` and a hidden table with the values. The chart fills the height of `--line-chart-height` (16rem; `100%` fills a sized container).
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './LineChart.css';
	import type { Chart, ChartOptions } from 'chart.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ChartBase from './ChartBase.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import type { ChartSpec, ChartTheme } from '../../../utils/chart/theme.js';
	import {
		cartesianScales,
		cartesianTable,
		crosshairPlugin,
		glowPlugin,
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
		/** The labels of the horizontal axis (`labels`) and the series (`datasets`), with one value per label. Svelte state can be passed as it is. */
		data: ChartData;
		/** Name of the chart for screen readers, also the caption of the hidden table of values. */
		label?: string;
		/** Puts the series on top of each other. */
		stacked?: boolean;
		/** How values are written: options of `Intl.NumberFormat` (for example `{ style: 'currency', currency: 'EUR' }`) or a function. Axes use the short form (`€1.2M`). A series can have its own `format`. */
		format?: ChartFormat;
		/** Where the legend goes. `auto` shows it below the chart when there are two or more series. */
		legend?: 'auto' | false | 'top' | 'bottom' | 'right';
		/** Drag on the chart to zoom on the horizontal axis, Ctrl + drag to pan; a "Reset zoom" icon appears in the top-right corner of the plot while zoomed, and a double click also resets the zoom. */
		zoom?: boolean;
		/** Any other chart.js option, merged over the defaults of the library (for example `scales.y.min`, `scales.y.type: 'logarithmic'`). */
		options?: ChartOptions<'line'>;
		/** BCP 47 locale of the texts and of the numbers (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Text of the button that resets the zoom. Defaults to "Reset zoom", in the language of `locale`. */
		resetZoomLabel?: string;
		/** The chart.js instance, to call its methods (`resetZoom()`, `toBase64Image()`). */
		chart?: Chart;
		/** The root `<div>` element. */
		lineChartElement?: HTMLDivElement;
		/** Extra classes on the root `<div>` element. */
		class?: string;
		/** Called with the point clicked; the pointer becomes a hand over the points. */
		onitemclick?: (item: ChartItemClick) => void;
		/** Replaces the content of the tooltip. */
		tooltipSnippet?: Snippet<[ChartTooltip]>;
		/** Replaces the legend; `toggle(key)` hides or shows a series. */
		legendSnippet?: Snippet<[{ items: ChartLegendItem[]; toggle: (key: string) => void }]>;
	}

	let {
		data,
		label,
		stacked = false,
		format,
		legend = 'auto',
		zoom = true,
		options,
		locale: localeProp,
		resetZoomLabel,
		chart = $bindable(),
		lineChartElement = $bindable(),
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
	const plugins = [glowPlugin, crosshairPlugin];
	let prepared = $derived(prepareSeries(data, 'line', palette));

	function build(theme: ChartTheme): ChartSpec {
		const datasets = prepared.map((p) => ({
			label: p.label,
			data: [...p.series.data],
			hidden: theme.hidden(p.key),
			...lineDataset(theme, p, 0),
			yAxisID: p.series.axis === 'right' ? 'y1' : 'y',
			...passthrough(p.series)
		}));
		return {
			type: 'line',
			data: { labels: [...data.labels], datasets } as ChartSpec['data'],
			options: {
				interaction: { mode: 'index', intersect: false, axis: 'x' },
				scales: cartesianScales(theme, prepared, { horizontal: false, stacked, format, locale, beginAtZero: false }),
				plugins: {
					tooltip: { callbacks: tooltipCallbacks(prepared, format, locale) },
					auroraGlow: {
						index: prepared.find((p) => p.gradient)?.index ?? -1,
						color: theme.color(theme.value('glow-color')),
						blur: theme.length('glow-blur')
					},
					auroraCrosshair: { color: theme.color(theme.value('crosshair-color')) }
				}
			}
		};
	}
</script>

<ChartBase
	{...rest}
	kind="line"
	{label}
	{build}
	{plugins}
	{options}
	{legend}
	autoLegendPosition="bottom"
	legendItems={() => legendOf(prepared)}
	legendMode="dataset"
	swatch={(datasetIndex, index) => swatchOf(prepared, datasetIndex, index)}
	labels={() => data.labels}
	table={() => cartesianTable(data, prepared, format, locale)}
	{zoom}
	resetZoomLabel={resetZoomLabel ?? texts.resetZoom}
	{onitemclick}
	bind:chart
	bind:element={lineChartElement}
	class={clazz}
	{tooltipSnippet}
	{legendSnippet}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-line-chart) {
			--_width: var(--line-chart-width, var(--line-chart-default-width));
			--_min-width: var(--line-chart-min-width, var(--line-chart-default-min-width));
			--_height: var(--line-chart-height, var(--line-chart-default-height));
			--_gap: var(--line-chart-gap, var(--line-chart-default-gap));
			--_grid-color: var(--line-chart-grid-color, var(--line-chart-default-grid-color));
			--_tick-color: var(--line-chart-tick-color, var(--line-chart-default-tick-color));
			--_tick-font-family: var(--line-chart-tick-font-family, var(--line-chart-default-tick-font-family));
			--_tick-font-size: var(--line-chart-tick-font-size, var(--line-chart-default-tick-font-size));
			--_line-width: var(--line-chart-line-width, var(--line-chart-default-line-width));
			--_gradient-from: var(--line-chart-gradient-from, var(--line-chart-default-gradient-from));
			--_gradient-via: var(--line-chart-gradient-via, var(--line-chart-default-gradient-via));
			--_gradient-to: var(--line-chart-gradient-to, var(--line-chart-default-gradient-to));
			--_glow-color: var(--line-chart-glow-color, var(--line-chart-default-glow-color));
			--_glow-blur: var(--line-chart-glow-blur, var(--line-chart-default-glow-blur));
			--_point-background: var(--line-chart-point-background, var(--line-chart-default-point-background));
			--_crosshair-color: var(--line-chart-crosshair-color, var(--line-chart-default-crosshair-color));
			--_reset-background: var(--line-chart-reset-background, var(--line-chart-default-reset-background));
			--_zoom-color: var(--line-chart-zoom-color, var(--line-chart-default-zoom-color));
			--_legend-gap: var(--line-chart-legend-gap, var(--line-chart-default-legend-gap));
			--_legend-font-size: var(--line-chart-legend-font-size, var(--line-chart-default-legend-font-size));
			--_legend-color: var(--line-chart-legend-color, var(--line-chart-default-legend-color));
			--_legend-swatch-size: var(--line-chart-legend-swatch-size, var(--line-chart-default-legend-swatch-size));
			--_legend-swatch-radius: var(--line-chart-legend-swatch-radius, var(--line-chart-default-legend-swatch-radius));
			--_legend-hidden-opacity: var(--line-chart-legend-hidden-opacity, var(--line-chart-default-legend-hidden-opacity));
			--_legend-detail-color: var(--line-chart-legend-detail-color, var(--line-chart-default-legend-detail-color));
			--_legend-detail-font-family: var(--line-chart-legend-detail-font-family, var(--line-chart-default-legend-detail-font-family));
			--_legend-min-width: var(--line-chart-legend-min-width, var(--line-chart-default-legend-min-width));
			--_tooltip-background: var(--line-chart-tooltip-background, var(--line-chart-default-tooltip-background));
			--_tooltip-border-color: var(--line-chart-tooltip-border-color, var(--line-chart-default-tooltip-border-color));
			--_tooltip-border-width: var(--line-chart-tooltip-border-width, var(--line-chart-default-tooltip-border-width));
			--_tooltip-radius: var(--line-chart-tooltip-radius, var(--line-chart-default-tooltip-radius));
			--_tooltip-shadow: var(--line-chart-tooltip-shadow, var(--line-chart-default-tooltip-shadow));
			--_tooltip-padding: var(--line-chart-tooltip-padding, var(--line-chart-default-tooltip-padding));
			--_tooltip-min-width: var(--line-chart-tooltip-min-width, var(--line-chart-default-tooltip-min-width));
			--_tooltip-color: var(--line-chart-tooltip-color, var(--line-chart-default-tooltip-color));
			--_tooltip-title-color: var(--line-chart-tooltip-title-color, var(--line-chart-default-tooltip-title-color));
			--_tooltip-title-font-family: var(--line-chart-tooltip-title-font-family, var(--line-chart-default-tooltip-title-font-family));
			--_tooltip-title-font-size: var(--line-chart-tooltip-title-font-size, var(--line-chart-default-tooltip-title-font-size));
			--_tooltip-label-color: var(--line-chart-tooltip-label-color, var(--line-chart-default-tooltip-label-color));
			--_tooltip-label-font-size: var(--line-chart-tooltip-label-font-size, var(--line-chart-default-tooltip-label-font-size));
			--_tooltip-value-font-family: var(--line-chart-tooltip-value-font-family, var(--line-chart-default-tooltip-value-font-family));
			--_tooltip-value-font-size: var(--line-chart-tooltip-value-font-size, var(--line-chart-default-tooltip-value-font-size));
		}
	}
</style>
