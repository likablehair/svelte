<!-- @component
Donut or pie chart drawn with chart.js. Pass `data` as `{ labels, datasets: [{ data, color? }] }`: one label and one value per slice. By default it is a donut with the total in the middle (`centerLabel` adds a line below it, `centerSnippet` replaces it); `donut={false}` draws a full pie. Slice colors come from the theme (`--global-color-data-1…6`, in order) and follow light and dark mode and theme changes by themselves; `color` takes an array of CSS colors, also `var(--…)`. The legend sits on the right (below when the chart is narrow) with the share of every slice, and hides a slice on click; the total and the shares count only the visible slices. `format` writes values with `Intl.NumberFormat`. `onitemclick` receives the clicked slice. `options` takes any other chart.js option and wins over the defaults. Screen readers get `label` and a hidden table with values and shares. The chart fills the height of `--pie-chart-height` (14rem).
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './PieChart.css';
	import type { Chart, ChartOptions, TooltipItem } from 'chart.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ChartBase from './ChartBase.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import type { ChartSpec, ChartTheme } from '../../../utils/chart/theme.js';
	import { passthrough } from '../../../utils/chart/series.js';
	import { valueFormatter } from '../../../utils/chart/format.js';
	import type {
		ChartData,
		ChartFormat,
		ChartItemClick,
		ChartLegendItem,
		ChartTooltip
	} from '../../../utils/chart/types.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** The slices: one label in `labels` and one value in `datasets[0].data` each. More datasets draw more rings. Svelte state can be passed as it is. */
		data: ChartData;
		/** Name of the chart for screen readers, also the caption of the hidden table of values. */
		label?: string;
		/** Draws a donut with the total in the middle; `false` draws a full pie. The hole is `--pie-chart-cutout` (72%). */
		donut?: boolean;
		/** Shows the total of the visible slices in the middle of the donut. */
		showTotal?: boolean;
		/** Small text below the total, for example what is counted. */
		centerLabel?: string;
		/** How values are written: options of `Intl.NumberFormat` (for example `{ style: 'currency', currency: 'EUR' }`) or a function. */
		format?: ChartFormat;
		/** Where the legend goes. `auto` shows it on the right (below when the chart is narrow) when there are two or more slices. */
		legend?: 'auto' | false | 'top' | 'bottom' | 'right';
		/** Any other chart.js option of a doughnut chart, merged over the defaults of the library. */
		options?: ChartOptions<'doughnut'>;
		/** BCP 47 locale of the numbers (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** The chart.js instance, to call its methods (`toBase64Image()`). */
		chart?: Chart;
		/** The root `<div>` element. */
		pieChartElement?: HTMLDivElement;
		/** Extra classes on the root `<div>` element. */
		class?: string;
		/** Called with the slice clicked; the pointer becomes a hand over the slices. */
		onitemclick?: (item: ChartItemClick) => void;
		/** Replaces the content of the tooltip. */
		tooltipSnippet?: Snippet<[ChartTooltip]>;
		/** Replaces the legend; `toggle(key)` hides or shows a slice. */
		legendSnippet?: Snippet<[{ items: ChartLegendItem[]; toggle: (key: string) => void }]>;
		/** Replaces the content in the middle of the donut; `total` counts the visible slices, `formatted` is written with `format`. */
		centerSnippet?: Snippet<[{ total: number; formatted: string }]>;
	}

	let {
		data,
		label,
		donut = true,
		showTotal = true,
		centerLabel,
		format,
		legend = 'auto',
		options,
		locale: localeProp,
		chart = $bindable(),
		pieChartElement = $bindable(),
		class: clazz = '',
		onitemclick,
		tooltipSnippet,
		legendSnippet,
		centerSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).chart);
	let formatValue = $derived(valueFormatter(format, locale));
	let formatShare = $derived(new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }));

	const keyOf = (label: string, index: number) => `${index}-${label}`;

	function colorsOf(datasetIndex: number): string[] {
		const color = data.datasets[datasetIndex]?.color;
		if (Array.isArray(color)) return color;
		if (color !== undefined) return data.labels.map(() => color);
		return data.labels.map((_, index) => `var(--global-color-data-${(index % 6) + 1})`);
	}

	function valueAt(index: number): number {
		const value = data.datasets[0]?.data[index];
		return typeof value === 'number' ? value : 0;
	}

	function visibleTotal(hidden: (key: string) => boolean): number {
		return data.labels.reduce((sum, label, index) => (hidden(keyOf(label, index)) ? sum : sum + valueAt(index)), 0);
	}

	function share(index: number, total: number): string {
		return total ? formatShare.format(valueAt(index) / total) : '—';
	}

	function build(theme: ChartTheme): ChartSpec {
		const total = visibleTotal(theme.hidden);
		const datasets = data.datasets.map((series, datasetIndex) => {
			const colors = colorsOf(datasetIndex);
			return {
				label: series.label ?? '',
				data: [...series.data],
				backgroundColor: colors.map((c) => theme.color(c)),
				hoverBackgroundColor: colors.map((c) => theme.alpha(c, 0.85)),
				borderColor: theme.color(theme.value('slice-border-color')),
				borderWidth: theme.length('slice-border-width'),
				hoverOffset: 4,
				...passthrough(series)
			};
		});
		return {
			type: 'doughnut',
			data: { labels: [...data.labels], datasets } as ChartSpec['data'],
			options: {
				cutout: donut ? theme.value('cutout') || '72%' : 0,
				layout: { padding: 6 },
				interaction: { mode: 'nearest', intersect: true },
				plugins: {
					tooltip: {
						callbacks: {
							title: (items: TooltipItem<'doughnut'>[]) => items[0]?.label ?? '',
							label: (item: TooltipItem<'doughnut'>) =>
								typeof item.raw === 'number'
									? `${formatValue(item.raw)} · ${item.datasetIndex === 0 ? share(item.dataIndex, total) : ''}`.replace(/ · $/, '')
									: '—'
						}
					}
				}
			}
		};
	}

	function legendItems(hidden: (key: string) => boolean): Omit<ChartLegendItem, 'hidden'>[] {
		const total = visibleTotal(hidden);
		const colors = colorsOf(0);
		return data.labels.map((label, index) => ({
			key: keyOf(label, index),
			label,
			color: colors[index] ?? '',
			detail: hidden(keyOf(label, index)) ? undefined : share(index, total)
		}));
	}

	function table() {
		const total = visibleTotal(() => false);
		return {
			head: ['', data.datasets[0]?.label ?? '', '%'],
			rows: data.labels.map((label, index) => [label, formatValue(valueAt(index)), share(index, total)])
		};
	}
