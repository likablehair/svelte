<!-- @component
Table of rows and columns. `columns` declares what each column shows (`key`, `label`, a `type` that formats numbers, dates and yes/no with `Intl` in the language of `locale`, `format`, or a `cell` snippet) and `rows` are plain objects, identified by `rowKey`. Sortable columns sort the rows on their own (ascending, descending, unsorted), or only report the new `sort` with `sorting="manual"` when the server sorts. `selectable` adds a checkbox per row (shift-click selects a range), `expandedSnippet` a detail row under each row, `actionsSnippet` a column of buttons that stays on the right while scrolling (with `actionsVisibility="hover"` it shows only on hover and focus). `rowHref` turns every row into a link (Ctrl-click and middle click open it in a new tab), `onrowclick` makes rows clickable and focusable. `pinned` columns stay on the left (unless together with the checkboxes and the actions they would take more than half of the table), `resizable` columns can be dragged or resized with the arrow keys, and `columnState` keeps order, visibility, widths and pins as plain data to save. Empty cells show "—". When the table is narrower than `cardBreakpoint` (640px by default) every row becomes a card, with the `cardColumns` (the first 4 by default) and the other columns behind "Show more fields". Above `virtualize` rows (200 by default) only the rows in view are in the page, so thousands of rows stay fast. `onendreached` is called when the last rows come into view, for loading more. While `loading` the table shows a progress bar, or placeholder rows when it has none; with no rows it shows `NoData`. State is exposed as `data-cards`, `data-loading`, `data-disabled`, `data-resizing`, `data-actions-visibility` and `data-pins-off` on the root, and `data-selected`, `data-expanded` on rows for app CSS.
-->
<script lang="ts" generics="Row extends Record<string, any>">
	import '../../../css/tokens.css';
	import './Table.css';
	import { onMount, untrack, type Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import Checkbox from '../forms/Checkbox.svelte';
	import Select from '../forms/Select.svelte';
	import Icon from '../media/Icon.svelte';
	import NoData from '../common/NoData.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import Skeleton from '../loaders/Skeleton.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import type { TableColumn, TableColumnState, TableSort } from '../../../utils/table/types.js';
	import {
		cellFormatter,
		cellValue,
		columnAlign,
		isEmptyValue,
		keyOf
	} from '../../../utils/table/values.js';
	import { nextSort, sortRows } from '../../../utils/table/sort.js';
	import {
		fullColumnState,
		isColumnState,
		visibleColumns,
		withWidths,
		type ResolvedColumn
	} from '../../../utils/table/columns.js';
	import {
		pageSelectionState,
		rowRange,
		selectionChecker,
		setRowsSelected,
		type Selection
	} from '../../../utils/table/selection.js';
	import { createRowWindow, scrollParent, type RowRange } from '../../../utils/table/virtual.js';

	const SORT_ICON = 'M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z';
	const EXPAND_ICON = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';
	const CHECK_ICON = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';
	const INFO_ICON =
		'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z';
	const SELECT_KEY = '\0select';
	const EXPAND_KEY = '\0expand';
	const ACTIONS_KEY = '\0actions';
	const MIN_WIDTH = 48;
	const CARD_FIELDS = 4;
	const FIRST_WINDOW = 40;
	const ROW_ESTIMATE = 41;
	const CARD_ESTIMATE = 160;
	const INTERACTIVE =
		'a, button, input, select, textarea, label, summary, [contenteditable], [role="button"], [role="checkbox"], [role="link"], [role="menuitem"], [role="switch"]';

	interface Props
		extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onselectionchange'> {
		/** The rows, plain objects. */
		rows?: Row[];
		/** The columns, in their default order (see `TableColumn`). */
		columns: TableColumn<Row>[];
		/** Identity of a row: the name of a property or a function. Used as the key of the list, of the selection and of the expanded rows. */
		rowKey?: string | ((row: Row) => string | number);
		/** Current sorting, or empty for the order of `rows`. */
		sort?: TableSort;
		/** `local`: the table sorts the rows it has. `manual`: it only updates `sort` and calls `onsortchange`, and the app passes the rows already sorted (for example by the server). */
		sorting?: 'local' | 'manual';
		/** Called when the user changes the sorting, after `sort` has changed. */
		onsortchange?: (event: { sort: TableSort | undefined }) => void;
		/** Adds a checkbox to each row: `multiple` also adds "select all" in the header and selects a range with shift-click, `single` keeps at most one row selected. */
		selectable?: 'single' | 'multiple';
		/** Selected rows, compared through `rowKey`. */
		selected?: Row[];
		/** Every row is selected, also those not loaded (for example on other pages), except `excluded`. Set by the app or by `DataTable`; the header checkbox of the table selects only the rows it shows. */
		selectedAll?: boolean;
		/** Rows left out of `selectedAll`. */
		excluded?: Row[];
		/** Called when the user changes the selection, after `selected`, `selectedAll` and `excluded` have changed. */
		onselectionchange?: (event: { selected: Row[]; selectedAll: boolean; excluded: Row[] }) => void;
		/** Keys (`rowKey`) of the expanded rows. */
		expanded?: (string | number)[];
		/** Which rows can expand. Defaults to all of them when `expandedSnippet` is set. */
		expandable?: (row: Row) => boolean;
		/** Called when the user expands or collapses a row, after `expanded` has changed. */
		onexpandedchange?: (event: { expanded: (string | number)[] }) => void;
		/** URL of a row: the row becomes a link, with a real link inside for the keyboard and screen readers. Ctrl-click and middle click open it in a new tab. */
		rowHref?: (row: Row) => string | undefined;
		/** Called on a click on a row (not on its buttons, links and fields) and on Enter or Space when the row has the focus. With it every row is focusable. Calling `event.preventDefault()` stops the navigation of `rowHref`. */
		onrowclick?: (row: Row, event: MouseEvent | KeyboardEvent) => void;
		/** Extra classes of a row. */
		rowClass?: (row: Row) => ClassValue;
		/** Text of empty cells (`null`, `undefined`, empty string) of every column, unless the column sets its own. */
		empty?: string;
		/** Shows that the rows are loading: a progress bar under the header, or `loadingRows` placeholder rows when there are no rows yet. */
		loading?: boolean;
		/** Number of placeholder rows while loading without rows. */
		loadingRows?: number;
		/** Title shown when there are no rows. Defaults to the one of `NoData`, in the language of `locale`. */
		noDataTitle?: string;
		/** Order, visibility, width and pin of the columns, in display order: plain data to save and restore. Columns missing from it keep their defaults, unknown keys are ignored. */
		columnState?: TableColumnState[];
		/** Called when the user changes the columns (for example by resizing one), after `columnState` has changed. */
		oncolumnstatechange?: (event: { columnState: TableColumnState[] }) => void;
		/** Saves `columnState` in the browser (`localStorage`) under this key and restores it on load, when the app does not pass its own. */
		columnsKey?: string;
		/** Columns can be resized by dragging the edge of their header, or with the arrow keys when it has the focus. */
		resizable?: boolean;
		/** `always` shows the buttons of `actionsSnippet` on every row; `hover` only on the row under the pointer or with the focus inside, for dense tables (always on touch screens and in the cards). */
		actionsVisibility?: 'always' | 'hover';
		/** Below this width of the table, in pixels, every row is shown as a card. `false` keeps the table, which scrolls sideways. */
		cardBreakpoint?: number | false;
		/** Key of the column used as the title of the cards and as the name of the rows for screen readers. Defaults to the first visible column. */
		cardTitle?: string;
		/** Keys of the columns always shown in the cards, under the title; the other columns are behind a "Show more fields" button in each card. Defaults to the first 4 visible columns after the title. */
		cardColumns?: string[];
		/** Accessible name of the table, read by screen readers. */
		caption?: string;
		/** BCP 47 locale of the texts and of the formatting of numbers and dates: `it` and `en` texts are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Texts to change, on top of those of `locale`. `{row}`, `{index}` and `{column}` are replaced by the name of the row, its position and the label of the column. */
		labels?: {
			selectAll?: string;
			selectAllShort?: string;
			selectRow?: string;
			row?: string;
			expand?: string;
			collapse?: string;
			actions?: string;
			resize?: string;
			info?: string;
			open?: string;
			loading?: string;
			yes?: string;
			no?: string;
			sortBy?: string;
			unsorted?: string;
			moreFields?: string;
			fewerFields?: string;
			ascending?: string;
			descending?: string;
		};
		/** Classes of the parts: `container` the root, `table` the `<table>`, `header` the header cells, `row` the rows (and cards), `cell` the body cells. */
		class?: {
			container?: ClassValue;
			table?: ClassValue;
			header?: ClassValue;
			row?: ClassValue;
			cell?: ClassValue;
		};
		/** The `<table>` element, empty while the cards are shown. */
		tableElement?: HTMLTableElement;
		/** Content of the cells of `custom` columns, for the columns without a `cell` snippet. */
		cellSnippet?: Snippet<[{ row: Row; value: any; column: TableColumn<Row> }]>;
		/** Content of the detail row under an expanded row. */
		expandedSnippet?: Snippet<[{ row: Row }]>;
		/** Buttons of a row, in a column that stays on the right while the table scrolls sideways. */
		actionsSnippet?: Snippet<[{ row: Row }]>;
		/** Replaces `NoData` when there are no rows. */
		noDataSnippet?: Snippet;
		/** Above this number of rows only the rows in view, plus a margin, are in the page, so thousands of rows stay fast; the others are drawn while scrolling (the page, the app container or the table with `--table-max-height`). `true` always, `false` never. While it is on, the find of the browser and printing see only the drawn rows, and the columns keep the widths they had on the first rows. */
		virtualize?: boolean | number;
		/** Called when the last rows come into view (the third from the end), again when the rows change while they are still in view and when this callback changes: for loading the next rows. */
		onendreached?: () => void;
		/** Read-only table, for example while the app saves: rows are not clickable and sorting, selection and resizing are off. Expanding rows still works. */
		disabled?: boolean;
		/** With `selectable="multiple"`, shows the checkbox that selects every row (in the header, or above the cards). `false` keeps only the checkbox of each row. */
		selectAll?: boolean;
	}

	let {
		rows = [],
		columns,
		rowKey = 'id',
		sort = $bindable(),
		sorting = 'local',
		onsortchange,
		selectable,
		selected = $bindable(),
		selectedAll = $bindable(),
		excluded = $bindable(),
		onselectionchange,
		expanded = $bindable(),
		expandable,
		onexpandedchange,
		rowHref,
		onrowclick,
		rowClass,
		empty = '—',
		loading = false,
		loadingRows = 5,
		noDataTitle,
		columnState = $bindable(),
		oncolumnstatechange,
		columnsKey,
		resizable = false,
		actionsVisibility = 'always',
		cardBreakpoint = 640,
		cardTitle,
		cardColumns,
		caption,
		locale: localeProp,
		labels,
		class: clazz = {},
		tableElement = $bindable(),
		cellSnippet,
		expandedSnippet,
		actionsSnippet,
		noDataSnippet,
		virtualize = 200,
		onendreached,
		disabled = false,
		selectAll = true,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived({ ...libraryTexts(locale).table, ...labels });

	let rootNode = $state<HTMLDivElement>();
	let scrollNode = $state<HTMLDivElement>();
	let rootWidth = $state<number>();
	let cards = $derived(
		cardBreakpoint !== false && rootWidth !== undefined && rootWidth < cardBreakpoint
	);

	let resolved = $derived(visibleColumns(columns, columnState));
	let formatters = $derived(
		new Map(resolved.map((entry) => [entry.column.key, cellFormatter(entry.column, locale)]))
	);
	let shownRows = $derived(sorting === 'local' ? sortRows(rows, columns, sort, locale) : rows);
	let titleColumn = $derived(
		(resolved.find((entry) => entry.column.key === cardTitle) ?? resolved[0])?.column
	);
	let cardFields = $derived.by(() => {
		const fields = resolved.map((entry) => entry.column).filter((column) => column !== titleColumn);
		const main = cardColumns
			? fields.filter((column) => cardColumns.includes(column.key))
			: fields.slice(0, CARD_FIELDS);
		const more = fields.filter((column) => !main.includes(column));
		return more.length > 1 ? { main, more } : { main: fields, more: [] };
	});
	const openCards = new SvelteSet<string | number>();
	let hasFooter = $derived(resolved.some((entry) => entry.column.footer !== undefined));
	let showEmpty = $derived(!loading && rows.length === 0);
	let clickable = $derived(!disabled && (!!onrowclick || !!rowHref));
	let focusable = $derived(!disabled && !!onrowclick);
	let showSelectAll = $derived(selectable === 'multiple' && selectAll);
	let showSkeleton = $derived(loading && rows.length === 0);

	let selection: Selection<Row> = $derived({
		selected: selected ?? [],
		selectedAll: selectedAll ?? false,
		excluded: excluded ?? []
	});
	let isSelected = $derived(selectionChecker(selection, rowKey));
	let pageState = $derived(pageSelectionState(shownRows, isSelected));
	let anchor: string | number | undefined;

	let expandedKeys = $derived(new Set(expanded ?? []));

	let virtualOn = $derived(
		virtualize === true || (typeof virtualize === 'number' && shownRows.length > virtualize)
	);
	let bodyNode = $state<HTMLElement>();
	let range = $state<RowRange>();
	let rowWindow = $state.raw<ReturnType<typeof createRowWindow>>();
	let lockedWidths = $state<Record<string, number>>();
	const partSizes = new Map<string | number, { main: number; detail: number }>();
	let estimated = false;
	let windowStart = $derived(virtualOn && range ? Math.min(range.start, shownRows.length) : 0);
	let windowEnd = $derived(
		!virtualOn
			? shownRows.length
			: range
				? Math.min(range.end + 1, shownRows.length)
				: Math.min(FIRST_WINDOW, shownRows.length)
	);
	let windowRows = $derived(virtualOn ? shownRows.slice(windowStart, windowEnd) : shownRows);
	let spaceBefore = $derived(virtualOn && range ? range.before : 0);
	let spaceAfter = $derived(
		!virtualOn
			? 0
			: range
				? range.after
				: (shownRows.length - windowEnd) * (cards ? CARD_ESTIMATE : ROW_ESTIMATE)
	);
	let cardGap = $state(0);
	let endTarget = $derived(Math.max(0, shownRows.length - 3));
	let nearEnd = $derived(virtualOn && !!range && range.end >= endTarget);

	let measured = $state<Record<string, number>>({});
	let liveWidths = $state<Record<string, number>>({});
	let resizing = $state<string>();
	let actionsWidth = $state<number>();
	let overflowStart = $state(false);
	let viewWidth = $state<number>();
	let scrolling = $state(false);
	let overflowEnd = $state(false);
	let infoButtons = $state<Record<string, HTMLButtonElement>>({});
	const headerCells: Record<string, HTMLTableCellElement> = {};

	function widthOf(entry: ResolvedColumn<Row>) {
		return (
			liveWidths[entry.column.key] ??
			entry.width ??
			(virtualOn && !cards ? lockedWidths?.[entry.column.key] : undefined)
		);
	}

	let fixedLayout = $derived(!cards && resolved.some((entry) => widthOf(entry) !== undefined));
	let anyPinned = $derived(resolved.some((entry) => entry.pinned));
	let pinnedWidth = $derived(
		[
			...(selectable ? [SELECT_KEY] : []),
			...(expandedSnippet ? [EXPAND_KEY] : []),
			...resolved.filter((entry) => entry.pinned).map((entry) => entry.column.key)
		].reduce((sum, key) => sum + (measured[key] ?? 0), actionsSnippet ? (actionsWidth ?? 0) : 0)
	);
	let pinsOff = $derived(
		anyPinned && scrolling && viewWidth !== undefined && pinnedWidth > viewWidth / 2
	);
	let pinsOn = $derived(anyPinned && !pinsOff);
	let stickyKeys = $derived(
		pinsOn
			? [
					...(selectable ? [SELECT_KEY] : []),
					...(expandedSnippet ? [EXPAND_KEY] : []),
					...resolved.filter((entry) => entry.pinned).map((entry) => entry.column.key)
				]
			: []
	);
	let offsets = $derived.by(() => {
		const result: Record<string, number> = {};
		let left = 0;
		for (const key of stickyKeys) {
			result[key] = left;
			left += measured[key] ?? 0;
		}
		return result;
	});
	let lastSticky = $derived(stickyKeys.at(-1));
	let columnCount = $derived(
		(selectable ? 1 : 0) +
			(expandedSnippet ? 1 : 0) +
			resolved.length +
			(actionsSnippet ? 1 : 0) +
			(fixedLayout ? 1 : 0)
	);

	let sortItems = $derived([
		{ value: '', label: texts.unsorted },
		...resolved
			.filter((entry) => entry.column.sortable)
			.flatMap((entry) => {
				const label = entry.column.label ?? entry.column.key;
				return [
					{ value: `asc:${entry.column.key}`, label: texts.ascending.replace('{column}', label) },
					{ value: `desc:${entry.column.key}`, label: texts.descending.replace('{column}', label) }
				];
			})
	]);

	onMount(() => {
		if (columnState !== undefined || !columnsKey) return;
		try {
			const saved = JSON.parse(localStorage.getItem(columnsKey) ?? 'null');
			if (isColumnState(saved)) columnState = saved;
		} catch {
			return;
		}
	});

	function observeSize(node: Element, update: (width: number) => void) {
		let frame = 0;
		const observer = new ResizeObserver(([entry]) => {
			const width = entry.borderBoxSize?.[0]?.inlineSize ?? node.getBoundingClientRect().width;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => update(width));
		});
		observer.observe(node);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}

	$effect(() => {
		if (!rootNode) return;
		return observeSize(rootNode, (width) => {
			if (rootWidth === undefined || Math.abs(rootWidth - width) >= 0.5) rootWidth = width;
		});
	});

	$effect(() => {
		const node = scrollNode;
		if (!node) return;
		const update = () => {
			const start = Math.abs(node.scrollLeft);
			const nextStart = start > 1;
			const nextEnd = start + node.clientWidth < node.scrollWidth - 1;
			const nextScrolling = node.scrollWidth > node.clientWidth + 1;
			if (viewWidth !== node.clientWidth) viewWidth = node.clientWidth;
			if (scrolling !== nextScrolling) scrolling = nextScrolling;
			if (overflowStart !== nextStart) overflowStart = nextStart;
			if (overflowEnd !== nextEnd) overflowEnd = nextEnd;
		};
		update();
		let frame = 0;
		const observer = new ResizeObserver(() => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(update);
		});
		observer.observe(node);
		if (node.firstElementChild) observer.observe(node.firstElementChild);
		node.addEventListener('scroll', update, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			node.removeEventListener('scroll', update);
		};
	});

	function measure(key: string) {
		return (node: HTMLElement) => {
			if (key !== SELECT_KEY && key !== EXPAND_KEY) headerCells[key] = node as HTMLTableCellElement;
			const stop = observeSize(node, (width) => {
				if (Math.abs((measured[key] ?? -1) - width) >= 0.5) measured[key] = width;
			});
			return () => {
				stop();
				if (headerCells[key] === node) delete headerCells[key];
			};
		};
	}

	function measureActions(node: HTMLElement) {
		const cell = node.parentElement!;
		return observeSize(node, (width) => {
			const style = getComputedStyle(cell);
			const total = width + parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd);
			if (actionsWidth === undefined || Math.abs(actionsWidth - total) >= 0.5) actionsWidth = total;
		});
	}

	$effect(() => {
		if (!virtualOn || !bodyNode || !rootNode) return;
		const body = bodyNode;
		const gap = cards ? parseFloat(getComputedStyle(body).rowGap) || 0 : 0;
		cardGap = gap;
		estimated = false;
		const windowed = createRowWindow({
			body,
			scroller: scrollParent(rootNode, cards ? undefined : scrollNode),
			count: untrack(() => shownRows.length),
			estimate: cards ? CARD_ESTIMATE : ROW_ESTIMATE,
			gap,
			key: (index) => keyOf(untrack(() => shownRows)[index], rowKey),
			onChange: (next) => {
				const current = untrack(() => range);
				if (
					!current ||
					current.start !== next.start ||
					current.end !== next.end ||
					Math.abs(current.before - next.before) >= 0.5 ||
					Math.abs(current.after - next.after) >= 0.5
				)
					range = next;
			}
		});
		rowWindow = windowed;
		return () => {
			windowed.destroy();
			rowWindow = undefined;
			range = undefined;
		};
	});

	$effect(() => {
		const count = shownRows.length;
		rowWindow?.update({ count, key: (index) => keyOf(untrack(() => shownRows)[index], rowKey) });
	});

	let lockBasis: { width: number; columns: ResolvedColumn<Row>[] } | undefined;

	$effect(() => {
		const width = rootWidth;
		const columnsNow = resolved;
		untrack(() => {
			if (!lockedWidths || !lockBasis) return;
			if (Math.abs((width ?? 0) - lockBasis.width) >= 1 || columnsNow !== lockBasis.columns) lockedWidths = undefined;
		});
	});

	$effect(() => {
		if (!virtualOn || cards || lockedWidths || resizing || rootWidth === undefined) return;
		const frame = requestAnimationFrame(() => {
			const widths: Record<string, number> = {};
			const columnsNow = untrack(() => resolved);
			for (const key of [...columnsNow.map((entry) => entry.column.key), ACTIONS_KEY]) {
				const cell = headerCells[key];
				if (cell) widths[key] = cell.getBoundingClientRect().width;
			}
			lockBasis = { width: untrack(() => rootWidth) ?? 0, columns: columnsNow };
			lockedWidths = widths;
		});
		return () => cancelAnimationFrame(frame);
	});

	$effect(() => {
		const callback = onendreached;
		if (!callback || !shownRows.length) return;
		if (virtualOn) {
			if (nearEnd) untrack(callback);
			return;
		}
		const node = bodyNode?.querySelector(`:scope > [data-index="${endTarget}"]`);
		if (!node) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) callback();
		});
		observer.observe(node);
		return () => observer.disconnect();
	});

	function measureRow(index: number, part: 'main' | 'detail') {
		return (node: HTMLElement) => {
			const key = untrack(() => keyOf(shownRows[index], rowKey));
			let frame = 0;
			const report = () => {
				const height = node.getBoundingClientRect().height;
				const entry = partSizes.get(key) ?? { main: 0, detail: 0 };
				entry[part] = height;
				partSizes.set(key, entry);
				if (part === 'main' && !estimated && height > 0) {
					estimated = true;
					rowWindow?.update({
						count: untrack(() => shownRows.length),
						key: (at) => keyOf(untrack(() => shownRows)[at], rowKey),
						estimate: height
					});
				}
				rowWindow?.resize(index, entry.main + entry.detail);
			};
			const observer = new ResizeObserver(() => {
				cancelAnimationFrame(frame);
				frame = requestAnimationFrame(report);
			});
			observer.observe(node);
			return () => {
				cancelAnimationFrame(frame);
				observer.disconnect();
				const entry = partSizes.get(key);
				if (part === 'detail' && entry && !untrack(() => expandedKeys.has(key))) {
					entry.detail = 0;
					rowWindow?.resize(index, entry.main);
				}
			};
		};
	}

	function rowName(row: Row, index: number) {
		const column = titleColumn;
		const value = column ? cellValue(row, column) : undefined;
		if (!column || isEmptyValue(value) || typeof value === 'object') {
			return texts.row.replace('{index}', String(index + 1));
		}
		return formatters.get(column.key)?.(value, row) ?? String(value);
	}

	function changeSort(next: TableSort | undefined) {
		sort = next;
		onsortchange?.({ sort: next });
	}

	function pickSortItem(value: string | number | undefined) {
		const [direction, ...key] = String(value ?? '').split(':');
		changeSort(
			direction === 'asc' || direction === 'desc'
				? { key: key.join(':'), direction }
				: undefined
		);
	}

	function commitSelection(next: Selection<Row>) {
		selected = next.selected;
		selectedAll = next.selectedAll;
		excluded = next.excluded;
		onselectionchange?.(next);
	}

	function toggleRow(row: Row, event: MouseEvent) {
		const key = keyOf(row, rowKey);
		if (selectable === 'single') {
			commitSelection({ selected: isSelected(row) ? [] : [row], selectedAll: false, excluded: [] });
			return;
		}
		const on = !isSelected(row);
		const targets =
			event.shiftKey && anchor !== undefined ? rowRange(shownRows, anchor, key, rowKey) : [row];
		commitSelection(setRowsSelected(selection, targets.length ? targets : [row], on, rowKey));
		anchor = key;
	}

	function toggleAll() {
		if (pageState !== 'all') {
			commitSelection(setRowsSelected(selection, shownRows, true, rowKey));
		} else if (selection.selectedAll) {
			commitSelection({ selected: [], selectedAll: false, excluded: [] });
		} else {
			commitSelection(setRowsSelected(selection, shownRows, false, rowKey));
		}
	}

	function canExpand(row: Row) {
		return !!expandedSnippet && (expandable?.(row) ?? true);
	}

	function toggleExpanded(row: Row) {
		const key = keyOf(row, rowKey);
		const next = expandedKeys.has(key)
			? (expanded ?? []).filter((item) => item !== key)
			: [...(expanded ?? []), key];
		expanded = next;
		onexpandedchange?.({ expanded: next });
	}

	function fromInteractive(event: Event) {
		const row = event.currentTarget as HTMLElement;
		const target = (event.target as Element | null)?.closest?.(INTERACTIVE);
		return !!target && target !== row && row.contains(target);
	}

	function hasTextSelection(node: HTMLElement) {
		const current = window.getSelection();
		return !!current && !current.isCollapsed && node.contains(current.anchorNode);
	}

	function activate(row: Row, event: MouseEvent) {
		if (fromInteractive(event)) return;
		const node = event.currentTarget as HTMLElement;
		if (event.type === 'click' && hasTextSelection(node)) return;
		onrowclick?.(row, event);
		const href = rowHref?.(row);
		if (!href || event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey || event.button === 1) {
			window.open(href, '_blank', 'noopener');
			return;
		}
		node.querySelector<HTMLAnchorElement>('.aurora-table-row-link')?.click();
	}

	function auxActivate(row: Row, event: MouseEvent) {
		if (event.button === 1 && rowHref) activate(row, event);
	}

	function keyActivate(row: Row, event: KeyboardEvent) {
		if (!onrowclick || event.target !== event.currentTarget) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onrowclick(row, event);
	}

	function commitColumnState(next: TableColumnState[]) {
		columnState = next;
		oncolumnstatechange?.({ columnState: next });
		if (!columnsKey) return;
		try {
			localStorage.setItem(columnsKey, JSON.stringify(next));
		} catch {
			return;
		}
	}

	function currentWidths() {
		const result: Record<string, number> = {};
		for (const entry of resolved) {
			const width =
				widthOf(entry) ?? headerCells[entry.column.key]?.getBoundingClientRect().width;
			if (width !== undefined) result[entry.column.key] = width;
		}
		return result;
	}

	function limits(key: string) {
		const cell = headerCells[key];
		if (!cell) return [MIN_WIDTH, Infinity];
		const style = getComputedStyle(cell);
		const min = Math.max(MIN_WIDTH, parseFloat(style.minWidth) || 0);
		const max = style.maxWidth.endsWith('px') ? parseFloat(style.maxWidth) : Infinity;
		return [min, Math.max(min, max)];
	}

	function clampWidth(key: string, width: number) {
		const [min, max] = limits(key);
		return Math.min(max, Math.max(min, width));
	}

	function startResize(key: string, event: PointerEvent) {
		if (event.button !== 0) return;
		event.preventDefault();
		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
		const base = currentWidths();
		const startX = event.clientX;
		const start = base[key] ?? MIN_WIDTH;
		const direction = rootNode && getComputedStyle(rootNode).direction === 'rtl' ? -1 : 1;
		liveWidths = base;
		resizing = key;

		const move = (moveEvent: PointerEvent) => {
			liveWidths[key] = clampWidth(key, start + direction * (moveEvent.clientX - startX));
		};
		const end = () => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', end);
			handle.removeEventListener('pointercancel', end);
			const widths = { ...liveWidths };
			resizing = undefined;
			liveWidths = {};
			commitColumnState(withWidths(fullColumnState(columns, columnState), widths));
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', end);
		handle.addEventListener('pointercancel', end);
	}

	function keyResize(key: string, event: KeyboardEvent) {
		const rtl = rootNode && getComputedStyle(rootNode).direction === 'rtl';
		const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
		if (!(event.key in steps)) return;
		event.preventDefault();
		const step = steps[event.key] * (rtl ? -1 : 1) * (event.shiftKey ? 50 : 10);
		const widths = currentWidths();
		widths[key] = clampWidth(key, (widths[key] ?? MIN_WIDTH) + step);
		commitColumnState(withWidths(fullColumnState(columns, columnState), widths));
	}

	function actionsColWidth() {
		const locked = virtualOn && !cards ? lockedWidths?.[ACTIONS_KEY] : undefined;
		const width = locked ?? actionsWidth;
		return fixedLayout && width ? `${width}px` : undefined;
	}

	function keepHeader(key: string) {
		return (node: HTMLTableCellElement) => {
			headerCells[key] = node;
			return () => {
				if (headerCells[key] === node) delete headerCells[key];
			};
		};
	}

	function colWidth(entry: ResolvedColumn<Row>) {
		const width = widthOf(entry);
		return width !== undefined ? `${width}px` : entry.column.width;
	}

	function stickyStart(key: string) {
		return key in offsets ? `${offsets[key]}px` : undefined;
	}
