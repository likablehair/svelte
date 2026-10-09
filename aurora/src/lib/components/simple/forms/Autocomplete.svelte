<!-- @component
Text field that searches a list of options (`items`) and picks one or, with `multiple`, more of them. Options are `Item` objects, `{ value: string | number; label?: string | number; icon?: string; data?: Data }`: `value` identifies the option, `label` is shown and searched (defaults to `value`), `icon` is an SVG path and `data` carries anything else. The selection lives in `values`, always an array, and shows as chips inside the field. `icon` adds an icon at the start of the field, and the item snippets add avatars, flags or extra text to the options. It follows the ARIA combobox pattern: focus stays in the input, the arrows move through the options, Enter picks the highlighted one (while typing, the first match is highlighted), Backspace on an empty field removes the last value and Escape closes the list. The list opens in a `Menu` as wide as the field; with `mobileDrawer`, on screens up to 1024px wide it opens in a bottom `Drawer` with its own search field. `loading` shows a spinner and a loading row, and a search without matches shows a "No results" row. With `name`, every selected value is submitted with the form. Its state is exposed as `data-state`, `data-disabled`, `data-open` and `data-loading` for app CSS.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './Autocomplete.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
	import { MediaQuery } from 'svelte/reactivity';
	import Menu from '../common/Menu.svelte';
	import Icon from '../media/Icon.svelte';
	import Chip from '../navigation/Chip.svelte';
	import Drawer from '../navigation/Drawer.svelte';
	import SimpleTextField from './SimpleTextField.svelte';
	import type { Item } from './item.js';

	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const SUCCESS_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';
	const CHECK_ICON = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';
	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';

	interface Props
		extends Omit<
			HTMLInputAttributes,
			| 'value'
			| 'class'
			| 'children'
			| 'type'
			| 'role'
			| 'name'
			| 'id'
			| 'placeholder'
			| 'disabled'
			| 'readonly'
			| 'multiple'
			| 'onchange'
		> {
		/** Selected options. With single selection it holds at most one item. */
		values?: Item<Data>[];
		/** Options to choose from. */
		items?: Item<Data>[];
		/** Allows selecting more than one option. */
		multiple?: boolean;
		/** Text typed in the field. */
		searchText?: string;
		/** Whether the list is open. `undefined` counts as closed. */
		open?: boolean;
		/** Visible label above the field, linked to the input. In the mobile drawer it is the title. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. */
		state?: 'error' | 'success';
		/** Placeholder of the search input. */
		placeholder?: string;
		/** SVG path of an icon at the start of the field, for example a magnifier from `@mdi/js`. */
		icon?: string;
		/** Disables the field: the list does not open and the values cannot be removed. */
		disabled?: boolean;
		/** Prevents removing the last selected value. */
		mandatory?: boolean;
		/** Shows a spinner in the field and a loading row in place of the options, for example while results are fetched. */
		loading?: boolean;
		/** `id` of the input. Generated when missing, so the label always points to the input. */
		id?: string;
		/** Form field name: each selected `value` is submitted under this name. */
		name?: string;
		/** Shows at most this many chips, followed by a "+N" counter. */
		maxVisibleChips?: number;
		/** Replaces the default search, which matches the label ignoring case and accents. Called for each item while `searchText` is not empty. Return `true` for every item when the filtering happens elsewhere, for example on a server. */
		searchFunction?: (item: Item<Data>, searchText: string) => boolean;
		/** Closes the list after an option is selected. Defaults to `true` with single selection and to `false` with `multiple`. */
		closeOnSelect?: boolean;
		/** Empties `searchText` when the list closes. */
		clearSearchOnClose?: boolean;
		/** Side of the field the list opens on. It flips when there is not enough space. */
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
		/** On screens up to 1024px wide, opens the list in a bottom drawer with its own search field instead of a menu. */
		mobileDrawer?: boolean;
		/** Shows the search field at the top of the mobile drawer. Without it the list itself takes the focus and the keyboard, as with a trigger that cannot type. */
		drawerSearch?: boolean;
		/** Title of the mobile drawer. Defaults to `label`. */
		drawerTitle?: string;
		/** Text of the loading row. */
		loadingText?: string;
		/** Text shown when no option matches. */
		noResultsText?: string;
		/** Accessible name of the chip remove buttons, followed by the option label. */
		removeLabel?: string;
		/** Accessible name of the close button of the mobile drawer. */
		closeLabel?: string;
		/** The native `<input>` element. */
		input?: HTMLInputElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			field?: string;
			input?: string;
			chip?: string;
			menu?: string;
			option?: string;
			hint?: string;
		};
		/** Called when an option is selected or removed, with the option added (`select`), the one removed (`unselect`, with single selection also the one replaced) and the new `selection`. */
		onchange?: (change: {
			select?: Item<Data>;
			unselect?: Item<Data>;
			selection: Item<Data>[];
		}) => void;
		/** Called whenever the list closes. */
		onclose?: () => void;
		/** Replaces the label content. It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the icon shown for `state`. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the whole field with a custom trigger, such as a button. Spread `attributes` on its focusable element and call `handleKeyDown` from its `onkeydown`, so it works as a combobox for keyboards and screen readers. */
		selectionContainerSnippet?: Snippet<
			[
				{
					values: Item<Data>[];
					searchText: string | undefined;
					disabled: boolean;
					openMenu: () => void;
					handleKeyDown: (event: KeyboardEvent) => void;
					select: (item: Item<Data>) => void;
					unselect: (item: Item<Data>) => void;
					attributes: HTMLAttributes<HTMLElement>;
				}
			]
		>;
		/** Replaces each selected chip. */
		selectionSnippet?: Snippet<[{ selection: Item<Data>; unselect: (item: Item<Data>) => void }]>;
		/** Replaces the text inside each selected chip. */
		chipLabelSnippet?: Snippet<[{ selection: Item<Data> }]>;
		/** Replaces the icon of each selected chip (`item.icon`), for example with an avatar or a flag. */
		chipIconSnippet?: Snippet<[{ selection: Item<Data> }]>;
		/** Replaces the icon at the start of the field. */
		iconSnippet?: Snippet;
		/** Replaces the "+N" counter shown with `maxVisibleChips`. */
		exceedCounterSnippet?: Snippet<
			[
				{
					notVisibleChipNumber: number;
					maxVisibleChips: number;
					values: Item<Data>[];
					searchText: string | undefined;
					disabled: boolean;
				}
			]
		>;
		/** Replaces the content of each option (icon, label and check mark). The option keeps its click handling, role and state. */
		itemSnippet?: Snippet<
			[{ item: Item<Data>; index: number; selected: boolean; highlighted: boolean }]
		>;
		/** Replaces the label of each option, keeping its icon and check mark. */
		itemLabelSnippet?: Snippet<[{ item: Item<Data> }]>;
		/** Replaces the icon of each option (`item.icon`), for example with an avatar or a flag. */
		itemIconSnippet?: Snippet<[{ item: Item<Data> }]>;
		/** Content at the end of each option, before the check mark, for example a price or a code. */
		itemAppendSnippet?: Snippet<[{ item: Item<Data>; selected: boolean }]>;
		/** Replaces the content of the loading row. */
		loadingSnippet?: Snippet;
		/** Replaces the content of the row shown when no option matches. */
		emptySnippet?: Snippet<[{ searchText: string | undefined }]>;
	}

	let {
		values = $bindable(),
		items = [],
		multiple = false,
		searchText = $bindable(),
		open = $bindable(),
		label,
		hint,
		state: validation,
		placeholder,
		icon,
		disabled = false,
		mandatory = false,
		loading = false,
		id,
		name,
		maxVisibleChips,
		searchFunction,
		closeOnSelect,
		clearSearchOnClose = true,
		placement = 'bottom-start',
		mobileDrawer = false,
		drawerSearch = true,
		drawerTitle,
		loadingText = 'Loading…',
		noResultsText = 'No results',
		removeLabel = 'Remove',
		closeLabel = 'Close',
		input = $bindable(),
		class: clazz = {},
		onchange,
		onclose,
		onfocus,
		onclick,
		oninput,
		onkeydown,
		labelSnippet,
		hintSnippet,
		stateIconSnippet,
		selectionContainerSnippet,
		selectionSnippet,
		chipLabelSnippet,
		chipIconSnippet,
		iconSnippet,
		exceedCounterSnippet,
		itemSnippet,
		itemLabelSnippet,
		itemIconSnippet,
		itemAppendSnippet,
		loadingSnippet,
		emptySnippet,
		...rest
	}: Props = $props();

	let inputNode = $state<HTMLInputElement>();

	const uid = $props.id();
	let inputId = $derived(id ?? `${uid}-input`);
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;
	const listboxId = `${uid}-listbox`;
	const optionId = (index: number) => `${uid}-option-${index}`;

	const mobile = new MediaQuery('max-width: 1024px', false);
	let drawerMode = $derived(mobileDrawer && mobile.current);

	let anchor = $state<HTMLDivElement>();
	let highlighted = $state<number>();

	const DIACRITICS = /\p{Diacritic}/gu;
	const fold = (value: string) => value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
	const text = (item: Item<Data>) => String(item.label ?? item.value);

	let selection = $derived(values ?? []);
	let query = $derived(fold((searchText ?? '').trim()));
	let options = $derived(
		searchText
			? items.filter((item) =>
					searchFunction ? searchFunction(item, searchText ?? '') : fold(text(item)).includes(query)
				)
			: items
	);
	let active = $derived(
		!loading && highlighted !== undefined && highlighted < options.length ? highlighted : undefined
	);
	let listboxShown = $derived(!!open && !loading && options.length > 0);
	let visible = $derived(
		maxVisibleChips === undefined ? selection : selection.slice(0, maxVisibleChips)
	);
	let hiddenCount = $derived(selection.length - visible.length);
	let removable = $derived(!disabled && !(mandatory && selection.length <= 1));
	let hasLabel = $derived(!!label || !!labelSnippet);
	let describedBy = $derived(hint || hintSnippet ? hintId : undefined);
	let activeDescendant = $derived(
		listboxShown && active !== undefined ? optionId(active) : undefined
	);

	let attributes = $derived({
		role: 'combobox',
		'aria-haspopup': 'listbox',
		'aria-expanded': !!open,
		'aria-controls': listboxShown ? listboxId : undefined,
		'aria-activedescendant': activeDescendant,
		'aria-labelledby': hasLabel ? labelId : undefined,
		'aria-describedby': describedBy,
		'aria-invalid': validation === 'error' || undefined,
		'aria-disabled': disabled || undefined
	} satisfies HTMLAttributes<HTMLElement>);

	function split(value: string): [string, string, string] | undefined {
		if (!query) return;
		let folded = '';
		const starts: number[] = [];
		const ends: number[] = [];
		let index = 0;
		for (const char of value) {
			const part = fold(char);
			for (let i = 0; i < part.length; i++) {
				starts.push(index);
				ends.push(index + char.length);
			}
			folded += part;
			index += char.length;
		}
		const at = folded.indexOf(query);
		if (at < 0) return;
		const start = starts[at];
		const end = ends[at + query.length - 1];
		return [value.slice(0, start), value.slice(start, end), value.slice(end)];
	}

	const isSelected = (item: Item<Data>) => selection.some((value) => value.value === item.value);

	function select(item: Item<Data>) {
		if (disabled || isSelected(item)) return;
		const replaced = multiple ? undefined : selection[0];
		values = multiple ? [...selection, item] : [item];
		onchange?.({ select: item, unselect: replaced, selection: values });
		if (closeOnSelect ?? !multiple) open = false;
	}

	function unselect(item: Item<Data>) {
		if (disabled || !isSelected(item)) return;
		if (mandatory && selection.length <= 1) return;
		values = selection.filter((value) => value.value !== item.value);
		onchange?.({ unselect: item, selection: values });
	}

	function toggle(item: Item<Data>) {
		if (isSelected(item)) unselect(item);
		else select(item);
	}

	function openMenu() {
		if (disabled || open) return;
		highlighted = query ? 0 : undefined;
		open = true;
	}

	function move(step: 1 | -1) {
		if (!options.length) return;
		const last = options.length - 1;
		highlighted =
			active === undefined
				? step === 1
					? 0
					: last
				: Math.min(Math.max(active + step, 0), last);
		reveal(highlighted);
	}

	async function reveal(index: number) {
		await tick();
		document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
	}

	let typed = '';
	let typedAt = 0;

	function typeAhead(key: string, time: number) {
		typed = time - typedAt > 500 ? key : typed + key;
		typedAt = time;
		const repeated = [...typed].every((char) => char === typed[0]);
		const prefix = fold(repeated ? typed[0] : typed);
		const start = active === undefined ? 0 : active + (repeated ? 1 : 0);
		for (let step = 0; step < options.length; step++) {
			const index = (start + step) % options.length;
			if (fold(text(options[index])).startsWith(prefix)) {
				openMenu();
				highlighted = index;
				reveal(index);
				return;
			}
		}
	}

	const typing = (event: KeyboardEvent) =>
		event.target instanceof HTMLInputElement ||
		event.target instanceof HTMLTextAreaElement ||
		(event.target as HTMLElement | null)?.isContentEditable;

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp': {
				event.preventDefault();
				const step = event.key === 'ArrowDown' ? 1 : -1;
				if (open) move(step);
				else {
					openMenu();
					move(step);
				}
				break;
			}
			case 'Enter':
				if (open && active !== undefined) {
					event.preventDefault();
					toggle(options[active]);
				} else if (drawerMode && !open) {
					event.preventDefault();
					openMenu();
				}
				break;
			case ' ':
				if (!typing(event) && open && active !== undefined) {
					event.preventDefault();
					toggle(options[active]);
				} else if (drawerMode && !open) {
					event.preventDefault();
					openMenu();
				}
				break;
			case 'Backspace':
				if (!searchText && selection.length) unselect(selection[selection.length - 1]);
				break;
			case 'Escape':
				if (open) {
					event.preventDefault();
					open = false;
				} else if (searchText) {
					event.preventDefault();
					searchText = '';
				}
				break;
			case 'Tab':
				if (!drawerMode) open = false;
				break;
			default:
				if (
					event.key.length === 1 &&
					!event.ctrlKey &&
					!event.metaKey &&
					!event.altKey &&
					!typing(event)
				) {
					event.preventDefault();
					typeAhead(event.key, event.timeStamp);
				}
		}
	}

	function search(event: Event & { currentTarget: HTMLInputElement }) {
		const typed = event.currentTarget.value.trim();
		if (!drawerMode) openMenu();
		highlighted = typed ? 0 : undefined;
	}

	let wasOpen = false;
	$effect(() => {
		const isOpen = !!open;
		if (wasOpen && !isOpen) {
			untrack(() => {
				highlighted = undefined;
				typed = '';
				if (clearSearchOnClose && searchText) searchText = '';
				onclose?.();
			});
		}
		wasOpen = isOpen;
	});
