<!-- @component
Panel where the user picks the columns of a table: which ones are shown, in which order and which ones are pinned on the left. It edits the same `columnState` bound to `Table`, live, so the table behind shows every change at once; "Save view" calls `onsave({ columnState })` (save it there, for example in the user's settings) and closes, while closing in any other way (Escape, the backdrop, the close button, `open = false`) puts back the state the panel opened with. "Reset" goes back to the default view of `columns` (order, visibility, pins and widths). Visible columns are reordered by dragging their handle (mouse or touch) or with the up and down arrows on it; pinned columns stay first and are reordered among themselves; `required` columns and the last visible one cannot be hidden. Hidden columns are listed under "Available" with their icon, the name of their type and their `description` (or `info`). With more than 7 columns a search field filters both lists by name, type and description. It is a `Drawer` on the right, a bottom sheet below 640px. While a column is dragged it gets `data-dragging`; pinned ones have `data-pinned`.
-->
<script lang="ts" generics="Row extends Record<string, any>">
	import '../../../css/tokens.css';
	import './ColumnManager.css';
	import { flushSync, tick, untrack, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import { MediaQuery } from 'svelte/reactivity';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Tooltip from '../../simple/common/Tooltip.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';
	import SearchBar from '../search/SearchBar.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import {
		arrangeColumnState,
		canHideColumn,
		columnKind,
		defaultColumnState,
		foldText,
		highlightParts,
		isEntryPinned,
		moveColumn,
		sameColumnState,
		setColumnPinned,
		setColumnVisible,
		columnGroupRange,
		type ColumnKind
	} from '../../../utils/table/manager.js';
	import type { TableColumn, TableColumnState } from '../../../utils/table/types.js';

	const DRAG_ICON =
		'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';
	const PIN_ICON = 'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z';
	const PIN_OUTLINE_ICON =
		'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z';
	const HIDE_ICON =
		'M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z';
	const ADD_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
	const RESET_ICON =
		'M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z';
	const TYPE_ICONS: Record<ColumnKind, string> = {
		text: 'M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z',
		number:
			'M5.41,21L6.12,17H2.12L2.47,15H6.47L7.53,9H3.53L3.88,7H7.88L8.59,3H10.59L9.88,7H15.88L16.59,3H18.59L17.88,7H21.88L21.53,9H17.53L16.47,15H20.47L20.12,17H16.12L15.41,21H13.41L14.12,17H8.12L7.41,21H5.41M9.53,9L8.47,15H14.47L15.53,9H9.53Z',
		currency:
			'M3,6H21V18H3V6M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M7,8A2,2 0 0,1 5,10V14A2,2 0 0,1 7,16H17A2,2 0 0,1 19,14V10A2,2 0 0,1 17,8H7Z',
		percent:
			'M18.5 3.5L20.5 5.5L5.5 20.5L3.5 18.5L18.5 3.5M7 4C8.66 4 10 5.34 10 7C10 8.66 8.66 10 7 10C5.34 10 4 8.66 4 7C4 5.34 5.34 4 7 4M17 14C18.66 14 20 15.34 20 17C20 18.66 18.66 20 17 20C15.34 20 14 18.66 14 17C14 15.34 15.34 14 17 14M7 6C6.45 6 6 6.45 6 7C6 7.55 6.45 8 7 8C7.55 8 8 7.55 8 7C8 6.45 7.55 6 7 6M17 16C16.45 16 16 16.45 16 17C16 17.55 16.45 18 17 18C17.55 18 18 17.55 18 17C18 16.45 17.55 16 17 16Z',
		date: 'M12 12H17V17H12V12M19 3H18V1H16V3H8V1H6V3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 5V7H5V5H19M5 19V9H19V19H5Z',
		datetime:
			'M6 1V3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H11.1C12.36 22.24 14.09 23 16 23C19.87 23 23 19.87 23 16C23 14.09 22.24 12.36 21 11.1V5C21 3.9 20.11 3 19 3H18V1H16V3H8V1M5 5H19V7H5M5 9H19V9.67C18.09 9.24 17.07 9 16 9C12.13 9 9 12.13 9 16C9 17.07 9.24 18.09 9.67 19H5M16 11.15C18.68 11.15 20.85 13.32 20.85 16C20.85 18.68 18.68 20.85 16 20.85C13.32 20.85 11.15 18.68 11.15 16C11.15 13.32 13.32 11.15 16 11.15M15 13V16.69L18.19 18.53L18.94 17.23L16.5 15.82V13Z',
		boolean:
			'M19,19H5V5H15V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V11H19M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z',
		custom: 'M4 5V18H21V5H4M14 7V16H11V7H14M6 7H9V16H6V7M19 16H16V7H19V16Z'
	};

	interface Props
		extends Omit<HTMLDialogAttributes, 'children' | 'class' | 'open' | 'onclose' | 'title'> {
		/** Whether the panel is open. `undefined` counts as closed. */
		open?: boolean;
		/** The columns of the table, the same passed to `Table`: their `label`, `type`, `icon` and `description` describe them in the panel, `required` ones cannot be hidden. */
		columns: TableColumn<Row>[];
		/** Order, visibility, widths and pins of the columns, the same bound to `Table`. It changes while the user edits, so the table shows each change at once; closing without saving puts back the state the panel opened with. Empty means the default view of `columns`. */
		columnState?: TableColumnState[];
		/** Lets the user pin columns on the left. Columns pinned by `columns` or by `columnState` stay pinned either way. */
		pinnable?: boolean;
		/** Shows a field that filters the columns by name, type and description. Defaults to on with more than 7 columns. */
		searchable?: boolean;
		/** Called when the user saves, with the new state, just before the panel closes: save it here, for example in the user's settings on the backend. */
		onsave?: (event: { columnState: TableColumnState[] }) => void;
		/** Called when the panel closes without saving, after `columnState` has been put back. */
		oncancel?: () => void;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Texts to change, on top of those of `locale`. `{column}`, `{count}`, `{visible}`, `{total}`, `{position}` and `{query}` are replaced by the label of the column, a number of columns, the visible and the total columns, the new position of a moved column and the search text. */
		labels?: {
			title?: string;
			count?: string;
			search?: string;
			visible?: string;
			reorderHint?: string;
			available?: string;
			availableCount?: string;
			availableCountOne?: string;
			results?: string;
			resultsOne?: string;
			noMatch?: string;
			allVisible?: string;
			reset?: string;
			save?: string;
			close?: string;
			move?: string;
			moveHint?: string;
			moved?: string;
			pin?: string;
			pinTip?: string;
			unpinTip?: string;
			pinned?: string;
			hide?: string;
			hideTip?: string;
			required?: string;
			lastVisible?: string;
			add?: string;
			typeText?: string;
			typeNumber?: string;
			typeCurrency?: string;
			typePercent?: string;
			typeDate?: string;
			typeDatetime?: string;
			typeBoolean?: string;
		};
		/** The `<dialog>` element. */
		drawerElement?: HTMLDialogElement;
		/** Extra classes for each part: `drawer` the `<dialog>`, `panel` the sliding panel, `item` the rows of the visible columns, `card` the cards of the available ones. */
		class?: {
			drawer?: string;
			panel?: string;
			item?: string;
			card?: string;
		};
		/** Content of a column in both lists, instead of its icon, its label, its type and its description. The handle and the buttons stay. */
		columnSnippet?: Snippet<[{ column: TableColumn<Row>; visible: boolean; query: string }]>;
		/** Replaces the text shown when the search matches no column. */
		emptySnippet?: Snippet<[{ query: string }]>;
		/** Replaces the buttons at the bottom: `reset` goes back to the default view, `save` saves and closes, `cancel` closes without saving. */
		actionsSnippet?: Snippet<[{ reset: () => void; save: () => void; cancel: () => void }]>;
	}

	let {
		open = $bindable(),
		columns,
		columnState = $bindable(),
		pinnable = true,
		searchable,
		onsave,
		oncancel,
		locale: localeProp,
		labels,
		drawerElement = $bindable(),
		class: clazz = {},
		columnSnippet,
		emptySnippet,
		actionsSnippet: actionsSnippetProp,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived({ ...libraryTexts(locale).columnManager, ...labels });

	const id = $props.id();
	const sheet = new MediaQuery('max-width: 640px', false);
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	let byKey = $derived(new Map(columns.map((column) => [column.key, column])));
	let current = $derived(arrangeColumnState(columns, columnState));
	let visibleEntries = $derived(current.filter((entry) => entry.visible));
	let visibleKeys = $derived(new Set(visibleEntries.map((entry) => entry.key)));
	let isDefault = $derived(sameColumnState(current, defaultColumnState(columns)));

	let query = $state('');
	let needle = $derived(foldText(query.trim()));
	let showSearch = $derived(searchable ?? columns.length > 7);
	let searching = $derived(showSearch && needle !== '');

	let shownEntries = $derived(
		searching ? visibleEntries.filter((entry) => matches(byKey.get(entry.key)!)) : visibleEntries
	);
	let availableColumns = $derived(
		columns.filter((column) => !visibleKeys.has(column.key) && (!searching || matches(column)))
	);

	let announcement = $state('');
	let listNode = $state<HTMLElement>();
	let availableNode = $state<HTMLElement>();
	let pinButtons = $state<Record<string, HTMLElement | null>>({});
	let hideButtons = $state<Record<string, HTMLElement | null>>({});
	const rowNodes: Record<string, HTMLElement | null> = {};
	const gripNodes: Record<string, HTMLElement | null> = {};

	let initial: TableColumnState[] | undefined;
	let editing = false;
	let saving = false;

	$effect.pre(() => {
		if (open) {
			if (editing) return;
			editing = true;
			saving = false;
			untrack(() => {
				initial = columnState;
				query = '';
				announcement = '';
			});
		} else if (editing) {
			editing = false;
			if (saving) return;
			untrack(() => {
				columnState = initial;
				oncancel?.();
			});
		}
	});

	function labelOf(column: TableColumn<Row>) {
		return column.label ?? column.key;
	}

	function typeName(column: TableColumn<Row>): string | undefined {
		const names: Record<ColumnKind, string | undefined> = {
			text: texts.typeText,
			number: texts.typeNumber,
			currency: texts.typeCurrency,
			percent: texts.typePercent,
			date: texts.typeDate,
			datetime: texts.typeDatetime,
			boolean: texts.typeBoolean,
			custom: undefined
		};
		return names[columnKind(column)];
	}

	function matches(column: TableColumn<Row>) {
		return foldText(`${labelOf(column)} ${typeName(column) ?? ''} ${column.description ?? column.info ?? ''}`).includes(needle);
	}

	function fill(text: string, values: Record<string, string | number>) {
		return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}

	function update(next: TableColumnState[]) {
		columnState = next;
	}

	async function focusLater(find: () => HTMLElement | null | undefined) {
		await tick();
		find()?.focus();
	}

	function show(key: string) {
		const index = availableColumns.findIndex((column) => column.key === key);
		update(setColumnVisible(columns, current, key, true));
		focusLater(() => {
			const buttons = availableNode?.querySelectorAll<HTMLElement>('.aurora-column-manager-add');
			if (buttons?.length) return buttons[Math.min(index, buttons.length - 1)];
			return hideButtons[key];
		});
	}

	function hide(key: string) {
		if (!canHideColumn(columns, current, key)) return;
		const index = shownEntries.findIndex((entry) => entry.key === key);
		update(setColumnVisible(columns, current, key, false));
		focusLater(() => {
			const next = shownEntries[Math.min(index, shownEntries.length - 1)];
			return next ? hideButtons[next.key] : availableNode?.querySelector<HTMLElement>('.aurora-column-manager-add');
		});
	}

	function togglePin(key: string) {
		const entry = current.find((candidate) => candidate.key === key);
		if (!entry) return;
		update(setColumnPinned(columns, current, key, !isEntryPinned(entry, byKey.get(key))));
		focusLater(() => pinButtons[key]);
	}

	function announceMove(key: string) {
		const range = columnGroupRange(columns, current, key);
		const position = current.findIndex((entry) => entry.key === key) - range[0] + 1;
		announcement = fill(texts.moved, {
			column: labelOf(byKey.get(key)!),
			position,
			count: range[1] - range[0] + 1
		});
	}

	function moveBy(event: KeyboardEvent, key: string) {
		const steps: Record<string, number> = { ArrowUp: -1, ArrowDown: 1 };
		const step = steps[event.key];
		if (!step || searching) return;
		event.preventDefault();
		const from = current.findIndex((entry) => entry.key === key);
		const next = moveColumn(columns, current, key, from + step);
		if (sameColumnState(next, current)) return;
		update(next);
		announceMove(key);
		focusLater(() => gripNodes[key]);
	}

	function reset() {
		update(defaultColumnState(columns));
	}

	function save() {
		const state = current;
		saving = true;
		columnState = state;
		onsave?.({ columnState: state });
		open = false;
	}

	function cancel() {
		open = false;
	}

	type Drag = { key: string; pointerId: number; grab: number; offset: number; y: number };
	let drag = $state<Drag | null>(null);
	let frame = 0;

	function startDrag(event: PointerEvent, key: string) {
		if (event.button !== 0 || searching || !listNode) return;
		const row = rowNodes[key];
		if (!row) return;
		event.preventDefault();
		const top = event.clientY - listNode.getBoundingClientRect().top;
		drag = { key, pointerId: event.pointerId, grab: top - row.offsetTop, offset: 0, y: event.clientY };
	}

	function dragTo(clientY: number) {
		if (!drag || !listNode) return;
		const row = rowNodes[drag.key];
		if (!row) return;
		const top = clientY - listNode.getBoundingClientRect().top - drag.grab;
		const center = top + row.offsetHeight / 2;
		const keys = visibleEntries.map((entry) => entry.key);
		const from = keys.indexOf(drag.key);
		const [min, max] = columnGroupRange(columns, current, drag.key);
		const gap = parseFloat(getComputedStyle(listNode).rowGap) || 0;
		const size = row.offsetHeight + gap;
		let target = min;
		for (let index = min; index <= max; index++) {
			if (index === from) continue;
			const other = rowNodes[keys[index]];
			if (!other) continue;
			const middle = other.offsetTop + other.offsetHeight / 2 - (index > from ? size : 0);
			if (middle < center) target++;
		}
		if (target !== from) {
			const key = drag.key;
			flushSync(() => update(moveColumn(columns, current, key, target)));
			announceMove(key);
		}
		drag.offset = top - row.offsetTop;
		drag.y = clientY;
	}

	function scroller() {
		return listNode?.closest<HTMLElement>('.aurora-drawer-body') ?? undefined;
	}

	function autoScroll() {
		frame = 0;
		const container = scroller();
		if (!drag || !container) return;
		const rect = container.getBoundingClientRect();
		const edge = Math.min(48, rect.height / 4);
		const above = rect.top + edge - drag.y;
		const below = drag.y - (rect.bottom - edge);
		const speed = above > 0 ? -above : below > 0 ? below : 0;
		if (!speed) return;
		const before = container.scrollTop;
		container.scrollTop += (speed / edge) * 12;
		if (container.scrollTop === before) return;
		dragTo(drag.y);
		frame = requestAnimationFrame(autoScroll);
	}

	function moveDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		dragTo(event.clientY);
		if (!frame) frame = requestAnimationFrame(autoScroll);
	}

	function endDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		drag = null;
	}

	let dragging = $derived(drag !== null);

	$effect(() => {
		if (!dragging) return;
		window.addEventListener('pointermove', moveDrag);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);
		return () => {
			cancelAnimationFrame(frame);
			frame = 0;
			window.removeEventListener('pointermove', moveDrag);
			window.removeEventListener('pointerup', endDrag);
			window.removeEventListener('pointercancel', endDrag);
		};
	});

	function reorder(node: Element, rects: { from: DOMRect; to: DOMRect }, params: { skip: boolean }) {
		if (params.skip || reducedMotion.current) return { duration: 0 };
		return flip(node, rects, { duration: 160 });
	}

	function countText() {
		const count = availableColumns.length;
		if (searching) return count === 1 ? texts.resultsOne : fill(texts.results, { count });
		return count === 1 ? texts.availableCountOne : fill(texts.availableCount, { count });
	}
