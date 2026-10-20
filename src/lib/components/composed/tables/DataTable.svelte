<!-- @component
Table for server data, with a toolbar (search, `Filters`, the buttons of the app, "Columns"), a bar of actions on the selected rows and a footer with the pagination. Every change of page, page size, sorting, search or filters makes a new query, `{ page, pageSize, sort, search, filterValue, builder }`, where `builder` is the whole `FilterBuilder` for the backend (filters, the search word by word on `searchColumns`, the sorting of the columns). Changing filters, search, sorting or page size goes back to page 1; changing filters or search also clears the selection, which instead stays across pages. Rows come in one of two ways: a `loader({ ...query, signal })` that returns `{ rows, total }` (the table shows the loading, aborts outdated requests, shows an error with "Retry", and `reload()` runs it again; pass `rows` and `total` from the `load` of SvelteKit to skip the first request), or `rows` and `total` managed by the app, which loads them in `onquerychange` (and appends the next batch in `onloadmore` with `pagination="infinite"`). `pagination` is `pages` (a page size selector, the range and a `Paginator`), `infinite` (the next batch loads when the last rows come into view) or `none`; a new query brings a table that scrolls on its own (`--table-max-height`) back to the top. With `selectable="multiple"` a floating bar at the bottom shows how many rows are selected, offers to select every row of the result (`selectedAll`, with the rows unchecked afterwards in `excluded`) and holds `selectionActionsSnippet`. `columnManager` adds a "Columns" button that opens a `ColumnManager` on `columnState`; `oncolumnstatechange` is called when the user saves the view or resizes a column. Every prop of `Table` works as there, other attributes go to the root of the `Table`. Below the `cardBreakpoint` of the table the frame goes away and the rows become cards; below 640px of width the toolbar is one row ("Filters" and "Columns" as icons, `toolbarSnippet` receives `narrow` for icon-only buttons) and, when it does not fit in one row (below about 480px), the selection bar puts its actions on a second row.
-->
<script lang="ts" generics="Row extends Record<string, any>">
	import '../../../css/tokens.css';
	import './DataTable.css';
	import { untrack, type ComponentProps, type Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Button from '../../simple/buttons/Button.svelte';
	import MenuOrDrawerOptions, {
		type MenuOrDrawerOption
	} from '../common/MenuOrDrawerOptions.svelte';
	import NoData from '../../simple/common/NoData.svelte';
	import Tooltip from '../../simple/common/Tooltip.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Select from '../../simple/forms/Select.svelte';
	import DotsLoader from '../../simple/loaders/DotsLoader.svelte';
	import Paginator from '../../simple/navigation/Paginator.svelte';
	import Table from '../../simple/tables/Table.svelte';
	import Filters from '../search/Filters.svelte';
	import SearchBar from '../search/SearchBar.svelte';
	import ColumnManager from './ColumnManager.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import { observeWidth } from '../../../utils/size.js';
	import { createFilters, type FilterField, type FilterGroup } from '../../../utils/filters/model.js';
	import {
		completeFilters,
		filterQuery,
		hasMoreRows,
		pageRange,
		resolvePageCount,
		selectionCount,
		sortedQuery
	} from '../../../utils/table/query.js';
	import { keyOf } from '../../../utils/table/values.js';
	import type {
		DataTableAction,
		DataTableLoadResult,
		DataTableQuery,
		TableColumnState,
		TableSort
	} from '../../../utils/table/types.js';
	import type { ClassValue } from 'svelte/elements';

	const COLUMNS_ICON = 'M4 5V18H21V5H4M14 7V16H11V7H14M6 7H9V16H6V7M19 16H16V7H19V16Z';
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
	const MORE_ICON =
		'M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z';
	const ERROR_ICON =
		'M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z';
	const EMPTY_FILTERS = createFilters();

	interface Props
		extends Omit<
			ComponentProps<typeof Table<Row>>,
			| 'rows'
			| 'sorting'
			| 'labels'
			| 'class'
			| 'oncolumnstatechange'
			| 'onendreached'
			| 'onload'
			| 'onerror'
		> {
		/** Rows of the current page, or of the batches loaded so far with `pagination="infinite"`. With `loader`, the rows of the first query (for example from the `load` of SvelteKit): the table shows them instead of loading them again. */
		rows?: Row[];
		/** Loads the rows of a query. Called when the table mounts without `rows`, at every change of the query, for the next batch with `pagination="infinite"` and by `reload()`; a newer call aborts the older one through `signal`. Return the rows and the `total` of the result (or `pageCount`). */
		loader?: (query: DataTableQuery & { signal: AbortSignal }) => Promise<DataTableLoadResult<Row>>;
		/** Called when the query changes (not when the table mounts): without `loader` the app loads the rows of `query` and passes them in `rows` and `total`. */
		onquerychange?: (query: DataTableQuery) => void;
		/** With `pagination="infinite"` and without `loader`: called when the last rows come into view and more rows exist, with the `page` of the next batch. Append its rows to `rows`. */
		onloadmore?: (query: DataTableQuery) => void;
		/** Called after the `loader` returns, with its rows (the batch only, with `pagination="infinite"`), its total and the query. */
		onloaded?: (event: { rows: Row[]; total: number | undefined; query: DataTableQuery }) => void;
		/** Called when the `loader` fails. */
		onerror?: (error: unknown) => void;
		/** `pages`: one page at a time, with a page size selector, the range and a `Paginator`. `infinite`: the next batch loads when the last rows come into view. `none`: every row at once. */
		pagination?: 'pages' | 'infinite' | 'none';
		/** Current page, from 1 (the last batch loaded with `pagination="infinite"`). */
		page?: number;
		/** Rows per page, or per batch. Defaults to the first of `pageSizes`. */
		pageSize?: number;
		/** Choices of the page size selector. With fewer than two the selector is hidden. */
		pageSizes?: number[];
		/** Number of rows of the whole result, on every page. Without it and without `pageCount` the `Paginator` only goes forward page by page. */
		total?: number;
		/** Number of pages, when the app knows it instead of `total`. */
		pageCount?: number;
		/** Text of the search field. */
		search?: string;
		/** Columns of the backend searched by the search field: the text goes in the query word by word, so "mario rossi" finds Mario Rossi across first and last name: one group per word, joined with AND, each an `ilike` on every column joined with OR. Shows the search field. */
		searchColumns?: string[];
		/** Shows the search field. Defaults to `true` when `searchColumns` is set; without them the text only reaches `query.search`. */
		searchable?: boolean;
		/** Fields of the `Filters` in the toolbar. Without them there are no filters. */
		filterFields?: FilterField[];
		/** Tree of the filters, as the `value` of `Filters`. */
		filterValue?: FilterGroup;
		/** Shows a "Columns" button that opens a `ColumnManager` on `columnState`. */
		columnManager?: boolean;
		/** Shows the bar of the selected rows while at least one is selected. */
		selectionBar?: boolean;
		/** Actions on the selected rows, drawn as buttons of the selection bar with the same look in every app. Those that do not fit (more than 4, or 2 below 640px) go in a "More actions" `MenuOrDrawerOptions`: a menu, or a bottom sheet on screens up to 1024px wide. */
		selectionActions?: DataTableAction<Row>[];
		/** Disables every action of the selection bar, for example while one of them is running. */
		selectionDisabled?: boolean;
		/** Called when the user changes the columns: when they save the view of the `ColumnManager` and at the end of a resize, after `columnState` has changed. Save it here, for example in the user's settings. */
		oncolumnstatechange?: (event: { columnState: TableColumnState[] }) => void;
		/** Props of the `Filters` in the toolbar, except those the table sets. */
		filtersProps?: Omit<
			ComponentProps<typeof Filters>,
			'fields' | 'value' | 'locale' | 'prependSnippet' | 'actionsSnippet'
		>;
		/** Props of the `SearchBar` in the toolbar, except those the table sets. */
		searchBarProps?: Omit<ComponentProps<typeof SearchBar>, 'value' | 'locale' | 'onsearch'>;
		/** Props of the `Paginator` in the footer, except those the table sets. */
		paginatorProps?: Omit<
			ComponentProps<typeof Paginator>,
			'page' | 'pageCount' | 'locale' | 'onchange'
		>;
		/** Props of the `ColumnManager`, except those the table sets. */
		columnManagerProps?: Omit<
			ComponentProps<typeof ColumnManager<Row>>,
			'columns' | 'columnState' | 'open' | 'locale'
		>;
		/** Texts to change, on top of those of `locale`: those of `Table` and those of the toolbar, the footer and the selection bar. `{from}`, `{to}`, `{total}` and `{count}` are replaced by the numbers. */
		labels?: {
			search?: string;
			columns?: string;
			rowsPerPage?: string;
			range?: string;
			rangeOpen?: string;
			loaded?: string;
			results?: string;
			result?: string;
			selected?: string;
			selectedOne?: string;
			allSelected?: string;
			selectAll?: string;
			clearSelection?: string;
			selectionActions?: string;
			moreActions?: string;
			loadError?: string;
			retry?: string;
			loadingMore?: string;
			selectRow?: string;
			selectAllShort?: string;
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
		/** Classes of the parts: `container` the root, `toolbar`, `footer`, `selectionBar`, and those of `Table`: `table` the `<table>`, `header` the header cells, `row` the rows (and cards), `cell` the body cells. */
		class?: {
			container?: ClassValue;
			toolbar?: ClassValue;
			footer?: ClassValue;
			selectionBar?: ClassValue;
			table?: ClassValue;
			header?: ClassValue;
			row?: ClassValue;
			cell?: ClassValue;
		};
		/** Buttons of the app at the end of the toolbar, for example "New". `narrow` is true below 640px of the table, where the toolbar is one row: show icon-only buttons there (with an `aria-label`). */
		toolbarSnippet?: Snippet<[{ narrow: boolean }]>;
		/** Extra content of the selection bar, after `selectionActions`, for actions that need more than a button. `count` is `undefined` when every row is selected and the total is unknown; `clear` empties the selection. */
		selectionActionsSnippet?: Snippet<
			[
				{
					selected: Row[];
					selectedAll: boolean;
					excluded: Row[];
					count: number | undefined;
					clear: () => void;
				}
			]
		>;
		/** Replaces the range in the footer ("1–20 of 312"). */
		rangeSnippet?: Snippet<
			[{ from: number; to: number; total: number | undefined; page: number; pageCount: number | undefined }]
		>;
		/** Replaces the search field. Call `setValue` with the new text, already debounced. */
		searchSnippet?: Snippet<[{ value: string; setValue: (text: string) => void }]>;
		/** Replaces the error of a failed `loader`; `retry` loads again. */
		errorSnippet?: Snippet<[{ error: unknown; retry: () => void }]>;
	}

	let {
		rows,
		columns,
		loader,
		onquerychange,
		onloadmore,
		onloaded,
		onerror,
		pagination = 'pages',
		page = $bindable(),
		pageSize = $bindable(),
		pageSizes = [20, 50, 100],
		total,
		pageCount,
		search = $bindable(),
		searchColumns,
		searchable,
		filterFields,
		filterValue = $bindable(),
		columnManager = false,
		selectionBar = true,
		selectionActions = [],
		selectionDisabled = false,
		disabled = false,
		selectAll = true,
		sort = $bindable(),
		selectable,
		selected = $bindable(),
		selectedAll = $bindable(),
		excluded = $bindable(),
		expanded = $bindable(),
		columnState = $bindable(),
		tableElement = $bindable(),
		rowKey = 'id',
		loading = false,
		locale: localeProp,
		labels,
		class: clazz = {},
		onsortchange,
		onselectionchange,
		oncolumnstatechange,
		noDataSnippet,
		toolbarSnippet,
		selectionActionsSnippet,
		rangeSnippet,
		searchSnippet,
		errorSnippet,
		filtersProps,
		searchBarProps,
		paginatorProps,
		columnManagerProps,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived({ ...libraryTexts(locale).dataTable, ...labels });
	const uid = $props.id();

	let loadedRows = $state.raw<Row[]>();
	let loadedTotal = $state<number>();
	let loadedPageCount = $state<number>();
	let fetching = $state(false);
	let fetchingMore = $state(false);
	let failure = $state<'page' | 'more'>();
	let error = $state.raw<unknown>();
	let managerOpen = $state(false);
	let moreOpen = $state(false);
	let moreButton = $state<HTMLButtonElement | HTMLAnchorElement>();
	let actionButtons = $state<(HTMLButtonElement | HTMLAnchorElement | undefined)[]>([]);
	const running = new SvelteSet<number>();
	let width = $state<number>();
	let bodyNode = $state<HTMLElement>();
	let controller: AbortController | undefined;
	let moreRequestedAt = $state<number>();

	let shownRows = $derived(loadedRows ?? rows ?? []);
	let shownTotal = $derived(loadedRows ? loadedTotal : total);
	let knownPageCount = $derived(loadedRows ? loadedPageCount : pageCount);
	let currentPage = $derived(page ?? 1);
	let size = $derived(pageSize ?? pageSizes[0] ?? 20);
	let pages = $derived(resolvePageCount(shownTotal, size, knownPageCount));
	let narrow = $derived(width !== undefined && width < 640);

	let fields = $derived(filterFields ?? []);
	let tree = $derived(filterValue ?? EMPTY_FILTERS);
	let completeTree = $derived(completeFilters(tree, fields));
	let searchText = $derived((search ?? '').trim());
	let filtered = $derived(
		filterQuery({
			search: searchText,
			searchColumns,
			filterValue: completeTree,
			filterFields: fields,
			weekStart: filtersProps?.weekStart,
			negativesIncludeEmpty: filtersProps?.negativesIncludeEmpty
		})
	);
	let filterKey = $derived(`${JSON.stringify(filtered.toJson())}\u0000${searchText}`);
	let sortKey = $derived(sort ? `${sort.direction}:${sort.key}` : '');
	let query: DataTableQuery = $derived({
		page: currentPage,
		pageSize: size,
		sort,
		search: searchText,
		filterValue: completeTree,
		builder: sortedQuery(filtered, sort, columns)
	});

	let selection = $derived({
		selected: selected ?? [],
		selectedAll: selectedAll ?? false,
		excluded: excluded ?? []
	});
	let count = $derived(selectionCount(selection, shownTotal));
	let showSelectionBar = $derived(
		selectionBar && !!selectable && (selection.selectedAll || selection.selected.length > 0)
	);
	let pageAllSelected = $derived.by(() => {
		if (!shownRows.length || selection.selectedAll) return false;
		const keys = new Set(selection.selected.map((row) => keyOf(row, rowKey)));
		return shownRows.every((row) => keys.has(keyOf(row, rowKey)));
	});
	let canSelectEverything = $derived(
		selectable === 'multiple' &&
			selectAll &&
			pageAllSelected &&
			shownTotal !== undefined &&
			shownTotal > selection.selected.length
	);

	let actionLimit = $derived(narrow ? 2 : 4);
	let inlineCount = $derived(
		selectionActions.length <= actionLimit + 1 ? selectionActions.length : actionLimit
	);
	let moreOptions = $derived(
		selectionActions.slice(inlineCount).map((action, offset): MenuOrDrawerOption => {
			const index = inlineCount + offset;
			return {
				name: index,
				label: action.label,
				icon: action.icon,
				description: actionTip(action),
				variant: action.variant,
				disabled: actionOff(action) || action.loading || running.has(index),
				onclick: (event) => runAction(action, index, event)
			};
		})
	);
	let showSearch = $derived(searchable ?? !!searchColumns?.length);
	let showFilters = $derived(fields.length > 0);
	let hasToolbarEnd = $derived(!!toolbarSnippet || columnManager);
	let showToolbar = $derived(showSearch || showFilters || hasToolbarEnd);
	let sizeItems = $derived(
		[...new Set([...pageSizes, size])]
			.sort((a, b) => a - b)
			.map((value) => ({ value, label: String(value) }))
	);
	let range = $derived(pageRange(currentPage, size, shownRows.length));
	let hasMore = $derived(
		pagination === 'infinite' &&
			hasMoreRows(shownRows.length, currentPage, size, shownTotal, knownPageCount)
	);
	let waitingMore = $derived(fetchingMore || (!loader && loading && moreRequestedAt !== undefined));
	let tableLoading = $derived((loading && !waitingMore) || fetching);
	let canLoadMore = $derived(
		hasMore &&
			!failure &&
			!fetching &&
			!fetchingMore &&
			!tableLoading &&
			!disabled &&
			moreRequestedAt !== shownRows.length
	);

	let seen = {
		filterKey: untrack(() => filterKey),
		sortKey: untrack(() => sortKey),
		size: untrack(() => size),
		page: untrack(() => currentPage)
	};

	$effect.pre(() => {
		const next = { filterKey, sortKey, size, page: currentPage };
		untrack(() => {
			const filtersChanged = next.filterKey !== seen.filterKey;
			const queryChanged = filtersChanged || next.sortKey !== seen.sortKey || next.size !== seen.size;
			const pageMoved = next.page !== seen.page;
			seen = next;
			if (filtersChanged && (selection.selectedAll || selection.selected.length))
				clearSelection();
			if (queryChanged && !pageMoved && next.page !== 1) {
				page = 1;
				seen = { ...next, page: 1 };
			}
			if (queryChanged) moreRequestedAt = undefined;
		});
	});

	let requested: string | undefined;

	$effect(() => {
		const key = `${filterKey}|${sortKey}|${size}|${pagination === 'infinite' ? '' : currentPage}`;
		untrack(() => {
			if (key === requested) return;
			const first = requested === undefined;
			requested = key;
			if (first) {
				if (loader && !rows) load(false);
				return;
			}
			scrollToTop();
			if (loader) load(false);
			else onquerychange?.(query);
		});
	});

	$effect.pre(() => {
		rows;
		untrack(() => {
			if (!loadedRows) return;
			controller?.abort();
			loadedRows = undefined;
			loadedTotal = undefined;
			loadedPageCount = undefined;
		});
	});

	$effect(() => {
		shownRows.length;
		if (!loading) moreRequestedAt = undefined;
	});

	function scrollToTop() {
		bodyNode?.querySelector(':scope > .aurora-table > .aurora-table-scroll')?.scrollTo({ top: 0 });
	}

	async function load(append: boolean) {
		if (!loader) return;
		controller?.abort();
		const own = (controller = new AbortController());
		const request = append ? { ...query, page: currentPage + 1 } : query;
		failure = undefined;
		error = undefined;
		fetching = !append;
		fetchingMore = append;
		try {
			const result = await loader({ ...request, signal: own.signal });
			if (own.signal.aborted) return;
			loadedRows = append ? [...shownRows, ...result.rows] : result.rows;
			loadedTotal = result.total;
			loadedPageCount = result.pageCount;
			if (append) page = request.page;
			onloaded?.({ rows: result.rows, total: result.total, query: request });
			const last = resolvePageCount(result.total, size, result.pageCount);
			if (!append && pagination === 'pages' && !result.rows.length && last && request.page > last)
				page = last;
		} catch (caught) {
			if (own.signal.aborted) return;
			error = caught;
			failure = append ? 'more' : 'page';
			onerror?.(caught);
		} finally {
			if (controller === own) {
				controller = undefined;
				fetching = false;
				fetchingMore = false;
			}
		}
	}

	function loadMore() {
		if (!hasMore) return;
		if (loader) {
			load(true);
			return;
		}
		if (moreRequestedAt === shownRows.length) return;
		moreRequestedAt = shownRows.length;
		const next = { ...query, page: currentPage + 1 };
		page = next.page;
		seen = { ...seen, page: next.page };
		onloadmore?.(next);
	}

	function retry() {
		if (failure === 'more') load(true);
		else load(false);
	}

	/** Loads the rows of the current query again, for example after the app has created or deleted one: with `loader` it calls it again (from the first batch with `pagination="infinite"`), without it calls `onquerychange`. */
	export function reload() {
		if (pagination === 'infinite' && currentPage !== 1) {
			page = 1;
			seen = { ...seen, page: 1 };
			scrollToTop();
		}
		if (loader) load(false);
		else onquerychange?.(query);
	}

	function commitSelection(next: { selected: Row[]; selectedAll: boolean; excluded: Row[] }) {
		selected = next.selected;
		selectedAll = next.selectedAll;
		excluded = next.excluded;
		onselectionchange?.(next);
	}

	function clearSelection() {
		commitSelection({ selected: [], selectedAll: false, excluded: [] });
	}

	function selectEverything() {
		commitSelection({ selected: [], selectedAll: true, excluded: [] });
	}

	function actionOff(action: DataTableAction<Row>) {
		return disabled || selectionDisabled || !!action.disabled;
	}

	function actionTip(action: DataTableAction<Row>) {
		return actionOff(action) ? (action.disabledInfo ?? action.info) : action.info;
	}

	function runAction(action: DataTableAction<Row>, index: number, event: MouseEvent) {
		if (actionOff(action) || action.loading || running.has(index)) return;
		moreOpen = false;
		const result = action.onclick({
			selected: selection.selected,
			selectedAll: selection.selectedAll,
			excluded: selection.excluded,
			count,
			clear: clearSelection,
			event
		});
		if (result && typeof (result as Promise<unknown>).finally === 'function') {
			running.add(index);
			(result as Promise<unknown>).finally(() => running.delete(index)).catch(() => undefined);
		}
	}

	function openMore() {
		moreOpen = !moreOpen;
	}

	function setSearch(text: string) {
		search = text;
	}

	function changeSort(event: { sort: TableSort | undefined }) {
		onsortchange?.(event);
	}

	function saveColumns(event: { columnState: TableColumnState[] }) {
		columnManagerProps?.onsave?.(event);
		oncolumnstatechange?.(event);
	}

	function fill(text: string, values: Record<string, number | undefined>) {
		return text.replace(/\{(\w+)\}/g, (match, name) =>
			values[name] === undefined ? match : values[name].toLocaleString(locale)
		);
	}
</script>

{#snippet searchField()}
	{#if searchSnippet}
		{@render searchSnippet({ value: search ?? '', setValue: setSearch })}
	{:else}
		<SearchBar
			placeholder={texts.search}
			debounce={300}
			clearable
			{...searchBarProps}
			class={{
				...searchBarProps?.class,
				container: ['aurora-data-table-search', searchBarProps?.class?.container].filter(Boolean).join(' ')
			}}
			value={search ?? ''}
			{locale}
			onsearch={setSearch}
		/>
	{/if}
{/snippet}

{#snippet toolbarEnd()}
	{#if columnManager}
		<Button
			variant="secondary"
			size="sm"
			icon={COLUMNS_ICON}
			aria-label={narrow ? texts.columns : undefined}
			aria-haspopup="dialog"
			aria-expanded={managerOpen}
			onclick={() => (managerOpen = true)}
		>
			{#if !narrow}{texts.columns}{/if}
		</Button>
	{/if}
	{@render toolbarSnippet?.({ narrow })}
{/snippet}

{#snippet failed()}
	{#if errorSnippet}
		{@render errorSnippet({ error, retry })}
	{:else}
		<NoData size="sm" icon={ERROR_ICON} title={texts.loadError} {locale}>
			<Button variant="secondary" size="sm" onclick={retry}>{texts.retry}</Button>
		</NoData>
	{/if}
{/snippet}

<div
	class={['aurora-data-table', clazz.container]}
	{@attach observeWidth((next) => (width = Math.round(next)))}
	data-pagination={pagination}
	data-narrow={narrow || undefined}
	data-selecting={showSelectionBar || undefined}
	data-error={failure ? '' : undefined}
	data-disabled={disabled || undefined}
>
	{#if showToolbar}
		<div class={['aurora-data-table-toolbar', clazz.toolbar]}>
			{#if showFilters}
				<Filters
					{...filtersProps}
					fields={fields}
					bind:value={() => tree, (next) => (filterValue = next)}
					{locale}
					prependSnippet={showSearch ? searchField : undefined}
					actionsSnippet={hasToolbarEnd ? toolbarEnd : undefined}
				/>
			{:else}
				{#if showSearch}{@render searchField()}{/if}
				{#if hasToolbarEnd}
					<div class="aurora-data-table-toolbar-end">{@render toolbarEnd()}</div>
				{/if}
			{/if}
		</div>
	{/if}

	<div class="aurora-data-table-body" bind:this={bodyNode}>
		<Table
			{...rest}
			{columns}
			{rowKey}
			{selectable}
			{disabled}
			{selectAll}
			rows={shownRows}
			sorting="manual"
			bind:sort
			bind:selected
			bind:selectedAll
			bind:excluded
			bind:expanded
			bind:columnState
			bind:tableElement
			loading={tableLoading}
			{locale}
			{labels}
			class={{ table: clazz.table, header: clazz.header, row: clazz.row, cell: clazz.cell }}
			onsortchange={changeSort}
			{onselectionchange}
			{oncolumnstatechange}
			noDataSnippet={failure === 'page' ? failed : noDataSnippet}
			onendreached={canLoadMore ? loadMore : undefined}
		/>
	</div>

	{#if failure && (failure === 'more' || shownRows.length)}
		<div class="aurora-data-table-error" role="alert">
			{#if errorSnippet}
				{@render errorSnippet({ error, retry })}
			{:else}
				<span>{texts.loadError}</span>
				<Button variant="secondary" size="sm" onclick={retry}>{texts.retry}</Button>
			{/if}
		</div>
	{/if}

	{#if waitingMore}
		<div class="aurora-data-table-more" role="status">
			<DotsLoader label={texts.loadingMore} {locale} />
			<span>{texts.loadingMore}</span>
		</div>
	{/if}

	{#if showSelectionBar}
		<div class="aurora-data-table-selection-dock">
			<div
				class={['aurora-data-table-selection', clazz.selectionBar]}
				role="toolbar"
				aria-label={texts.selectionActions}
			>
				<span class="aurora-data-table-selection-count" aria-live="polite">
					{#if count === undefined}
						{texts.allSelected}
					{:else}
						<b>{count.toLocaleString(locale)}</b>
						{count === 1 ? texts.selectedOne : texts.selected}
					{/if}
				</span>
				{#if canSelectEverything}
					<Button buttonType="text" size="sm" {disabled} onclick={selectEverything}>
						{fill(texts.selectAll, { total: shownTotal })}
					</Button>
				{/if}
				{#if selectionActions.length || selectionActionsSnippet}
					<div class="aurora-data-table-selection-actions">
						{#each selectionActions.slice(0, inlineCount) as action, index (index)}
							{@const tip = actionTip(action)}
							<Button
								buttonType="text"
								variant={action.variant === 'danger' ? 'danger' : 'primary'}
								size="sm"
								icon={action.icon}
								loading={action.loading || running.has(index)}
								aria-disabled={actionOff(action) ? 'true' : undefined}
								bind:buttonElement={actionButtons[index]}
								onclick={(event: MouseEvent) => runAction(action, index, event)}
							>
								{action.label}
							</Button>
							{#if tip}<Tooltip activator={actionButtons[index] ?? undefined} text={tip} />{/if}
						{/each}
						{#if selectionActions.length > inlineCount}
							<Button
								buttonType="text"
								variant="secondary"
								size="sm"
								icon={MORE_ICON}
								aria-label={texts.moreActions}
								aria-haspopup="menu"
								aria-expanded={moreOpen}
								bind:buttonElement={moreButton}
								onclick={openMore}
							/>
							<MenuOrDrawerOptions
								bind:open={moreOpen}
								activator={moreButton as HTMLElement | undefined}
								placement="bottom-start"
								aria-label={texts.moreActions}
								{locale}
								options={moreOptions}
							/>
						{/if}
						{#if selectionActionsSnippet}
							{@render selectionActionsSnippet({
								selected: selection.selected,
								selectedAll: selection.selectedAll,
								excluded: selection.excluded,
								count,
								clear: clearSelection
							})}
						{/if}
					</div>
				{/if}
				<Button
					buttonType="text"
					variant="secondary"
					size="sm"
					icon={CLOSE_ICON}
					aria-label={texts.clearSelection}
					onclick={clearSelection}
				/>
			</div>
		</div>
	{/if}

	{#if pagination === 'pages' ? shownRows.length > 0 || currentPage > 1 : shownTotal !== undefined}
		<div class={['aurora-data-table-footer', clazz.footer]} inert={disabled || undefined}>
			{#if pagination === 'pages'}
				<div class="aurora-data-table-footer-start">
					{#if sizeItems.length > 1}
						<span class="aurora-data-table-page-size">
							<span id="{uid}-size">{texts.rowsPerPage}</span>
							<Select
								items={sizeItems}
								aria-labelledby="{uid}-size"
								class={{ container: 'aurora-data-table-page-size-select' }}
								bind:value={() => size, (value) => (pageSize = Number(value))}
							/>
						</span>
					{/if}
					{#if shownRows.length}
						<span class="aurora-data-table-range">
							{#if rangeSnippet}
								{@render rangeSnippet({ ...range, total: shownTotal, page: currentPage, pageCount: pages })}
							{:else}
								{fill(shownTotal === undefined ? texts.rangeOpen : texts.range, {
									...range,
									total: shownTotal
								})}
							{/if}
						</span>
					{/if}
				</div>
				<Paginator
					compact={narrow}
					{...paginatorProps}
					bind:page={() => currentPage, (next) => (page = next)}
					pageCount={pages}
					{locale}
				/>
			{:else if pagination === 'infinite'}
				<span class="aurora-data-table-range">
					{fill(texts.loaded, { count: shownRows.length, total: shownTotal })}
				</span>
			{:else}
				<span class="aurora-data-table-range">
					{shownTotal === 1 ? texts.result : fill(texts.results, { count: shownTotal })}
				</span>
			{/if}
		</div>
	{/if}
</div>

{#if columnManager}
	<ColumnManager
		{...columnManagerProps}
		bind:open={managerOpen}
		{columns}
		bind:columnState
		{locale}
		onsave={saveColumns}
	/>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-data-table {
			box-sizing: border-box;
			display: flex;
			width: var(--data-table-width, var(--data-table-default-width));
			min-width: 0;
			flex-direction: column;
			overflow: clip;
			border: var(--data-table-border, var(--data-table-default-border));
			border-radius: var(--data-table-border-radius, var(--data-table-default-border-radius));
			background: var(--data-table-background, var(--data-table-default-background));
			color: var(--data-table-color, var(--data-table-default-color));
			font-size: var(--data-table-font-size, var(--data-table-default-font-size));
		}

		.aurora-data-table-toolbar {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: var(--data-table-toolbar-gap, var(--data-table-default-toolbar-gap));
			padding: var(--data-table-toolbar-padding, var(--data-table-default-toolbar-padding));
			border-bottom: var(--global-border-width) solid
				var(--data-table-separator-color, var(--data-table-default-separator-color));
			background: var(--data-table-toolbar-background, var(--data-table-default-toolbar-background));
			--search-bar-default-height: var(
				--data-table-control-height,
				var(--data-table-default-control-height)
			);
		}

		.aurora-data-table-toolbar > :global(.aurora-filters) {
			flex: 1 1 auto;
			min-width: 0;
		}

		.aurora-data-table-toolbar :global(.aurora-data-table-search) {
			flex: 0 1 var(--data-table-search-width, var(--data-table-default-search-width));
			min-width: 160px;
		}

		.aurora-data-table-toolbar-end {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: var(--data-table-toolbar-gap, var(--data-table-default-toolbar-gap));
			margin-inline-start: auto;
		}

		.aurora-data-table[data-narrow] .aurora-data-table-toolbar :global(.aurora-data-table-search) {
			flex: 1 1 120px;
			min-width: 0;
		}

		.aurora-data-table-body {
			isolation: isolate;
			min-width: 0;
			--table-border: none;
			--table-border-radius: 0;
			--table-background: var(--data-table-background, var(--data-table-default-background));
		}

		.aurora-data-table-error,
		.aurora-data-table-more {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-wrap: wrap;
			gap: 12px;
			padding: var(--data-table-message-padding, var(--data-table-default-message-padding));
			border-top: var(--global-border-width) solid
				var(--data-table-separator-color, var(--data-table-default-separator-color));
			color: var(--data-table-message-color, var(--data-table-default-message-color));
			font-size: var(--data-table-footer-font-size, var(--data-table-default-footer-font-size));
		}

		.aurora-data-table-error {
			color: var(--data-table-error-color, var(--data-table-default-error-color));
		}

		.aurora-data-table-selection-dock {
			container: aurora-data-table-dock / inline-size;
			position: sticky;
			bottom: var(--data-table-selection-offset, var(--data-table-default-selection-offset));
			z-index: 1;
			display: flex;
			justify-content: center;
			padding: 8px 12px;
			pointer-events: none;
		}

		.aurora-data-table-selection {
			display: flex;
			max-width: 100%;
			align-items: center;
			flex-wrap: wrap;
			gap: 6px;
			padding: var(--data-table-selection-padding, var(--data-table-default-selection-padding));
			border: var(--data-table-selection-border, var(--data-table-default-selection-border));
			border-radius: var(
				--data-table-selection-border-radius,
				var(--data-table-default-selection-border-radius)
			);
			background: var(--data-table-selection-background, var(--data-table-default-selection-background));
			box-shadow: var(--data-table-selection-shadow, var(--data-table-default-selection-shadow));
			color: var(--data-table-selection-color, var(--data-table-default-selection-color));
			pointer-events: auto;
			animation: aurora-data-table-rise
				var(--data-table-duration, var(--data-table-default-duration))
				var(--data-table-easing, var(--data-table-default-easing));
		}

		.aurora-data-table-selection-actions {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 6px;
		}

		@container aurora-data-table-dock (max-width: 480px) {
			.aurora-data-table-selection {
				width: 100%;
				box-sizing: border-box;
			}

			.aurora-data-table-selection > :global(.aurora-button:last-child) {
				order: 1;
				margin-inline-start: auto;
			}

			.aurora-data-table-selection-actions {
				order: 2;
				flex-basis: 100%;
			}
		}

		.aurora-data-table-selection-count {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			margin-inline-end: 4px;
			padding-inline-end: 12px;
			border-inline-end: var(--global-border-width) solid
				var(--data-table-separator-color, var(--data-table-default-separator-color));
			font-weight: 500;
			white-space: nowrap;
		}

		.aurora-data-table-selection-count b {
			display: inline-grid;
			min-width: 24px;
			height: 24px;
			box-sizing: border-box;
			padding: 0 6px;
			place-items: center;
			border-radius: var(--global-radius-xs);
			background: var(
				--data-table-selection-count-background,
				var(--data-table-default-selection-count-background)
			);
			color: var(--data-table-selection-count-color, var(--data-table-default-selection-count-color));
			font-family: var(--global-font-family-mono);
			font-size: 12px;
			font-weight: 600;
		}

		.aurora-data-table-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 10px;
			padding: var(--data-table-footer-padding, var(--data-table-default-footer-padding));
			border-top: var(--global-border-width) solid
				var(--data-table-separator-color, var(--data-table-default-separator-color));
			color: var(--data-table-footer-color, var(--data-table-default-footer-color));
			font-size: var(--data-table-footer-font-size, var(--data-table-default-footer-font-size));
		}

		.aurora-data-table-footer-start {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 6px 16px;
		}

		.aurora-data-table-page-size {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			white-space: nowrap;
			--select-default-height: var(--data-table-control-height, var(--data-table-default-control-height));
			--select-default-font-size: var(--data-table-footer-font-size, var(--data-table-default-footer-font-size));
		}

		.aurora-data-table-range {
			font-variant-numeric: tabular-nums;
		}

		.aurora-data-table[data-narrow] .aurora-data-table-footer {
			justify-content: center;
		}

		.aurora-data-table:has(> .aurora-data-table-body > :global(.aurora-table[data-cards])) {
			border: none;
			border-radius: 0;
			background: transparent;
			overflow: visible;
		}

		.aurora-data-table:has(> .aurora-data-table-body > :global(.aurora-table[data-cards]))
			.aurora-data-table-toolbar {
			padding-inline: 0;
			padding-top: 0;
			border-bottom: none;
			background: transparent;
		}

		.aurora-data-table:has(> .aurora-data-table-body > :global(.aurora-table[data-cards]))
			:is(.aurora-data-table-footer, .aurora-data-table-error, .aurora-data-table-more) {
			padding-inline: 0;
			border-top: none;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-data-table-selection {
				animation: none;
			}
		}
	}

	@keyframes aurora-data-table-rise {
		from {
			opacity: 0;
			translate: 0 8px;
		}
	}
</style>
