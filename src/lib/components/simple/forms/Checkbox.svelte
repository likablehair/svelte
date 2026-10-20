<!-- @component
Checkbox with an optional label next to it. It renders a native `<input type="checkbox">` inside a `<label>`, so a click on the text toggles it: `name`, `value`, `required`, `disabled` and events (`onchange`, `onclick`, ...) work as in HTML. `indeterminate` shows the partial state of a "select all"; a click clears it, as in HTML. To know whether Shift was held (range selection), read `event.shiftKey` in `onclick`: it works for a click on the box, and in Chromium also for the Space key and a click on the text (Firefox reports Shift+Space without Shift and does not toggle the box on a Shift+click on the text). Its state is exposed as `data-checked`, `data-indeterminate` and `data-disabled` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Checkbox.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props
		extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'class' | 'children' | 'indeterminate'> {
		/** Checked state. */
		checked?: boolean;
		/** Partial state, for example a "select all" with only some rows selected. A click clears it and toggles `checked`. */
		indeterminate?: boolean;
		/** Text next to the box. A click on it toggles the checkbox. */
		label?: string;
		/** Native `disabled`. */
		disabled?: boolean;
		/** The native `<input>` element. */
		input?: HTMLInputElement;
		/** Extra classes for each part: the root `<label>`, the input and the text. */
		class?: {
			container?: string;
			input?: string;
			label?: string;
		};
		/** Replaces the text next to the box (for example to add a link). A click on it still toggles the checkbox. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
	}

	let {
		checked = $bindable(),
		indeterminate = $bindable(),
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
	class={['aurora-checkbox', labelled && 'aurora-checkbox-labelled', clazz.container]}
	data-checked={checked || undefined}
	data-indeterminate={indeterminate || undefined}
	data-disabled={disabled || undefined}
>
	<input
		{...rest}
		bind:this={input}
		bind:checked
		bind:indeterminate
		type="checkbox"
		{disabled}
		class={['aurora-checkbox-box', clazz.input]}
	/>
	{#if labelSnippet}
		<span class={['aurora-checkbox-label', clazz.label]}>{@render labelSnippet({ label })}</span>
	{:else if label}
		<span class={['aurora-checkbox-label', clazz.label]}>{label}</span>
	{/if}
</label>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-checkbox {
			--_size: var(--checkbox-size, var(--checkbox-default-size));

			display: inline-flex;
			align-items: center;
			gap: var(--checkbox-gap, var(--checkbox-default-gap));
			vertical-align: middle;
			color: var(--checkbox-label-color, var(--checkbox-default-label-color));
			font-size: var(--checkbox-label-font-size, var(--checkbox-default-label-font-size));
			font-weight: var(--checkbox-label-font-weight, var(--checkbox-default-label-font-weight));
			line-height: var(--checkbox-label-line-height, var(--checkbox-default-label-line-height));
			cursor: pointer;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
		}

		.aurora-checkbox-labelled {
			align-items: flex-start;
		}

		.aurora-checkbox-box {
			box-sizing: border-box;
			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--_size);
			height: var(--_size);
			margin: 0;
			border: var(--checkbox-border-width, var(--checkbox-default-border-width)) solid
				var(--checkbox-border-color, var(--checkbox-default-border-color));
			border-radius: var(--checkbox-border-radius, var(--checkbox-default-border-radius));
			background: var(--checkbox-background, var(--checkbox-default-background));
			box-shadow: var(--checkbox-box-shadow, var(--checkbox-default-box-shadow));
			font: inherit;
			appearance: none;
			cursor: inherit;
			transition:
				background var(--checkbox-duration, var(--checkbox-default-duration)) var(--global-ease),
				border-color var(--checkbox-duration, var(--checkbox-default-duration)) var(--global-ease),
				box-shadow var(--checkbox-duration, var(--checkbox-default-duration)) var(--global-ease);
		}

		.aurora-checkbox-labelled .aurora-checkbox-box {
			margin-block: calc((1lh - var(--_size)) / 2);
		}

		.aurora-checkbox-box::after {
			content: '';
			box-sizing: border-box;
			width: calc(var(--_size) * 0.55);
			height: calc(var(--_size) * 0.33);
			margin-top: calc(var(--_size) * -0.1);
			border-left: var(--checkbox-mark-thickness, var(--checkbox-default-mark-thickness)) solid
				var(--checkbox-mark-color, var(--checkbox-default-mark-color));
			border-bottom: var(--checkbox-mark-thickness, var(--checkbox-default-mark-thickness)) solid
				var(--checkbox-mark-color, var(--checkbox-default-mark-color));
			transform: rotate(-45deg) scale(0);
			transition: transform var(--checkbox-duration, var(--checkbox-default-duration))
				var(--checkbox-easing, var(--checkbox-default-easing));
		}

		.aurora-checkbox-box:checked,
		.aurora-checkbox-box:indeterminate {
			border-color: var(--checkbox-checked-border-color, var(--checkbox-default-checked-border-color));
			background: var(--checkbox-checked-background, var(--checkbox-default-checked-background));
			box-shadow: var(--checkbox-checked-box-shadow, var(--checkbox-default-checked-box-shadow));
		}

		.aurora-checkbox-box:checked::after {
			transform: rotate(-45deg) scale(1);
		}

		.aurora-checkbox-box:indeterminate::after {
			height: 0;
			margin: 0;
			border-left: 0;
			transform: none;
		}

		@media (hover: hover) {
			.aurora-checkbox:hover .aurora-checkbox-box:not(:checked, :indeterminate, :disabled) {
				border-color: var(--checkbox-hover-border-color, var(--checkbox-default-hover-border-color));
			}
		}

		.aurora-checkbox-box:focus-visible {
			outline: var(--checkbox-focus-ring-width, var(--checkbox-default-focus-ring-width)) solid
				var(--checkbox-focus-ring-color, var(--checkbox-default-focus-ring-color));
			outline-offset: var(--checkbox-focus-ring-offset, var(--checkbox-default-focus-ring-offset));
		}

		.aurora-checkbox:has(.aurora-checkbox-box:disabled) {
			opacity: var(--checkbox-disabled-opacity, var(--checkbox-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-checkbox-label {
			min-width: 0;
		}
	}
</style>
