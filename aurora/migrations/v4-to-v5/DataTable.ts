import type { Changed, ComponentMigration, EventChange, ManualStep, Removal, Rename, SnippetChange } from '../types.js';
import paginator from './Paginator.js';
import { forwarded, innerCssVars } from './Table.js';

const table = forwarded('data-table', ['table-sort', 'table-look']);

const DYNAMIC = new Set([
	'headers',
	'resizableColumns',
	'noItemsText',
	'lang',
	'sortedBy',
	'sortDirection',
	'resizedColumnSizeWithPadding',
	'stickyMinContainerWidth',
	'loading',
	'onrowClick',
	'oncolumnResize',
	'headerSnippet',
	'headerLabelSnippet'
]);
const inDynamic = <T extends { name: string } | { from: string }>(list: T[]) =>
	list.filter((item) => DYNAMIC.has('name' in item ? item.name : item.from));

const both = (prefix: string, from: string, to: string): Removal[] => [
	{ name: `--${prefix}-${from}`, note: 'Renamed in the inner Table.', replacement: `--table-${to}` },
	{ name: `--${prefix}-default-${from}`, note: 'Renamed in the inner Table.', replacement: `--table-default-${to}` }
];

const gone = (prefix: string, name: string, note: string, replacement?: string): Removal[] => [
	{ name: `--${prefix}-${name}`, note, replacement },
	{ name: `--${prefix}-default-${name}`, note }
];

const selectionNote =
	'`selectable="multiple"` (or `"single"`) adds the checkboxes; `bind:selected` holds the rows, `selectedAll` + `excluded` the "whole result" selection.';

const shared = {
	renamed: [
		{ from: 'totalElements', to: 'total', note: 'Number of rows of the whole result; the table computes the pages from it and `pageSize`.' },
		{ from: 'searchBarColumns', to: 'searchColumns', note: 'Same `ilike` OR group in the query; setting it also shows the search field.' },
		{ from: 'selectedItems', to: 'selected' },
		{
			from: 'actionsForSelectedItems',
			to: 'selectionActions',
			note: 'Same objects, drawn by the table as in v4 (the extra ones in a "More actions" menu): `label`, `icon`, `disabled`, `loading`, `info`, `disabledInfo` stay; `onClick(e)` → `onclick({ selected, selectedAll, excluded, count, clear, event })` (`e.detail.nativeEvent` → `event`), and a returned promise shows a spinner; `variant: \'danger\'` is new. See `data-table-selection`.'
		},
		{ from: 'uniqueKey', to: 'rowKey', note: 'Also accepts a function `(row) => key`.' },
		{
			from: 'filters',
			to: 'filterFields',
			note: 'The v4 `Filter[]` becomes `FilterField[]` (see the Filters rule): the conditions are no longer inside the definitions but in `bind:filterValue`. See `data-table-filters`.'
		}
	] satisfies Rename[],
	removed: [
		{
			name: 'searchBarPlaceholder',
			note: 'The placeholder comes from `locale`; change it with `labels={{ search: \'...\' }}`.',
			replacement: 'labels'
		},
		{
			name: 'searchBarVisible',
			note: 'The search field shows when `searchColumns` is set (or with `searchable`); without columns it was a field that searched nothing. Drop `searchBarVisible={false}`.',
			replacement: 'searchable'
		},
		{
			name: 'quickFilters',
			note: 'Quick filters are `pinned` fields and `presets` of the Filters: pass them in `filterFields` and `filtersProps={{ presets }}`. See `data-table-quick-filters`.',
			replacement: 'filterFields'
		},
		{ name: 'quickFiltersVisible', note: 'Pinned fields of `filterFields` are always in the bar.' },
		{ name: 'editFilterMode', note: 'One way of editing filters: pills plus the "Filters" panel. Drop it.' },
		{
			name: 'showActiveFilters',
			note: 'Pass `filtersProps={{ showPills: false }}` to hide the pills.',
			replacement: 'filtersProps'
		},
		{ name: 'multiEditTabs', note: 'No tabs in the filters any more. Drop it.' },
		{
			name: 'filterLabels',
			note: 'Texts of the filters come from `locale`; change single ones with `filtersProps={{ labels: { ... } }}`.',
			replacement: 'filtersProps'
		},
		{ name: 'dateLocale', note: '`locale` sets the language of the filters and of the dates.', replacement: 'locale' },
	] satisfies Removal[]
};

