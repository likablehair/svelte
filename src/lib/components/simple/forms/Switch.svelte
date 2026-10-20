<!-- @component
On/off toggle with an optional label next to it. It renders a native `<input type="checkbox" role="switch">` inside a `<label>`, so a click on the text toggles it and screen readers announce it as a switch: `name`, `value`, `required`, `disabled` and events (`onchange`, ...) work as in HTML. Two sizes: `md` and `lg`. Its state is exposed as `data-checked`, `data-size` and `data-disabled` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Switch.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'class' | 'children' | 'size'> {
		/** On or off. */
		checked?: boolean;
		/** Track size: `md` 36×20px, `lg` 46×26px. */
		size?: 'md' | 'lg';
		/** Text next to the switch. A click on it toggles the switch. */
		label?: string;
		/** Native `disabled`. */
		disabled?: boolean;
		/** The native `<input>` element. */
		input?: HTMLInputElement;
		/** Extra classes for each part: the root `<label>`, the input (which draws the track) and the text. */
		class?: {
			container?: string;
			input?: string;
			label?: string;
		};
		/** Replaces the text next to the switch. A click on it still toggles the switch. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
	}

	let {
		checked = $bindable(),
		size = 'md',
		label,
		disabled = false,
		input = $bindable(),
		class: clazz = {},
		labelSnippet,
		...rest
	}: Props = $props();

	let labelled = $derived(!!label || !!labelSnippet);
</script>

<label
	class={['aurora-switch', labelled && 'aurora-switch-labelled', clazz.container]}
	data-checked={checked || undefined}
	data-size={size}
	data-disabled={disabled || undefined}
>
	<input
		{...rest}
		bind:this={input}
		bind:checked
		type="checkbox"
		role="switch"
		{disabled}
		class={['aurora-switch-track', clazz.input]}
	/>
	{#if labelSnippet}
		<span class={['aurora-switch-label', clazz.label]}>{@render labelSnippet({ label })}</span>
	{:else if label}
		<span class={['aurora-switch-label', clazz.label]}>{label}</span>
	{/if}
</label>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-switch {
			--_width: var(--switch-default-width);
			--_height: var(--switch-default-height);
			--_thumb-size: var(--switch-default-thumb-size);
			--_dir: 1;

			display: inline-flex;
			align-items: center;
			gap: var(--switch-gap, var(--switch-default-gap));
			vertical-align: middle;
			color: var(--switch-label-color, var(--switch-default-label-color));
			font-size: var(--switch-label-font-size, var(--switch-default-label-font-size));
			font-weight: var(--switch-label-font-weight, var(--switch-default-label-font-weight));
			line-height: var(--switch-label-line-height, var(--switch-default-label-line-height));
			cursor: pointer;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
		}

		.aurora-switch:dir(rtl) {
			--_dir: -1;
		}

		.aurora-switch[data-size='lg'] {
			--_width: var(--switch-default-lg-width);
			--_height: var(--switch-default-lg-height);
			--_thumb-size: var(--switch-default-lg-thumb-size);
		}

		.aurora-switch-labelled {
			align-items: flex-start;
		}

		.aurora-switch-track {
			--_w: var(--switch-width, var(--_width));
			--_h: var(--switch-height, var(--_height));
			--_t: var(--switch-thumb-size, var(--_thumb-size));
			--_bw: var(--switch-border-width, var(--switch-default-border-width));

			box-sizing: border-box;
			display: flex;
			flex-shrink: 0;
			align-items: center;
			width: var(--_w);
			height: var(--_h);
			margin: 0;
			padding: 0 calc((var(--_h) - 2 * var(--_bw) - var(--_t)) / 2);
			border: var(--_bw) solid var(--switch-border-color, var(--switch-default-border-color));
			border-radius: var(--switch-border-radius, var(--switch-default-border-radius));
			background: var(--switch-background, var(--switch-default-background));
			box-shadow: var(--switch-box-shadow, var(--switch-default-box-shadow));
			font: inherit;
			appearance: none;
			cursor: inherit;
			transition:
				background var(--switch-duration, var(--switch-default-duration)) var(--global-ease),
				border-color var(--switch-duration, var(--switch-default-duration)) var(--global-ease),
				box-shadow var(--switch-duration, var(--switch-default-duration)) var(--global-ease);
		}

		.aurora-switch-labelled .aurora-switch-track {
			margin-block: calc((1lh - var(--_h)) / 2);
		}

		.aurora-switch-track::after {
			content: '';
			flex-shrink: 0;
			width: var(--_t);
			height: var(--_t);
			border-radius: var(--switch-thumb-border-radius, var(--switch-default-thumb-border-radius));
			background: var(--switch-thumb-color, var(--switch-default-thumb-color));
			box-shadow: var(--switch-thumb-box-shadow, var(--switch-default-thumb-box-shadow));
			transition:
				transform var(--switch-duration, var(--switch-default-duration))
					var(--switch-easing, var(--switch-default-easing)),
				background var(--switch-duration, var(--switch-default-duration)) var(--global-ease);
		}

		.aurora-switch-track:checked {
			border-color: var(--switch-checked-border-color, var(--switch-default-checked-border-color));
			background: var(--switch-checked-background, var(--switch-default-checked-background));
			box-shadow: var(--switch-checked-box-shadow, var(--switch-default-checked-box-shadow));
		}

		.aurora-switch-track:checked::after {
			background: var(--switch-checked-thumb-color, var(--switch-default-checked-thumb-color));
			transform: translateX(
				calc(var(--_dir) * var(--switch-translate-x, calc(var(--_w) - var(--_h))))
			);
		}

		@media (hover: hover) {
			.aurora-switch:hover .aurora-switch-track:not(:checked, :disabled) {
				border-color: var(--switch-hover-border-color, var(--switch-default-hover-border-color));
			}
		}

		.aurora-switch-track:focus-visible {
			outline: var(--switch-focus-ring-width, var(--switch-default-focus-ring-width)) solid
				var(--switch-focus-ring-color, var(--switch-default-focus-ring-color));
			outline-offset: var(--switch-focus-ring-offset, var(--switch-default-focus-ring-offset));
		}

		.aurora-switch:has(.aurora-switch-track:disabled) {
			opacity: var(--switch-disabled-opacity, var(--switch-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-switch-label {
			min-width: 0;
		}
	}
</style>
