<!-- @component
Line that separates content. Without content it is a native `<hr>` (a separator for assistive technology); with `label` or `children` the text sits in the middle of the line, as in "— or —", and stays readable. `variant="gradient"` paints the theme gradient faded at both ends, `orientation="vertical"` separates items in a row and stretches to its height. It has a margin only across the line (10px, `--divider-spacing`). Its state is exposed as `data-variant` and `data-orientation` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Divider.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		/** Line style: `solid` uses `--divider-color`, `gradient` the theme gradient (`--global-gradient`) faded at both ends. */
		variant?: 'solid' | 'gradient';
		/** `vertical` separates items in a row: in a flex row it is as tall as the row, elsewhere at least `--divider-vertical-min-height`. */
		orientation?: 'horizontal' | 'vertical';
		/** Text in the middle of the line, such as "or". The divider becomes a `<div>` and the text is read by screen readers. */
		label?: string;
		/** Content in the middle of the line, instead of `label`. */
		children?: Snippet;
		/** The root element: the `<hr>`, or the `<div>` when there is text. */
		dividerElement?: HTMLElement;
	}

	let {
		variant = 'solid',
		orientation = 'horizontal',
		label,
		children,
		dividerElement = $bindable(),
		class: clazz,
		...rest
	}: Props = $props();
</script>

{#if children || label}
	<div
		{...rest}
		bind:this={dividerElement}
		data-variant={variant}
		data-orientation={orientation}
		class={['aurora-divider', 'aurora-divider-labelled', clazz]}
	>
		<span class="aurora-divider-label">
			{#if children}{@render children()}{:else}{label}{/if}
		</span>
	</div>
{:else}
	<hr
		{...rest}
		bind:this={dividerElement}
		data-variant={variant}
		data-orientation={orientation}
		aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
		class={['aurora-divider', clazz]}
	/>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-divider {
			--_line: var(--divider-color, var(--divider-default-color));
			--_weight: var(--divider-weight, var(--divider-default-weight));
			--_spacing: var(--divider-spacing, var(--divider-default-spacing));
			--_margin-block: var(--_spacing);
			--_margin-inline: 0px;
			--_angle: 90deg;

			box-sizing: border-box;
			flex-shrink: 0;
			align-self: stretch;
			margin: var(--divider-margin-top, var(--_margin-block))
				var(--divider-margin-right, var(--_margin-inline))
				var(--divider-margin-bottom, var(--_margin-block))
				var(--divider-margin-left, var(--_margin-inline));
			padding: 0;
			border: 0;
		}

		.aurora-divider:dir(rtl) {
			--_angle: -90deg;
		}

		.aurora-divider[data-variant='gradient'] {
			--_line: var(--divider-color, var(--divider-default-gradient-background));
		}

		.aurora-divider[data-orientation='vertical'] {
			--_margin-block: 0px;
			--_margin-inline: var(--_spacing);
			--_angle: 180deg;

			min-height: var(
				--divider-vertical-min-height,
				var(--divider-default-vertical-min-height)
			);
		}

		hr.aurora-divider {
			display: block;
			height: var(--_weight);
			background: var(--_line);
			border-radius: var(--divider-radius, var(--divider-default-radius));
			color: inherit;
		}

		hr.aurora-divider[data-orientation='vertical'] {
			display: inline-block;
			width: var(--_weight);
			height: auto;
			vertical-align: middle;
		}

		hr.aurora-divider[data-variant='gradient'] {
			mask-image: linear-gradient(var(--_angle), transparent, #000 30%, #000 70%, transparent);
		}

		.aurora-divider-labelled {
			display: flex;
			align-items: center;
			gap: var(--divider-gap, var(--divider-default-gap));
			color: var(--divider-label-color, var(--divider-default-label-color));
			font-family: var(--divider-label-font-family, var(--divider-default-label-font-family));
			font-size: var(--divider-label-font-size, var(--divider-default-label-font-size));
			font-weight: var(--divider-label-font-weight, var(--divider-default-label-font-weight));
			letter-spacing: var(
				--divider-label-letter-spacing,
				var(--divider-default-label-letter-spacing)
			);
			line-height: 1.3;
			text-transform: var(
				--divider-label-text-transform,
				var(--divider-default-label-text-transform)
			);
		}

		.aurora-divider-labelled::before,
		.aurora-divider-labelled::after {
			content: '';
			flex: 1 1 0;
			min-width: 0;
			height: var(--_weight);
			border-radius: var(--divider-radius, var(--divider-default-radius));
			background: var(--_line);
		}

		.aurora-divider-labelled[data-orientation='vertical'] {
			display: inline-flex;
			flex-direction: column;
			vertical-align: middle;
		}

		.aurora-divider-labelled[data-orientation='vertical']::before,
		.aurora-divider-labelled[data-orientation='vertical']::after {
			width: var(--_weight);
			height: auto;
			min-height: 0;
		}

		.aurora-divider-labelled[data-variant='gradient']::before {
			mask-image: linear-gradient(var(--_angle), transparent, #000 60%);
		}

		.aurora-divider-labelled[data-variant='gradient']::after {
			mask-image: linear-gradient(var(--_angle), #000 40%, transparent);
		}

		.aurora-divider-label {
			flex: 0 1 auto;
			max-width: 100%;
			text-align: center;
		}
	}
</style>