</script>

{#snippet highlighted(text: string)}
	{#each highlightParts(text, searching ? query : '') as part, index (index)}
		{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}
	{/each}
{/snippet}

{#snippet typeIcon(column: TableColumn<Row>)}
	<span class="aurora-column-manager-type-icon">
		<Icon path={column.icon ?? TYPE_ICONS[columnKind(column)]} />
	</span>
{/snippet}

<Drawer
	aria-labelledby="{id}-title"
	{...rest}
	bind:open
	bind:drawerElement
	position={sheet.current ? 'bottom' : 'right'}
	title={texts.title}
	closable
	closeLabel={texts.close}
	{locale}
	class={{
		drawer: ['aurora-column-manager', clazz.drawer].filter(Boolean).join(' '),
		panel: clazz.panel
	}}
>
	{#snippet titleSnippet()}
		<span id="{id}-title" class="aurora-column-manager-title">{texts.title}</span>
		<span class="aurora-column-manager-count">
			{fill(texts.count, { visible: visibleEntries.length, total: columns.length })}
		</span>
	{/snippet}

	<div class="aurora-column-manager-content" data-searching={searching || undefined}>
		{#if showSearch}
			<div class="aurora-column-manager-search">
				<SearchBar
					bind:value={query}
					label={texts.search}
					placeholder={texts.search}
					debounce={0}
					clearable
					{locale}
				/>
			</div>
		{/if}

		<div class="aurora-column-manager-section">
			<h3 id="{id}-visible" class="aurora-column-manager-section-title">{texts.visible}</h3>
			{#if !searching && visibleEntries.length > 1}
				<span class="aurora-column-manager-section-hint">{texts.reorderHint}</span>
			{/if}
		</div>
		<span id="{id}-move-hint" class="aurora-column-manager-visually-hidden">{texts.moveHint}</span>
		<ul
			class="aurora-column-manager-list"
			aria-labelledby="{id}-visible"
			bind:this={listNode}
			data-dragging={drag ? true : undefined}
		>
			{#each shownEntries as entry (entry.key)}
				{@const column = byKey.get(entry.key)!}
				{@const label = labelOf(column)}
				{@const pinned = isEntryPinned(entry, column)}
				{@const hideable = canHideColumn(columns, current, entry.key)}
				{@const dragged = drag?.key === entry.key}
				<li
					class={['aurora-column-manager-item', clazz.item]}
					data-pinned={pinned || undefined}
					data-dragging={dragged || undefined}
					style:translate={dragged ? `0 ${drag?.offset ?? 0}px` : undefined}
					bind:this={() => rowNodes[entry.key], (node) => (rowNodes[entry.key] = node)}
					animate:reorder={{ skip: dragged }}
				>
					<button
						type="button"
						class="aurora-column-manager-grip"
						aria-label={fill(texts.move, { column: label })}
						aria-describedby="{id}-move-hint"
						disabled={searching}
						bind:this={() => gripNodes[entry.key], (node) => (gripNodes[entry.key] = node)}
						onpointerdown={(event) => startDrag(event, entry.key)}
						onkeydown={(event) => moveBy(event, entry.key)}
					>
						<Icon path={DRAG_ICON} />
					</button>
					{#if columnSnippet}
						{@render columnSnippet({ column, visible: true, query })}
					{:else}
						{@render typeIcon(column)}
						<span class="aurora-column-manager-name">{@render highlighted(label)}</span>
					{/if}
					<span class="aurora-column-manager-item-actions">
						{#if pinnable}
							<button
								type="button"
								class="aurora-column-manager-button"
								data-pinned={pinned || undefined}
								aria-label={fill(texts.pin, { column: label })}
								aria-pressed={pinned}
								bind:this={pinButtons[entry.key]}
								onclick={() => togglePin(entry.key)}
							>
								<Icon path={pinned ? PIN_ICON : PIN_OUTLINE_ICON} />
							</button>
							<Tooltip
								activator={pinButtons[entry.key] ?? undefined}
								text={pinned ? texts.unpinTip : texts.pinTip}
							/>
						{:else if pinned}
							<span class="aurora-column-manager-pinned">
								<Icon path={PIN_ICON} title={texts.pinned} />
							</span>
						{/if}
						<button
							type="button"
							class="aurora-column-manager-button"
							aria-label={fill(texts.hide, { column: label })}
							aria-disabled={hideable ? undefined : 'true'}
							bind:this={hideButtons[entry.key]}
							onclick={() => hide(entry.key)}
						>
							<Icon path={HIDE_ICON} />
						</button>
						<Tooltip
							activator={hideButtons[entry.key] ?? undefined}
							text={hideable ? texts.hideTip : column.required ? texts.required : texts.lastVisible}
						/>
					</span>
				</li>
			{/each}
		</ul>

		<div class="aurora-column-manager-section">
			<h3 id="{id}-available" class="aurora-column-manager-section-title">{texts.available}</h3>
			<span class="aurora-column-manager-section-hint">{countText()}</span>
		</div>
		<ul class="aurora-column-manager-available" aria-labelledby="{id}-available" bind:this={availableNode}>
			{#each availableColumns as column (column.key)}
				{@const label = labelOf(column)}
				{@const type = typeName(column)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
				<li class={['aurora-column-manager-card', clazz.card]} onclick={() => show(column.key)}>
					{#if columnSnippet}
						{@render columnSnippet({ column, visible: false, query })}
					{:else}
						{@render typeIcon(column)}
						<span class="aurora-column-manager-meta">
							<span class="aurora-column-manager-card-title">
								<span class="aurora-column-manager-name">{@render highlighted(label)}</span>
								{#if type}<span class="aurora-column-manager-tag">{@render highlighted(type)}</span>{/if}
							</span>
							{#if column.description ?? column.info}
								<span class="aurora-column-manager-description">
									{@render highlighted(column.description ?? column.info ?? '')}
								</span>
							{/if}
						</span>
					{/if}
					<button
						type="button"
						class="aurora-column-manager-button aurora-column-manager-add"
						aria-label={fill(texts.add, { column: label })}
					>
						<Icon path={ADD_ICON} />
					</button>
				</li>
			{/each}
		</ul>

		{#if searching && !shownEntries.length && !availableColumns.length}
			<div class="aurora-column-manager-empty">
				{#if emptySnippet}
					{@render emptySnippet({ query })}
				{:else}
					{fill(texts.noMatch, { query: query.trim() })}
				{/if}
			</div>
		{:else if !searching && !availableColumns.length}
			<div class="aurora-column-manager-empty">{texts.allVisible}</div>
		{/if}

		<div class="aurora-column-manager-visually-hidden" aria-live="polite">{announcement}</div>
	</div>

	{#snippet actionsSnippet()}
		<div class="aurora-column-manager-actions">
			{#if actionsSnippetProp}
				{@render actionsSnippetProp({ reset, save, cancel })}
			{:else}
				<Button buttonType="text" size="sm" icon={RESET_ICON} disabled={isDefault} onclick={reset}>
					{texts.reset}
				</Button>
				<Button size="sm" onclick={save}>{texts.save}</Button>
			{/if}
		</div>
	{/snippet}
</Drawer>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-column-manager) {
			--_drawer-size: var(--column-manager-width, var(--column-manager-default-width));
			--_drawer-backdrop-background: var(
				--column-manager-backdrop-background,
				var(--column-manager-default-backdrop-background)
			);
			--_drawer-backdrop-filter: var(
				--column-manager-backdrop-filter,
				var(--column-manager-default-backdrop-filter)
			);
			--_drawer-max-size: 100%;
		}

		:global(.aurora-column-manager[data-position='bottom']) {
			--_drawer-size: auto;
			--_drawer-max-size: var(
				--column-manager-sheet-max-height,
				var(--column-manager-default-sheet-max-height)
			);
		}

		.aurora-column-manager-title {
			display: block;
		}

		.aurora-column-manager-count {
			display: block;
			margin-top: 2px;
			color: var(--column-manager-count-color, var(--column-manager-default-count-color));
			font-family: var(--global-font-family);
			font-size: var(--column-manager-count-font-size, var(--column-manager-default-count-font-size));
			font-weight: 400;
			letter-spacing: normal;
		}

		.aurora-column-manager-content {
			--_duration: var(--column-manager-duration, var(--column-manager-default-duration));
			--_easing: var(--column-manager-easing, var(--column-manager-default-easing));
			--_ring: var(--column-manager-focus-ring-width, var(--column-manager-default-focus-ring-width))
				solid var(--column-manager-focus-ring-color, var(--column-manager-default-focus-ring-color));
			--_ring-offset: var(
				--column-manager-focus-ring-offset,
				var(--column-manager-default-focus-ring-offset)
			);

			display: flex;
			flex-direction: column;
		}

		.aurora-column-manager-search {
			position: sticky;
			top: 0;
			z-index: 2;
			padding-bottom: 4px;
			background: var(--drawer-background, var(--drawer-default-background));
			--search-bar-default-height: 36px;
		}

		.aurora-column-manager-section {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 8px;
			margin: var(--column-manager-section-margin, var(--column-manager-default-section-margin));
		}

		.aurora-column-manager-section:first-child {
			margin-top: 0;
		}

		.aurora-column-manager-section-title {
			margin: 0;
			color: var(--column-manager-section-color, var(--column-manager-default-section-color));
			font-size: var(--column-manager-section-font-size, var(--column-manager-default-section-font-size));
			font-weight: 600;
			letter-spacing: 0.12em;
			line-height: 1.4;
			text-transform: uppercase;
		}

		.aurora-column-manager-section-hint {
			color: var(--column-manager-section-color, var(--column-manager-default-section-color));
			font-size: var(
				--column-manager-section-hint-font-size,
				var(--column-manager-default-section-hint-font-size)
			);
		}

		.aurora-column-manager-list,
		.aurora-column-manager-available {
			position: relative;
			display: flex;
			flex-direction: column;
			gap: var(--column-manager-item-gap, var(--column-manager-default-item-gap));
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-column-manager-list[data-dragging] {
			cursor: grabbing;
			user-select: none;
		}

		.aurora-column-manager-item,
		.aurora-column-manager-card {
			box-sizing: border-box;
			display: flex;
			align-items: center;
			min-width: 0;
			border: var(--column-manager-item-border-width, var(--column-manager-default-item-border-width))
				solid var(--_border-color);
			border-radius: var(
				--column-manager-item-border-radius,
				var(--column-manager-default-item-border-radius)
			);
			background: var(--column-manager-item-background, var(--column-manager-default-item-background));
			color: var(--column-manager-item-color, var(--column-manager-default-item-color));
			font-size: var(--column-manager-item-font-size, var(--column-manager-default-item-font-size));
			line-height: 1.35;
			transition:
				border-color var(--_duration) var(--_easing),
				box-shadow var(--_duration) var(--_easing);
		}

		.aurora-column-manager-item {
			--_border-color: var(
				--column-manager-item-border-color,
				var(--column-manager-default-item-border-color)
			);

			gap: 8px;
			padding: var(--column-manager-item-padding, var(--column-manager-default-item-padding));
			transition:
				translate var(--_duration) var(--_easing),
				border-color var(--_duration) var(--_easing),
				box-shadow var(--_duration) var(--_easing);
		}

		.aurora-column-manager-item[data-dragging] {
			position: relative;
			z-index: 1;
			--_border-color: var(
				--column-manager-item-dragging-border-color,
				var(--column-manager-default-item-dragging-border-color)
			);
			box-shadow: var(
				--column-manager-item-dragging-box-shadow,
				var(--column-manager-default-item-dragging-box-shadow)
			);
			transition: none;
		}

		.aurora-column-manager-card {
			--_border-color: var(
				--column-manager-card-border-color,
				var(--column-manager-default-card-border-color)
			);

			gap: var(--column-manager-card-gap, var(--column-manager-default-card-gap));
			padding: var(--column-manager-card-padding, var(--column-manager-default-card-padding));
			cursor: pointer;
		}

		@media (hover: hover) {
			.aurora-column-manager-list:not([data-dragging]) .aurora-column-manager-item:hover {
				--_border-color: var(
					--column-manager-item-hover-border-color,
					var(--column-manager-default-item-hover-border-color)
				);
			}

			.aurora-column-manager-card:hover {
				--_border-color: var(
					--column-manager-card-hover-border-color,
					var(--column-manager-default-card-hover-border-color)
				);
			}

			.aurora-column-manager-card:hover .aurora-column-manager-add {
				border-color: var(--column-manager-add-hover-background, var(--column-manager-default-add-hover-background));
				background: var(--column-manager-add-hover-background, var(--column-manager-default-add-hover-background));
				color: var(--column-manager-add-hover-color, var(--column-manager-default-add-hover-color));
			}

			.aurora-column-manager-button:not(.aurora-column-manager-add, [aria-disabled='true']):hover {
				background: var(
					--column-manager-button-hover-background,
					var(--column-manager-default-button-hover-background)
				);
				color: var(--column-manager-button-hover-color, var(--column-manager-default-button-hover-color));
			}
		}

		.aurora-column-manager-grip {
			flex: none;
			display: grid;
			place-items: center;
			width: 20px;
			height: var(--column-manager-button-size, var(--column-manager-default-button-size));
			padding: 0;
			border: 0;
			border-radius: var(
				--column-manager-button-border-radius,
				var(--column-manager-default-button-border-radius)
			);
			background: none;
			color: var(--column-manager-grip-color, var(--column-manager-default-grip-color));
			cursor: grab;
			touch-action: none;
			--icon-size: 18px;
		}

		.aurora-column-manager-grip:disabled {
			cursor: default;
			opacity: var(
				--column-manager-button-disabled-opacity,
				var(--column-manager-default-button-disabled-opacity)
			);
		}

		.aurora-column-manager-list[data-dragging] .aurora-column-manager-grip {
			cursor: grabbing;
		}

		.aurora-column-manager-type-icon {
			flex: none;
			display: grid;
			place-items: center;
			width: var(--column-manager-type-icon-size, var(--column-manager-default-type-icon-size));
			height: var(--column-manager-type-icon-size, var(--column-manager-default-type-icon-size));
			border-radius: var(
				--column-manager-type-icon-border-radius,
				var(--column-manager-default-type-icon-border-radius)
			);
			background: var(
				--column-manager-type-icon-background,
				var(--column-manager-default-type-icon-background)
			);
			color: var(--column-manager-type-icon-color, var(--column-manager-default-type-icon-color));
			--icon-size: 15px;
		}

		.aurora-column-manager-card .aurora-column-manager-type-icon {
			background: var(
				--column-manager-card-icon-background,
				var(--column-manager-default-card-icon-background)
			);
			color: var(--column-manager-card-icon-color, var(--column-manager-default-card-icon-color));
		}

		.aurora-column-manager-name {
			min-width: 0;
			overflow: hidden;
			font-weight: var(--column-manager-item-font-weight, var(--column-manager-default-item-font-weight));
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-column-manager-item > .aurora-column-manager-name {
			flex: 1 1 auto;
		}

		.aurora-column-manager-item-actions {
			flex: none;
			display: flex;
			gap: 2px;
			margin-inline-start: auto;
		}

		.aurora-column-manager-button {
			flex: none;
			display: grid;
			place-items: center;
			width: var(--column-manager-button-size, var(--column-manager-default-button-size));
			height: var(--column-manager-button-size, var(--column-manager-default-button-size));
			padding: 0;
			border: 0;
			border-radius: var(
				--column-manager-button-border-radius,
				var(--column-manager-default-button-border-radius)
			);
			background: transparent;
			color: var(--column-manager-button-color, var(--column-manager-default-button-color));
			cursor: pointer;
			transition:
				background var(--_duration) var(--_easing),
				color var(--_duration) var(--_easing),
				border-color var(--_duration) var(--_easing);
			--icon-size: 16px;
		}

		.aurora-column-manager-button[data-pinned],
		.aurora-column-manager-pinned {
			color: var(
				--column-manager-button-pinned-color,
				var(--column-manager-default-button-pinned-color)
			);
		}

		.aurora-column-manager-button[aria-disabled='true'] {
			cursor: not-allowed;
			opacity: var(
				--column-manager-button-disabled-opacity,
				var(--column-manager-default-button-disabled-opacity)
			);
		}

		.aurora-column-manager-pinned {
			display: grid;
			place-items: center;
			width: var(--column-manager-button-size, var(--column-manager-default-button-size));
			--icon-size: 16px;
		}

		.aurora-column-manager-grip:focus-visible,
		.aurora-column-manager-button:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		.aurora-column-manager-meta {
			display: flex;
			flex: 1 1 auto;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-column-manager-card-title {
			display: flex;
			align-items: center;
			gap: 6px;
			min-width: 0;
		}

		.aurora-column-manager-tag {
			flex: none;
			padding: var(--column-manager-tag-padding, var(--column-manager-default-tag-padding));
			border: var(--global-border-width) solid var(--global-color-border);
			border-radius: var(--column-manager-tag-border-radius, var(--column-manager-default-tag-border-radius));
			background: var(--column-manager-tag-background, var(--column-manager-default-tag-background));
			color: var(--column-manager-tag-color, var(--column-manager-default-tag-color));
			font-family: var(--column-manager-tag-font-family, var(--column-manager-default-tag-font-family));
			font-size: var(--column-manager-tag-font-size, var(--column-manager-default-tag-font-size));
			font-weight: 400;
			line-height: 1.5;
		}

		.aurora-column-manager-description {
			overflow: hidden;
			color: var(--column-manager-description-color, var(--column-manager-default-description-color));
			font-size: var(
				--column-manager-description-font-size,
				var(--column-manager-default-description-font-size)
			);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-column-manager-add {
			width: var(--column-manager-add-size, var(--column-manager-default-add-size));
			height: var(--column-manager-add-size, var(--column-manager-default-add-size));
			border: var(--global-border-width) solid
				var(--column-manager-add-border-color, var(--column-manager-default-add-border-color));
			background: var(--column-manager-add-background, var(--column-manager-default-add-background));
			color: var(--column-manager-add-color, var(--column-manager-default-add-color));
		}

		.aurora-column-manager-content mark {
			background: none;
			color: var(--column-manager-mark-color, var(--column-manager-default-mark-color));
			font-weight: var(--column-manager-mark-font-weight, var(--column-manager-default-mark-font-weight));
		}

		.aurora-column-manager-empty {
			padding: 20px 10px;
			color: var(--column-manager-empty-color, var(--column-manager-default-empty-color));
			font-size: var(--column-manager-empty-font-size, var(--column-manager-default-empty-font-size));
			text-align: center;
		}

		.aurora-column-manager-actions {
			display: flex;
			flex: 1 1 auto;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}

		.aurora-column-manager-visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			border: 0;
			white-space: nowrap;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-column-manager-item,
			.aurora-column-manager-card,
			.aurora-column-manager-button {
				transition: none;
			}
		}
	}
</style>
