<!-- @component
Group of toggle buttons to pick one or more options, such as the services of a booking or the days of the week. Each option is an `ActivableButton`, pressed when selected, so screen readers hear the state through `aria-pressed`; the group is a `role="group"` that needs an `aria-label` (or `aria-labelledby`). With `multiple` (the default) every button turns on and off by itself; with `multiple={false}` a click replaces the selection and, since `mandatory` is on by default there, clicking the pressed button keeps it on. Its state is exposed as `data-multiple` and `data-disabled` for app CSS.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './ToggleList.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ActivableButton from '../buttons/ActivableButton.svelte';
	import type { Item } from '../../simple/forms/item.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** The options, one button each, in this order. */
		items: Item<Data>[];
		/** The selected options, compared with `items` by `value`. */
		values?: Item<Data>[];
		/** Lets more options be selected together. With `false` a click replaces the selection. */
		multiple?: boolean;
		/** Prevents removing the last selected option, so a click on it keeps it pressed. Defaults to `true` with `multiple={false}` (it works like a group of radio buttons) and to `false` otherwise. */
		mandatory?: boolean;
		/** Disables every button. */
		disabled?: boolean;
		/** Height, padding and text size of the buttons: `sm` 28px, `md` 34px, `lg` 40px. */
		size?: 'sm' | 'md' | 'lg';
		/** Shows the state dot on the buttons with text and no icon, as in `ActivableButton`. */
		dot?: boolean;
		/** Extra classes on the root element. */
		class?: string;
		/** The root element. */
		toggleListElement?: HTMLDivElement;
		/** Called after every change of the selection: `select` is the option turned on, `unselect` the one turned off (with `multiple={false}`, the one replaced), `selection` the new `values`. */
		onchange?: (change: {
			select?: Item<Data>;
			unselect?: Item<Data>;
			selection: Item<Data>[];
		}) => void;
		/** Replaces the content of each button (its icon stays, if the item has one). */
		itemSnippet?: Snippet<[{ item: Item<Data>; active: boolean }]>;
	}

	let {
		items,
		values = $bindable(),
		multiple = true,
		mandatory,
		disabled = false,
		size,
		dot = true,
		class: clazz = '',
		toggleListElement = $bindable(),
		onchange,
		itemSnippet,
		...rest
	}: Props = $props();

	let selection = $derived(values ?? []);
	let keepOne = $derived(mandatory ?? !multiple);

	function isSelected(item: Item<Data>): boolean {
		return selection.some((value) => value.value === item.value);
	}

	function select(item: Item<Data>) {
		if (multiple) {
			values = [...selection, item];
			onchange?.({ select: item, selection: values });
		} else {
			const replaced = selection.find((value) => value.value !== item.value);
			values = [item];
			onchange?.({ select: item, unselect: replaced, selection: values });
		}
	}

	function unselect(item: Item<Data>) {
		if (keepOne && selection.length <= 1) return;
		values = selection.filter((value) => value.value !== item.value);
		onchange?.({ unselect: item, selection: values });
	}

	function setActive(item: Item<Data>, active: boolean) {
		if (disabled || active === isSelected(item)) return;
		if (active) select(item);
		else unselect(item);
	}
</script>

<div
	role="group"
	{...rest}
	bind:this={toggleListElement}
	data-multiple={multiple || undefined}
	data-disabled={disabled || undefined}
	class="aurora-toggle-list {clazz}"
>
	{#each items as item (item.value)}
		<ActivableButton
			bind:active={() => isSelected(item), (active) => setActive(item, active)}
			icon={item.icon}
			{size}
			{dot}
			{disabled}
			class="aurora-toggle-list-button"
		>
			{#if itemSnippet}
				{@render itemSnippet({ item, active: isSelected(item) })}
			{:else}
				{item.label ?? item.value}
			{/if}
		</ActivableButton>
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-toggle-list {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--toggle-list-gap, var(--toggle-list-default-gap));
			box-sizing: border-box;
			width: var(--toggle-list-width, var(--toggle-list-default-width));
			max-width: var(--toggle-list-max-width, var(--toggle-list-default-max-width));
			height: var(--toggle-list-height, var(--toggle-list-default-height));
		}
	}
</style>
