<!-- @component
Button that opens a list of options (`items`) and picks one or, with `multiple`, more of them: for toolbars, sorting and filters. It is an `Autocomplete` without the search field, with a `Button` as trigger. The button shows `icon`, then `label` (also its accessible name, as in "Sort by Newest"), then the selection or the `placeholder`, and an arrow. With `clearable` (the default) a clear button replaces the arrow while something is selected. Options are `Item` objects, `{ value: string | number; label?: string | number; icon?: string; data?: Data }`, and the selection lives in `values`, always an array. It follows the ARIA select-only combobox pattern: Enter, Space and the arrows open the list and move through it, Enter or Space picks the highlighted option, typing a letter jumps to the first option that starts with it, Escape closes. With `mobileDrawer`, on screens up to 1024px wide the list opens in a bottom `Drawer`. The trigger takes the `--button-*` variables, the list the `--menu-*` and `--autocomplete-option-*` ones. Its state is exposed as `data-open`, `data-disabled` and `data-empty` for app CSS.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './Dropdown.css';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Autocomplete from '../../simple/forms/Autocomplete.svelte';
	import type { Item } from '../../simple/forms/item.js';
	import Icon from '../../simple/media/Icon.svelte';

	const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

	interface Props
		extends Omit<
			HTMLButtonAttributes,
			'type' | 'children' | 'class' | 'value' | 'name' | 'disabled' | 'onchange'
		> {
		/** Options to choose from. */
		items?: Item<Data>[];
		/** Selected options. With single selection it holds at most one item. */
		values?: Item<Data>[];
		/** Allows selecting more than one option. */
		multiple?: boolean;
		/** Text before the selection inside the button, and the accessible name of the control. */
		label?: string;
		/** Text shown in place of the selection while nothing is selected. */
		placeholder?: string;
		/** SVG path of an icon at the start of the button. */
		icon?: string;
		/** Shows a button that clears the selection, in place of the arrow, while something is selected. */
		clearable?: boolean;
		/** Prevents removing the last selected option from the list. The clear button still clears it. */
		mandatory?: boolean;
		/** Disables the button and hides the clear button. */
		disabled?: boolean;
		/** Whether the list is open. `undefined` counts as closed. */
		open?: boolean;
		/** Form field name: each selected `value` is submitted under this name. */
		name?: string;
		/** Closes the list after an option is selected. Defaults to `true` with single selection and to `false` with `multiple`. */
		closeOnSelect?: boolean;
		/** Side of the button the list opens on. It flips when there is not enough space. */
		placement?:
			| 'bottom-start'
			| 'bottom'
			| 'bottom-end'
			| 'top-start'
			| 'top'
			| 'top-end'
			| 'left-start'
			| 'left'
			| 'left-end'
			| 'right-start'
			| 'right'
			| 'right-end';
		/** On screens up to 1024px wide, opens the list in a bottom drawer instead of a menu. */
		mobileDrawer?: boolean;
		/** Color of the button. */
		variant?: 'primary' | 'secondary' | 'danger' | 'gradient';
		/** Height, padding and text size of the button. */
		size?: 'sm' | 'md' | 'lg';
		/** Text of the button while something is selected. */
		selectionText?: (values: Item<Data>[]) => string;
		/** Accessible name of the clear button. */
		clearLabel?: string;
		/** Accessible name of the close button of the mobile drawer. */
		closeLabel?: string;
		/** Text shown when there are no options. */
		noResultsText?: string;
		/** The native `<button>` element of the trigger. */
		buttonElement?: HTMLButtonElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			button?: string;
			label?: string;
			value?: string;
			clear?: string;
			menu?: string;
			option?: string;
		};
		/** Called when an option is selected or removed, with the option added (`select`), the one removed (`unselect`, with single selection also the one replaced; on clear the first one) and the new `selection`. */
		onchange?: (change: {
			select?: Item<Data>;
			unselect?: Item<Data>;
			selection: Item<Data>[];
		}) => void;
		/** Called whenever the list closes. */
		onclose?: () => void;
		/** Replaces the icon at the start of the button. */
		iconSnippet?: Snippet<[{ icon: string | undefined }]>;
		/** Replaces the label inside the button. It stays the accessible name. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the selection text (or the placeholder) inside the button. */
		valueSnippet?: Snippet<[{ values: Item<Data>[]; text: string; placeholder: string }]>;
		/** Replaces the arrow at the end of the button. */
		chevronSnippet?: Snippet<[{ open: boolean }]>;
		/** Replaces the icon of the clear button. */
		clearSnippet?: Snippet;
		/** Replaces the content of each option (icon, label and check mark). The option keeps its click handling, role and state. */
		itemSnippet?: Snippet<
			[{ item: Item<Data>; index: number; selected: boolean; highlighted: boolean }]
		>;
		/** Replaces the label of each option, keeping its icon and check mark. */
		itemLabelSnippet?: Snippet<[{ item: Item<Data> }]>;
		/** Replaces the content of the row shown when there are no options. */
		emptySnippet?: Snippet;
	}

	let {
		items = [],
		values = $bindable(),
		multiple = false,
		label,
		placeholder = 'Select',
		icon,
		clearable = true,
		mandatory = true,
		disabled = false,
		open = $bindable(),
		name,
		closeOnSelect,
		placement = 'bottom-start',
		mobileDrawer = false,
		variant = 'secondary',
		size = 'md',
		selectionText = (values) =>
			values.length === 1
				? String(values[0].label ?? values[0].value)
				: `${values.length} selected`,
		clearLabel = 'Clear selection',
		closeLabel = 'Close',
		noResultsText = 'No options',
		buttonElement = $bindable(),
		class: clazz = {},
		onchange,
		onclose,
		onclick,
		onkeydown,
		iconSnippet,
		labelSnippet,
		valueSnippet,
		chevronSnippet,
		clearSnippet,
		itemSnippet,
		itemLabelSnippet,
		emptySnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;

	let selection = $derived(values ?? []);
	let text = $derived(selection.length ? selectionText(selection) : placeholder);
	let showClear = $derived(clearable && !disabled && selection.length > 0);
	let clearInset = $state<number>();

	$effect(() => {
		if (!buttonElement || !showClear) return;
		size;
		const style = getComputedStyle(buttonElement);
		clearInset = parseFloat(style.paddingInlineEnd) + parseFloat(style.borderInlineEndWidth);
	});

	function clear() {
		const removed = selection;
		values = [];
		onchange?.({ unselect: removed[0], selection: [] });
		buttonElement?.focus();
	}
</script>

<Autocomplete
	{items}
	bind:values
	bind:open
	{multiple}
	{mandatory}
	{disabled}
	{name}
	{closeOnSelect}
	{placement}
	{mobileDrawer}
	drawerSearch={false}
	drawerTitle={label}
	placeholder={label ?? placeholder}
	{noResultsText}
	{closeLabel}
	class={{
		container: ['aurora-dropdown', clazz.container].filter(Boolean).join(' '),
		menu: ['aurora-dropdown-menu', clazz.menu].filter(Boolean).join(' '),
		option: clazz.option
	}}
	{onchange}
	{onclose}
	{itemSnippet}
	{itemLabelSnippet}
	{emptySnippet}
>
	{#snippet selectionContainerSnippet({ openMenu, handleKeyDown, attributes })}
		<div
			class="aurora-dropdown-trigger"
			data-variant={variant}
			data-empty={selection.length === 0 || undefined}
		>
			<Button
				{...rest}
				{...attributes}
				aria-labelledby={label || labelSnippet ? labelId : rest['aria-labelledby']}
				aria-label={label || labelSnippet ? undefined : (rest['aria-label'] ?? placeholder)}
				{variant}
				{size}
				{disabled}
				bind:buttonElement
				class={['aurora-dropdown-button', clazz.button]}
				onclick={(event) => {
					onclick?.(event);
					if (open) open = false;
					else openMenu();
				}}
				onkeydown={(event) => {
					onkeydown?.(event);
					if (event.key !== 'Backspace') handleKeyDown(event);
				}}
			>
				{#if iconSnippet}
					{@render iconSnippet({ icon })}
				{:else if icon}
					<Icon path={icon} />
				{/if}
				{#if labelSnippet}
					<span class={['aurora-dropdown-label', clazz.label]} id={labelId}>
						{@render labelSnippet({ label })}
					</span>
				{:else if label}
					<span class={['aurora-dropdown-label', clazz.label]} id={labelId}>{label}</span>
				{/if}
				<span class={['aurora-dropdown-value', clazz.value]}>
					{#if valueSnippet}
						{@render valueSnippet({ values: selection, text, placeholder })}
					{:else}
						{text}
					{/if}
				</span>
				<span class="aurora-dropdown-chevron" data-hidden={showClear || undefined}>
					{#if chevronSnippet}
						{@render chevronSnippet({ open: !!open })}
					{:else}
						<Icon path={CHEVRON_ICON} />
					{/if}
				</span>
			</Button>
			{#if showClear}
				<button
					type="button"
					class={['aurora-dropdown-clear', clazz.clear]}
					aria-label={clearLabel}
					style:inset-inline-end={clearInset === undefined ? undefined : `${clearInset}px`}
					onclick={clear}
				>
					{#if clearSnippet}
						{@render clearSnippet()}
					{:else}
						<Icon path={CLOSE_ICON} />
					{/if}
				</button>
			{/if}
		</div>
	{/snippet}
</Autocomplete>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-dropdown) {
			--autocomplete-default-width: var(--dropdown-width, var(--dropdown-default-width));
			--autocomplete-default-max-width: var(--dropdown-max-width, var(--dropdown-default-max-width));

			min-width: var(--dropdown-min-width, var(--dropdown-default-min-width));
		}

		:global(.aurora-dropdown-menu) {
			--menu-default-min-width: var(--dropdown-menu-min-width, var(--dropdown-default-menu-min-width));
		}

		.aurora-dropdown-trigger {
			position: relative;
			display: flex;
			color: var(--button-color, var(--button-default-primary-color));
		}

		.aurora-dropdown-trigger[data-variant='secondary'] {
			color: var(--button-color, var(--button-default-secondary-color));
		}

		.aurora-dropdown-trigger[data-variant='danger'] {
			color: var(--button-color, var(--button-default-danger-color));
		}

		.aurora-dropdown-trigger[data-variant='gradient'] {
			color: var(--button-color, var(--button-default-gradient-color));
		}

		.aurora-dropdown-trigger > :global(.aurora-dropdown-button) {
			flex: 1;
			min-width: 0;
		}

		.aurora-dropdown-label {
			flex-shrink: 0;
			color: var(--dropdown-label-color, var(--dropdown-default-label-color));
			font-weight: var(--dropdown-label-font-weight, var(--dropdown-default-label-font-weight));
		}

		.aurora-dropdown-value {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-align: start;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-dropdown-trigger[data-empty] .aurora-dropdown-value {
			color: var(--dropdown-placeholder-color, var(--dropdown-default-placeholder-color));
		}

		.aurora-dropdown-chevron {
			--icon-size: var(--dropdown-chevron-size, var(--dropdown-default-chevron-size));

			display: flex;
			flex-shrink: 0;
			color: var(--dropdown-chevron-color, var(--dropdown-default-chevron-color));
			transition: rotate var(--global-duration) var(--global-ease);
		}

		.aurora-dropdown-chevron[data-hidden] {
			visibility: hidden;
		}

		:global(.aurora-dropdown[data-open]) .aurora-dropdown-chevron {
			rotate: 180deg;
		}

		.aurora-dropdown-clear {
			--icon-size: var(--dropdown-clear-icon-size, var(--dropdown-default-clear-icon-size));

			position: absolute;
			inset-inline-end: 14px;
			top: 50%;
			translate: calc(
					(var(--dropdown-clear-size, var(--dropdown-default-clear-size)) -
							var(--dropdown-chevron-size, var(--dropdown-default-chevron-size))) /
						2
				)
				-50%;
			display: grid;
			place-items: center;
			box-sizing: border-box;
			width: var(--dropdown-clear-size, var(--dropdown-default-clear-size));
			height: var(--dropdown-clear-size, var(--dropdown-default-clear-size));
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--dropdown-clear-border-radius, var(--dropdown-default-clear-border-radius));
			background: transparent;
			color: var(--dropdown-clear-color, var(--dropdown-default-clear-color));
			cursor: pointer;
			transition:
				background var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dropdown-clear:dir(rtl) {
			translate: calc(
					(var(--dropdown-clear-size, var(--dropdown-default-clear-size)) -
							var(--dropdown-chevron-size, var(--dropdown-default-chevron-size))) /
						-2
				)
				-50%;
		}

		@media (hover: hover) {
			.aurora-dropdown-clear:hover {
				background: var(
					--dropdown-clear-hover-background,
					var(--dropdown-default-clear-hover-background)
				);
				color: var(--dropdown-clear-hover-color, var(--dropdown-default-clear-hover-color));
			}
		}

		.aurora-dropdown-clear:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 0;
		}
	}
</style>
