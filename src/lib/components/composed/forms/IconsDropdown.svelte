<!-- @component
Button that picks an icon from a grid, for example the heading level or the text alignment in an editor toolbar. It is a `Dropdown` whose options are `IconItem`s, `{ value, label, icon, data? }`: the button shows the chosen icons as tiles and the list is a grid of tiles (`columns`, by default as many as the options up to 5) that the four arrows move through. Every option needs a `label`: it is its accessible name, the Tooltip shown while it is highlighted and what typing a letter jumps to. The `label` of the component names the button for screen readers and titles the mobile drawer, without being shown. The selection lives in `values`, always an array: one icon, or more with `multiple`. Everything else works as in `Dropdown`, including `clearable` (off by default here), `mandatory`, `placement`, `mobileDrawer`, `variant` and `size`; the button takes the `--button-*` variables and the menu the `--menu-*` ones.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './IconsDropdown.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import Dropdown from './Dropdown.svelte';
	import type { IconItem, Item } from '../../simple/forms/item.js';
	import Icon from '../../simple/media/Icon.svelte';
	import Tooltip from '../../simple/common/Tooltip.svelte';

	type DropdownProps = ComponentProps<typeof Dropdown<Data>>;

	interface Props
		extends Omit<
			DropdownProps,
			| 'items'
			| 'values'
			| 'label'
			| 'placeholder'
			| 'icon'
			| 'clearable'
			| 'columns'
			| 'selectionText'
			| 'class'
			| 'onchange'
			| 'iconSnippet'
			| 'labelSnippet'
			| 'valueSnippet'
			| 'itemSnippet'
			| 'itemLabelSnippet'
		> {
		/** Options to choose from. Each one needs an `icon` and a `label`. */
		items?: IconItem<Data>[];
		/** Selected options. With single selection it holds at most one item. */
		values?: IconItem<Data>[];
		/** Accessible name of the button, also the title of the mobile drawer. It is not shown. */
		label?: string;
		/** Text shown in the button while nothing is selected. Without it the button shows only the arrow, and screen readers hear "Select", in the language of `locale`. */
		placeholder?: string;
		/** Shows a button that clears the selection, in place of the arrow, while something is selected. */
		clearable?: boolean;
		/** Number of tiles per row in the list. Defaults to the number of options, up to 5. */
		columns?: number;
		/** With `multiple`, the button shows at most this many tiles, followed by a "+N" counter. */
		maxVisibleIcons?: number;
		/** Text that screen readers hear for the selection. Defaults to the labels of the selected options. */
		selectionText?: (values: IconItem<Data>[]) => string;
		/** Extra classes for each part: those of `Dropdown`, plus `tile` on every tile, in the button and in the list. */
		class?: {
			container?: string;
			button?: string;
			label?: string;
			value?: string;
			clear?: string;
			menu?: string;
			option?: string;
			tile?: string;
		};
		/** Called when an option is selected or removed, with the option added (`select`), the one removed (`unselect`, with single selection also the one replaced; on clear the first one) and the new `selection`. */
		onchange?: (change: {
			select?: IconItem<Data>;
			unselect?: IconItem<Data>;
			selection: IconItem<Data>[];
		}) => void;
		/** Replaces the content of the button before the arrow: the tiles of the selection or the placeholder. */
		valueSnippet?: Snippet<[{ values: IconItem<Data>[]; text: string; placeholder: string }]>;
		/** Replaces the icon inside each tile of the list. The tile keeps its label, Tooltip and state. */
		itemSnippet?: Snippet<
			[{ item: IconItem<Data>; index: number; selected: boolean; highlighted: boolean }]
		>;
	}

	let {
		items = [],
		values = $bindable(),
		label,
		placeholder,
		clearable = false,
		columns,
		maxVisibleIcons = 3,
		selectionText,
		open = $bindable(),
		buttonElement = $bindable(),
		class: clazz = {},
		onchange,
		valueSnippet,
		itemSnippet,
		...rest
	}: Props = $props();

	let gridColumns = $derived(columns ?? Math.max(1, Math.min(items.length, 5)));
	let tiles = $state<HTMLSpanElement[]>([]);

	const labels = (selected: IconItem<Data>[]) => selected.map((item) => item.label).join(', ');
	const iconItems = (list: Item<Data>[]) => list as IconItem<Data>[];
</script>

