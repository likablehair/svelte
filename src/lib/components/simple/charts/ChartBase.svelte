<script lang="ts">
	import '../../../css/tokens.css';
	import { Chart, type ChartConfiguration, type Plugin } from 'chart.js';
	import { untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '../buttons/Button.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import { theme as page } from '../../../theme.svelte.js';
	import { colorResolver, type ColorResolver } from '../../../utils/chart/colors.js';
	import { mergeOptions } from '../../../utils/chart/merge.js';
	import { registerCharts, registerZoom } from '../../../utils/chart/register.js';
	import { observeWidth } from '../../../utils/size.js';
	import type { ChartTheme, ChartSpec, ChartTable } from '../../../utils/chart/theme.js';
	import type { ChartItemClick, ChartLegendItem, ChartTooltip } from '../../../utils/chart/types.js';

	const RESET_ZOOM_ICON =
		'M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7,14 5,12 5,9.5C5,7 7,5 9.5,5C12,5 14,7 14,9.5C14,12 12,14 9.5,14M7,9H12V10H7V9Z';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		kind: 'bar' | 'line' | 'pie';
		label?: string;
		build: (theme: ChartTheme) => ChartSpec;
		plugins?: Plugin[];
		options?: object;
		legend: 'auto' | false | 'top' | 'bottom' | 'right';
		autoLegendPosition: 'top' | 'bottom' | 'right';
		legendItems: (hidden: (key: string) => boolean) => Omit<ChartLegendItem, 'hidden'>[];
		legendMode: 'dataset' | 'data';
		swatch: (datasetIndex: number, index: number) => string;
		labels: () => string[];
		table: () => ChartTable;
		zoom: boolean;
		zoomAxis?: 'x' | 'y';
		resetZoomLabel: string;
		rows?: number;
		onitemclick?: (item: ChartItemClick) => void;
		chart?: Chart;
		element?: HTMLDivElement;
		class?: string;
		tooltipSnippet?: Snippet<[ChartTooltip]>;
		legendSnippet?: Snippet<[{ items: ChartLegendItem[]; toggle: (key: string) => void }]>;
		overlaySnippet?: Snippet<[(key: string) => boolean]>;
	}

	let {
		kind,
		label,
		build,
		plugins = [],
		options: userOptions,
		legend,
		autoLegendPosition,
		legendItems,
		legendMode,
		swatch,
		labels,
		table,
		zoom,
		zoomAxis = 'x',
		resetZoomLabel,
		rows,
		onitemclick,
		chart = $bindable(),
		element = $bindable(),
		class: clazz = '',
		tooltipSnippet,
		legendSnippet,
		overlaySnippet,
		...rest
	}: Props = $props();

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce');

	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let instance = $state.raw<Chart>();
	let resolver: ColorResolver | undefined;
	let hidden = $state<Record<string, boolean>>({});
	let zoomed = $state(false);
	let corner = $state({ top: 0, right: 0 });
	let resetButton = $state<HTMLButtonElement | HTMLAnchorElement>();
	let width = $state(0);
	let tip = $state<{ data: ChartTooltip; x: number; y: number; flip: boolean } | null>(null);

	const isHidden = (key: string) => !!hidden[key];

	let items: ChartLegendItem[] = $derived(legendItems(isHidden).map((item) => ({ ...item, hidden: isHidden(item.key) })));
	let narrow = $derived(width > 0 && width < 420);
	let position = $derived.by(() => {
		const wanted = legend === 'auto' ? autoLegendPosition : legend;
		return wanted === 'right' && narrow ? 'bottom' : wanted;
	});
	let legendShown = $derived(legend !== false && (legend !== 'auto' || items.length >= 2));
	let data = $derived(table());

	function toggle(key: string) {
		hidden[key] = !hidden[key];
	}

	function themeFor(resolve: ColorResolver): ChartTheme {
		const style = getComputedStyle(root!);
		const value = (name: string) => style.getPropertyValue(`--_${name}`).trim();
		return {
			color: (color) => resolve.color(color),
			alpha: (color, alpha) => resolve.alpha(color, alpha),
			value,
			length: (name) => resolve.length(value(name)),
			palette: (index) => `var(--global-color-data-${(index % 6) + 1})`,
			hidden: isHidden
		};
	}

	function hitAt(event: Event, chartInstance: Chart) {
		return chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)[0];
	}

	function showTooltip({ chart: chartInstance, tooltip }: { chart: Chart; tooltip: Chart['tooltip'] }) {
		if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
			tip = null;
			return;
		}
		const area = chartInstance.width;
		tip = {
			data: {
				title: (tooltip.title ?? []).join(' '),
				items: tooltip.dataPoints.map((point, i) => ({
					label: legendMode === 'data' ? '' : (point.dataset.label ?? ''),
					value: (tooltip.body?.[i]?.lines ?? []).join(' '),
					raw: (point.raw as number | null) ?? null,
					color: swatch(point.datasetIndex, point.dataIndex),
					datasetIndex: point.datasetIndex,
					index: point.dataIndex
				}))
			},
			x: tooltip.caretX,
			y: tooltip.caretY,
			flip: tooltip.caretX > area / 2
		};
	}

	function baseOptions(theme: ChartTheme) {
		const zoomColor = theme.value('zoom-color') || 'var(--global-color-primary)';
		return {
			responsive: true,
			maintainAspectRatio: false,
			animation: reducedMotion.current ? false : { duration: 500, easing: 'easeOutQuart' },
			plugins: {
				legend: { display: false },
				tooltip: {
					enabled: false,
					external: showTooltip,
					itemSort: (a: { datasetIndex: number }, b: { datasetIndex: number }) => a.datasetIndex - b.datasetIndex
				},
				zoom: zoom
					? {
							limits: { x: { min: 'original', max: 'original' }, y: { min: 'original', max: 'original' } },
							zoom: {
								drag: {
									enabled: true,
									backgroundColor: theme.alpha(zoomColor, 0.12),
									borderColor: theme.alpha(zoomColor, 0.6),
									borderWidth: 1
								},
								mode: zoomAxis,
								onZoomComplete: ({ chart: zoomedChart }: { chart: Chart }) => (zoomed = zoomedChart.isZoomedOrPanned())
							},
							pan: {
								enabled: true,
								mode: zoomAxis,
								modifierKey: 'ctrl',
								onPanComplete: ({ chart: pannedChart }: { chart: Chart }) => (zoomed = pannedChart.isZoomedOrPanned())
							}
						}
					: { zoom: { drag: { enabled: false }, wheel: { enabled: false }, pinch: { enabled: false } }, pan: { enabled: false } }
			},
			onClick: (event: { native: Event | null }, elements: { index: number; datasetIndex: number }[], chartInstance: Chart) => {
				if (!onitemclick || !event.native) return;
				const hit = hitAt(event.native, chartInstance) ?? elements[0];
				if (!hit) return;
				const value = chartInstance.data.datasets[hit.datasetIndex]?.data[hit.index];
				onitemclick({
					index: hit.index,
					datasetIndex: hit.datasetIndex,
					label: labels()[hit.index] ?? '',
					value: typeof value === 'number' ? value : null,
					event: event.native as MouseEvent
				});
			},
			onHover: (event: { native: Event | null }, _: unknown, chartInstance: Chart) => {
				if (!onitemclick || !event.native || !canvas) return;
				canvas.style.cursor = hitAt(event.native, chartInstance) ? 'pointer' : '';
			}
		};
	}

	function configFor(resolve: ColorResolver) {
		const theme = themeFor(resolve);
		const spec = build(theme);
		return {
			type: spec.type,
			data: spec.data,
			options: mergeOptions<ChartConfiguration['options']>(baseOptions(theme), spec.options, userOptions)
		};
	}

	function syncVisibility(chartInstance: Chart) {
		if (legendMode !== 'data') return false;
		let changed = false;
		legendItems(isHidden).forEach((item, index) => {
			const visible = !isHidden(item.key);
			if (chartInstance.getDataVisibility(index) !== visible) {
				chartInstance.toggleDataVisibility(index);
				changed = true;
			}
		});
		return changed;
	}

	const zoomState: Plugin = {
		id: 'auroraZoomState',
		afterUpdate(updated) {
			zoomed = updated.isZoomedOrPanned?.() ?? false;
			const top = updated.chartArea.top;
			const right = updated.width - updated.chartArea.right;
			if (corner.top !== top || corner.right !== right) corner = { top, right };
		}
	};

	function resetZoom() {
		instance?.resetZoom?.();
	}

	$effect(() => {
		if (!canvas || !root) return;
		registerCharts();
		const resolve = colorResolver(root);
		resolver = resolve;
		const created = untrack(() => {
			const config = configFor(resolve);
			return new Chart(canvas!, { ...config, plugins: [...plugins, zoomState] } as ChartConfiguration);
		});
		if (untrack(() => syncVisibility(created))) created.update('none');
		instance = created;
		chart = created;
		return () => {
			created.destroy();
			resolve.dispose();
			resolver = undefined;
			instance = undefined;
			tip = null;
		};
	});

	let themeKey = '';
	let first = true;
	$effect(() => {
		const current = instance;
		const resolve = resolver;
		const key = `${page.dark}|${page.name}`;
		if (!current || !resolve) return;
		const themeChanged = key !== themeKey;
		if (themeChanged) resolve.reset();
		themeKey = key;
		const config = configFor(resolve);
		if (first) {
			first = false;
			return;
		}
		untrack(() => {
			current.data = config.data;
			current.options = config.options ?? {};
			syncVisibility(current);
			current.update(themeChanged ? 'none' : undefined);
			tip = null;
		});
	});

	$effect(() => {
		const current = instance;
		if (!current || !zoom) return;
		let cancelled = false;
		registerZoom().then(() => {
			if (!cancelled && current.canvas) current.update('none');
		});
		return () => {
			cancelled = true;
		};
	});

	const measure = observeWidth((w) => (width = w));
