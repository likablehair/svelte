<!-- @component
Text input with an optional label, hint and validation state. It renders a native `<input>`: `type`, `disabled`, `readonly`, `required` and events (`oninput`, `onchange`, ...) work as in HTML. Icons can sit outside or inside the field, on either side, and every piece of content (label, icons, state icon, hint) can be replaced with a snippet. With `type="password"` and `revealable` an eye button inside the field shows and hides the password. Its state is exposed as `data-state`, `data-disabled`, `data-readonly` and `data-revealed` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './SimpleTextField.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const CHECK_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';
	const EYE_ICON =
		'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z';
	const EYE_OFF_ICON =
		'M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z';

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
		/** With `type="password"`, shows an eye button inside the field that shows and hides the password. */
		revealable?: boolean;
		/** Whether the password is shown as plain text, with `revealable`. Bind it to read or set it. */
		revealed?: boolean;
		/** Accessible name of the eye button, a toggle that is pressed while the password is shown. Defaults to "Show password", in the language of `locale`. */
		revealLabel?: string;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
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
		revealable = false,
		revealed = $bindable(),
		revealLabel,
		locale: localeProp,
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

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).simpleTextField);
	let canReveal = $derived(revealable && type === 'password');
	let inputType = $derived(canReveal && revealed ? 'text' : type);
</script>

<div
	class={['aurora-text-field', clazz.container]}
	data-state={state}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-revealed={(canReveal && revealed) || undefined}
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
				type={inputType}
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
			{#if canReveal}
				<button
					type="button"
					class="aurora-text-field-reveal"
					aria-label={revealLabel ?? texts.showPassword}
					aria-pressed={!!revealed}
					aria-controls={inputId}
					{disabled}
					onmousedown={(event) => event.preventDefault()}
					onclick={() => (revealed = !revealed)}
				>
					<Icon path={revealed ? EYE_OFF_ICON : EYE_ICON} />
				</button>
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

		.aurora-text-field-reveal {
			display: inline-flex;
			flex: none;
			align-items: center;
			justify-content: center;
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--global-radius-xs);
			background: transparent;
			color: var(--simple-text-field-reveal-color, var(--simple-text-field-default-reveal-color));
			cursor: pointer;
		}

		.aurora-text-field-reveal:disabled {
			cursor: not-allowed;
		}

		@media (hover: hover) {
			.aurora-text-field-reveal:hover:not(:disabled) {
				color: var(
					--simple-text-field-reveal-hover-color,
					var(--simple-text-field-default-reveal-hover-color)
				);
			}
		}

		.aurora-text-field-reveal:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 1px;
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