</script>

{#snippet headerLabel(column: TableColumn<Row>)}
	{#if column.header}
		{@render column.header({ column })}
	{:else}
		{column.label ?? ''}
	{/if}
{/snippet}

{#snippet cellContent(row: Row, column: TableColumn<Row>, card = false)}
	{@const value = cellValue(row, column)}
	{#if column.cell}
		{@render column.cell({ row, value, column })}
	{:else if column.type === 'custom' && cellSnippet}
		{@render cellSnippet({ row, value, column })}
	{:else if isEmptyValue(value)}
		<span class="aurora-table-empty">{column.empty ?? empty}</span>
	{:else if column.type === 'boolean' && !column.format}
		{#if value}
			<Icon path={CHECK_ICON} title={texts.yes} class="aurora-table-boolean" />
		{:else}
			<span class={card ? 'aurora-table-empty' : 'aurora-table-visually-hidden'}>{texts.no}</span>
		{/if}
	{:else}
		{formatters.get(column.key)?.(value, row)}
	{/if}
{/snippet}

{#snippet rowLink(row: Row, index: number)}
	{@const href = disabled ? undefined : rowHref?.(row)}
	{#if href}
		<a class="aurora-table-row-link" {href} tabindex={onrowclick ? -1 : undefined}>
			{rowName(row, index)}
		</a>
	{/if}
{/snippet}

{#snippet rowCheckbox(row: Row, index: number)}
	<Checkbox
		checked={isSelected(row)}
		{disabled}
		aria-label={texts.selectRow.replace('{row}', rowName(row, index))}
		onclick={(event: MouseEvent) => toggleRow(row, event)}
	/>
{/snippet}

{#snippet expandButton(row: Row, index: number, withText: boolean)}
	{@const open = expandedKeys.has(keyOf(row, rowKey))}
	<button
		type="button"
		class="aurora-table-expand"
		aria-expanded={open}
		aria-controls={open ? `${uid}-detail-${index}` : undefined}
		aria-label={withText ? undefined : open ? texts.collapse : texts.expand}
		onclick={() => toggleExpanded(row)}
	>
		<Icon path={EXPAND_ICON} />
		{#if withText}<span>{open ? texts.collapse : texts.expand}</span>{/if}
	</button>
{/snippet}

{#snippet cardFieldList(row: Row, fields: TableColumn<Row>[], id?: string)}
	<dl class="aurora-table-card-fields" {id}>
		{#each fields as column (column.key)}
			<div class={['aurora-table-card-field', clazz.cell]} data-type={column.type ?? 'text'}>
				<dt>{@render headerLabel(column)}</dt>
				<dd>{@render cellContent(row, column, true)}</dd>
			</div>
		{/each}
	</dl>
{/snippet}

{#snippet footerContent(column: TableColumn<Row>)}
	{#if typeof column.footer === 'function'}
		{@render column.footer({ rows, column })}
	{:else}
		{column.footer ?? ''}
	{/if}
{/snippet}

<div
	{...rest}
	bind:this={rootNode}
	class={['aurora-table', clazz.container]}
	data-cards={cards || undefined}
	data-loading={loading || undefined}
	data-disabled={disabled || undefined}
	data-resizing={resizing ? '' : undefined}
	data-actions-visibility={actionsSnippet ? actionsVisibility : undefined}
	data-pins-off={!cards && pinsOff ? '' : undefined}
	data-overflow-start={!cards && overflowStart ? '' : undefined}
	data-overflow-end={!cards && overflowEnd ? '' : undefined}
>
	{#if cards}
		{#if (showSelectAll && rows.length) || sortItems.length > 1}
			<div class="aurora-table-cards-bar">
				{#if showSelectAll && rows.length}
					<Checkbox
						label={texts.selectAllShort}
						{disabled}
						checked={pageState === 'all'}
						indeterminate={pageState === 'some'}
						onclick={toggleAll}
					/>
				{/if}
				{#if sortItems.length > 1}
					<Select
						class={{ container: 'aurora-table-cards-sort' }}
						aria-label={texts.sortBy}
						{disabled}
						items={sortItems}
						bind:value={
							() => (sort ? `${sort.direction}:${sort.key}` : ''), (value) => pickSortItem(value)
						}
					/>
				{/if}
			</div>
		{/if}
		{#if caption}<p class="aurora-table-visually-hidden" id="{uid}-caption">{caption}</p>{/if}
		<ul
			bind:this={bodyNode}
			class="aurora-table-cards"
			aria-busy={loading || undefined}
			aria-labelledby={caption ? `${uid}-caption` : undefined}
		>
			{#if showSkeleton}
				{#each { length: loadingRows }, index (index)}
					<li class="aurora-table-card" aria-hidden="true">
						<Skeleton shape="text" lines={3} />
					</li>
				{/each}
			{/if}
			{#if spaceBefore > cardGap}
				<li class="aurora-table-spacer" aria-hidden="true" style:height="{spaceBefore - cardGap}px"></li>
			{/if}
			{#each windowRows as row, position (keyOf(row, rowKey))}
				{@const index = windowStart + position}
				{@const key = keyOf(row, rowKey)}
				{@const open = expandedKeys.has(key)}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<li
					{@attach virtualOn ? measureRow(index, 'main') : undefined}
					data-index={index}
					class={['aurora-table-card', clazz.row, rowClass?.(row)]}
					data-selected={isSelected(row) || undefined}
					data-expanded={open || undefined}
					data-clickable={clickable ? '' : undefined}
					tabindex={focusable ? 0 : undefined}
					onclick={clickable ? (event) => activate(row, event) : undefined}
					onauxclick={clickable && rowHref ? (event) => auxActivate(row, event) : undefined}
					onkeydown={focusable ? (event) => keyActivate(row, event) : undefined}
				>
					<div class="aurora-table-card-head">
						{#if selectable}{@render rowCheckbox(row, index)}{/if}
						<div class="aurora-table-card-title">
							{@render rowLink(row, index)}
							{#if titleColumn}{@render cellContent(row, titleColumn)}{/if}
						</div>
						{#if actionsSnippet}
							<div class="aurora-table-card-actions">{@render actionsSnippet({ row })}</div>
						{/if}
					</div>
					{#if cardFields.main.length}
						{@render cardFieldList(row, cardFields.main)}
					{/if}
					{#if cardFields.more.length}
						{@const more = openCards.has(key)}
						{#if more}
							{@render cardFieldList(row, cardFields.more, `${uid}-more-${index}`)}
						{/if}
						<button
							type="button"
							class="aurora-table-expand aurora-table-card-more"
							aria-expanded={more}
							aria-controls={more ? `${uid}-more-${index}` : undefined}
							onclick={() => (more ? openCards.delete(key) : openCards.add(key))}
						>
							<Icon path={EXPAND_ICON} />
							<span>
								{more
									? texts.fewerFields
									: texts.moreFields.replace('{count}', String(cardFields.more.length))}
							</span>
						</button>
					{/if}
					{#if canExpand(row)}
						{@render expandButton(row, index, true)}
						{#if open}
							<div class="aurora-table-card-detail" id="{uid}-detail-{index}">
								{@render expandedSnippet?.({ row })}
							</div>
						{/if}
					{/if}
				</li>
			{/each}
			{#if spaceAfter > cardGap}
				<li class="aurora-table-spacer" aria-hidden="true" style:height="{spaceAfter - cardGap}px"></li>
			{/if}
		</ul>
		{#if showEmpty}
			<div class="aurora-table-no-data">
				{#if noDataSnippet}
					{@render noDataSnippet()}
				{:else}
					<NoData size="sm" title={noDataTitle} {locale} />
				{/if}
			</div>
		{/if}
		{#if hasFooter && rows.length}
			<dl class="aurora-table-card-footer">
				{#each resolved as entry (entry.column.key)}
					{#if entry.column.footer !== undefined}
						<div class="aurora-table-card-field" data-type={entry.column.type ?? 'text'}>
							<dt>{@render headerLabel(entry.column)}</dt>
							<dd>{@render footerContent(entry.column)}</dd>
						</div>
					{/if}
				{/each}
			</dl>
		{/if}
	{:else}
		<div class="aurora-table-scroll" bind:this={scrollNode}>
			<table
				bind:this={tableElement}
				class={['aurora-table-table', clazz.table]}
				data-fixed={fixedLayout || undefined}
				aria-busy={loading || undefined}
			>
				{#if caption}<caption class="aurora-table-visually-hidden">{caption}</caption>{/if}
				<colgroup>
					{#if selectable}<col class="aurora-table-control-col" />{/if}
					{#if expandedSnippet}<col class="aurora-table-control-col" />{/if}
					{#each resolved as entry (entry.column.key)}
						<col style:width={colWidth(entry)} />
					{/each}
					{#if actionsSnippet}
						<col style:width={actionsColWidth()} />
					{/if}
					{#if fixedLayout}<col />{/if}
				</colgroup>
				<thead>
					<tr>
						{#if selectable}
							<th
								{@attach measure(SELECT_KEY)}
								class={['aurora-table-control', clazz.header]}
								data-pinned={pinsOn || undefined}
								data-pinned-last={lastSticky === SELECT_KEY || undefined}
								style:inset-inline-start={stickyStart(SELECT_KEY)}
							>
								{#if showSelectAll}
									<Checkbox
										checked={pageState === 'all'}
										indeterminate={pageState === 'some'}
										disabled={disabled || !rows.length}
										aria-label={texts.selectAll}
										onclick={toggleAll}
									/>
								{/if}
							</th>
						{/if}
						{#if expandedSnippet}
							<th
								{@attach measure(EXPAND_KEY)}
								class={['aurora-table-control', clazz.header]}
								data-pinned={pinsOn || undefined}
								data-pinned-last={lastSticky === EXPAND_KEY || undefined}
								style:inset-inline-start={stickyStart(EXPAND_KEY)}
							>
								<span class="aurora-table-visually-hidden">{texts.expand}</span>
							</th>
						{/if}
						{#each resolved as entry (entry.column.key)}
							{@const column = entry.column}
							{@const sorted = sort?.key === column.key ? sort.direction : undefined}
							<th
								{@attach measure(column.key)}
								scope="col"
								class={['aurora-table-header', clazz.header]}
								aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
								data-align={columnAlign(column)}
								data-sortable={column.sortable || undefined}
								data-sorted={sorted}
								data-pinned={(pinsOn && entry.pinned) || undefined}
								data-pinned-last={lastSticky === column.key || undefined}
								style:inset-inline-start={stickyStart(column.key)}
								style:min-width={column.minWidth}
								style:max-width={column.maxWidth}
							>
								<div class="aurora-table-header-content">
									{#if column.sortable}
										<button
											type="button"
											class="aurora-table-sort"
											{disabled}
											onclick={() => changeSort(nextSort(sort, column.key))}
										>
											<span class="aurora-table-header-label">{@render headerLabel(column)}</span>
											<Icon path={SORT_ICON} class="aurora-table-sort-icon" />
										</button>
									{:else}
										<span class="aurora-table-header-label">{@render headerLabel(column)}</span>
									{/if}
									{#if column.info}
										<button
											type="button"
											class="aurora-table-info"
											aria-label={texts.info.replace('{column}', column.label ?? column.key)}
											bind:this={infoButtons[column.key]}
										>
											<Icon path={INFO_ICON} />
										</button>
										<Tooltip activator={infoButtons[column.key]} text={column.info} />
									{/if}
								</div>
								{#if resizable && column.resizable !== false && !disabled}
									<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
									<div
										class="aurora-table-resizer"
										role="separator"
										tabindex="0"
										aria-orientation="vertical"
										aria-label={texts.resize.replace('{column}', column.label ?? column.key)}
										aria-valuenow={Math.round(widthOf(entry) ?? measured[column.key] ?? 0)}
										aria-valuemin={MIN_WIDTH}
										data-active={resizing === column.key || undefined}
										onpointerdown={(event) => startResize(column.key, event)}
										onkeydown={(event) => keyResize(column.key, event)}
									></div>
								{/if}
							</th>
						{/each}
						{#if actionsSnippet}
							<th {@attach keepHeader(ACTIONS_KEY)} class={['aurora-table-actions', clazz.header]}>
								<span class="aurora-table-visually-hidden">{texts.actions}</span>
							</th>
						{/if}
						{#if fixedLayout}<th class="aurora-table-filler" aria-hidden="true"></th>{/if}
					</tr>
					{#if loading && rows.length}
						<tr class="aurora-table-progress-row" aria-hidden="true">
							<td colspan={columnCount}><div class="aurora-table-progress"></div></td>
						</tr>
					{/if}
				</thead>
				<tbody bind:this={bodyNode}>
					{#if showSkeleton}
						{#each { length: loadingRows }, index (index)}
							<tr class="aurora-table-row aurora-table-skeleton-row" aria-hidden="true">
								{#if selectable}<td class="aurora-table-control"></td>{/if}
								{#if expandedSnippet}<td class="aurora-table-control"></td>{/if}
								{#each resolved as entry (entry.column.key)}
									<td class="aurora-table-cell"><Skeleton shape="text" /></td>
								{/each}
								{#if actionsSnippet}<td class="aurora-table-actions"></td>{/if}
								{#if fixedLayout}<td class="aurora-table-filler"></td>{/if}
							</tr>
						{/each}
					{:else if showEmpty}
						<tr class="aurora-table-no-data-row">
							<td colspan={columnCount}>
								{#if noDataSnippet}
									{@render noDataSnippet()}
								{:else}
									<NoData size="sm" title={noDataTitle} {locale} />
								{/if}
							</td>
						</tr>
					{/if}
					{#if spaceBefore > 0}
						<tr class="aurora-table-spacer" aria-hidden="true" style:height="{spaceBefore}px">
							<td colspan={columnCount}></td>
						</tr>
					{/if}
					{#each windowRows as row, position (keyOf(row, rowKey))}
						{@const index = windowStart + position}
						{@const key = keyOf(row, rowKey)}
						{@const open = expandedKeys.has(key)}
						<tr
							{@attach virtualOn ? measureRow(index, 'main') : undefined}
							data-index={index}
							class={['aurora-table-row', clazz.row, rowClass?.(row)]}
							data-selected={isSelected(row) || undefined}
							data-expanded={open || undefined}
							data-clickable={clickable ? '' : undefined}
							tabindex={focusable ? 0 : undefined}
							onclick={clickable ? (event) => activate(row, event) : undefined}
							onauxclick={clickable && rowHref ? (event) => auxActivate(row, event) : undefined}
							onkeydown={focusable ? (event) => keyActivate(row, event) : undefined}
						>
							{#if selectable}
								<td
									class="aurora-table-control"
									data-pinned={pinsOn || undefined}
									data-pinned-last={lastSticky === SELECT_KEY || undefined}
									style:inset-inline-start={stickyStart(SELECT_KEY)}
								>
									{@render rowCheckbox(row, index)}
								</td>
							{/if}
							{#if expandedSnippet}
								<td
									class="aurora-table-control"
									data-pinned={pinsOn || undefined}
									data-pinned-last={lastSticky === EXPAND_KEY || undefined}
									style:inset-inline-start={stickyStart(EXPAND_KEY)}
								>
									{#if canExpand(row)}{@render expandButton(row, index, false)}{/if}
								</td>
							{/if}
							{#each resolved as entry, columnIndex (entry.column.key)}
								{@const column = entry.column}
								<td
									class={['aurora-table-cell', clazz.cell]}
									data-type={column.type ?? 'text'}
									data-align={columnAlign(column)}
									data-pinned={(pinsOn && entry.pinned) || undefined}
									data-pinned-last={lastSticky === column.key || undefined}
									style:inset-inline-start={stickyStart(column.key)}
									style:min-width={column.minWidth}
									style:max-width={column.maxWidth}
								>
									{#if columnIndex === 0}{@render rowLink(row, index)}{/if}
									{@render cellContent(row, column)}
								</td>
							{/each}
							{#if actionsSnippet}
								<td class="aurora-table-actions">
									{#if position === 0}
										<div class="aurora-table-actions-content" {@attach measureActions}>
											{@render actionsSnippet({ row })}
										</div>
									{:else}
										<div class="aurora-table-actions-content">{@render actionsSnippet({ row })}</div>
									{/if}
								</td>
							{/if}
							{#if fixedLayout}<td class="aurora-table-filler"></td>{/if}
						</tr>
						{#if open && canExpand(row)}
							<tr
								{@attach virtualOn ? measureRow(index, 'detail') : undefined}
								class="aurora-table-detail-row"
								data-selected={isSelected(row) || undefined}
							>
								<td colspan={columnCount} id="{uid}-detail-{index}">
									{@render expandedSnippet?.({ row })}
								</td>
							</tr>
						{/if}
					{/each}
					{#if spaceAfter > 0}
						<tr class="aurora-table-spacer" aria-hidden="true" style:height="{spaceAfter}px">
							<td colspan={columnCount}></td>
						</tr>
					{/if}
				</tbody>
				{#if hasFooter && rows.length}
					<tfoot>
						<tr>
							{#if selectable}
								<td
									class="aurora-table-control"
									data-pinned={pinsOn || undefined}
									style:inset-inline-start={stickyStart(SELECT_KEY)}
								></td>
							{/if}
							{#if expandedSnippet}
								<td
									class="aurora-table-control"
									data-pinned={pinsOn || undefined}
									style:inset-inline-start={stickyStart(EXPAND_KEY)}
								></td>
							{/if}
							{#each resolved as entry (entry.column.key)}
								<td
									class="aurora-table-cell"
									data-type={entry.column.type ?? 'text'}
									data-align={columnAlign(entry.column)}
									data-pinned={(pinsOn && entry.pinned) || undefined}
									data-pinned-last={lastSticky === entry.column.key || undefined}
									style:inset-inline-start={stickyStart(entry.column.key)}
								>
									{@render footerContent(entry.column)}
								</td>
							{/each}
							{#if actionsSnippet}<td class="aurora-table-actions"></td>{/if}
							{#if fixedLayout}<td class="aurora-table-filler"></td>{/if}
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-table {
			--_focus-ring: var(--table-focus-ring-width, var(--table-default-focus-ring-width)) solid
				var(--table-focus-ring-color, var(--table-default-focus-ring-color));
			--_table-bg: var(--table-background, var(--table-default-background));
			--_separator: var(--global-border-width) solid
				var(--table-separator-color, var(--table-default-separator-color));
			--_duration: var(--table-duration, var(--table-default-duration));
			--_easing: var(--table-easing, var(--table-default-easing));

			box-sizing: border-box;
			position: relative;
			width: var(--table-width, var(--table-default-width));
			min-width: 0;
			color: var(--table-color, var(--table-default-color));
			font-size: var(--table-font-size, var(--table-default-font-size));
		}

		.aurora-table:not([data-cards]) {
			overflow: hidden;
			border: var(--table-border, var(--table-default-border));
			border-radius: var(--table-border-radius, var(--table-default-border-radius));
			background: var(--_table-bg);
		}

		.aurora-table[data-resizing] {
			cursor: col-resize;
			user-select: none;
		}

		.aurora-table-scroll {
			max-height: var(--table-max-height, var(--table-default-max-height));
			overflow: auto;
		}

		.aurora-table-table {
			width: 100%;
			border-collapse: separate;
			border-spacing: 0;
		}

		.aurora-table-table[data-fixed] {
			table-layout: fixed;
		}

		.aurora-table-table thead {
			position: sticky;
			top: 0;
			z-index: 2;
		}

		.aurora-table-table th {
			--_header-bg: var(--table-header-background, var(--table-default-header-background));

			box-sizing: border-box;
			position: relative;
			padding: var(--table-header-padding, var(--table-default-header-padding));
			border-bottom: var(--_separator);
			background: linear-gradient(var(--_header-bg), var(--_header-bg)), var(--_table-bg);
			color: var(--table-header-color, var(--table-default-header-color));
			font-size: var(--table-header-font-size, var(--table-default-header-font-size));
			font-weight: var(--table-header-font-weight, var(--table-default-header-font-weight));
			letter-spacing: var(--table-header-letter-spacing, var(--table-default-header-letter-spacing));
			text-align: start;
			text-transform: var(
				--table-header-text-transform,
				var(--table-default-header-text-transform)
			);
			white-space: nowrap;
			vertical-align: middle;
		}

		.aurora-table-table th[data-sorted] {
			color: var(--table-header-sorted-color, var(--table-default-header-sorted-color));
		}

		.aurora-table-header-content {
			display: flex;
			align-items: center;
			gap: 4px;
			min-width: 0;
		}

		.aurora-table-header[data-align='end'] .aurora-table-header-content {
			justify-content: flex-end;
		}

		.aurora-table-header[data-align='center'] .aurora-table-header-content {
			justify-content: center;
		}

		.aurora-table-header[data-align='end'] .aurora-table-sort {
			flex-direction: row-reverse;
		}

		.aurora-table-header-label {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.aurora-table-sort {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			min-width: 0;
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--global-radius-xs);
			background: none;
			color: inherit;
			font: inherit;
			letter-spacing: inherit;
			text-align: inherit;
			text-transform: inherit;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition: color var(--_duration) var(--_easing);
		}

		.aurora-table-sort :global(.aurora-table-sort-icon) {
			--icon-size: var(--table-sort-icon-size, var(--table-default-sort-icon-size));

			flex: none;
			opacity: 0;
			transition-property: opacity, rotate;
			transition-duration: var(--_duration);
			transition-timing-function: var(--_easing);
		}

		@media (hover: hover) {
			.aurora-table-sort:hover {
				color: var(--table-header-hover-color, var(--table-default-header-hover-color));
			}

			.aurora-table-sort:hover :global(.aurora-table-sort-icon) {
				opacity: 0.45;
			}
		}

		.aurora-table-sort:focus-visible {
			outline: var(--_focus-ring);
			outline-offset: 2px;
		}

		.aurora-table-sort:focus-visible :global(.aurora-table-sort-icon) {
			opacity: 0.45;
		}

		th[data-sorted] .aurora-table-sort,
		th[data-sorted] .aurora-table-sort:hover {
			color: inherit;
		}

		th[data-sorted] .aurora-table-sort :global(.aurora-table-sort-icon) {
			opacity: 1;
		}

		th[data-sorted='desc'] .aurora-table-sort :global(.aurora-table-sort-icon) {
			rotate: 180deg;
		}

		.aurora-table-info {
			--icon-size: var(--table-info-icon-size, var(--table-default-info-icon-size));

			display: inline-grid;
			flex: none;
			place-items: center;
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--global-radius-full);
			background: none;
			color: inherit;
			opacity: 0.7;
			cursor: help;
		}

		.aurora-table-info:focus-visible {
			outline: var(--_focus-ring);
			outline-offset: 2px;
		}

		.aurora-table-resizer {
			position: absolute;
			inset-block: 0;
			inset-inline-end: 0;
			z-index: 1;
			width: 9px;
			cursor: col-resize;
			touch-action: none;
		}

		.aurora-table-resizer::after {
			content: '';
			position: absolute;
			inset-block: 22%;
			inset-inline-end: 0;
			width: var(--table-resizer-width, var(--table-default-resizer-width));
			border-radius: var(--global-radius-full);
			background: var(--table-resizer-color, var(--table-default-resizer-color));
			opacity: 0;
			transition: opacity var(--_duration) var(--_easing);
		}

		@media (hover: hover) {
			.aurora-table-header:hover .aurora-table-resizer::after {
				opacity: 0.35;
			}

			.aurora-table-resizer:hover::after {
				opacity: 1;
			}
		}

		.aurora-table-resizer[data-active]::after,
		.aurora-table-resizer:focus-visible::after {
			opacity: 1;
		}

		.aurora-table-resizer:focus-visible {
			outline: var(--_focus-ring);
			outline-offset: -2px;
		}

		.aurora-table-table td {
			--_cell-bg: transparent;
			--_edge: 0 0 transparent;

			box-sizing: border-box;
			padding: var(--table-cell-padding, var(--table-default-cell-padding));
			border-bottom: var(--_separator);
			background-color: var(--_cell-bg);
			box-shadow:
				inset 0 0 0 100vmax var(--_row-bg, transparent),
				var(--_edge);
			overflow: hidden;
			text-align: start;
			text-overflow: ellipsis;
			white-space: nowrap;
			vertical-align: middle;
		}

		.aurora-table-table tbody tr {
			--_row-bg: var(--table-row-background, var(--table-default-row-background));
		}

		.aurora-table-table .aurora-table-spacer > td {
			padding: 0;
			border: 0;
			box-shadow: none;
		}

		.aurora-table-cards > .aurora-table-spacer {
			list-style: none;
		}

		.aurora-table-table tbody tr:last-child > td,
		.aurora-table-table:has(tfoot) tbody tr:last-child > td {
			border-bottom: 0;
		}

		@media (hover: hover) {
			.aurora-table-row:hover {
				--_row-bg: var(--table-row-hover-background, var(--table-default-row-hover-background));
			}

			.aurora-table-row:hover > td {
				transition: box-shadow var(--_duration) var(--_easing);
			}

			.aurora-table-row[data-selected]:hover {
				--_row-bg: var(
					--table-row-selected-hover-background,
					var(--table-default-row-selected-hover-background)
				);
			}
		}

		.aurora-table-row:not(:hover, :focus-within) :global(.aurora-checkbox-box),
		.aurora-table-row:not(:hover, :focus-within) :global(.aurora-checkbox-box)::after,
		.aurora-table-card:not(:hover, :focus-within) :global(.aurora-checkbox-box),
		.aurora-table-card:not(:hover, :focus-within) :global(.aurora-checkbox-box)::after {
			transition: none;
		}

		.aurora-table-row[data-selected],
		.aurora-table-detail-row[data-selected] {
			--_row-bg: var(--table-row-selected-background, var(--table-default-row-selected-background));
		}

		.aurora-table-row[data-clickable] {
			cursor: pointer;
		}

		.aurora-table-row:focus-visible,
		.aurora-table-row:has(.aurora-table-row-link:focus-visible) {
			outline: var(--_focus-ring);
			outline-offset: calc(-1 * var(--table-focus-ring-width, var(--table-default-focus-ring-width)));
		}

		.aurora-table[data-loading] .aurora-table-row {
			opacity: var(--table-loading-opacity, var(--table-default-loading-opacity));
		}

		.aurora-table-table [data-align='end'] {
			text-align: end;
		}

		.aurora-table-table [data-align='center'] {
			text-align: center;
		}

		td[data-type='number'],
		.aurora-table-card-field[data-type='number'] > dd {
			font-family: var(--table-number-font-family, var(--table-default-number-font-family));
			font-size: var(--table-number-font-size, var(--table-default-number-font-size));
			font-variant-numeric: tabular-nums;
		}

		td[data-type='date'],
		td[data-type='datetime'],
		.aurora-table-card-field[data-type='date'] > dd,
		.aurora-table-card-field[data-type='datetime'] > dd {
			color: var(--table-date-color, var(--table-default-date-color));
			font-family: var(--table-date-font-family, var(--table-default-date-font-family));
			font-size: var(--table-date-font-size, var(--table-default-date-font-size));
			font-variant-numeric: tabular-nums;
		}

		.aurora-table-empty {
			color: var(--table-empty-color, var(--table-default-empty-color));
			font-family: var(--global-font-family);
		}

		.aurora-table :global(.aurora-table-boolean) {
			--icon-size: var(--table-boolean-icon-size, var(--table-default-boolean-icon-size));

			color: var(--table-boolean-color, var(--table-default-boolean-color));
			vertical-align: middle;
		}

		.aurora-table-table [data-pinned] {
			--_cell-bg: var(--table-pinned-background, var(--table-default-pinned-background));

			position: sticky;
			z-index: 1;
		}

		.aurora-table-table thead [data-pinned] {
			background:
				linear-gradient(var(--_header-bg), var(--_header-bg)),
				var(--table-pinned-background, var(--table-default-pinned-background));
		}

		.aurora-table[data-overflow-start] th[data-pinned-last] {
			box-shadow: var(--table-pinned-shadow, var(--table-default-pinned-shadow));
		}

		.aurora-table[data-overflow-start] td[data-pinned-last] {
			--_edge: var(--table-pinned-shadow, var(--table-default-pinned-shadow));
		}

		.aurora-table-control-col {
			width: var(--table-control-size, var(--table-default-control-size));
		}

		.aurora-table-table .aurora-table-control {
			width: var(--table-control-size, var(--table-default-control-size));
			min-width: var(--table-control-size, var(--table-default-control-size));
			padding-inline: 0;
			text-align: center;
		}

		.aurora-table-table .aurora-table-actions {
			position: sticky;
			inset-inline-end: 0;
			z-index: 1;
			--_cell-bg: var(--table-pinned-background, var(--table-default-pinned-background));

			width: 1px;
			padding-block: 0;
			text-align: end;
		}

		.aurora-table-table thead .aurora-table-actions {
			background:
				linear-gradient(var(--_header-bg), var(--_header-bg)),
				var(--table-pinned-background, var(--table-default-pinned-background));
		}

		.aurora-table[data-overflow-end] th.aurora-table-actions {
			box-shadow: var(--table-actions-shadow, var(--table-default-actions-shadow));
		}

		.aurora-table[data-overflow-end] td.aurora-table-actions {
			--_edge: var(--table-actions-shadow, var(--table-default-actions-shadow));
		}

		.aurora-table-actions-content {
			display: inline-flex;
			align-items: center;
			gap: var(--table-actions-gap, var(--table-default-actions-gap));
			vertical-align: middle;
			transition: opacity var(--_duration) var(--_easing);
		}

		.aurora-table[data-actions-visibility='hover'] .aurora-table-actions-content {
			opacity: 0;
		}

		.aurora-table[data-actions-visibility='hover'] .aurora-table-row:hover .aurora-table-actions-content,
		.aurora-table[data-actions-visibility='hover']
			.aurora-table-row:focus-within
			.aurora-table-actions-content {
			opacity: 1;
		}

		@media (hover: none) {
			.aurora-table[data-actions-visibility='hover'] .aurora-table-actions-content {
				opacity: 1;
			}
		}

		.aurora-table-table .aurora-table-filler {
			padding: 0;
		}

		.aurora-table-expand {
			--icon-size: var(--table-expand-icon-size, var(--table-default-expand-icon-size));

			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin: 0;
			padding: 2px;
			border: 0;
			border-radius: var(--global-radius-sm);
			background: none;
			color: var(--global-color-text-2);
			font: inherit;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition: background-color var(--_duration) var(--_easing);
		}

		.aurora-table-expand :global(.aurora-icon) {
			transition: rotate var(--_duration) var(--_easing);
		}

		.aurora-table-expand[aria-expanded='true'] :global(.aurora-icon) {
			rotate: 90deg;
		}

		.aurora-table-expand:dir(rtl):not([aria-expanded='true']) :global(.aurora-icon) {
			scale: -1 1;
		}

		@media (hover: hover) {
			.aurora-table-expand:hover {
				background: var(--global-color-surface-2);
				color: var(--global-color-text);
			}
		}

		.aurora-table-expand:focus-visible {
			outline: var(--_focus-ring);
			outline-offset: 1px;
		}

		.aurora-table-table .aurora-table-detail-row > td {
			--_cell-bg: var(--table-detail-background, var(--table-default-detail-background));

			padding: var(--table-detail-padding, var(--table-default-detail-padding));
			color: var(--table-detail-color, var(--table-default-detail-color));
			white-space: normal;
		}

		.aurora-table-table .aurora-table-no-data-row > td {
			padding: 24px 16px;
			white-space: normal;
		}

		.aurora-table-table .aurora-table-progress-row > td {
			height: 0;
			padding: 0;
			border: 0;
			background: none;
			box-shadow: none;
			overflow: visible;
		}

		.aurora-table-progress {
			position: relative;
			height: var(--table-progress-height, var(--table-default-progress-height));
			margin-top: calc(-1 * var(--table-progress-height, var(--table-default-progress-height)));
			overflow: hidden;
		}

		.aurora-table-progress::before {
			content: '';
			position: absolute;
			inset-block: 0;
			width: 40%;
			border-radius: var(--global-radius-full);
			background: var(--table-progress-color, var(--table-default-progress-color));
			animation: aurora-table-progress 1.2s var(--global-ease) infinite;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-table-progress::before {
				width: 100%;
				opacity: 0.6;
				animation: none;
			}
		}

		.aurora-table-table tfoot td {
			--_footer-bg: var(--table-footer-background, var(--table-default-footer-background));

			border-top: var(--_separator);
			border-bottom: 0;
			background: linear-gradient(var(--_footer-bg), var(--_footer-bg)), var(--_table-bg);
			color: var(--table-footer-color, var(--table-default-footer-color));
			font-weight: var(--table-footer-font-weight, var(--table-default-footer-font-weight));
		}

		.aurora-table-row-link,
		.aurora-table-visually-hidden {
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

		.aurora-table[data-cards] {
			display: grid;
			gap: var(--table-card-gap, var(--table-default-card-gap));
		}

		.aurora-table-cards-bar {
			--select-default-height: 32px;

			display: flex;
			align-items: center;
			gap: 12px;
			min-width: 0;
		}

		.aurora-table-cards-bar > :global(.aurora-checkbox) {
			flex: none;
		}

		.aurora-table-cards-bar > :global(.aurora-table-cards-sort) {
			flex: 0 1 auto;
			width: auto;
			min-width: 0;
			max-width: 65%;
			margin-inline-start: auto;
		}

		.aurora-table-cards {
			display: grid;
			gap: var(--table-card-gap, var(--table-default-card-gap));
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-table-card,
		.aurora-table-card-footer {
			--_row-bg: var(--table-row-background, var(--table-default-row-background));
			--_card-bg: var(--table-card-background, var(--table-default-card-background));

			box-sizing: border-box;
			display: grid;
			gap: 10px;
			min-width: 0;
			margin: 0;
			padding: var(--table-card-padding, var(--table-default-card-padding));
			border: var(--table-card-border, var(--table-default-card-border));
			border-radius: var(--table-card-border-radius, var(--table-default-card-border-radius));
			background: linear-gradient(var(--_row-bg), var(--_row-bg)), var(--_card-bg);
			transition: background-color var(--_duration) var(--_easing);
		}

		.aurora-table-card[data-selected] {
			--_row-bg: var(--table-row-selected-background, var(--table-default-row-selected-background));
		}

		.aurora-table-card[data-clickable] {
			cursor: pointer;
		}

		.aurora-table-card:focus-visible,
		.aurora-table-card:has(.aurora-table-row-link:focus-visible) {
			outline: var(--_focus-ring);
			outline-offset: 2px;
		}

		.aurora-table[data-loading] .aurora-table-card:not([aria-hidden]) {
			opacity: var(--table-loading-opacity, var(--table-default-loading-opacity));
		}

		.aurora-table-card-head {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}

		.aurora-table-card-title {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			font-weight: var(--table-card-title-font-weight, var(--table-default-card-title-font-weight));
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-table-card-actions {
			display: inline-flex;
			flex: none;
			align-items: center;
			gap: var(--table-actions-gap, var(--table-default-actions-gap));
		}

		.aurora-table-card-fields,
		.aurora-table-card-footer {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			gap: 6px 16px;
			margin: 0;
		}

		.aurora-table-card-footer {
			--_card-bg: var(--table-footer-background, var(--table-default-footer-background));

			font-weight: var(--table-footer-font-weight, var(--table-default-footer-font-weight));
		}

		.aurora-table-card-field {
			display: contents;
		}

		.aurora-table-card-field > dt {
			align-self: center;
			color: var(--table-card-label-color, var(--table-default-card-label-color));
			font-size: var(--table-card-label-font-size, var(--table-default-card-label-font-size));
			font-weight: 400;
		}

		.aurora-table-card-field > dd {
			min-width: 0;
			margin: 0;
			overflow-wrap: anywhere;
			text-align: end;
		}

		.aurora-table-card .aurora-table-expand {
			justify-self: start;
			margin-inline-start: -2px;
			font-size: var(--table-card-label-font-size, var(--table-default-card-label-font-size));
		}

		.aurora-table-card-detail {
			padding: 12px;
			border-radius: var(--global-radius-sm);
			background: var(--table-detail-background, var(--table-default-detail-background));
			color: var(--table-detail-color, var(--table-default-detail-color));
		}

		.aurora-table-no-data {
			padding: 16px;
		}
	}

	@keyframes aurora-table-progress {
		from {
			translate: -100%;
		}

		to {
			translate: 250%;
		}
	}
</style>