const queryEvent: EventChange = {
	name: 'onpaginationChange',
	to: 'onquerychange',
	argument: { 'detail.page': 'page', 'detail.rowsPerPage': 'pageSize', 'detail.builder': 'builder', detail: '' },
	type: 'DataTableQuery',
	note: 'One callback for every change of page, page size, sorting, search and filters, with the page already back to 1 when needed. It is not called on mount. See `data-table-query`.'
};

const filtersEvent: Removal = {
	name: 'onfiltersChange',
	note: 'Merged into `onquerychange`: move its body there (or replace both with a `loader`). The builder now always has the search and the sorting. See `data-table-query`.',
	replacement: 'onquerychange'
};

const removeFilterEvents: Removal[] = [
	{
		name: 'onremoveFilter',
		note: 'Use `filtersProps={{ onremove: ({ conditions }) => ... }}`: it receives the removed conditions.',
		replacement: 'filtersProps'
	},
	{
		name: 'onremoveAllFilters',
		note: 'Use `filtersProps={{ onremove }}`: "Clear" calls it with every removed condition.',
		replacement: 'filtersProps'
	}
];

const sortEvent: EventChange = {
	name: 'onsort',
	to: 'onsortchange',
	argument: { 'detail.sortedBy': 'sort.key', 'detail.sortDirection': 'sort.direction', 'detail.sortModify': null, detail: '' },
	type: '{ sort: TableSort | undefined }',
	note: 'The sorting reaches `onquerychange` and `loader` on its own (with the `sort` of the column): delete a handler that only reloaded the rows.'
};

const searchSnippet: SnippetChange = {
	name: 'searchSnippet',
	v4: '{ handleSearchChange }',
	v5: '{ value, setValue }',
	note: '`handleSearchChange(text)` → `setValue(text)`; debounce the text in the app as v4 did.'
};

const removedFilterSnippets: Removal[] = [
	{
		name: 'customFilterChipSnippet',
		note: 'Pass `filtersProps={{ pillSnippet }}`: it receives `{ condition, field, operator, value }`.',
		replacement: 'filtersProps'
	},
	{
		name: 'customFilterSnippet',
		note: 'Pass `filtersProps={{ inputSnippet }}` for `custom` fields: it receives the condition and `setValue`.',
		replacement: 'filtersProps'
	}
];

const quickActionsVars: Removal[] = [
	{
		name: '--quick-actions-background-color',
		note: 'The selection bar is part of the table now.',
		replacement: '--data-table-selection-background'
	},
	{
		name: '--quick-actions-default-background-color',
		note: 'The selection bar is part of the table now.',
		replacement: '--data-table-default-selection-background'
	},
	...[
		'z-index',
		'selected-items-button-background-color',
		'selected-items-button-background-color-hover',
		'selected-items-button-background-color-disabled',
		'selected-items-button-color-disabled',
		'buttons-background-color',
		'buttons-background-color-hover',
		'buttons-background-color-disabled',
		'buttons-color',
		'buttons-color-disabled'
	].flatMap((name) => [
		{
			name: `--quick-actions-${name}`,
			note: 'The bar floats at the bottom of the table and its actions are text `Button`s: change them with the `--button-*` variables on the table, or drop it.'
		},
		{ name: `--quick-actions-default-${name}`, note: 'Drop it.' }
	])
];

