<!-- @component
Multi-line text field with an optional label, hint, character counter and validation state. It renders a native `<textarea>`: `rows`, `maxlength`, `disabled`, `readonly`, `required` and events (`oninput`, `onchange`, ...) work as in HTML. By default the user can drag it taller; with `autoGrow` it grows with its content instead, between `rows` lines and `--textarea-max-height`. Every piece of content (label, state icon, hint, counter) can be replaced with a snippet. Its state is exposed as `data-state`, `data-disabled` and `data-readonly` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Textarea.css';
	import type { Snippet } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const CHECK_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';

	interface Props extends Omit<HTMLTextareaAttributes, 'value' | 'class' | 'children'> {
		/** Text of the field. */
		value?: string | null;
		/** Visible label above the field, linked to the textarea. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. */
		state?: 'error' | 'success';
		/** Native `placeholder`. */
		placeholder?: string;
		/** Native `rows`: the visible lines, and the minimum height with `autoGrow`. */
		rows?: number;
		/** Native `maxlength`. With `counter` it is shown as the limit. */
		maxlength?: number;
		/** Shows the number of characters below the field, as `length / maxlength` when `maxlength` is set. */
		counter?: boolean;
		/** Grows with the content instead of scrolling, up to `--textarea-max-height`. It also turns off manual resizing. */
		autoGrow?: boolean;
		/** Native `disabled`. */
		disabled?: boolean;
		/** Native `readonly`. */
		readonly?: boolean;
		/** `id` of the textarea. Generated when missing, so the label always points to the textarea. */
		id?: string;
		/** Native `name`. */
		name?: string;
		/** The native `<textarea>` element. */
		textarea?: HTMLTextAreaElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			field?: string;
			textarea?: string;
			hint?: string;
			counter?: string;
		};
		/** Replaces the label content (for example to add an "optional" tag). It stays linked to the textarea. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the icon shown for `state`. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the counter content. */
		counterSnippet?: Snippet<[{ length: number; maxlength: number | undefined }]>;
	}

	let {
		value = $bindable(),
		label,
		hint,
		state,
		placeholder,
		rows = 3,
		maxlength,
		counter = false,
		autoGrow = false,
		disabled = false,
		readonly = false,
		id,
		name,
		textarea = $bindable(),
		class: clazz = {},
		labelSnippet,
		stateIconSnippet,
		hintSnippet,
		counterSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	let textareaId = $derived(id ?? `${uid}-textarea`);
	const hintId = `${uid}-hint`;
	const counterId = `${uid}-counter`;
	let hasHint = $derived(!!hint || !!hintSnippet);
	let length = $derived(value?.length ?? 0);
	let describedBy = $derived(
		[rest['aria-describedby'], hasHint && hintId, counter && counterId].filter(Boolean).join(' ') ||
			undefined
	);

	function fitContent(node: HTMLTextAreaElement) {
		if (CSS.supports('field-sizing', 'content')) return;
		const fit = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};
		$effect(() => {
			void value;
			fit();
		});
		let width = node.offsetWidth;
		const observer = new ResizeObserver(() => {
			if (node.offsetWidth === width) return;
			width = node.offsetWidth;
			fit();
		});
		observer.observe(node);
		return () => {
			observer.disconnect();
			node.style.height = '';
		};
	}
</script>

<div
	class={['aurora-textarea', clazz.container]}
	data-state={state}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-auto-grow={autoGrow || undefined}
	style:--_rows={rows}