</script>

{#snippet center(hidden: (key: string) => boolean)}
	{@const total = visibleTotal(hidden)}
	{#if centerSnippet}
		{@render centerSnippet({ total, formatted: formatValue(total) })}
	{:else}
		<div class="aurora-pie-chart-center">
			<span class="aurora-pie-chart-total">{formatValue(total)}</span>
			{#if centerLabel}<span class="aurora-pie-chart-center-label">{centerLabel}</span>{/if}
		</div>
	{/if}
{/snippet}

<ChartBase
	{...rest}
	kind="pie"
	{label}
	{build}
	{options}
	{legend}
	autoLegendPosition="right"
	{legendItems}
	legendMode="data"
	swatch={(datasetIndex, index) => colorsOf(datasetIndex)[index] ?? ''}
	labels={() => data.labels}
	{table}
	zoom={false}
	resetZoomLabel={texts.resetZoom}
	{onitemclick}
	bind:chart
	bind:element={pieChartElement}
	class={clazz}
	{tooltipSnippet}
	{legendSnippet}
	overlaySnippet={donut && (showTotal || centerSnippet) ? center : undefined}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-pie-chart) {
			--_width: var(--pie-chart-width, var(--pie-chart-default-width));
			--_min-width: var(--pie-chart-min-width, var(--pie-chart-default-min-width));
			--_height: var(--pie-chart-height, var(--pie-chart-default-height));
			--_gap: var(--pie-chart-gap, var(--pie-chart-default-gap));
			--_cutout: var(--pie-chart-cutout, var(--pie-chart-default-cutout));
			--_slice-border-color: var(--pie-chart-slice-border-color, var(--pie-chart-default-slice-border-color));
			--_slice-border-width: var(--pie-chart-slice-border-width, var(--pie-chart-default-slice-border-width));
			--_center-color: var(--pie-chart-center-color, var(--pie-chart-default-center-color));
			--_center-font-family: var(--pie-chart-center-font-family, var(--pie-chart-default-center-font-family));
			--_center-font-size: var(--pie-chart-center-font-size, var(--pie-chart-default-center-font-size));
			--_center-label-color: var(--pie-chart-center-label-color, var(--pie-chart-default-center-label-color));
			--_center-label-font-size: var(--pie-chart-center-label-font-size, var(--pie-chart-default-center-label-font-size));
			--_legend-gap: var(--pie-chart-legend-gap, var(--pie-chart-default-legend-gap));
			--_legend-color: var(--pie-chart-legend-color, var(--pie-chart-default-legend-color));
			--_legend-hidden-opacity: var(--pie-chart-legend-hidden-opacity, var(--pie-chart-default-legend-hidden-opacity));
			--_legend-detail-color: var(--pie-chart-legend-detail-color, var(--pie-chart-default-legend-detail-color));
			--_legend-detail-font-family: var(--pie-chart-legend-detail-font-family, var(--pie-chart-default-legend-detail-font-family));
			--_legend-min-width: var(--pie-chart-legend-min-width, var(--pie-chart-default-legend-min-width));
			--_legend-font-size: var(--pie-chart-legend-font-size, var(--pie-chart-default-legend-font-size));
			--_legend-swatch-size: var(--pie-chart-legend-swatch-size, var(--pie-chart-default-legend-swatch-size));
			--_legend-swatch-radius: var(--pie-chart-legend-swatch-radius, var(--pie-chart-default-legend-swatch-radius));
			--_tooltip-background: var(--pie-chart-tooltip-background, var(--pie-chart-default-tooltip-background));
			--_tooltip-border-color: var(--pie-chart-tooltip-border-color, var(--pie-chart-default-tooltip-border-color));
			--_tooltip-border-width: var(--pie-chart-tooltip-border-width, var(--pie-chart-default-tooltip-border-width));
			--_tooltip-radius: var(--pie-chart-tooltip-radius, var(--pie-chart-default-tooltip-radius));
			--_tooltip-shadow: var(--pie-chart-tooltip-shadow, var(--pie-chart-default-tooltip-shadow));
			--_tooltip-padding: var(--pie-chart-tooltip-padding, var(--pie-chart-default-tooltip-padding));
			--_tooltip-min-width: var(--pie-chart-tooltip-min-width, var(--pie-chart-default-tooltip-min-width));
			--_tooltip-color: var(--pie-chart-tooltip-color, var(--pie-chart-default-tooltip-color));
			--_tooltip-title-color: var(--pie-chart-tooltip-title-color, var(--pie-chart-default-tooltip-title-color));
			--_tooltip-title-font-family: var(--pie-chart-tooltip-title-font-family, var(--pie-chart-default-tooltip-title-font-family));
			--_tooltip-title-font-size: var(--pie-chart-tooltip-title-font-size, var(--pie-chart-default-tooltip-title-font-size));
			--_tooltip-label-color: var(--pie-chart-tooltip-label-color, var(--pie-chart-default-tooltip-label-color));
			--_tooltip-label-font-size: var(--pie-chart-tooltip-label-font-size, var(--pie-chart-default-tooltip-label-font-size));
			--_tooltip-value-font-family: var(--pie-chart-tooltip-value-font-family, var(--pie-chart-default-tooltip-value-font-family));
			--_tooltip-value-font-size: var(--pie-chart-tooltip-value-font-size, var(--pie-chart-default-tooltip-value-font-size));
		}

		.aurora-pie-chart-center {
			display: grid;
			gap: 4px;
			max-inline-size: 60%;
			line-height: 1;
		}

		.aurora-pie-chart-total {
			color: var(--_center-color);
			font-family: var(--_center-font-family);
			font-size: var(--_center-font-size);
			font-weight: 800;
			letter-spacing: -0.03em;
		}

		.aurora-pie-chart-center-label {
			color: var(--_center-label-color);
			font-size: var(--_center-label-font-size);
		}
	}
</style>