const manual: ManualStep[] = [
	{
		id: 'data-table-query',
		summary:
			'v4 split one query in three callbacks (`onpaginationChange`, `onfiltersChange`, `onsort`) whose bodies were almost the same (load the page with `{ page, perPage, filtersBuilder }`), never reset the page and dropped the search from the builder of a page change. v5 has one `onquerychange(query)` with `{ page, pageSize, sort, search, filterValue, builder }`, the page already back to 1 after a change of filters, search, sorting or page size.',
		action:
			'Replace the handlers with one `onquerychange={(query) => load(query)}` that calls the service with `query.page`, `query.pageSize` and `query.builder`, then sets `rows`, `total` and `loading`; delete `page = 1` resets and the `filtersBuilder` kept in the page. Better, replace the whole thing with a `loader` (see `data-table-loader`).',
		when: { events: ['onpaginationChange', 'onfiltersChange', 'onsort', 'onfetchData'] }
	},
	{
		id: 'data-table-loader',
		summary:
			'With `loader={(query) => service.list(...)}` returning `{ rows, total }` the table loads by itself: loading state, aborted outdated requests, error with "Retry", page past the end, `reload()` after a create or delete. The first page from the `load` of SvelteKit goes in `rows` and `total`, so it is not loaded twice.',
		action:
			'Write `loader={async ({ page, pageSize, builder, signal }) => { const res = await service.list({ page, perPage: pageSize, filtersBuilder: builder }, { signal }); return { rows: res.data, total: res.meta.total }; }}` (or `pageCount: res.meta.lastPage`), pass `rows={data.rows}` and `total={data.total}` from `load`, and delete the handlers, `loading` and `maxPage` state. Call `table.reload()` (with `bind:this={table}`) where the page reloaded the list after saving.',
		when: { events: ['onpaginationChange', 'onfiltersChange', 'onfetchData'] }
	},
	{
		id: 'data-table-filters',
		summary:
			'`filters` (v4 `Filter[]`, definition and value together) becomes `filterFields` (`FilterField[]`, definitions only) plus `bind:filterValue` (the tree of conditions, as the `value` of Filters).',
		action:
			'Convert each `Filter` to a `FilterField` as the Filters rule says (`filters-fields`); where the page read the active values from `filters`, read `filterValue` (or `query.filterValue`) instead. Initial conditions go in `filterValue={createFilters([filterCondition(...)])}`.',
		when: { props: ['filters'] }
	},
	{
		id: 'data-table-quick-filters',
		summary:
			'The quick filters of the v4 tables (two incompatible models in PaginatedTable and DynamicTable) are fields of the Filters: `pinned` keeps a field as a pill in the bar, `presets` are chips with ready conditions. A "missing value" is the operator `empty`; a boolean with three states is `isTrue` / `isFalse` / no condition.',
		action:
			'For each quick filter add `pinned: true` to its field in `filterFields`; for ready-made choices pass `filtersProps={{ presets: [{ id, label, conditions }] }}`. Move the `modify` of custom quick filters to the `apply` of the field.',
		when: { props: ['quickFilters', 'quickFiltersVisible'] }
	},
	{
		id: 'data-table-selection',
		summary:
			'The selection keeps working across pages and has one model: `bind:selected`, plus `selectedAll` and `excluded` once the user picks "Select all N" in the bar (v4 PaginatedTable could not exclude rows and cleared `selectedItems` at every page). It is cleared when filters or search change. The header checkbox selects the rows of the page (v4 PaginatedTable: every row). The v4 `Action` objects keep working as `selectionActions`.',
		action:
			'Rename `actionsForSelectedItems` to `selectionActions` and, in each `onClick`, read the selection from the argument (`onclick: ({ selected, selectedAll, excluded, event }) => ...`) instead of the bound `selectedItems`; when `selectedAll` is true send the query (`builder`) and `excluded` to the backend instead of the ids. Destructive actions can take `variant: \'danger\'`. Where the bar must not show, pass `selectionBar={false}`.',
		when: { props: ['actionsForSelectedItems', 'selectedAll', 'selectedItems', 'unselectedItems'] }
	},
	{
		id: 'data-table-saved-columns',
		summary:
			'Apps saved the visible headers as `[{ name, order }]` in the user settings (`populateHeaders`, 53 times). v5 keeps the order, visibility, widths and pins as `columnState` = `[{ key, visible, width?, pinned? }]`, plain data.',
		action:
			'Keep the setting key and store `columnState` instead: restore it with `columnState={settings.value}` (old values: map `[{ name, order }]` to `{ key: name, visible: true }` in order, the others hidden) and save it in `oncolumnstatechange({ columnState })`, called when the user saves the view or resizes a column. Delete `populateHeaders` and the hand-made column drawers.',
		when: { props: ['headersToShowInTable', 'customizeHeaders'], events: ['onsaveHeadersToShow'] }
	},
	{
		id: 'data-table-wrappers',
		summary:
			'Many apps wrap the v4 tables (`StandardPaginatedTable`, `<Entity>PaginatedTable`, a `PaginatedTable` with `fetcher` in evote and epass, `LocalPaginatedTable` in lupette) mostly to repeat the same fetch, the same defaults (`lang="it"`, `editFilterMode`) and the same column drawer.',
		action:
			'Migrate the wrapper once to `DataTable` with a `loader`, then check whether it still adds anything: set `setDefaultLocale(\'it\')` in the root layout instead of `lang`, and use `columnManager` instead of the copied drawer. For rows already in memory (LocalPaginatedTable) use `Table` with `Paginator`: DataTable always asks the server.',
		scope: 'app'
	},
	{
		id: 'data-table-look',
		summary:
			'Default look of the prototype: one bordered box with the toolbar on top (search, filter pills, "Columns", the app buttons on the right), the table and a footer with "Rows per page", "1–20 of 312" and the paginator; the selection bar floats at the bottom of the table. Below the `cardBreakpoint` of the table the frame goes away and the rows become cards.',
		action:
			'Usually accept it. Remove page CSS that drew a box or a toolbar around the v4 table. App CSS on `.paginated-table`, `.searchbar-and-filter-container` or `.footer` must target `.aurora-data-table`, `.aurora-data-table-toolbar`, `.aurora-data-table-footer` or use the `class` parts.'
	}
];

