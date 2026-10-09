<!-- @component
Placeholder with a shimmer, shown while content loads. Three shapes: `rect` (a block that fills its parent by default, size it with `--skeleton-width` and `--skeleton-height`), `circle` (an avatar, `--skeleton-size`) and `text` (`lines` bars of text height, the last one shorter). The shimmer is in sync across all skeletons on the page and stops with reduced motion. It is hidden from screen readers: mark the region that is loading with `aria-busy="true"`. Its shape is exposed as `data-shape` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Skeleton.css';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** `rect` a block, `circle` an avatar, `text` one or more lines of text. */
		shape?: 'rect' | 'circle' | 'text';
		/** Number of lines with `shape="text"`. With more than one, the last line is shorter. */
		lines?: number;
		/** Extra classes on the root element. */
		class?: string;
	}

	let { shape = 'rect', lines = 1, class: clazz = '', ...rest }: Props = $props();
</script>

<div {...rest} class={['aurora-skeleton', clazz]} data-shape={shape} aria-hidden="true">
	{#if shape === 'text'}
		{#each { length: Math.max(1, lines) }, index (index)}
			<span class="aurora-skeleton-line"></span>
		{/each}
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-skeleton,
		.aurora-skeleton-line {
			--_base: var(--skeleton-background, var(--skeleton-default-background));

			background: var(--_base)
				linear-gradient(
					90deg,
					transparent 35%,
					var(--skeleton-highlight-color, var(--skeleton-default-highlight-color)) 50%,
					transparent 65%
				)
				fixed;
			background-size: 200vw 100%;
			border-radius: var(--skeleton-border-radius, var(--skeleton-default-border-radius));
			animation: aurora-skeleton-shimmer
				var(--skeleton-duration, var(--skeleton-default-duration)) ease-in-out infinite;
		}

		.aurora-skeleton {
			box-sizing: border-box;
			display: block;
			width: var(--skeleton-width, var(--skeleton-default-width));
			height: var(--skeleton-height, var(--skeleton-default-height));
			min-height: var(
				--skeleton-min-height,
				var(--skeleton-height, var(--skeleton-default-min-height))
			);
		}

		.aurora-skeleton[data-shape='circle'] {
			flex-shrink: 0;
			width: var(--skeleton-size, var(--skeleton-default-size));
			height: var(--skeleton-size, var(--skeleton-default-size));
			min-height: 0;
			border-radius: 50%;
		}

		.aurora-skeleton[data-shape='text'] {
			display: flex;
			flex-direction: column;
			gap: var(--skeleton-line-gap, var(--skeleton-default-line-gap));
			height: auto;
			min-height: 0;
			padding-block: calc((1lh - var(--skeleton-line-height, var(--skeleton-default-line-height))) / 2);
			background: none;
			border-radius: 0;
			animation: none;
		}

		.aurora-skeleton-line {
			display: block;
			height: var(--skeleton-line-height, var(--skeleton-default-line-height));
		}

		.aurora-skeleton-line:last-child:not(:first-child) {
			width: var(--skeleton-last-line-width, var(--skeleton-default-last-line-width));
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-skeleton,
			.aurora-skeleton-line {
				animation: none;
			}
		}
	}

	@keyframes aurora-skeleton-shimmer {
		from {
			background-position: -150vw 0;
		}
		to {
			background-position: 50vw 0;
		}
	}
</style>
