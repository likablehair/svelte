<!-- @component
Radio button with an optional label and description. It renders a native `<input type="radio">` inside a `<label>`, so a click on the text selects it: `name`, `required`, `disabled` and events (`onchange`, `onclick`, ...) work as in HTML, and radios with the same `name` form a group that the arrow keys move through. Bind the selected value of the group with `bind:group`, as with Svelte's `bind:group`: every radio of the group gets the same variable and its own `value`. `card` turns it into a bordered box that highlights when selected. To render a whole group from a list use `RadioGroup`. Its state is exposed as `data-checked` (from `group`, or `checked` without it), `data-disabled` and `data-card` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './RadioButton.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props
		extends Omit<HTMLInputAttributes, 'type' | 'value' | 'checked' | 'class' | 'children' | 'group'> {
		/** Value of this radio. It becomes `group` when the radio is selected; in a form it is sent as text. */
		value: string | number;
		/** Value of the selected radio of the group. Use `bind:group` with the same variable on every radio of the group. */
		group?: string | number;
		/** Native `checked`, one way. Used only while `group` is `undefined`. */
		checked?: boolean;
		/** Text next to the circle. A click on it selects the radio. */
		label?: string;
		/** Secondary text below the label. It is read as the description of the radio, not as part of its name. */
		description?: string;
		/** Shows the radio as a bordered box that highlights when selected. */
		card?: boolean;
		/** Native `disabled`. */
		disabled?: boolean;
		/** The native `<input>` element. */
		input?: HTMLInputElement;
		/** Extra classes for each part: the root `<label>`, the input, the label text and the description. */
		class?: {
			container?: string;
			input?: string;
			label?: string;
			description?: string;
		};
		/** Replaces the text next to the circle. A click on it still selects the radio. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the secondary text below the label. */
		descriptionSnippet?: Snippet<[{ description: string | undefined }]>;
	}

	let {
		value,
		group = $bindable(),
		checked,
		label,
		description,
		card = false,
		disabled = false,
		input = $bindable(),
		class: clazz = {},
		labelSnippet,
		descriptionSnippet,
		onchange,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const descriptionId = `${uid}-description`;

	let selected = $derived(group === undefined ? !!checked : group === value);
	let hasLabel = $derived(!!label || !!labelSnippet);
	let hasDescription = $derived(!!description || !!descriptionSnippet);

	function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		if (event.currentTarget.checked) group = value;
		onchange?.(event);
	}
</script>

<label
	class={[
		'aurora-radio-button',
		(hasLabel || hasDescription) && 'aurora-radio-button-labelled',
		clazz.container
	]}
	data-checked={selected || undefined}
	data-disabled={disabled || undefined}
	data-card={card || undefined}