const added = [
	'`loader({ ...query, signal })` with `onloaded`, `onerror`, `errorSnippet` and `reload()`.',
	'`pagination`: `pages`, `infinite` (with `onloadmore` when there is no `loader`) or `none`.',
	'`search` bindable, `searchable`, `filterValue` bindable, `filtersProps`, `searchBarProps`, `paginatorProps`, `columnManagerProps`.',
	'`columnManager`: "Columns" button with the `ColumnManager`; `oncolumnstatechange` on save and resize.',
	'Selection bar with "Select all N", `selectionActions` (with `variant: \'danger\'` and promises that spin), `selectionDisabled`, `selectionActionsSnippet` for extra content, `selectionBar`, `excluded`.',
	'`pageSizes`, `pageCount`, `rangeSnippet`, `searchSnippet`, `toolbarSnippet`, `labels`, `class` parts (`container`, `toolbar`, `footer`, `selectionBar`, `table`, `header`, `row`, `cell`).',
	'`--data-table-*` variables for the frame, the toolbar, the footer, the messages and the selection bar.',
	'Every prop of `Table`: `expandedSnippet`, `rowHref`, `actionsSnippet`, `actionsVisibility`, cards, `columnState`, `columnsKey`.'
];

const tableClass: Changed = {
	name: 'class',
	note: 'Flat parts: `container` (the whole box), `toolbar`, `footer`, `selectionBar`, and `table`, `header`, `row`, `cell` of the inner table (v4 `class={{ simpleTable: { ... } }}`).'
};

const pageEntry: Changed = {
	name: 'page',
	note: 'Still bindable and 1-based; the table now sets it back to 1 when filters, search, sorting or page size change, and to the last page when a load finds it past the end.'
};

