<!-- @component
Circular loader. Without `value` it is a spinning ring that says something is loading; with `value` it becomes a progress ring that fills up to `value / total`, with optional content in the middle (for example the percentage). It is a `role="progressbar"` named by `label`; `label=""` makes it decorative, for example next to a text that already says "Loading". The ring takes the theme gradient: `--circular-loader-color` sets any color or gradient (`currentColor` matches the surrounding text, for example inside a button). Its state is exposed as `data-indeterminate` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './CircularLoader.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
		/** Progress, from 0 to `total`. Without it the loader spins (indeterminate). */
		value?: number;
		/** Value that fills the ring. With `0` the ring is full. */
		total?: number;
		/** Accessible name. An empty string makes the loader decorative (hidden from screen readers). */
		label?: string;
		/** Extra classes on the root element. */
		class?: string;
		/** Content in the middle of the ring, for example the percentage. Receives the value, the total and the percentage (0–100). */
		children?: Snippet<[{ value: number | undefined; total: number; percent: number }]>;
	}

	let { value, total = 100, label = 'Loading', class: clazz = '', children, ...rest }: Props = $props();

	let indeterminate = $derived(value === undefined);
	let percent = $derived(
		value === undefined ? 0 : total === 0 ? 100 : Math.min(100, Math.max(0, (value * 100) / total))
	);
</script>

<span
	{...rest}
	class={['aurora-circular-loader', clazz]}
	role={label ? 'progressbar' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	aria-valuemin={label && !indeterminate ? 0 : undefined}
	aria-valuemax={label && !indeterminate ? total : undefined}
	aria-valuenow={label && !indeterminate ? Math.min(total, Math.max(0, value ?? 0)) : undefined}
	data-indeterminate={indeterminate || undefined}
	style:--aurora-circular-loader-percent={percent}
>
	<span class="aurora-circular-loader-track"></span>
	<span class="aurora-circular-loader-arc"></span>
	{#if children}
		<span class="aurora-circular-loader-content">{@render children({ value, total, percent })}</span>
	{/if}
</span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@property --aurora-circular-loader-percent {
		syntax: '<number>';
		inherits: true;
		initial-value: 0;
	}

	@layer global.components {
		.aurora-circular-loader {
			--_size: var(--circular-loader-size, var(--circular-loader-default-size));

			position: relative;
			box-sizing: border-box;
			display: inline-grid;
			place-items: center;
			flex-shrink: 0;
			width: var(--_size);
			height: var(--_size);
			container-type: size;
			vertical-align: middle;
			transition: --aurora-circular-loader-percent
				var(--circular-loader-value-duration, var(--circular-loader-default-value-duration))
				var(--global-ease);
		}

		.aurora-circular-loader-track,
		.aurora-circular-loader-arc {
			--_t: var(--circular-loader-thickness, var(--circular-loader-default-thickness));
			--_ring: radial-gradient(
				farthest-side,
				transparent calc(100% - var(--_t)),
				#000 calc(100% - var(--_t) + 0.5px)
			);

			position: absolute;
			inset: 0;
			border-radius: 50%;
		}

		.aurora-circular-loader-track {
			background: var(
				--circular-loader-track-color,
				var(--circular-loader-default-track-color)
			);
			mask: var(--_ring);
		}

		.aurora-circular-loader[data-indeterminate] .aurora-circular-loader-track {
			background: var(--circular-loader-track-color, transparent);
		}

		.aurora-circular-loader-arc {
			--_r: calc(50cqi - var(--_t) / 2);
			--_cap: min(var(--_t) / 2, var(--aurora-circular-loader-percent) * 100px);
			--_angle: calc(var(--aurora-circular-loader-percent) * 3.6deg);
			--_dot: #000 calc(100% - 0.75px), transparent;

			background: var(--circular-loader-color, var(--circular-loader-default-color));
			mask:
				radial-gradient(
					circle var(--_cap) at calc(50cqi + var(--_r) * sin(var(--_angle)))
						calc(50cqi - var(--_r) * cos(var(--_angle))),
					var(--_dot)
				),
				radial-gradient(circle var(--_cap) at 50cqi calc(var(--_t) / 2), var(--_dot)),
				conic-gradient(#000 calc(var(--aurora-circular-loader-percent) * 1%), transparent 0),
				var(--_ring);
			mask-composite: add, add, intersect, add;
		}

		.aurora-circular-loader[data-indeterminate] .aurora-circular-loader-arc {
			mask:
				radial-gradient(circle calc(var(--_t) / 2) at 50cqi calc(var(--_t) / 2), var(--_dot)),
				conic-gradient(transparent 10%, #000),
				var(--_ring);
			mask-composite: add, intersect, add;
			animation: aurora-circular-loader-spin
				var(--circular-loader-duration, var(--circular-loader-default-duration)) linear infinite;
		}

		.aurora-circular-loader-content {
			position: relative;
			color: var(--circular-loader-content-color, var(--circular-loader-default-content-color));
			font-family: var(
				--circular-loader-content-font-family,
				var(--circular-loader-default-content-font-family)
			);
			font-size: var(
				--circular-loader-content-font-size,
				var(--circular-loader-default-content-font-size)
			);
			font-weight: var(
				--circular-loader-content-font-weight,
				var(--circular-loader-default-content-font-weight)
			);
			line-height: 1;
			font-variant-numeric: tabular-nums;
		}
	}

	@keyframes aurora-circular-loader-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