{#snippet value({ values: selected, text, placeholder: fallback }: { values: Item<Data>[]; text: string; placeholder: string })}
	{@const chosen = iconItems(selected)}
	{#if valueSnippet}
		{@render valueSnippet({ values: chosen, text, placeholder: fallback })}
	{:else if chosen.length}
		{@const shown = rest.multiple ? chosen.slice(0, Math.max(maxVisibleIcons, 1)) : chosen.slice(0, 1)}
		{#each shown as item (item.value)}
			<span class={['aurora-icons-dropdown-value', clazz.tile]} aria-hidden="true">
				<Icon path={item.icon} />
			</span>
		{/each}
		{#if chosen.length > shown.length}
			<span class="aurora-icons-dropdown-counter" aria-hidden="true">+{chosen.length - shown.length}</span>
		{/if}
		<span class="aurora-icons-dropdown-hidden">{text}</span>
	{:else if placeholder}
		<span class="aurora-icons-dropdown-placeholder">{placeholder}</span>
	{:else}
		<span class="aurora-icons-dropdown-hidden">{fallback}</span>
	{/if}
{/snippet}

{#snippet option({ item, index, selected, highlighted }: { item: Item<Data>; index: number; selected: boolean; highlighted: boolean })}
	{@const iconItem = item as IconItem<Data>}
	<span
		class={['aurora-icons-dropdown-tile', clazz.tile]}
		data-selected={selected || undefined}
		data-highlighted={highlighted || undefined}
		bind:this={tiles[index]}
	>
		{#if itemSnippet}
			{@render itemSnippet({ item: iconItem, index, selected, highlighted })}
		{:else}
			<Icon path={iconItem.icon} />
		{/if}
	</span>
	<span class="aurora-icons-dropdown-hidden">{iconItem.label}</span>
	<Tooltip
		activator={tiles[index]}
		text={iconItem.label}
		open={highlighted}
		aria-hidden="true"
		class="aurora-icons-dropdown-tooltip"
	/>
{/snippet}

<Dropdown
	{...rest}
	{items}
	bind:values={() => values, (next) => (values = next && iconItems(next))}
	bind:open
	bind:buttonElement
	{label}
	{placeholder}
	{clearable}
	columns={gridColumns}
	selectionText={(selected) => (selectionText ?? labels)(iconItems(selected))}
	class={{
		...clazz,
		container: ['aurora-icons-dropdown', clazz.container].filter(Boolean).join(' '),
		button: ['aurora-icons-dropdown-button', clazz.button].filter(Boolean).join(' '),
		label: ['aurora-icons-dropdown-hidden', clazz.label].filter(Boolean).join(' '),
		value: ['aurora-icons-dropdown-values', clazz.value].filter(Boolean).join(' '),
		menu: ['aurora-icons-dropdown-menu', clazz.menu].filter(Boolean).join(' '),
		option: ['aurora-icons-dropdown-option', clazz.option].filter(Boolean).join(' ')
	}}
	onchange={(change) =>
		onchange?.({
			select: change.select as IconItem<Data> | undefined,
			unselect: change.unselect as IconItem<Data> | undefined,
			selection: iconItems(change.selection)
		})}
	valueSnippet={value}
	itemSnippet={option}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-dropdown.aurora-icons-dropdown) {
			--dropdown-default-width: var(--icons-dropdown-width, var(--icons-dropdown-default-width));
			--dropdown-default-min-width: var(
				--icons-dropdown-min-width,
				var(--icons-dropdown-default-min-width)
			);
		}

		:global(.aurora-button.aurora-icons-dropdown-button) {
			--button-default-padding: var(--icons-dropdown-padding, var(--icons-dropdown-default-padding));
			--button-default-sm-padding: var(
				--icons-dropdown-padding,
				var(--icons-dropdown-default-sm-padding)
			);
			--button-default-lg-padding: var(
				--icons-dropdown-padding,
				var(--icons-dropdown-default-lg-padding)
			);
			--button-default-gap: var(--icons-dropdown-gap, var(--icons-dropdown-default-gap));
			--_value-size: var(--icons-dropdown-default-value-size);
			--_value-icon-size: var(--icons-dropdown-default-value-icon-size);
		}

		:global(.aurora-button.aurora-icons-dropdown-button[data-size='sm']) {
			--_value-size: var(--icons-dropdown-default-sm-value-size);
			--_value-icon-size: var(--icons-dropdown-default-sm-value-icon-size);
		}

		:global(.aurora-button.aurora-icons-dropdown-button[data-size='lg']) {
			--_value-size: var(--icons-dropdown-default-lg-value-size);
			--_value-icon-size: var(--icons-dropdown-default-lg-value-icon-size);
		}

		:global(.aurora-dropdown-value.aurora-icons-dropdown-values) {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(--icons-dropdown-value-gap, var(--icons-dropdown-default-value-gap));
			overflow: visible;
		}

		.aurora-icons-dropdown-value {
			--icon-size: var(--icons-dropdown-value-icon-size, var(--_value-icon-size));

			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--icons-dropdown-value-size, var(--_value-size));
			height: var(--icons-dropdown-value-size, var(--_value-size));
			border-radius: var(
				--icons-dropdown-value-border-radius,
				var(--icons-dropdown-default-value-border-radius)
			);
			background: var(--icons-dropdown-value-background, var(--icons-dropdown-default-value-background));
			color: var(--icons-dropdown-value-color, var(--icons-dropdown-default-value-color));
			box-shadow: var(
				--icons-dropdown-value-box-shadow,
				var(--icons-dropdown-default-value-box-shadow)
			);
		}

		.aurora-icons-dropdown-placeholder {
			padding-inline-start: var(
				--icons-dropdown-placeholder-indent,
				var(--icons-dropdown-default-placeholder-indent)
			);
		}

		.aurora-icons-dropdown-counter {
			color: var(--icons-dropdown-counter-color, var(--icons-dropdown-default-counter-color));
			font-size: var(--icons-dropdown-counter-font-size, var(--icons-dropdown-default-counter-font-size));
			font-variant-numeric: tabular-nums;
		}

		:global(.aurora-icons-dropdown-hidden) {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		:global(.aurora-menu.aurora-icons-dropdown-menu) {
			--dropdown-default-menu-min-width: 0;
			--_menu-width: var(--icons-dropdown-menu-width, var(--icons-dropdown-default-menu-width));
		}

		:global(.aurora-autocomplete-listbox[data-columns]:has(> .aurora-icons-dropdown-option)) {
			--autocomplete-default-option-spacing: var(
				--icons-dropdown-menu-gap,
				var(--icons-dropdown-default-menu-gap)
			);

			grid-template-columns: repeat(var(--_columns), max-content);
		}

		:global(
			.aurora-autocomplete-drawer
				.aurora-autocomplete-listbox[data-columns]:has(> .aurora-icons-dropdown-option)
		) {
			--autocomplete-default-option-spacing: var(
				--icons-dropdown-drawer-menu-gap,
				var(--icons-dropdown-default-drawer-menu-gap)
			);
		}

		:global(.aurora-autocomplete-option.aurora-icons-dropdown-option) {
			--autocomplete-default-option-padding: 0;
			--autocomplete-default-drawer-option-padding: 0;
			--autocomplete-default-option-highlighted-background: transparent;
			--autocomplete-default-option-selected-background: transparent;
			--autocomplete-default-option-selected-highlighted-background: transparent;

			position: relative;
		}

		.aurora-icons-dropdown-tile {
			--icon-size: var(--icons-dropdown-option-icon-size, var(--icons-dropdown-default-option-icon-size));

			display: grid;
			place-items: center;
			box-sizing: border-box;
			width: var(--icons-dropdown-option-size, var(--icons-dropdown-default-option-size));
			height: var(--icons-dropdown-option-size, var(--icons-dropdown-default-option-size));
			border: var(--global-border-width) solid
				var(--icons-dropdown-option-border-color, var(--icons-dropdown-default-option-border-color));
			border-radius: var(
				--icons-dropdown-option-border-radius,
				var(--icons-dropdown-default-option-border-radius)
			);
			background: var(--icons-dropdown-option-background, var(--icons-dropdown-default-option-background));
			color: var(--icons-dropdown-option-color, var(--icons-dropdown-default-option-color));
			transition:
				background var(--global-duration-fast) var(--global-ease),
				border-color var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease),
				transform var(--global-duration) var(--global-ease);
		}

		:global(.aurora-autocomplete-drawer) .aurora-icons-dropdown-tile {
			width: var(--icons-dropdown-drawer-option-size, var(--icons-dropdown-default-drawer-option-size));
			height: var(--icons-dropdown-drawer-option-size, var(--icons-dropdown-default-drawer-option-size));
		}

		.aurora-icons-dropdown-tile[data-highlighted] {
			border-color: var(
				--icons-dropdown-option-highlighted-border-color,
				var(--icons-dropdown-default-option-highlighted-border-color)
			);
			background: var(
				--icons-dropdown-option-highlighted-background,
				var(--icons-dropdown-default-option-highlighted-background)
			);
			color: var(
				--icons-dropdown-option-highlighted-color,
				var(--icons-dropdown-default-option-highlighted-color)
			);
			transform: var(
				--icons-dropdown-option-highlighted-transform,
				var(--icons-dropdown-default-option-highlighted-transform)
			);
		}

		.aurora-icons-dropdown-tile[data-selected] {
			border-color: transparent;
			background: var(
				--icons-dropdown-option-selected-background,
				var(--icons-dropdown-default-option-selected-background)
			);
			color: var(
				--icons-dropdown-option-selected-color,
				var(--icons-dropdown-default-option-selected-color)
			);
			box-shadow: var(
				--icons-dropdown-option-selected-box-shadow,
				var(--icons-dropdown-default-option-selected-box-shadow)
			);
		}

		.aurora-icons-dropdown-tile[data-selected][data-highlighted] {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		:global(.aurora-tooltip.aurora-icons-dropdown-tooltip) {
			pointer-events: none;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-icons-dropdown-tile[data-highlighted] {
				transform: none;
			}
		}
	}
</style>