const paginated = {
	from: 'PaginatedTable',
	to: 'DataTable',
	props: {
		renamed: [
			...table.props.renamed,
			...shared.renamed,
			{ from: 'rowsPerPage', to: 'pageSize', note: 'Still bindable, default 20.' },
			{ from: 'maxPage', to: 'pageCount', note: 'Pass `total` instead when it is known: the table computes the pages.' }
		],
		inverted: [
			{ from: 'hideActions', to: 'selectionBar' },
			{ from: 'hideSelectAll', to: 'selectAll' }
		],
		removed: [
			...table.props.removed,
			...shared.removed,
			{
				name: 'rowsPerPageOptions',
				note: 'Plain numbers: `pageSizes={[20, 50, 100]}` (v4 Dropdown items `{ label, value }`).',
				replacement: 'pageSizes'
			},
			{
				name: 'hideRowsPerPage',
				note: 'The selector hides with fewer than two sizes: `pageSizes={[pageSize]}`.',
				replacement: 'pageSizes'
			},
			{
				name: 'searchTimeoutDelay',
				note: 'Pass `searchBarProps={{ debounce: ms }}` (default 300, as v4).',
				replacement: 'searchBarProps'
			},
			{ name: 'showSelection', note: selectionNote, replacement: 'selectable' },
			{ name: 'selectionMode', note: `Its value goes in \`selectable\`. ${selectionNote}`, replacement: 'selectable' },

		],
		changed: [...table.props.changed.filter((c) => c.name !== 'class'), tableClass, pageEntry]
	},
	events: {
		changed: [queryEvent, sortEvent, ...table.events.changed.filter((e) => e.name !== 'onsort')],
		removed: [...table.events.removed, filtersEvent, ...removeFilterEvents]
	},
	snippets: {
		renamed: [
			...table.snippets.renamed,
			{ from: 'filterAppendSnippet', to: 'toolbarSnippet', note: 'At the end of the toolbar, after "Columns".' },
			{ from: 'searchBarSnippet', to: 'searchSnippet' },
			{ from: 'rangeDescriptorSnippet', to: 'rangeSnippet' }
		],
		parameters: [
			...table.snippets.parameters,
			searchSnippet,
			{
				name: 'rangeSnippet',
				v4: '{ page, maxPage, rowsPerPage, totalElements }',
				v5: '{ from, to, total, page, pageCount }',
				note: '`maxPage` → `pageCount`, `totalElements` → `total`; `from` and `to` are the first and last row shown.'
			}
		],
		removed: [
			...table.snippets.removed,
			...removedFilterSnippets,
			{
				name: 'footerSnippet',
				note: 'Change the parts instead: `rangeSnippet`, `pageSizes`, `paginatorProps`, `--data-table-footer-*`.',
				replacement: 'rangeSnippet'
			},
			{
				name: 'totalsSnippet',
				note: 'Totals go in the `footer` of the columns (a `<tfoot>` row), not above the table.'
			},
			{
				name: 'selectedItemsTextSnippet',
				note: 'Change the text with `labels={{ selected, selectedOne }}`; extra content goes in `selectionActionsSnippet`.',
				replacement: 'selectionActionsSnippet'
			}
		]
	},
	cssVars: {
		removed: [...table.cssVars, ...innerCssVars(paginator.cssVars, 'Paginator'), ...quickActionsVars]
	},
	manual: [...table.manual, ...manual],
	added
} satisfies ComponentMigration;

const enhanced = {
	...paginated,
	from: 'EnhancedPaginatedTable',
	props: {
		...paginated.props,
		removed: [
			...paginated.props.removed,
			{
				name: 'headersToShowInTable',
				note: 'The visible columns and their order are `columnState`; give `hidden: true` to the columns that start hidden. See `data-table-saved-columns`.',
				replacement: 'columnState'
			},
			{
				name: 'pinnableColumns',
				note: 'Pins are on by default; `columnManagerProps={{ pinnable: false }}` turns them off.',
				replacement: 'columnManagerProps'
			},
			{
				name: 'headerDrawerProps',
				note: 'Pass the props of the panel in `columnManagerProps`.',
				replacement: 'columnManagerProps'
			}
		],
		defaults: [
			{
				name: 'columnManager',
				v4: 'true',
				v5: 'false',
				keepV4: 'columnManager',
				behaviour: true,
				note: 'The "+" in the last header opened the drawer; now a "Columns" button in the toolbar.'
			}
		]
	},
	events: {
		...paginated.events,
		changed: [
			...paginated.events.changed,
			{
				name: 'onsaveHeadersToShow',
				to: 'oncolumnstatechange',
				argument: { 'detail.headersToShow': null, detail: '' },
				type: '{ columnState: TableColumnState[] }',
				note: 'Receives `columnState` (`{ key, visible, width?, pinned? }[]`, plain data) instead of the header objects. See `data-table-saved-columns`.'
			}
		]
	},
	snippets: {
		...paginated.snippets,
		removed: [
			...paginated.snippets.removed,
			...['headerDrawerContentSnippet', 'headerDrawerItemSnippet', 'headerDrawerHeadersToAddSnippet'].map((name) => ({
				name,
				note: 'Pass `columnManagerProps={{ columnSnippet, emptySnippet, actionsSnippet }}`.',
				replacement: 'columnManagerProps'
			}))
		]
	},
	cssVars: {
		removed: [
			...paginated.cssVars.removed,
			...gone('enhanced-paginated-table', 'customize-headers-icon-size', 'The "+" icon became the "Columns" button. Drop it.')
		]
	}
} satisfies ComponentMigration;

