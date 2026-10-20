<!-- @component
Field that picks one option from a list, built on the native `<select>`: forms, `required`, the keyboard and the native picker on phones work as in HTML, and so do events (`onchange`, `oninput`, ...). Options are `Item` objects, `{ value: string | number; label?: string | number; icon?: string; data?: Data }`, and `value` holds the `value` of the selected one. With `placeholder`, `value` stays `undefined` until an option is chosen; without it the first option is selected, as in HTML. Where the browser supports `appearance: base-select` (Chrome and Edge 135+, Safari 27+) the list opens in a styled popup with icons, a check mark and custom content (`itemSnippet`), and the field shows the content of the selected option; other browsers open their native list, which shows only the labels. For multiple selection or a button trigger use `Dropdown`. Its state is exposed as `data-state`, `data-disabled` and `data-empty` for app CSS.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './Select.css';
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import type { Item } from './item.js';

	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const SUCCESS_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';
	const CHECK_ICON = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';
	const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';

	interface Props extends Omit<HTMLSelectAttributes, 'value' | 'class' | 'children' | 'multiple'> {
		/** Options to choose from. */
		items?: Item<Data>[];
		/** `value` of the selected option. `undefined` while the placeholder is shown. */
		value?: string | number;
		/** Visible label above the field, linked to the select. */
		label?: string;
		/** Text shown in the field until an option is chosen. It is not in the list, and with `required` the form cannot be submitted while it is shown. */
		placeholder?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. */
		state?: 'error' | 'success';
		/** Native `disabled`. */
		disabled?: boolean;
		/** `id` of the select. Generated when missing, so the label always points to the select. */
		id?: string;
		/** Native `name`: the selected `value` is submitted under it. */
		name?: string;
		/** The native `<select>` element. */
		select?: HTMLSelectElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			field?: string;
			select?: string;
			option?: string;
			hint?: string;
		};
		/** Replaces the label content. It stays linked to the select. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the icon shown for `state`. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the arrow on the right of the field. */
		chevronSnippet?: Snippet;
		/** Replaces the content of each option (icon and label) in the styled list, and of the field when the option is selected. Browsers without `appearance: base-select` show the label instead. */
		itemSnippet?: Snippet<[{ item: Item<Data>; index: number }]>;
		/** Replaces the check mark of the selected option in the styled list. */
		checkSnippet?: Snippet;
	}

	let {
		items = [],
		value = $bindable(),
		label,
		placeholder,
		hint,
		state: validation,
		disabled = false,
		id,
		name,
		select = $bindable(),
		class: clazz = {},
		labelSnippet,
		hintSnippet,
		stateIconSnippet,
		chevronSnippet,
		itemSnippet,
		checkSnippet,
		...rest
	}: Props = $props();

	let selectNode = $state<HTMLSelectElement>();

	const uid = $props.id();
	let selectId = $derived(id ?? `${uid}-select`);
	const hintId = `${uid}-hint`;
	let describedBy = $derived(
		[rest['aria-describedby'], (hint || hintSnippet) && hintId].filter(Boolean).join(' ') || undefined
	);

	let rich = $state(false);
	let endWidth = $state<number>();

	const text = (item: Item<Data>) => String(item.label ?? item.value);

	$effect(() => {
		rich = CSS.supports('appearance', 'base-select');
	});

	$effect(() => {
		if (!rich || !itemSnippet || !selectNode) return;
		const index = selectNode.selectedIndex;
		selectNode.selectedIndex = -1;
		selectNode.selectedIndex = index;
	});
</script>

