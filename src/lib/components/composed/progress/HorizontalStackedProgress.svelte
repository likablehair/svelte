<!-- @component
One bar split into colored segments, one per entry of `progresses`, each as wide as its share of the total, with a legend below. Without `total` the segments fill the bar; with `total` the rest of it stays empty. Colors come from the data palette unless an entry sets its own. `label` and `showValue` add a header like `ProgressBar`, `segmentLabels` writes each label under its segment, and hovering a segment shows its value in a tooltip. Screen readers read the legend, which stays in the page (visually hidden) when `legend` is `false`.
-->
<script lang="ts" module>
	export type ProgressItem = {
		/** Name of the entry, shown in the legend, under the segment and in the tooltip. */
		label?: string;
		/** Any CSS color. Default: the data palette, in order. */
		color?: string;
		/** Size of the entry. Entries with `0` are not shown. */
		value: number;
		/** Text shown instead of the value, for example `"3h 20m"`. */
		valueLabel?: string | number;
	};
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './HorizontalStackedProgress.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Tooltip from '../../simple/common/Tooltip.svelte';

	type Segment = ProgressItem & { color: string };

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** Entries of the bar: numbers or `ProgressItem` objects with label, color and value text. */
		progresses?: (number | ProgressItem)[];
		/** Value of the whole bar. Default: the sum of the entries, so the segments fill it. */
		total?: number;
		/** Text above the bar, on the left. It also names the group for screen readers. */
		label?: string;
		/** Shows the share of `total` taken by the entries above the bar, on the right. */
		showValue?: boolean;
		/** Shows the legend below the bar. When `false` it stays in the page for screen readers only. */
		legend?: boolean;
		/** Writes each label and value under its segment. */
		segmentLabels?: boolean;
		/** Hides the labels of segments that take this percentage of the bar or less. */
		minLabelPercentage?: number;
		/** Shows the label and value of a segment in a tooltip when the pointer is over it. */
		valueTooltip?: boolean;
		/** Extra classes on the root element. */
		class?: string;
		/** Replaces the text of the label. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the percentage shown with `showValue`. Receives the sum of the entries, the total and the percentage (0–100). */
		valueSnippet?: Snippet<[{ value: number; total: number; percent: number }]>;
		/** Replaces the content of a legend entry (the colored dot stays). */
		legendItemSnippet?: Snippet<[{ item: Segment; percentage: number }]>;
		/** Replaces the content under a segment. */
		segmentLabelSnippet?: Snippet<[{ item: Segment; percentage: number }]>;
	}

	let {
		progresses = [],
		total,
		label,
		showValue = false,
		legend = true,
		segmentLabels = false,
		minLabelPercentage,
		valueTooltip = true,
		class: clazz = '',
		labelSnippet,
		valueSnippet,
		legendItemSnippet,
		segmentLabelSnippet,
		...rest
	}: Props = $props();

	const labelId = $props.id();

	let segments = $derived(
		progresses
			.map((entry, index): Segment => {
				const item = typeof entry === 'number' ? { value: entry } : entry;
				return { ...item, color: item.color ?? `var(--global-color-data-${(index % 6) + 1})` };
			})
			.filter((item) => item.value > 0)
	);
	let sum = $derived(segments.reduce((result, item) => result + item.value, 0));
	let whole = $derived(Math.max(total ?? sum, sum));
	let remainder = $derived(whole - sum);
	let percent = $derived(whole === 0 ? 0 : (sum * 100) / whole);
	let labelled = $derived(!!label || !!labelSnippet);
	let activators = $state<HTMLElement[]>([]);

	function share(item: Segment) {
		return whole === 0 ? 0 : (item.value * 100) / whole;
	}

	function shown(item: Segment) {
		return item.valueLabel ?? item.value;
	}
</script>

<div
	{...rest}
	class={['aurora-horizontal-stacked-progress', clazz]}
	role="group"
	aria-labelledby={labelled ? labelId : undefined}