const dynamicVar = (from: string, to: string): Rename[] => [
	{ from: `--dynamic-table-${from}`, to: `--data-table-${to}` },
	{ from: `--dynamic-table-default-${from}`, to: `--data-table-default-${to}` }
];

const dynamic = {
	from: 'DynamicTable',
	to: 'DataTable',
	props: {
		renamed: [
			...inDynamic(table.props.renamed),
			...shared.renamed,
			{ from: 'totalRows', to: 'total' },
			{ from: 'unselectedItems', to: 'excluded', note: 'Rows left out of `selectedAll`.' },
			{ from: 'searchText', to: 'search' },
			{ from: 'showActions', to: 'selectionBar' },
			{ from: 'quickActionsDisabled', to: 'selectionDisabled' },
			{
				from: 'customizeHeaders',
				to: 'columnManager',
				note: 'A "Columns" button in the toolbar instead of the "+" in the last header.'
			}
		],
		inverted: [{ from: 'selectedAllDisabled', to: 'selectAll' }],
		removed: [
			...inDynamic(table.props.removed),
			...shared.removed,
			{
				name: 'headersToShowInTable',
				note: 'The visible columns and their order are `columnState`; give `hidden: true` to the columns that start hidden. See `data-table-saved-columns`.',
				replacement: 'columnState'
			},
			{
				name: 'subHeaders',
				note: 'Sub-rows are a nested `Table` inside `expandedSnippet`. See `data-table-rows`.',
				replacement: 'expandedSnippet'
			},
			{
				name: 'cellEdit',
				note: 'No inline cell editor: put a field or a button opening a Dialog in the `cell` snippet of the column. See `data-table-cell-edit`.'
			},
			{ name: 'showSelect', note: selectionNote, replacement: 'selectable' },
			{
				name: 'selectMode',
				note: `Its value goes in \`selectable\` (v4 default \`single\`). ${selectionNote}`,
				replacement: 'selectable'
			},
			{
				name: 'showExpand',
				note: 'Rows expand when `expandedSnippet` is set (`expandable(row)` limits which ones); selection and expansion work together now.',
				replacement: 'expandedSnippet'
			},
			{
				name: 'filtersVisible',
				note: 'The filters show when `filterFields` has fields.',
				replacement: 'filterFields'
			},
			{ name: 'dynamicFilters', note: 'One filters UI: pills plus the "Filters" panel. Drop it.' },

			...['renderedRowsNumber', 'sectionRowsNumber', 'sectionThreshold', 'backwardThresholdPixel', 'forwardThresholdPixel'].map(
				(name) => ({
					name,
					note: 'Replaced by the virtual rows of the table: above `virtualize` rows (200 by default) only the rows in view are in the page, however many are loaded. Drop it.',
					replacement: 'virtualize'
				})
			),
			{
				name: 'numberOfResultsVisible',
				note: 'The footer always shows "40 of 312" with `pagination="infinite"`.'
			},
			{ name: 'endLineVisible', note: 'No end line. Drop it.' },
			{
				name: 'useSelectedItemsOnly',
				note: '"Select all" in the header selects the loaded rows; "Select all N" in the bar sets `selectedAll`.'
			},
			{
				name: 'pinnableColumns',
				note: 'Pins are on by default; `columnManagerProps={{ pinnable: false }}` turns them off.',
				replacement: 'columnManagerProps'
			},
			{
				name: 'headerDrawerProps',
				note: 'Pass the props of the panel in `columnManagerProps`.',
				replacement: 'columnManagerProps'
			}
		],
		changed: [
			...inDynamic(table.props.changed),
			{
				name: 'class',
				note: 'Same parts `container`, `header`, `row`, `cell`, plus `toolbar`, `footer`, `selectionBar`, `table`; `container` is now the whole box with toolbar and footer.'
			}
		],
		defaults: [
			{
				name: 'pagination',
				v4: "'infinite'",
				v5: "'pages'",
				keepV4: 'pagination="infinite"',
				behaviour: true,
				note: 'DynamicTable always scrolled for more rows.'
			}
		],
		types: [
			{
				name: 'rows',
				v4: '{ item: Row; subItems: SubRow[] }[]',
				v5: 'Row[]',
				note: 'Plain rows. See `data-table-rows`.'
			}
		]
	},
	events: {
		changed: [
			sortEvent,
			...inDynamic(table.events.changed),
			{
				name: 'onfiltersChange',
				to: 'onquerychange',
				argument: { 'detail.builder': 'builder', detail: '' },
				type: 'DataTableQuery',
				note: 'Called for every change of search, filters and sorting (after 300 ms of typing; v4 800 ms) with the first batch (`page: 1`). See `data-table-query`.'
			},
			{
				name: 'onfetchData',
				to: 'onloadmore',
				argument: {},
				type: 'DataTableQuery',
				note: 'Receives the query of the next batch (`page` is its number); append its rows to `rows`. With a `loader` the table appends them by itself. It now fires also when the first rows do not fill the table.'
			},
			{
				name: 'onsaveHeadersToShow',
				to: 'oncolumnstatechange',
				argument: { 'detail.headersToShow': null, detail: '' },
				type: '{ columnState: TableColumnState[] }',
				note: 'Receives `columnState` instead of the header objects. See `data-table-saved-columns`.'
			}
		],
		removed: [
			...inDynamic(table.events.removed),
			...removeFilterEvents,
			{
				name: 'oncellClick',
				note: 'Put a button or a link in the `cell` snippet of the column, or use `onrowclick(row, event)` and read `event.target`.',
				replacement: 'onrowclick'
			},
			{ name: 'onsaveCellEdit', note: 'No inline cell editor. See `data-table-cell-edit`.' },
			{
				name: 'onremoveCustomQuickFilter',
				note: 'Quick filters are Filters fields: use `filtersProps={{ onremove }}`.',
				replacement: 'filtersProps'
			},
			{
				name: 'onapplyCustomQuickFilter',
				note: 'Quick filters are Filters fields: their query comes from the `apply` of the field.',
				replacement: 'filterFields'
			},
			{
				name: 'onscroll',
				note: 'The table scrolls inside `.aurora-table-scroll` only with `--table-max-height`; listen to the page scroll otherwise. Infinite loading no longer needs it.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'customRowSnippet',
				to: 'cellSnippet',
				note: 'Still draws the cells of `custom` columns; a column can also have its own `cell` snippet.'
			},
			{
				from: 'rowAppendSnippet',
				to: 'actionsSnippet',
				note: 'The column of row buttons, pinned on the right; its header has no content (drop the `index === -1` branch).'
			},
			{ from: 'appendSnippet', to: 'toolbarSnippet', note: 'At the end of the toolbar, after "Columns".' },
			{ from: 'searchBarSnippet', to: 'searchSnippet' }
		],
		parameters: [
			{
				name: 'cellSnippet',
				v4: '{ index, columnIndex, header, row }',
				v5: '{ row, value, column }',
				note: '`row` is the row itself (v4 `row.item`), `header` → `column` (its `value` is now `key`); `index` and `columnIndex` are gone.'
			},
			{ name: 'actionsSnippet', v4: '{ index, row? }', v5: '{ row }', note: '`row.item` → `row`.' },
			searchSnippet
		],
		removed: [
			...inDynamic(table.snippets.removed),
			...removedFilterSnippets,
			{ name: 'filterAppendSnippet', note: 'Use `toolbarSnippet`.', replacement: 'toolbarSnippet' },
			...['subHeaderSnippet', 'subHeaderLabelSnippet', 'subRowAppendSnippet', 'subRowActionsSnippet', 'customSubRowSnippet'].map(
				(name) => ({
					name,
					note: 'Sub-rows are a nested `Table` inside `expandedSnippet`, with its own columns and snippets. See `data-table-rows`.',
					replacement: 'expandedSnippet'
				})
			),
			...['customQuickFilterSnippet', 'selectionSnippet', 'itemLabelSnippet', 'chipLabelSnippet'].map((name) => ({
				name,
				note: 'Quick filters are Filters fields: customize them with `filtersProps={{ pillSnippet, inputSnippet }}`.',
				replacement: 'filtersProps'
			})),
			...['headerDrawerContentSnippet', 'headerDrawerItemSnippet', 'headerDrawerHeadersToAddSnippet'].map((name) => ({
				name,
				note: 'Pass `columnManagerProps={{ columnSnippet, emptySnippet, actionsSnippet }}`.',
				replacement: 'columnManagerProps'
			}))
		]
	},
	cssVars: {
		renamed: [...dynamicVar('background-color', 'background')],
		removed: [
			{
				name: '--dynamic-table-max-height',
				note: 'Renamed in the inner Table, default `none` (v4 70vh): set it to keep the table scrolling inside.',
				replacement: '--table-max-height'
			},
			{
				name: '--dynamic-table-default-max-height',
				note: 'Renamed in the inner Table.',
				replacement: '--table-default-max-height'
			},
			...both('dynamic-table', 'header-padding', 'header-padding'),
			...both('dynamic-table', 'header-font-size', 'header-font-size'),
			...both('dynamic-table', 'header-font-weight', 'header-font-weight'),
			...both('dynamic-table', 'header-background-color', 'header-background'),
			...both('dynamic-table', 'header-hover-color', 'header-hover-color'),
			{
				name: '--dynamic-table-default-hover-color',
				note: 'Renamed in the inner Table.',
				replacement: '--table-default-header-hover-color'
			},
			...both('dynamic-table', 'row-background-color-hover', 'row-hover-background'),
			...both('dynamic-table', 'selected-row-background-color', 'row-selected-background'),
			...both('dynamic-table', 'expanded-row-background-color', 'detail-background'),
			...both('dynamic-table', 'sticked-background-color', 'pinned-background'),
			...both('dynamic-table', 'non-resizable-header-width', 'control-size'),
			...both('dynamic-table', 'resizer-color', 'resizer-color'),
			...gone('dynamic-table', 'header-height', 'The header is as tall as its padding and text.', '--table-header-padding'),
			...gone('dynamic-table', 'row-min-height', 'Rows are as tall as their padding and content.', '--table-cell-padding'),
			...gone('dynamic-table', 'header-border-radius', 'The rounded corners are on the whole box.', '--data-table-border-radius'),
			...gone('dynamic-table', 'header-label-margin', 'The header spaces its label, arrow and info icon.'),
			...gone('dynamic-table', 'header-label-font-size', 'One size for the header.', '--table-header-font-size'),
			...gone('dynamic-table', 'border-collapse', 'The table draws its own separators.', '--table-separator-color'),
			...gone('dynamic-table', 'cell-border', 'The table draws its own separators.', '--table-separator-color'),
			...gone('dynamic-table', 'subheader-background-color', 'Sub-rows are a nested Table in `expandedSnippet`.'),
			...gone('dynamic-table', 'row-disabled-background-color', 'No disabled rows: give them a class with `rowClass` and set `--table-row-background` in it.'),
			...gone('dynamic-table', 'customize-headers-icon-size', 'The "+" icon became the "Columns" button.'),
			...gone('dynamic-table', 'cell-editor-background-color', 'No inline cell editor.'),
			...gone('dynamic-table', 'quick-filter-background-color', 'Quick filters are Filters pills.'),
			...['end-line-background-color', 'end-line-color', 'end-line-text-color'].flatMap((name) =>
				gone('dynamic-table', name, 'No end line.')
			),
			...quickActionsVars
		]
	},
	manual: [
		...table.manual,
		...manual,
		{
			id: 'data-table-rows',
			summary:
				'DynamicTable wanted `rows: { item, subItems }[]` (62 mappings in the apps) and drew the sub-rows with `subHeaders` and the `subRow*` snippets. v5 takes plain rows; the detail of a row is `expandedSnippet`, where a sub-table is a nested `Table`.',
			action:
				'Pass the items directly (`rows={items}` instead of `items.map((item) => ({ item, subItems: [] }))`), read `row` instead of `row.item` in the snippets. Where `subItems` were used, write `expandedSnippet({ row })` with `<Table rows={row.lines} columns={subColumns} />`.',
			when: { props: ['rows', 'subHeaders', 'showExpand'] }
		},
		{
			id: 'data-table-cell-edit',
			summary:
				'The inline cell editor (`cellEdit`, `cellEditorInfo`, `onsaveCellEdit`) is gone: it was active in two apps only and edited the wrong row after scrolling.',
			action:
				'In the `cell` snippet of an editable column put a small field that saves on change, or a button that opens a Dialog with the form; save there and call `reload()` or update the row in `rows`.',
			when: { props: ['cellEdit'], events: ['onsaveCellEdit'] }
		}
	],
	added
} satisfies ComponentMigration;

export default [paginated, enhanced, dynamic] satisfies ComponentMigration[];