<div
	class={['aurora-select', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-empty={value === undefined || undefined}
>
	{#if labelSnippet}
		<label class={['aurora-select-label', clazz.label]} for={selectId}>{@render labelSnippet({ label })}</label>
	{:else if label}
		<label class={['aurora-select-label', clazz.label]} for={selectId}>{label}</label>
	{/if}
	<div class={['aurora-select-control', clazz.field]} style:--_end-width={endWidth ? `${endWidth}px` : undefined}>
		<select
			{...rest}
			bind:value={
				() => value ?? (placeholder === undefined ? undefined : ''),
				(next) => (value = next === '' ? undefined : next)
			}
			bind:this={() => selectNode, (node) => (selectNode = select = node)}
			id={selectId}
			{name}
			{disabled}
			aria-invalid={validation === 'error' || rest['aria-invalid'] || undefined}
			aria-describedby={describedBy}
			class={clazz.select}
		>
			<button class="aurora-select-button"><selectedcontent></selectedcontent></button>
			{#if placeholder !== undefined}
				<option value="" disabled hidden>{placeholder}</option>
			{/if}
			{#each items as item, index (item.value)}
				<option value={item.value} class={['aurora-select-option', clazz.option]}>
					<span class="aurora-select-option-content">
						{#if itemSnippet && rich}
							{@render itemSnippet({ item, index })}
						{:else}
							{#if item.icon}<Icon path={item.icon} />{/if}
							<span class="aurora-select-option-label">{text(item)}</span>
						{/if}
					</span>
					<span class="aurora-select-check">
						{#if checkSnippet}
							{@render checkSnippet()}
						{:else}
							<Icon path={CHECK_ICON} />
						{/if}
					</span>
				</option>
			{/each}
		</select>
		<span class="aurora-select-end" bind:offsetWidth={endWidth}>
			{#if validation && stateIconSnippet}
				{@render stateIconSnippet({ state: validation })}
			{:else if validation}
				<Icon path={validation === 'error' ? ALERT_ICON : SUCCESS_ICON} class="aurora-select-state-icon" />
			{/if}
			{#if chevronSnippet}
				{@render chevronSnippet()}
			{:else}
				<Icon path={CHEVRON_ICON} />
			{/if}
		</span>
	</div>
	{#if hintSnippet}
		<div class={['aurora-select-hint', clazz.hint]} id={hintId}>{@render hintSnippet({ hint })}</div>
	{:else if hint}
		<div class={['aurora-select-hint', clazz.hint]} id={hintId}>{hint}</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-select {
			--_border: var(--select-border-color, var(--select-default-border-color));
			--_hover-border: var(--select-hover-border-color, var(--select-default-hover-border-color));
			--_focus-border: var(--select-focus-border-color, var(--select-default-focus-border-color));
			--_ring: var(--select-focus-ring-color, var(--select-default-focus-ring-color));
			--_hint: var(--select-hint-color, var(--select-default-hint-color));
			--_padding-x: var(--select-padding-x, var(--select-default-padding-x));
			--_gap: var(--select-inner-gap, var(--select-default-inner-gap));
			--icon-size: var(--select-icon-size, var(--select-default-icon-size));

			display: flex;
			flex-direction: column;
			gap: var(--select-gap, var(--select-default-gap));
			box-sizing: border-box;
			width: var(--select-width, var(--select-default-width));
			max-width: var(--select-max-width, var(--select-default-max-width));
			min-width: 0;
		}

		.aurora-select[data-state='error'] {
			--_border: var(--select-error-color, var(--select-default-error-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-select[data-state='success'] {
			--_border: var(--select-success-color, var(--select-default-success-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-select-label {
			color: var(--select-label-color, var(--select-default-label-color));
			font-size: var(--select-label-font-size, var(--select-default-label-font-size));
			font-weight: var(--select-label-font-weight, var(--select-default-label-font-weight));
		}

		.aurora-select-control {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			box-sizing: border-box;
			height: var(--select-height, var(--select-default-height));
			background: var(--select-background, var(--select-default-background));
			border: var(--select-border-width, var(--select-default-border-width)) solid var(--_border);
			border-radius: var(--select-border-radius, var(--select-default-border-radius));
			box-shadow: var(--select-box-shadow, var(--select-default-box-shadow));
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-select:not([data-disabled]) .aurora-select-control:hover:not(:focus-within, :has(select:open)) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-select-control:focus-within,
		.aurora-select-control:has(select:open) {
			border-color: var(--_focus-border);
			box-shadow: 0 0 0 var(--select-focus-ring-width, var(--select-default-focus-ring-width))
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-select-control:focus-within > .aurora-select-end {
			color: var(--_focus-border);
		}

		select {
			grid-area: 1 / 1 / 2 / 3;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
			min-width: 0;
			margin: 0;
			padding-block: 0;
			padding-inline: var(--_padding-x)
				calc(var(--_end-width, var(--icon-size) + var(--_padding-x)) + var(--_gap));
			border: 0;
			border-radius: inherit;
			outline: none;
			background: transparent;
			appearance: none;
			color: var(--select-color, var(--select-default-color));
			font-family: inherit;
			font-size: var(--select-font-size, var(--select-default-font-size));
			font-weight: var(--select-font-weight, var(--select-default-font-weight));
			text-overflow: ellipsis;
			cursor: pointer;
		}

		.aurora-select[data-empty] select {
			color: var(--select-placeholder-color, var(--select-default-placeholder-color));
		}

		option {
			color: var(--select-color, var(--select-default-color));
		}

		.aurora-select-option-content {
			display: contents;
		}

		.aurora-select-end {
			grid-area: 1 / 2;
			display: flex;
			align-items: center;
			gap: var(--_gap);
			padding-inline-end: var(--_padding-x);
			color: var(--select-icon-color, var(--select-default-icon-color));
			pointer-events: none;
		}

		.aurora-select-end :global(.aurora-select-state-icon) {
			color: var(--_border);
		}

		.aurora-select-hint {
			color: var(--_hint);
			font-size: var(--select-hint-font-size, var(--select-default-hint-font-size));
		}

		.aurora-select[data-disabled] .aurora-select-control {
			background: var(--select-disabled-background, var(--select-default-disabled-background));
			opacity: var(--select-disabled-opacity, var(--select-default-disabled-opacity));
		}

		.aurora-select[data-disabled] select {
			cursor: not-allowed;
		}

		@supports (appearance: base-select) {
			select,
			select::picker(select) {
				appearance: base-select;
			}

			select {
				display: flex;
				align-items: center;
			}

			select::picker-icon {
				display: none;
			}

			.aurora-select-button {
				display: flex;
				align-items: center;
				flex: 1;
				min-width: 0;
				margin: 0;
				padding: 0;
				border: 0;
				background: none;
				color: inherit;
				font: inherit;
			}

			selectedcontent {
				--icon-size: var(--select-option-icon-size, var(--select-default-option-icon-size));

				display: flex;
				align-items: center;
				gap: var(--select-option-gap, var(--select-default-option-gap));
				min-width: 0;
				overflow: hidden;
				white-space: nowrap;
			}

			selectedcontent .aurora-select-option-label {
				overflow: hidden;
				text-overflow: ellipsis;
			}

			selectedcontent .aurora-select-check {
				display: none;
			}

			select::picker(select) {
				box-sizing: border-box;
				position-try-order: normal;
				margin-block: var(--select-picker-offset, var(--select-default-picker-offset));
				padding: var(--select-picker-padding, var(--select-default-picker-padding));
				max-height: var(--select-picker-max-height, var(--select-default-picker-max-height));
				overflow: auto;
				background: var(--select-picker-background, var(--select-default-picker-background));
				color: var(--select-picker-color, var(--select-default-picker-color));
				border: var(--select-picker-border-width, var(--select-default-picker-border-width)) solid
					var(--select-picker-border-color, var(--select-default-picker-border-color));
				border-radius: var(
					--select-picker-border-radius,
					var(--select-default-picker-border-radius)
				);
				box-shadow: var(--select-picker-box-shadow, var(--select-default-picker-box-shadow));
				backdrop-filter: var(
					--select-picker-backdrop-filter,
					var(--select-default-picker-backdrop-filter)
				);
				opacity: 0;
				translate: 0
					calc(
						-1 *
							var(
								--select-picker-transition-distance,
								var(--select-default-picker-transition-distance)
							)
					);
				transition-property: opacity, translate, display, overlay;
				transition-duration: var(--select-picker-duration, var(--select-default-picker-duration));
				transition-timing-function: var(--global-ease);
				transition-behavior: allow-discrete;
			}

			select:open::picker(select) {
				opacity: 1;
				translate: 0;
			}

			@starting-style {
				select:open::picker(select) {
					opacity: 0;
					translate: 0
						calc(
							-1 *
								var(
									--select-picker-transition-distance,
									var(--select-default-picker-transition-distance)
								)
						);
				}
			}

			.aurora-select-option {
				--icon-size: var(--select-option-icon-size, var(--select-default-option-icon-size));

				display: flex;
				align-items: center;
				gap: var(--select-option-gap, var(--select-default-option-gap));
				padding: var(--select-option-padding, var(--select-default-option-padding));
				border-radius: var(
					--select-option-border-radius,
					var(--select-default-option-border-radius)
				);
				outline: none;
				color: var(--select-option-color, var(--select-default-option-color));
				font-size: var(--select-option-font-size, var(--select-default-option-font-size));
				line-height: 1.4;
				cursor: pointer;
				transition:
					background var(--global-duration-fast) var(--global-ease),
					color var(--global-duration-fast) var(--global-ease);
			}

			.aurora-select-option + .aurora-select-option {
				margin-block-start: var(--select-option-spacing, var(--select-default-option-spacing));
			}

			.aurora-select-option::checkmark {
				display: none;
			}

			.aurora-select-option:is(:hover, :focus-visible) {
				background: var(
					--select-option-highlighted-background,
					var(--select-default-option-highlighted-background)
				);
				color: var(
					--select-option-highlighted-color,
					var(--select-default-option-highlighted-color)
				);
			}

			.aurora-select-option:checked {
				background: var(
					--select-option-selected-background,
					var(--select-default-option-selected-background)
				);
				color: var(--select-option-selected-color, var(--select-default-option-selected-color));
			}

			.aurora-select-option:checked:is(:hover, :focus-visible) {
				background: var(
					--select-option-selected-highlighted-background,
					var(--select-default-option-selected-highlighted-background)
				);
			}

			.aurora-select-option-label {
				flex: 1;
				min-width: 0;
				overflow-wrap: anywhere;
			}

			.aurora-select-check {
				display: flex;
				margin-inline-start: auto;
				color: var(--select-check-color, var(--select-default-check-color));
				visibility: hidden;
			}

			.aurora-select-option:checked .aurora-select-check {
				visibility: visible;
			}
		}
	}
</style>