>
	{#if labelSnippet}
		<label class={['aurora-textarea-label', clazz.label]} for={textareaId}
			>{@render labelSnippet({ label })}</label
		>
	{:else if label}
		<label class={['aurora-textarea-label', clazz.label]} for={textareaId}>{label}</label>
	{/if}
	<div class={['aurora-textarea-control', clazz.field]}>
		<textarea
			{...rest}
			bind:value
			bind:this={textarea}
			{@attach autoGrow && fitContent}
			id={textareaId}
			{name}
			{placeholder}
			{rows}
			{maxlength}
			{disabled}
			{readonly}
			aria-invalid={state === 'error' || rest['aria-invalid'] || undefined}
			aria-describedby={describedBy}
			class={clazz.textarea}
		></textarea>
		{#if state && stateIconSnippet}
			{@render stateIconSnippet({ state })}
		{:else if state}
			<Icon path={state === 'error' ? ALERT_ICON : CHECK_ICON} class="aurora-textarea-state-icon" />
		{/if}
	</div>
	{#if hasHint || counter}
		<div class="aurora-textarea-footer">
			{#if hintSnippet}
				<div class={['aurora-textarea-hint', clazz.hint]} id={hintId}>{@render hintSnippet({ hint })}</div>
			{:else if hint}
				<div class={['aurora-textarea-hint', clazz.hint]} id={hintId}>{hint}</div>
			{/if}
			{#if counter}
				<div class={['aurora-textarea-counter', clazz.counter]} id={counterId}>
					{#if counterSnippet}
						{@render counterSnippet({ length, maxlength })}
					{:else}
						{length}{maxlength != null ? ` / ${maxlength}` : ''}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-textarea {
			--_border: var(--textarea-border-color, var(--textarea-default-border-color));
			--_hover-border: var(--textarea-hover-border-color, var(--textarea-default-hover-border-color));
			--_focus-border: var(--textarea-focus-border-color, var(--textarea-default-focus-border-color));
			--_ring: var(--textarea-focus-ring-color, var(--textarea-default-focus-ring-color));
			--_hint: var(--textarea-hint-color, var(--textarea-default-hint-color));
			--_min-height: var(--textarea-default-min-height);
			--_resize: var(--textarea-resize, var(--textarea-default-resize));
			--icon-size: var(--textarea-icon-size, var(--textarea-default-icon-size));

			display: flex;
			flex-direction: column;
			gap: var(--textarea-gap, var(--textarea-default-gap));
			box-sizing: border-box;
			width: var(--textarea-width, var(--textarea-default-width));
			max-width: var(--textarea-max-width, var(--textarea-default-max-width));
			min-width: 0;
		}

		.aurora-textarea[data-auto-grow] {
			--_min-height: calc(var(--_rows) * 1lh);
			--_resize: none;
		}

		.aurora-textarea[data-state='error'] {
			--_border: var(--textarea-error-color, var(--textarea-default-error-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-textarea[data-state='success'] {
			--_border: var(--textarea-success-color, var(--textarea-default-success-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-textarea-label {
			color: var(--textarea-label-color, var(--textarea-default-label-color));
			font-size: var(--textarea-label-font-size, var(--textarea-default-label-font-size));
			font-weight: var(--textarea-label-font-weight, var(--textarea-default-label-font-weight));
		}

		.aurora-textarea-control {
			display: flex;
			align-items: flex-start;
			gap: var(--textarea-inner-gap, var(--textarea-default-inner-gap));
			box-sizing: border-box;
			padding: var(--textarea-padding, var(--textarea-default-padding));
			background: var(--textarea-background, var(--textarea-default-background));
			border: var(--textarea-border-width, var(--textarea-default-border-width)) solid var(--_border);
			border-radius: var(--textarea-border-radius, var(--textarea-default-border-radius));
			box-shadow: var(--textarea-box-shadow, var(--textarea-default-box-shadow));
			color: var(--textarea-color, var(--textarea-default-color));
			font-family: var(--textarea-font-family, var(--textarea-default-font-family));
			font-size: var(--textarea-font-size, var(--textarea-default-font-size));
			font-weight: var(--textarea-font-weight, var(--textarea-default-font-weight));
			line-height: var(--textarea-line-height, var(--textarea-default-line-height));
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-textarea:not([data-disabled]) .aurora-textarea-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-textarea-control:focus-within {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0 var(--textarea-focus-ring-width, var(--textarea-default-focus-ring-width))
				var(--_ring);
			outline: 2px solid transparent;
		}

		textarea {
			flex: 1;
			box-sizing: border-box;
			min-width: 0;
			height: var(--textarea-height, var(--textarea-default-height));
			min-height: var(--textarea-min-height, var(--_min-height));
			max-height: var(--textarea-max-height, var(--textarea-default-max-height));
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: inherit;
			font: inherit;
			resize: var(--_resize);
		}

		.aurora-textarea[data-auto-grow] textarea {
			field-sizing: content;
		}

		textarea::placeholder {
			color: var(--textarea-placeholder-color, var(--textarea-default-placeholder-color));
			opacity: 1;
		}

		.aurora-textarea-control :global(.aurora-textarea-state-icon) {
			margin-block: calc((1lh - var(--icon-size)) / 2);
			color: var(--_border);
		}

		.aurora-textarea-footer {
			display: flex;
			align-items: baseline;
			gap: 8px;
		}

		.aurora-textarea-hint {
			min-width: 0;
			color: var(--_hint);
			font-size: var(--textarea-hint-font-size, var(--textarea-default-hint-font-size));
		}

		.aurora-textarea-counter {
			flex-shrink: 0;
			margin-inline-start: auto;
			color: var(--textarea-counter-color, var(--textarea-default-counter-color));
			font-family: var(--textarea-counter-font-family, var(--textarea-default-counter-font-family));
			font-size: var(--textarea-counter-font-size, var(--textarea-default-counter-font-size));
			font-variant-numeric: tabular-nums;
		}

		.aurora-textarea[data-disabled] .aurora-textarea-control {
			background: var(--textarea-disabled-background, var(--textarea-default-disabled-background));
			opacity: var(--textarea-disabled-opacity, var(--textarea-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-textarea[data-disabled] textarea {
			cursor: not-allowed;
		}
	}
</style>