</script>

{#snippet legendBlock()}
	{#if legendSnippet}
		{@render legendSnippet({ items, toggle })}
	{:else}
		<ul class="aurora-chart-legend">
			{#each items as item (item.key)}
				<li>
					<button
						type="button"
						class="aurora-chart-legend-item"
						aria-pressed={!item.hidden}
						onclick={() => toggle(item.key)}
					>
						<span class="aurora-chart-legend-swatch" style:background={item.color}></span>
						<span class="aurora-chart-legend-label">{item.label}</span>
						{#if item.detail}<span class="aurora-chart-legend-detail">{item.detail}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<div
	{...rest}
	bind:this={() => root, (node) => (root = element = node)}
	{@attach measure}
	class="aurora-chart aurora-{kind}-chart {clazz}"
	data-legend={legendShown ? position : undefined}
	data-rows={rows === undefined ? undefined : ''}
	data-zoomed={zoomed ? '' : undefined}
	style:--_rows={rows}
>
	{#if legendShown && position === 'top'}{@render legendBlock()}{/if}
	<div class="aurora-chart-plot">
		<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
		<canvas
			bind:this={canvas}
			class="aurora-chart-canvas"
			role="img"
			aria-label={label}
			ondblclick={() => zoomed && resetZoom()}
		></canvas>
		{#if overlaySnippet}
			<div class="aurora-chart-overlay">{@render overlaySnippet(isHidden)}</div>
		{/if}
		{#if tip}
			<div
				class="aurora-chart-tooltip"
				aria-hidden="true"
				data-flip={tip.flip ? '' : undefined}
				style:left="{tip.x}px"
				style:top="{tip.y}px"
			>
				{#if tooltipSnippet}
					{@render tooltipSnippet(tip.data)}
				{:else}
					{#if tip.data.title}<div class="aurora-chart-tooltip-title">{tip.data.title}</div>{/if}
					{#each tip.data.items as item (`${item.datasetIndex}-${item.index}`)}
						<div class="aurora-chart-tooltip-item">
							{#if tip.data.items.length > 1 || item.label}
								<span class="aurora-chart-tooltip-swatch" style:background={item.color}></span>
								<span class="aurora-chart-tooltip-label">{item.label}</span>
							{/if}
							<span class="aurora-chart-tooltip-value">{item.value}</span>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
		{#if zoomed}
			<div class="aurora-chart-reset" style:--_area-top="{corner.top}px" style:--_area-right="{corner.right}px">
				<Button
					buttonType="icon"
					variant="secondary"
					size="sm"
					icon={RESET_ZOOM_ICON}
					aria-label={resetZoomLabel}
					onclick={resetZoom}
					bind:buttonElement={resetButton}
				/>
				<Tooltip activator={resetButton} text={resetZoomLabel} placement="left" />
			</div>
		{/if}
	</div>
	{#if legendShown && position !== 'top'}{@render legendBlock()}{/if}
	<table class="aurora-chart-table">
		{#if label}<caption>{label}</caption>{/if}
		<thead>
			<tr>
				{#each data.head as cell, i (i)}<th scope="col">{cell}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row, r (r)}
				<tr>
					{#each row as cell, i (i)}
						{#if i === 0}<th scope="row">{cell}</th>{:else}<td>{cell}</td>{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-chart {
			position: relative;
			display: flex;
			flex-direction: column;
			gap: var(--_gap);
			box-sizing: border-box;
			inline-size: var(--_width);
			block-size: var(--_height);
			min-inline-size: var(--_min-width);
			font-family: var(--global-font-family);
		}

		.aurora-chart[data-legend='right'] {
			flex-direction: row;
			align-items: center;
		}

		.aurora-pie-chart[data-legend='right'] {
			justify-content: center;
		}

		.aurora-pie-chart[data-legend='right'] .aurora-chart-plot {
			flex: 0 1 auto;
			block-size: 100%;
			aspect-ratio: 1;
		}

		.aurora-pie-chart:not([data-legend='right']) .aurora-chart-legend {
			justify-content: center;
		}

		.aurora-chart[data-rows] {
			overflow-y: auto;
		}

		.aurora-chart-plot {
			position: relative;
			flex: 1 1 auto;
			min-block-size: 0;
			min-inline-size: 0;
			align-self: stretch;
		}

		.aurora-chart[data-rows] .aurora-chart-plot {
			flex: none;
			block-size: calc(var(--_rows) * var(--_row-height) + var(--_axis-size));
		}

		.aurora-chart-canvas {
			position: absolute;
			inset: 0;
		}

		.aurora-chart-legend {
			display: flex;
			flex-wrap: wrap;
			gap: 4px var(--_legend-gap);
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-chart[data-legend='right'] .aurora-chart-legend {
			flex-direction: column;
			flex-wrap: nowrap;
			min-inline-size: var(--_legend-min-width);
			max-block-size: 100%;
			overflow-y: auto;
		}

		.aurora-chart-legend-item {
			display: flex;
			align-items: center;
			gap: 8px;
			inline-size: 100%;
			margin: 0;
			padding: 2px 4px;
			border: 0;
			border-radius: var(--global-radius-xs);
			background: none;
			color: var(--_legend-color);
			font: inherit;
			font-size: var(--_legend-font-size);
			text-align: start;
			cursor: pointer;
			transition: opacity var(--global-duration-fast) var(--global-ease);
		}

		.aurora-chart-legend-item[aria-pressed='false'] {
			opacity: var(--_legend-hidden-opacity);
		}

		.aurora-chart-legend-item[aria-pressed='false'] .aurora-chart-legend-label {
			text-decoration: line-through;
		}

		.aurora-chart-legend-item:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-chart-legend-swatch {
			flex: none;
			inline-size: var(--_legend-swatch-size);
			block-size: var(--_legend-swatch-size);
			border-radius: var(--_legend-swatch-radius);
		}

		.aurora-chart-legend-detail {
			margin-inline-start: auto;
			padding-inline-start: 8px;
			color: var(--_legend-detail-color);
			font-family: var(--_legend-detail-font-family);
		}

		.aurora-chart-overlay {
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			pointer-events: none;
			text-align: center;
		}

		.aurora-chart-tooltip {
			position: absolute;
			z-index: 2;
			display: grid;
			gap: 4px;
			box-sizing: border-box;
			min-inline-size: var(--_tooltip-min-width);
			padding: var(--_tooltip-padding);
			border: var(--_tooltip-border-width) solid var(--_tooltip-border-color);
			border-radius: var(--_tooltip-radius);
			background: var(--_tooltip-background);
			box-shadow: var(--_tooltip-shadow);
			color: var(--_tooltip-color);
			pointer-events: none;
			white-space: nowrap;
			transform: translate(12px, -50%);
		}

		.aurora-chart-tooltip[data-flip] {
			transform: translate(calc(-100% - 12px), -50%);
		}

		.aurora-chart-tooltip-title {
			color: var(--_tooltip-title-color);
			font-family: var(--_tooltip-title-font-family);
			font-size: var(--_tooltip-title-font-size);
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}

		.aurora-chart-tooltip-item {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.aurora-chart-tooltip-swatch {
			flex: none;
			inline-size: 8px;
			block-size: 8px;
			border-radius: 2px;
		}

		.aurora-chart-tooltip-label {
			color: var(--_tooltip-label-color);
			font-size: var(--_tooltip-label-font-size);
		}

		.aurora-chart-tooltip-value {
			margin-inline-start: auto;
			font-family: var(--_tooltip-value-font-family);
			font-size: var(--_tooltip-value-font-size);
			font-weight: 700;
		}

		.aurora-chart-reset {
			position: absolute;
			z-index: 1;
			inset-block-start: calc(var(--_area-top) + var(--_gap) / 2);
			inset-inline-end: calc(var(--_area-right) + var(--_gap) / 2);
			--button-background: var(--_reset-background);
		}

		.aurora-chart-table {
			position: absolute;
			inline-size: 1px;
			block-size: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
