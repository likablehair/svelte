<!-- @component
Horizontal progress bar that fills up to `value / total`, with an optional `label` above it and the percentage on the right (`showValue`). `indeterminate` shows a bar that slides back and forth, for work of unknown length. Four colors (`variant`). `valueTooltip` shows the value in a tooltip when the pointer is over the bar. The root is a `role="progressbar"` named by the label; without a label pass `aria-label`. Its state is exposed as `data-variant` and `data-indeterminate` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './ProgressBar.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Tooltip from '../common/Tooltip.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** Progress, from 0 to `total`. Values outside the range are clamped. */
		value?: number;
		/** Value that fills the bar. With `0` the bar is full. */
		total?: number;
		/** Text above the bar, on the left. It also names the progress bar for screen readers. */
		label?: string;
		/** Shows the percentage above the bar, on the right. */
		showValue?: boolean;
		/** A bar that slides back and forth, for work of unknown length. `value` is ignored. */
		indeterminate?: boolean;
		/** Fill color: the theme gradient or a status color. */
		variant?: 'primary' | 'success' | 'warning' | 'error';
		/** Shows the value in a tooltip when the pointer is over the bar. */
		valueTooltip?: boolean;
		/** Text of the tooltip, instead of the value. Screen readers read it as the value text. */
		valueTooltipLabel?: string | number;
		/** Extra classes on the root element. */
		class?: string;
		/** Replaces the text of the label. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the percentage shown with `showValue`. Receives the value, the total and the percentage (0–100). */
		valueSnippet?: Snippet<[{ value: number; total: number; percent: number }]>;
	}

	let {
		value = 0,
		total = 100,
		label,
		showValue = false,
		indeterminate = false,
		variant = 'primary',
		valueTooltip = false,
		valueTooltipLabel,
		class: clazz = '',
		labelSnippet,
		valueSnippet,
		...rest
	}: Props = $props();

	const labelId = $props.id();

	let track = $state<HTMLDivElement>();
	let percent = $derived(total === 0 ? 100 : Math.min(100, Math.max(0, (value * 100) / total)));
	let labelled = $derived(!!label || !!labelSnippet);
</script>

<div
	{...rest}
	class={['aurora-progress-bar', clazz]}
	role="progressbar"
	aria-labelledby={labelled ? labelId : undefined}
	aria-valuemin={0}
	aria-valuemax={total}
	aria-valuenow={indeterminate ? undefined : Math.min(total, Math.max(0, value))}
	aria-valuetext={rest['aria-valuetext'] ??
		(valueTooltip && valueTooltipLabel !== undefined ? String(valueTooltipLabel) : undefined)}
	data-variant={variant}
	data-indeterminate={indeterminate || undefined}
>
	{#if labelled || (showValue && !indeterminate)}
		<div class="aurora-progress-bar-header">
			{#if labelled}
				<span id={labelId} class="aurora-progress-bar-label">
					{#if labelSnippet}{@render labelSnippet({ label })}{:else}{label}{/if}
				</span>
			{/if}
			{#if showValue && !indeterminate}
				<span class="aurora-progress-bar-value">
					{#if valueSnippet}{@render valueSnippet({ value, total, percent })}{:else}{Math.round(percent)}%{/if}
				</span>
			{/if}
		</div>
	{/if}
	<div class="aurora-progress-bar-track" bind:this={track}>
		<div class="aurora-progress-bar-fill" style:width={indeterminate ? undefined : `${percent}%`}></div>
	</div>
	{#if valueTooltip && !indeterminate}
		<Tooltip activator={track} text={String(valueTooltipLabel ?? value)} />
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-progress-bar {
			--_fill-background: var(--progress-bar-default-fill-background);
			--_fill-box-shadow: var(--progress-bar-default-fill-box-shadow);

			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: var(--progress-bar-gap, var(--progress-bar-default-gap));
			width: var(--progress-bar-width, var(--progress-bar-default-width));
		}

		.aurora-progress-bar[data-variant='success'] {
			--_fill-background: var(--progress-bar-default-success-fill-background);
			--_fill-box-shadow: var(--progress-bar-default-success-fill-box-shadow);
		}

		.aurora-progress-bar[data-variant='warning'] {
			--_fill-background: var(--progress-bar-default-warning-fill-background);
			--_fill-box-shadow: var(--progress-bar-default-warning-fill-box-shadow);
		}

		.aurora-progress-bar[data-variant='error'] {
			--_fill-background: var(--progress-bar-default-error-fill-background);
			--_fill-box-shadow: var(--progress-bar-default-error-fill-box-shadow);
		}

		.aurora-progress-bar-header {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 12px;
		}

		.aurora-progress-bar-label {
			min-width: 0;
			color: var(--progress-bar-label-color, var(--progress-bar-default-label-color));
			font-size: var(--progress-bar-label-font-size, var(--progress-bar-default-label-font-size));
			font-weight: var(
				--progress-bar-label-font-weight,
				var(--progress-bar-default-label-font-weight)
			);
		}

		.aurora-progress-bar-value {
			margin-inline-start: auto;
			color: var(--progress-bar-value-color, var(--progress-bar-default-value-color));
			font-family: var(
				--progress-bar-value-font-family,
				var(--progress-bar-default-value-font-family)
			);
			font-size: var(--progress-bar-value-font-size, var(--progress-bar-default-value-font-size));
			font-variant-numeric: tabular-nums;
		}

		.aurora-progress-bar-track {
			position: relative;
			height: var(--progress-bar-height, var(--progress-bar-default-height));
			overflow: hidden;
			border-radius: var(--progress-bar-border-radius, var(--progress-bar-default-border-radius));
			background: var(--progress-bar-background, var(--progress-bar-default-background));
		}

		.aurora-progress-bar-fill {
			position: relative;
			height: 100%;
			overflow: hidden;
			border-radius: inherit;
			background: var(--progress-bar-fill-background, var(--_fill-background));
			box-shadow: var(--progress-bar-fill-box-shadow, var(--_fill-box-shadow));
			transition: width var(--progress-bar-duration, var(--progress-bar-default-duration))
				var(--global-ease);
		}

		.aurora-progress-bar:not([data-indeterminate]) .aurora-progress-bar-fill::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(
				90deg,
				transparent,
				var(--progress-bar-shimmer-color, var(--progress-bar-default-shimmer-color)),
				transparent
			);
			translate: -100% 0;
			animation: aurora-progress-bar-shimmer
				var(--progress-bar-shimmer-duration, var(--progress-bar-default-shimmer-duration))
				infinite;
		}

		.aurora-progress-bar[data-indeterminate] .aurora-progress-bar-fill {
			--_width: var(--progress-bar-indeterminate-width, var(--progress-bar-default-indeterminate-width));

			width: 100%;
			clip-path: inset(
				0 calc(100% - var(--_width)) 0 0 round
					var(--progress-bar-border-radius, var(--progress-bar-default-border-radius))
			);
			animation: aurora-progress-bar-slide
				var(
					--progress-bar-indeterminate-duration,
					var(--progress-bar-default-indeterminate-duration)
				)
				var(--global-ease) infinite;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-progress-bar:not([data-indeterminate]) .aurora-progress-bar-fill::after {
				animation: none;
			}
		}
	}

	@keyframes aurora-progress-bar-shimmer {
		from {
			translate: -100% 0;
		}
		to {
			translate: 100% 0;
		}
	}

	@keyframes aurora-progress-bar-slide {
		from {
			translate: calc(-1 * var(--_width)) 0;
		}
		to {
			translate: 100% 0;
		}
	}
</style>