>
	<input
		{...rest}
		bind:this={input}
		type="radio"
		{value}
		checked={selected}
		{disabled}
		aria-labelledby={hasDescription && hasLabel ? labelId : rest['aria-labelledby']}
		aria-describedby={hasDescription ? descriptionId : rest['aria-describedby']}
		onchange={handleChange}
		class={['aurora-radio-button-circle', clazz.input]}
	/>
	{#if hasLabel || hasDescription}
		<span class="aurora-radio-button-text">
			{#if labelSnippet}
				<span class={['aurora-radio-button-label', clazz.label]} id={labelId}
					>{@render labelSnippet({ label })}</span
				>
			{:else if label}
				<span class={['aurora-radio-button-label', clazz.label]} id={labelId}>{label}</span>
			{/if}
			{#if descriptionSnippet}
				<span class={['aurora-radio-button-description', clazz.description]} id={descriptionId}
					>{@render descriptionSnippet({ description })}</span
				>
			{:else if description}
				<span class={['aurora-radio-button-description', clazz.description]} id={descriptionId}
					>{description}</span
				>
			{/if}
		</span>
	{/if}
</label>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-radio-button {
			--_size: var(--radio-button-size, var(--radio-button-default-size));
			--_duration: var(--radio-button-duration, var(--radio-button-default-duration));

			display: inline-flex;
			align-items: center;
			gap: var(--radio-button-gap, var(--radio-button-default-gap));
			box-sizing: border-box;
			vertical-align: middle;
			color: var(--radio-button-label-color, var(--radio-button-default-label-color));
			font-size: var(--radio-button-label-font-size, var(--radio-button-default-label-font-size));
			font-weight: var(
				--radio-button-label-font-weight,
				var(--radio-button-default-label-font-weight)
			);
			line-height: var(
				--radio-button-label-line-height,
				var(--radio-button-default-label-line-height)
			);
			cursor: pointer;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
		}

		.aurora-radio-button-labelled {
			align-items: flex-start;
		}

		.aurora-radio-button-circle {
			box-sizing: border-box;
			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--_size);
			height: var(--_size);
			margin: 0;
			border: var(--radio-button-border-width, var(--radio-button-default-border-width)) solid
				var(--radio-button-border-color, var(--radio-button-default-border-color));
			border-radius: 50%;
			background: var(--radio-button-background, var(--radio-button-default-background));
			box-shadow: var(--radio-button-box-shadow, var(--radio-button-default-box-shadow));
			font: inherit;
			appearance: none;
			cursor: inherit;
			transition:
				background var(--_duration) var(--global-ease),
				border-color var(--_duration) var(--global-ease),
				box-shadow var(--_duration) var(--global-ease);
		}

		.aurora-radio-button-labelled .aurora-radio-button-circle {
			margin-block: calc((1lh - var(--_size)) / 2);
		}

		.aurora-radio-button-circle::after {
			content: '';
			width: var(--radio-button-dot-size, var(--radio-button-default-dot-size));
			height: var(--radio-button-dot-size, var(--radio-button-default-dot-size));
			border-radius: 50%;
			background: var(--radio-button-dot-color, var(--radio-button-default-dot-color));
			transform: scale(0);
			transition: transform var(--_duration)
				var(--radio-button-easing, var(--radio-button-default-easing));
		}

		.aurora-radio-button-circle:checked {
			border-color: var(
				--radio-button-checked-border-color,
				var(--radio-button-default-checked-border-color)
			);
			background: var(
				--radio-button-checked-background,
				var(--radio-button-default-checked-background)
			);
			box-shadow: var(
				--radio-button-checked-box-shadow,
				var(--radio-button-default-checked-box-shadow)
			);
		}

		.aurora-radio-button-circle:checked::after {
			transform: scale(1);
		}

		@media (hover: hover) {
			.aurora-radio-button:hover .aurora-radio-button-circle:not(:checked, :disabled) {
				border-color: var(
					--radio-button-hover-border-color,
					var(--radio-button-default-hover-border-color)
				);
			}
		}

		.aurora-radio-button-circle:focus-visible {
			outline: var(--radio-button-focus-ring-width, var(--radio-button-default-focus-ring-width))
				solid var(--radio-button-focus-ring-color, var(--radio-button-default-focus-ring-color));
			outline-offset: var(
				--radio-button-focus-ring-offset,
				var(--radio-button-default-focus-ring-offset)
			);
		}

		.aurora-radio-button-text {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-radio-button-description {
			color: var(
				--radio-button-description-color,
				var(--radio-button-default-description-color)
			);
			font-size: var(
				--radio-button-description-font-size,
				var(--radio-button-default-description-font-size)
			);
		}

		.aurora-radio-button[data-card] {
			display: flex;
			padding: var(--radio-button-card-padding, var(--radio-button-default-card-padding));
			border: var(--radio-button-card-border-width, var(--radio-button-default-card-border-width))
				solid var(--radio-button-card-border-color, var(--radio-button-default-card-border-color));
			border-radius: var(
				--radio-button-card-border-radius,
				var(--radio-button-default-card-border-radius)
			);
			background: var(--radio-button-card-background, var(--radio-button-default-card-background));
			box-shadow: var(--radio-button-card-box-shadow, var(--radio-button-default-card-box-shadow));
			transition:
				background var(--_duration) var(--global-ease),
				border-color var(--_duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-radio-button[data-card]:hover:not(:has(:checked, :disabled)) {
				border-color: var(
					--radio-button-card-hover-border-color,
					var(--radio-button-default-card-hover-border-color)
				);
			}
		}

		.aurora-radio-button[data-card]:has(:checked) {
			border-color: var(
				--radio-button-card-checked-border-color,
				var(--radio-button-default-card-checked-border-color)
			);
			background: var(
				--radio-button-card-checked-background,
				var(--radio-button-default-card-checked-background)
			);
		}

		.aurora-radio-button[data-card]:has(:focus-visible) {
			outline: var(--radio-button-focus-ring-width, var(--radio-button-default-focus-ring-width))
				solid var(--radio-button-focus-ring-color, var(--radio-button-default-focus-ring-color));
			outline-offset: var(
				--radio-button-focus-ring-offset,
				var(--radio-button-default-focus-ring-offset)
			);
		}

		.aurora-radio-button[data-card] .aurora-radio-button-circle:focus-visible {
			outline: none;
		}

		.aurora-radio-button:has(.aurora-radio-button-circle:disabled) {
			opacity: var(--radio-button-disabled-opacity, var(--radio-button-default-disabled-opacity));
			cursor: not-allowed;
		}
	}
</style>
