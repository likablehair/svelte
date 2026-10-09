<!-- @component
Three dots that light up in turn, a lighter alternative to `CircularLoader` for inline "typing" or "loading" states. It is a `role="progressbar"` named by `label`; `label=""` makes it decorative. Each dot takes a color of the data palette: `--dots-loader-color` sets one color for all of them.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './DotsLoader.css';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
		/** Accessible name. An empty string makes the loader decorative (hidden from screen readers). */
		label?: string;
		/** Extra classes on the root element. */
		class?: string;
	}

	let { label = 'Loading', class: clazz = '', ...rest }: Props = $props();
</script>

<span
	{...rest}
	class={['aurora-dots-loader', clazz]}
	role={label ? 'progressbar' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<span class="aurora-dots-loader-dot"></span>
	<span class="aurora-dots-loader-dot"></span>
	<span class="aurora-dots-loader-dot"></span>
</span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-dots-loader {
			display: inline-flex;
			align-items: center;
			gap: var(--dots-loader-gap, var(--dots-loader-default-gap));
			vertical-align: middle;
		}

		.aurora-dots-loader-dot {
			--_duration: var(--dots-loader-duration, var(--dots-loader-default-duration));

			flex-shrink: 0;
			width: var(--dots-loader-size, var(--dots-loader-default-size));
			height: var(--dots-loader-size, var(--dots-loader-default-size));
			border-radius: 50%;
			background: var(
				--dots-loader-color-1,
				var(--dots-loader-color, var(--dots-loader-default-color-1))
			);
			opacity: var(--dots-loader-dim-opacity, var(--dots-loader-default-dim-opacity));
			animation: aurora-dots-loader-blink var(--_duration) var(--global-ease) infinite;
		}

		.aurora-dots-loader-dot:nth-child(2) {
			background: var(
				--dots-loader-color-2,
				var(--dots-loader-color, var(--dots-loader-default-color-2))
			);
			animation-delay: calc(var(--_duration) / 8);
		}

		.aurora-dots-loader-dot:nth-child(3) {
			background: var(
				--dots-loader-color-3,
				var(--dots-loader-color, var(--dots-loader-default-color-3))
			);
			animation-delay: calc(var(--_duration) / 4);
		}
	}

	@keyframes aurora-dots-loader-blink {
		0%,
		80%,
		100% {
			opacity: var(--dots-loader-dim-opacity, var(--dots-loader-default-dim-opacity));
		}
		40% {
			opacity: 1;
		}
	}
</style>
