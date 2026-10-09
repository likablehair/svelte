<!-- @component
Text input with an optional label, hint and validation state. It renders a native `<input>`: `type`, `disabled`, `readonly`, `required` and events (`oninput`, `onchange`, ...) work as in HTML. Icons can sit outside or inside the field, on either side, and every piece of content (label, icons, state icon, hint) can be replaced with a snippet. Its state is exposed as `data-state`, `data-disabled` and `data-readonly` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './SimpleTextField.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const CHECK_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'class' | 'children'> {
		/** Value of the input. */
		value?: string | number | null;
		/** Native input `type`. */
		type?: 'text' | 'password' | 'number' | 'time' | 'date' | 'email' | 'tel' | 'search' | 'url';
		/** Visible label above the field, linked to the input. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border, the hint and shows an icon. `error` also sets `aria-invalid`. */
		state?: 'error' | 'success';
		/** Native `placeholder`. */
		placeholder?: string;
		/** Native `disabled`. */
		disabled?: boolean;
		/** Native `readonly`. */
		readonly?: boolean;
		/** `id` of the input. Generated when missing, so the label always points to the input. */
		id?: string;
		/** Native `name`. */
		name?: string;
		/** SVG path of an icon outside the field, on the left. */
		prependIcon?: string;
		/** SVG path of an icon inside the field, on the left. */
		prependInnerIcon?: string;
		/** SVG path of an icon inside the field, on the right. */
		appendInnerIcon?: string;
		/** SVG path of an icon outside the field, on the right. */
		appendIcon?: string;
		/** The native `<input>` element. */
		input?: HTMLInputElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			row?: string;
			field?: string;
			input?: string;
			hint?: string;
		};
		/** Replaces the outer left icon. */
		prependSnippet?: Snippet<[{ prependIcon: string | undefined }]>;
		/** Replaces the inner left icon. */
		prependInnerSnippet?: Snippet<[{ prependInnerIcon: string | undefined }]>;
		/** Replaces the inner right icon. */
		appendInnerSnippet?: Snippet<[{ appendInnerIcon: string | undefined }]>;
		/** Replaces the outer right icon. */
		appendSnippet?: Snippet<[{ appendIcon: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the label content (for example to add an "optional" tag). It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the icon shown for `state`. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
	}

	let {
		value = $bindable(),
		type = 'text',
		label,
		hint,
		state,
		placeholder,
		disabled = false,
		readonly = false,
		id,
		name,
		prependIcon,
		prependInnerIcon,
		appendInnerIcon,
		appendIcon,
		input = $bindable(),
		class: clazz = {},
		prependSnippet,
		prependInnerSnippet,
		appendInnerSnippet,
		appendSnippet,
		hintSnippet,
		labelSnippet,
		stateIconSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	let inputId = $derived(id ?? `${uid}-input`);
	const hintId = `${uid}-hint`;
	let describedBy = $derived(
		[rest['aria-describedby'], (hint || hintSnippet) && hintId].filter(Boolean).join(' ') || undefined
	);
</script>

<div
	class={['aurora-text-field', clazz.container]}
	data-state={state}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
>
	{#if labelSnippet}
		<label class={['aurora-text-field-label', clazz.label]} for={inputId}>{@render labelSnippet({ label })}</label>
	{:else if label}
		<label class={['aurora-text-field-label', clazz.label]} for={inputId}>{label}</label>
	{/if}
	<div class={['aurora-text-field-row', clazz.row]}>
		{#if prependSnippet}
			{@render prependSnippet({ prependIcon })}
		{:else if prependIcon}
			<Icon path={prependIcon} />
		{/if}
		<div class={['aurora-text-field-control', clazz.field]}>
			{#if prependInnerSnippet}
				{@render prependInnerSnippet({ prependInnerIcon })}
			{:else if prependInnerIcon}
				<Icon path={prependInnerIcon} />
			{/if}
			<input
				{...rest}
				bind:value
				bind:this={input}
				id={inputId}
				{type}
				{name}
				{placeholder}
				{disabled}
				{readonly}
				aria-invalid={state === 'error' || rest['aria-invalid'] || undefined}
				aria-describedby={describedBy}
				class={clazz.input}
			/>
			{#if appendInnerSnippet}
				{@render appendInnerSnippet({ appendInnerIcon })}
			{:else if appendInnerIcon}
				<Icon path={appendInnerIcon} />
			{/if}
			{#if state && stateIconSnippet}
				{@render stateIconSnippet({ state })}
			{:else if state}
				<Icon path={state === 'error' ? ALERT_ICON : CHECK_ICON} class="aurora-text-field-state-icon" />
			{/if}
		</div>
		{#if appendSnippet}
			{@render appendSnippet({ appendIcon })}
		{:else if appendIcon}
			<Icon path={appendIcon} />
		{/if}
	</div>
	{#if hintSnippet}
		<div class={['aurora-text-field-hint', clazz.hint]} id={hintId}>{@render hintSnippet({ hint })}</div>
	{:else if hint}
		<div class={['aurora-text-field-hint', clazz.hint]} id={hintId}>{hint}</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-text-field {
			--_border: var(
				--simple-text-field-border-color,
				var(--simple-text-field-default-border-color)
			);
			--_hover-border: var(
				--simple-text-field-hover-border-color,
				var(--simple-text-field-default-hover-border-color)
			);
			--_focus-border: var(
				--simple-text-field-focus-border-color,
				var(--simple-text-field-default-focus-border-color)
			);
			--_ring: var(
				--simple-text-field-focus-ring-color,
				var(--simple-text-field-default-focus-ring-color)
			);
			--_hint: var(--simple-text-field-hint-color, var(--simple-text-field-default-hint-color));
			--icon-size: var(--simple-text-field-icon-size, var(--simple-text-field-default-icon-size));

			display: flex;
			flex-direction: column;
			gap: var(--simple-text-field-gap, var(--simple-text-field-default-gap));
			box-sizing: border-box;
			width: var(--simple-text-field-width, var(--simple-text-field-default-width));
			max-width: var(--simple-text-field-max-width, var(--simple-text-field-default-max-width));
			min-width: 0;
		}

		.aurora-text-field[data-state='error'] {
			--_border: var(--simple-text-field-error-color, var(--simple-text-field-default-error-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-text-field[data-state='success'] {
			--_border: var(
				--simple-text-field-success-color,
				var(--simple-text-field-default-success-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-text-field-label {
			color: var(--simple-text-field-label-color, var(--simple-text-field-default-label-color));
			font-size: var(
				--simple-text-field-label-font-size,
				var(--simple-text-field-default-label-font-size)
			);
			font-weight: var(
				--simple-text-field-label-font-weight,
				var(--simple-text-field-default-label-font-weight)
			);
		}

		.aurora-text-field-row {
			display: flex;
			align-items: center;
			gap: var(--simple-text-field-outer-gap, var(--simple-text-field-default-outer-gap));
			color: var(--simple-text-field-icon-color, var(--simple-text-field-default-icon-color));
		}

		.aurora-text-field-control {
			flex: 1;
			min-width: 0;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(--simple-text-field-inner-gap, var(--simple-text-field-default-inner-gap));
			height: var(--simple-text-field-height, var(--simple-text-field-default-height));
			padding: var(--simple-text-field-padding, var(--simple-text-field-default-padding));
			background: var(--simple-text-field-background, var(--simple-text-field-default-background));
			border: var(--simple-text-field-border-width, var(--simple-text-field-default-border-width))
				solid var(--_border);
			border-radius: var(
				--simple-text-field-border-radius,
				var(--simple-text-field-default-border-radius)
			);
			box-shadow: var(--simple-text-field-box-shadow, var(--simple-text-field-default-box-shadow));
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-text-field:not([data-disabled]) .aurora-text-field-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-text-field-control:focus-within {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
				var(
					--simple-text-field-focus-ring-width,
					var(--simple-text-field-default-focus-ring-width)
				)
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-text-field-control:focus-within > :global(.aurora-icon) {
			color: var(--_focus-border);
		}

		.aurora-text-field-control :global(.aurora-text-field-state-icon) {
			color: var(--_border);
		}

		input {
			flex: 1;
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--simple-text-field-color, var(--simple-text-field-default-color));
			font-family: inherit;
			font-size: var(--simple-text-field-font-size, var(--simple-text-field-default-font-size));
			font-weight: var(--simple-text-field-font-weight, var(--simple-text-field-default-font-weight));
		}

		input::placeholder {
			color: var(
				--simple-text-field-placeholder-color,
				var(--simple-text-field-default-placeholder-color)
			);
			opacity: 1;
		}

		.aurora-text-field-hint {
			color: var(--_hint);
			font-size: var(
				--simple-text-field-hint-font-size,
				var(--simple-text-field-default-hint-font-size)
			);
		}

		.aurora-text-field[data-disabled] .aurora-text-field-control {
			background: var(
				--simple-text-field-disabled-background,
				var(--simple-text-field-default-disabled-background)
			);
			opacity: var(
				--simple-text-field-disabled-opacity,
				var(--simple-text-field-default-disabled-opacity)
			);
			cursor: not-allowed;
		}

		.aurora-text-field[data-disabled] input {
			cursor: not-allowed;
		}
	}
</style>