</script>

{#snippet matchedLabel(item: Item<Data>)}
	{@const parts = split(text(item))}
	{#if parts}
		{parts[0]}<mark class="aurora-autocomplete-match">{parts[1]}</mark>{parts[2]}
	{:else}
		{text(item)}
	{/if}
{/snippet}

{#snippet list(focusable = false)}
	{#if loading}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="aurora-autocomplete-status"
			role="status"
			onmousedown={(event) => event.preventDefault()}
		>
			{#if loadingSnippet}
				{@render loadingSnippet()}
			{:else}
				<span class="aurora-autocomplete-spinner" aria-hidden="true"></span>{loadingText}
			{/if}
		</div>
	{:else if options.length === 0}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="aurora-autocomplete-status"
			role="status"
			onmousedown={(event) => event.preventDefault()}
		>
			{#if emptySnippet}
				{@render emptySnippet({ searchText })}
			{:else}
				{noResultsText}
			{/if}
		</div>
	{:else}
		<!-- svelte-ignore a11y_autofocus -->
		<div
			id={listboxId}
			role="listbox"
			class="aurora-autocomplete-listbox"
			aria-multiselectable={multiple || undefined}
			aria-labelledby={hasLabel ? labelId : undefined}
			aria-label={hasLabel ? undefined : placeholder}
			aria-activedescendant={focusable ? activeDescendant : undefined}
			tabindex={focusable ? 0 : -1}
			autofocus={focusable}
			onmousedown={(event) => event.preventDefault()}
			onkeydown={focusable ? handleKeyDown : undefined}
		>
			{#each options as item, index (item.value)}
				{@const selected = isSelected(item)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					id={optionId(index)}
					role="option"
					tabindex="-1"
					aria-selected={selected}
					class={['aurora-autocomplete-option', clazz.option]}
					data-selected={selected || undefined}
					data-highlighted={index === active || undefined}
					onclick={() => toggle(item)}
					onpointermove={() => (highlighted = index)}
				>
					{#if itemSnippet}
						{@render itemSnippet({ item, index, selected, highlighted: index === active })}
					{:else}
						{#if itemIconSnippet}
							{@render itemIconSnippet({ item })}
						{:else if item.icon}
							<Icon path={item.icon} />
						{/if}
						<span class="aurora-autocomplete-option-label">
							{#if itemLabelSnippet}
								{@render itemLabelSnippet({ item })}
							{:else}
								{@render matchedLabel(item)}
							{/if}
						</span>
						{#if itemAppendSnippet}
							{@render itemAppendSnippet({ item, selected })}
						{/if}
						{#if selected}
							<Icon path={CHECK_ICON} class="aurora-autocomplete-check" />
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

<div
	class={['aurora-autocomplete', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-open={open || undefined}
	data-loading={loading || undefined}
>
	{#if hasLabel}
		<label id={labelId} class={['aurora-autocomplete-label', clazz.label]} for={inputId}>
			{#if labelSnippet}
				{@render labelSnippet({ label })}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
	<div class="aurora-autocomplete-anchor" bind:this={anchor}>
		{#if selectionContainerSnippet}
			{@render selectionContainerSnippet({
				values: selection,
				searchText,
				disabled,
				openMenu,
				handleKeyDown,
				select,
				unselect,
				attributes
			})}
		{:else}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class={['aurora-autocomplete-field', clazz.field]}
				onmousedown={(event) => {
					if (event.target !== inputNode) event.preventDefault();
				}}
				onclick={(event) => {
					if (event.target === inputNode || (event.target as Element).closest('button')) return;
					inputNode?.focus();
					openMenu();
				}}
			>
				{#if iconSnippet || icon}
					<div class="aurora-autocomplete-start">
						{#if iconSnippet}
							{@render iconSnippet()}
						{:else if icon}
							<Icon path={icon} />
						{/if}
					</div>
				{/if}
				<div class="aurora-autocomplete-selection">
					{#each visible as item (item.value)}
						{#snippet chipIcon()}
							{@render chipIconSnippet?.({ selection: item })}
						{/snippet}
						{#if selectionSnippet}
							{@render selectionSnippet({ selection: item, unselect })}
						{:else}
							<Chip
								variant="primary"
								size="sm"
								prependIcon={item.icon}
								prependSnippet={chipIconSnippet ? chipIcon : undefined}
								closable={removable}
								closeLabel="{removeLabel} {text(item)}"
								tabindex={-1}
								onclose={() => unselect(item)}
								class={clazz.chip}
							>
								{#if chipLabelSnippet}
									{@render chipLabelSnippet({ selection: item })}
								{:else}
									{text(item)}
								{/if}
							</Chip>
						{/if}
					{/each}
					{#if hiddenCount > 0 && maxVisibleChips !== undefined}
						{#if exceedCounterSnippet}
							{@render exceedCounterSnippet({
								notVisibleChipNumber: hiddenCount,
								maxVisibleChips,
								values: selection,
								searchText,
								disabled
							})}
						{:else}
							<span
								class="aurora-autocomplete-counter"
								title={selection.slice(maxVisibleChips).map(text).join(', ')}>+{hiddenCount}</span
							>
						{/if}
					{/if}
					<input
						autocomplete="off"
						{...rest}
						{...attributes}
						bind:this={() => inputNode, (node) => (inputNode = input = node)}
						bind:value={searchText}
						id={inputId}
						type="text"
						aria-autocomplete="list"
						aria-labelledby={undefined}
						{placeholder}
						{disabled}
						readonly={drawerMode}
						class={clazz.input}
						onfocus={(event) => {
							onfocus?.(event);
							if (!drawerMode) openMenu();
						}}
						onclick={(event) => {
							onclick?.(event);
							openMenu();
						}}
						oninput={(event) => {
							oninput?.(event);
							search(event);
						}}
						onkeydown={(event) => {
							onkeydown?.(event);
							if (!event.defaultPrevented) handleKeyDown(event);
						}}
					/>
				</div>
				{#if loading || validation}
					<div class="aurora-autocomplete-end">
						{#if loading}
							<span class="aurora-autocomplete-spinner" aria-hidden="true"></span>
						{/if}
						{#if validation && stateIconSnippet}
							{@render stateIconSnippet({ state: validation })}
						{:else if validation}
							<Icon
								path={validation === 'error' ? ALERT_ICON : SUCCESS_ICON}
								class="aurora-autocomplete-state-icon"
							/>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if hintSnippet}
		<div class={['aurora-autocomplete-hint', clazz.hint]} id={hintId}>
			{@render hintSnippet({ hint })}
		</div>
	{:else if hint}
		<div class={['aurora-autocomplete-hint', clazz.hint]} id={hintId}>{hint}</div>
	{/if}
	{#if name}
		{#each selection as item (item.value)}
			<input type="hidden" {name} value={item.value} />
		{/each}
	{/if}
</div>

{#if drawerMode}
	<Drawer
		bind:open
		position="bottom"
		title={drawerTitle ?? label}
		aria-label={(drawerTitle ?? label) ? undefined : placeholder}
		closable
		{closeLabel}
		class={{
			drawer: drawerSearch
				? 'aurora-autocomplete-drawer'
				: 'aurora-autocomplete-drawer aurora-autocomplete-drawer-fit',
			body: 'aurora-autocomplete-drawer-body'
		}}
	>
		{#if drawerSearch}
			<!-- svelte-ignore a11y_autofocus -->
			<SimpleTextField
				bind:value={searchText}
				{placeholder}
				prependInnerIcon={SEARCH_ICON}
				role="combobox"
				aria-expanded="true"
				aria-controls={listboxShown ? listboxId : undefined}
				aria-activedescendant={activeDescendant}
				aria-autocomplete="list"
				aria-label={label ?? placeholder}
				autocomplete="off"
				autofocus
				oninput={search}
				onkeydown={(event) => {
					if (event.key !== 'Backspace') handleKeyDown(event);
				}}
			/>
		{/if}
		<div class="aurora-autocomplete-scroll">{@render list(!drawerSearch)}</div>
	</Drawer>
{:else}
	<Menu
		bind:open
		activator={anchor}
		{placement}
		matchActivatorWidth
		class={['aurora-autocomplete-menu', clazz.menu]}
	>
		{@render list()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-autocomplete {
			--_border: var(--autocomplete-border-color, var(--autocomplete-default-border-color));
			--_hover-border: var(
				--autocomplete-hover-border-color,
				var(--autocomplete-default-hover-border-color)
			);
			--_focus-border: var(
				--autocomplete-focus-border-color,
				var(--autocomplete-default-focus-border-color)
			);
			--_ring: var(--autocomplete-focus-ring-color, var(--autocomplete-default-focus-ring-color));
			--_hint: var(--autocomplete-hint-color, var(--autocomplete-default-hint-color));
			--icon-size: var(--autocomplete-icon-size, var(--autocomplete-default-icon-size));

			display: flex;
			flex-direction: column;
			gap: var(--autocomplete-gap, var(--autocomplete-default-gap));
			box-sizing: border-box;
			width: var(--autocomplete-width, var(--autocomplete-default-width));
			max-width: var(--autocomplete-max-width, var(--autocomplete-default-max-width));
			min-width: 0;
		}

		.aurora-autocomplete[data-state='error'] {
			--_border: var(--autocomplete-error-color, var(--autocomplete-default-error-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-autocomplete[data-state='success'] {
			--_border: var(--autocomplete-success-color, var(--autocomplete-default-success-color));
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-autocomplete-label {
			color: var(--autocomplete-label-color, var(--autocomplete-default-label-color));
			font-size: var(--autocomplete-label-font-size, var(--autocomplete-default-label-font-size));
			font-weight: var(
				--autocomplete-label-font-weight,
				var(--autocomplete-default-label-font-weight)
			);
		}

		.aurora-autocomplete-field {
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(--autocomplete-inner-gap, var(--autocomplete-default-inner-gap));
			min-height: var(--autocomplete-min-height, var(--autocomplete-default-min-height));
			padding: var(--autocomplete-padding, var(--autocomplete-default-padding));
			background: var(--autocomplete-background, var(--autocomplete-default-background));
			color: var(--autocomplete-icon-color, var(--autocomplete-default-icon-color));
			border: var(--autocomplete-border-width, var(--autocomplete-default-border-width)) solid
				var(--_border);
			border-radius: var(--autocomplete-border-radius, var(--autocomplete-default-border-radius));
			box-shadow: var(--autocomplete-box-shadow, var(--autocomplete-default-box-shadow));
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-autocomplete:not([data-disabled], [data-open]) .aurora-autocomplete-field:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-autocomplete-field:focus-within,
		.aurora-autocomplete[data-open] .aurora-autocomplete-field {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
					var(--autocomplete-focus-ring-width, var(--autocomplete-default-focus-ring-width))
					var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-autocomplete-selection {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--autocomplete-chip-gap, var(--autocomplete-default-chip-gap));
		}

		input {
			--_input-min-width: var(
				--autocomplete-input-min-width,
				var(--autocomplete-default-input-min-width)
			);

			flex: 1 1 var(--_input-min-width);
			min-width: var(--_input-min-width);
			width: 0;
			box-sizing: border-box;
			margin: 0;
			padding: var(--autocomplete-input-padding, var(--autocomplete-default-input-padding));
			border: 0;
			outline: none;
			background: transparent;
			color: var(--autocomplete-color, var(--autocomplete-default-color));
			font-family: inherit;
			font-size: var(--autocomplete-font-size, var(--autocomplete-default-font-size));
			line-height: 1.5;
			cursor: inherit;
		}

		input::placeholder {
			color: var(--autocomplete-placeholder-color, var(--autocomplete-default-placeholder-color));
			opacity: 1;
		}

		.aurora-autocomplete-counter {
			color: var(--autocomplete-counter-color, var(--autocomplete-default-counter-color));
			font-size: var(--autocomplete-counter-font-size, var(--autocomplete-default-counter-font-size));
			font-weight: var(
				--autocomplete-counter-font-weight,
				var(--autocomplete-default-counter-font-weight)
			);
		}

		.aurora-autocomplete-start {
			display: flex;
			align-items: center;
			padding-inline-start: var(
				--autocomplete-start-padding,
				var(--autocomplete-default-start-padding)
			);
		}

		.aurora-autocomplete-end {
			display: flex;
			align-items: center;
			gap: var(--autocomplete-inner-gap, var(--autocomplete-default-inner-gap));
			padding-inline-end: var(--autocomplete-end-padding, var(--autocomplete-default-end-padding));
		}

		.aurora-autocomplete-end :global(.aurora-autocomplete-state-icon) {
			color: var(--_border);
		}

		.aurora-autocomplete-hint {
			color: var(--_hint);
			font-size: var(--autocomplete-hint-font-size, var(--autocomplete-default-hint-font-size));
		}

		.aurora-autocomplete[data-disabled] .aurora-autocomplete-field {
			background: var(
				--autocomplete-disabled-background,
				var(--autocomplete-default-disabled-background)
			);
			opacity: var(--autocomplete-disabled-opacity, var(--autocomplete-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-autocomplete-spinner {
			--_spinner-size: var(--autocomplete-spinner-size, var(--autocomplete-default-spinner-size));
			--_spinner-color: var(--autocomplete-spinner-color, var(--autocomplete-default-spinner-color));

			box-sizing: border-box;
			flex-shrink: 0;
			width: var(--_spinner-size);
			height: var(--_spinner-size);
			border-radius: 50%;
			border: var(
					--autocomplete-spinner-border-width,
					var(--autocomplete-default-spinner-border-width)
				)
				solid color-mix(in oklab, var(--_spinner-color) 25%, transparent);
			border-top-color: var(--_spinner-color);
			animation: autocomplete-spin 0.7s linear infinite;
		}

		:global(.aurora-autocomplete-menu) {
			--menu-default-max-height: var(
				--autocomplete-menu-max-height,
				var(--autocomplete-default-menu-max-height)
			);
		}

		:global(.aurora-autocomplete-drawer) {
			--drawer-default-size: var(--autocomplete-drawer-size, var(--autocomplete-default-drawer-size));
		}

		:global(.aurora-autocomplete-drawer-fit) {
			--drawer-default-size: auto;
			--drawer-default-max-size: var(
				--autocomplete-drawer-size,
				var(--autocomplete-default-drawer-size)
			);
		}

		:global(.aurora-drawer-body.aurora-autocomplete-drawer-body) {
			display: flex;
			flex-direction: column;
			gap: var(--autocomplete-drawer-gap, var(--autocomplete-default-drawer-gap));
			overflow: hidden;
		}

		.aurora-autocomplete-scroll {
			flex: 1;
			min-height: 0;
			overflow: auto;
			overscroll-behavior: contain;
		}

		.aurora-autocomplete-listbox {
			display: flex;
			flex-direction: column;
			gap: var(--autocomplete-option-spacing, var(--autocomplete-default-option-spacing));
			outline: none;
		}

		.aurora-autocomplete-option {
			--icon-size: var(--autocomplete-option-icon-size, var(--autocomplete-default-option-icon-size));

			display: flex;
			align-items: center;
			gap: var(--autocomplete-option-gap, var(--autocomplete-default-option-gap));
			padding: var(--autocomplete-option-padding, var(--autocomplete-default-option-padding));
			border-radius: var(
				--autocomplete-option-border-radius,
				var(--autocomplete-default-option-border-radius)
			);
			color: var(--autocomplete-option-color, var(--autocomplete-default-option-color));
			font-size: var(--autocomplete-option-font-size, var(--autocomplete-default-option-font-size));
			line-height: 1.4;
			cursor: pointer;
			user-select: none;
			transition:
				background var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-autocomplete-option[data-highlighted] {
			background: var(
				--autocomplete-option-highlighted-background,
				var(--autocomplete-default-option-highlighted-background)
			);
			color: var(
				--autocomplete-option-highlighted-color,
				var(--autocomplete-default-option-highlighted-color)
			);
		}

		.aurora-autocomplete-option[data-selected] {
			background: var(
				--autocomplete-option-selected-background,
				var(--autocomplete-default-option-selected-background)
			);
			color: var(
				--autocomplete-option-selected-color,
				var(--autocomplete-default-option-selected-color)
			);
		}

		.aurora-autocomplete-option[data-selected][data-highlighted] {
			background: var(
				--autocomplete-option-selected-highlighted-background,
				var(--autocomplete-default-option-selected-highlighted-background)
			);
		}

		:global(.aurora-autocomplete-drawer) .aurora-autocomplete-option {
			padding: var(
				--autocomplete-drawer-option-padding,
				var(--autocomplete-default-drawer-option-padding)
			);
			font-size: var(
				--autocomplete-drawer-option-font-size,
				var(--autocomplete-default-drawer-option-font-size)
			);
		}

		.aurora-autocomplete-option-label {
			flex: 1;
			min-width: 0;
			overflow-wrap: anywhere;
		}

		.aurora-autocomplete-option :global(.aurora-autocomplete-check) {
			color: var(--autocomplete-check-color, var(--autocomplete-default-check-color));
		}

		.aurora-autocomplete-match {
			background: none;
			color: var(--autocomplete-match-color, var(--autocomplete-default-match-color));
			font-weight: var(--autocomplete-match-font-weight, var(--autocomplete-default-match-font-weight));
		}

		.aurora-autocomplete-status {
			display: flex;
			align-items: center;
			gap: var(--autocomplete-option-gap, var(--autocomplete-default-option-gap));
			padding: var(--autocomplete-status-padding, var(--autocomplete-default-status-padding));
			color: var(--autocomplete-status-color, var(--autocomplete-default-status-color));
			font-size: var(--autocomplete-status-font-size, var(--autocomplete-default-status-font-size));
		}
	}

	@keyframes autocomplete-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