>
	{#if labelled || showValue}
		<div class="aurora-horizontal-stacked-progress-header">
			{#if labelled}
				<span id={labelId} class="aurora-horizontal-stacked-progress-label">
					{#if labelSnippet}{@render labelSnippet({ label })}{:else}{label}{/if}
				</span>
			{/if}
			{#if showValue}
				<span class="aurora-horizontal-stacked-progress-value">
					{#if valueSnippet}{@render valueSnippet({ value: sum, total: whole, percent })}{:else}{Math.round(
							percent
						)}%{/if}
				</span>
			{/if}
		</div>
	{/if}
	<div class="aurora-horizontal-stacked-progress-bars" aria-hidden="true">
		<div class="aurora-horizontal-stacked-progress-track">
			{#each segments as item, index (index)}
				<span
					class="aurora-horizontal-stacked-progress-segment"
					style:flex-grow={item.value}
					style:--_color={item.color}
					bind:this={activators[index]}
				></span>
			{/each}
			{#if remainder > 0}
				<span class="aurora-horizontal-stacked-progress-rest" style:flex-grow={remainder}></span>
			{/if}
		</div>
		{#if segmentLabels}
			<div class="aurora-horizontal-stacked-progress-segment-labels">
				{#each segments as item, index (index)}
					{@const percentage = share(item)}
					<span class="aurora-horizontal-stacked-progress-segment-label" style:flex-grow={item.value}>
						{#if minLabelPercentage === undefined || percentage > minLabelPercentage}
							{#if segmentLabelSnippet}
								{@render segmentLabelSnippet({ item, percentage })}
							{:else}
								{#if item.label}
									<span class="aurora-horizontal-stacked-progress-segment-name">{item.label}</span>
								{/if}
								<span class="aurora-horizontal-stacked-progress-segment-value">
									<span class="aurora-horizontal-stacked-progress-dot" style:--_color={item.color}
									></span>
									{shown(item)}
								</span>
							{/if}
						{/if}
					</span>
				{/each}
				{#if remainder > 0}
					<span class="aurora-horizontal-stacked-progress-segment-label" style:flex-grow={remainder}></span>
				{/if}
			</div>
		{/if}
	</div>
	<ul class="aurora-horizontal-stacked-progress-legend" data-hidden={!legend || undefined}>
		{#each segments as item, index (index)}
			<li class="aurora-horizontal-stacked-progress-legend-item">
				<span class="aurora-horizontal-stacked-progress-dot" style:--_color={item.color}></span>
				{#if legendItemSnippet}
					{@render legendItemSnippet({ item, percentage: share(item) })}
				{:else}
					{#if item.label}{item.label}{/if}
					<b class="aurora-horizontal-stacked-progress-legend-value">{shown(item)}</b>
				{/if}
			</li>
		{/each}
	</ul>
	{#if valueTooltip}
		{#each segments as item, index (index)}
			<Tooltip
				activator={activators[index]}
				text={item.label ? `${item.label}: ${shown(item)}` : String(shown(item))}
			/>
		{/each}
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-horizontal-stacked-progress {
			--_gap: var(--horizontal-stacked-progress-gap, var(--horizontal-stacked-progress-default-gap));

			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			width: var(
				--horizontal-stacked-progress-width,
				var(--horizontal-stacked-progress-default-width)
			);
		}

		.aurora-horizontal-stacked-progress-header {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 12px;
			margin-bottom: var(
				--horizontal-stacked-progress-header-gap,
				var(--horizontal-stacked-progress-default-header-gap)
			);
		}

		.aurora-horizontal-stacked-progress-label {
			min-width: 0;
			color: var(
				--horizontal-stacked-progress-label-color,
				var(--horizontal-stacked-progress-default-label-color)
			);
			font-size: var(
				--horizontal-stacked-progress-label-font-size,
				var(--horizontal-stacked-progress-default-label-font-size)
			);
			font-weight: var(
				--horizontal-stacked-progress-label-font-weight,
				var(--horizontal-stacked-progress-default-label-font-weight)
			);
		}

		.aurora-horizontal-stacked-progress-value {
			margin-inline-start: auto;
			color: var(
				--horizontal-stacked-progress-value-color,
				var(--horizontal-stacked-progress-default-value-color)
			);
			font-family: var(
				--horizontal-stacked-progress-value-font-family,
				var(--horizontal-stacked-progress-default-value-font-family)
			);
			font-size: var(
				--horizontal-stacked-progress-value-font-size,
				var(--horizontal-stacked-progress-default-value-font-size)
			);
			font-variant-numeric: tabular-nums;
		}

		.aurora-horizontal-stacked-progress-track,
		.aurora-horizontal-stacked-progress-segment-labels {
			display: flex;
			gap: var(--_gap);
		}

		.aurora-horizontal-stacked-progress-track {
			height: var(
				--horizontal-stacked-progress-height,
				var(--horizontal-stacked-progress-default-height)
			);
		}

		.aurora-horizontal-stacked-progress-segment,
		.aurora-horizontal-stacked-progress-rest,
		.aurora-horizontal-stacked-progress-segment-label {
			flex-basis: 0;
			min-width: 0;
		}

		.aurora-horizontal-stacked-progress-segment,
		.aurora-horizontal-stacked-progress-rest {
			border-radius: var(
				--horizontal-stacked-progress-segment-border-radius,
				var(--horizontal-stacked-progress-default-segment-border-radius)
			);
		}

		.aurora-horizontal-stacked-progress-segment {
			background: var(--_color);
			transition:
				flex-grow var(--_duration) var(--global-ease),
				scale var(--_duration) var(--global-ease),
				filter var(--_duration) var(--global-ease);
			--_duration: var(
				--horizontal-stacked-progress-duration,
				var(--horizontal-stacked-progress-default-duration)
			);
		}

		.aurora-horizontal-stacked-progress-rest {
			background: var(
				--horizontal-stacked-progress-rest-background,
				var(--horizontal-stacked-progress-default-rest-background)
			);
		}

		@media (hover: hover) {
			.aurora-horizontal-stacked-progress-segment:hover {
				filter: var(
					--horizontal-stacked-progress-hover-filter,
					var(--horizontal-stacked-progress-default-hover-filter)
				);
				scale: 1
					var(
						--horizontal-stacked-progress-hover-scale,
						var(--horizontal-stacked-progress-default-hover-scale)
					);
			}
		}

		.aurora-horizontal-stacked-progress-segment-labels {
			margin-top: var(
				--horizontal-stacked-progress-segment-label-gap,
				var(--horizontal-stacked-progress-default-segment-label-gap)
			);
		}

		.aurora-horizontal-stacked-progress-segment-label {
			display: flex;
			flex-direction: column;
			gap: 2px;
			overflow: hidden;
		}

		.aurora-horizontal-stacked-progress-segment-name {
			overflow: hidden;
			color: var(
				--horizontal-stacked-progress-segment-label-color,
				var(--horizontal-stacked-progress-default-segment-label-color)
			);
			font-size: var(
				--horizontal-stacked-progress-segment-label-font-size,
				var(--horizontal-stacked-progress-default-segment-label-font-size)
			);
			font-weight: var(
				--horizontal-stacked-progress-segment-label-font-weight,
				var(--horizontal-stacked-progress-default-segment-label-font-weight)
			);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-horizontal-stacked-progress-segment-value {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(
				--horizontal-stacked-progress-segment-value-color,
				var(--horizontal-stacked-progress-default-segment-value-color)
			);
			font-size: var(
				--horizontal-stacked-progress-segment-value-font-size,
				var(--horizontal-stacked-progress-default-segment-value-font-size)
			);
			font-weight: var(
				--horizontal-stacked-progress-segment-value-font-weight,
				var(--horizontal-stacked-progress-default-segment-value-font-weight)
			);
			white-space: nowrap;
		}

		.aurora-horizontal-stacked-progress-dot {
			flex-shrink: 0;
			display: inline-block;
			width: var(
				--horizontal-stacked-progress-dot-size,
				var(--horizontal-stacked-progress-default-dot-size)
			);
			height: var(
				--horizontal-stacked-progress-dot-size,
				var(--horizontal-stacked-progress-default-dot-size)
			);
			border-radius: var(
				--horizontal-stacked-progress-dot-border-radius,
				var(--horizontal-stacked-progress-default-dot-border-radius)
			);
			background: var(--_color);
		}

		.aurora-horizontal-stacked-progress-legend {
			display: flex;
			flex-wrap: wrap;
			gap: var(
				--horizontal-stacked-progress-legend-gap,
				var(--horizontal-stacked-progress-default-legend-gap)
			);
			margin: var(
					--horizontal-stacked-progress-legend-margin-top,
					var(--horizontal-stacked-progress-default-legend-margin-top)
				)
				0 0;
			padding: 0;
			list-style: none;
			color: var(
				--horizontal-stacked-progress-legend-color,
				var(--horizontal-stacked-progress-default-legend-color)
			);
			font-size: var(
				--horizontal-stacked-progress-legend-font-size,
				var(--horizontal-stacked-progress-default-legend-font-size)
			);
		}

		.aurora-horizontal-stacked-progress-legend[data-hidden] {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.aurora-horizontal-stacked-progress-legend-item {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.aurora-horizontal-stacked-progress-legend-value {
			color: var(
				--horizontal-stacked-progress-legend-value-color,
				var(--horizontal-stacked-progress-default-legend-value-color)
			);
			font-family: var(
				--horizontal-stacked-progress-legend-value-font-family,
				var(--horizontal-stacked-progress-default-legend-value-font-family)
			);
			font-weight: var(
				--horizontal-stacked-progress-legend-value-font-weight,
				var(--horizontal-stacked-progress-default-legend-value-font-weight)
			);
			font-variant-numeric: tabular-nums;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-horizontal-stacked-progress-segment {
				transition: none;
			}
		}
	}
</style>
