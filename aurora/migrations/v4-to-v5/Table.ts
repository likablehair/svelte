import type { ComponentMigration, Rename, Removal } from '../types.js';

const both = (from: string, to: string): Rename[] => [
	{ from: `--simple-table-${from}`, to: `--table-${to}` },
	{ from: `--simple-table-default-${from}`, to: `--table-default-${to}` }
];

const gone = (name: string, note: string, replacement?: string, withDefault = true): Removal[] => [
	{ name: `--simple-table-${name}`, note, replacement },
	...(withDefault ? [{ name: `--simple-table-default-${name}`, note }] : [])
];

export default {
	from: 'SimpleTable',
	to: 'Table',
	props: {
		renamed: [
			{
				from: 'headers',
				to: 'columns',
				note: 'Each header becomes a column with another shape: see `table-columns`.'
			},
			{ from: 'items', to: 'rows' },
			{ from: 'resizableColumns', to: 'resizable' },
			{ from: 'calculateRowClasses', to: 'rowClass', note: 'Same function `(row) => classes`; it may now also return an array or an object, like `class`.' },
			{ from: 'noItemsText', to: 'noDataTitle' },
			{ from: 'lang', to: 'locale', note: '`it` and `en` keep working; `locale` also sets the formatting of numbers and dates. Without it the table follows `setDefaultLocale`.' }
		],
		removed: [
			{
				name: 'sortedBy',
				note: '`sortedBy` and `sortDirection` are one prop: `bind:sort` = `{ key, direction }` or `undefined`. See `table-sort`.',
				replacement: 'sort'
			},
			{
				name: 'sortDirection',
				note: 'Part of `sort` = `{ key, direction }` (see `sortedBy`).',
				replacement: 'sort'
			},
			{
				name: 'resizedColumnSizeWithPadding',
				note: 'Widths live in `columnState` (`[{ key, visible, width?, pinned? }]`, in display order, widths in pixels), with order, visibility and pins: bind it or listen to `oncolumnstatechange` to save it, or pass `columnsKey` to keep it in the browser.',
				replacement: 'columnState'
			},
			{
				name: 'pointerOnRowHover',
				note: 'Rows with `onrowclick` or `rowHref` show the pointer on their own; other rows are not clickable, so the pointer would mislead.'
			},
			{
				name: 'doubleClickActive',
				note: 'No double click on rows: it was never used and delayed every click by 250 ms. Put the action in `actionsSnippet` or in `onrowclick`.'
			},
			{ name: 'doubleClickDelay', note: 'Removed with the double click (see `doubleClickActive`).' },
			{
				name: 'calculateRowStyles',
				note: 'Return a class from `rowClass` and style it in the app CSS; for the background set `--table-row-background` in that class (pinned cells follow it), for the text `color` and `font-weight`.',
				replacement: 'rowClass'
			},
			{
				name: 'stickyMinContainerWidth',
				note: 'No fixed width any more: pinned columns scroll with the others only while, with the checkboxes and the actions, they would take more than half of a table that scrolls sideways (`data-pins-off` on the root); below `cardBreakpoint` (640px of the table) the rows become cards.'
			}
		],
		changed: [
			{
				name: 'loading',
				note: 'With rows it shows a thin progress bar under the header, dims the rows and sets `aria-busy`; without rows it shows `loadingRows` placeholder rows (v4: a bar only).'
			},
			{
				name: 'class',
				note: 'Same parts plus `table`; `header` now goes on every header cell (v4: on the `<thead>`), `row` also on the cards.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onsort',
				to: 'onsortchange',
				argument: { 'detail.sortedBy': 'sort.key', 'detail.sortDirection': 'sort.direction', 'detail.sortModify': null, detail: '' },
				type: '{ sort: TableSort | undefined }',
				note: '`sort` is `undefined` when the user removes the sorting (v4: `sortedBy` undefined and `sortDirection` left at `desc`). `sortModify` is now the `sort` function of the column, used by `DataTable` to build the query. See `table-sort`.'
			},
			{
				name: 'onrowClick',
				to: 'onrowclick',
				argument: { 'detail.item': '', detail: '' },
				type: '(row: Row, event: MouseEvent | KeyboardEvent)',
				note: 'The row is the first argument, the native event the second. With it the rows are focusable and react to Enter and Space; clicks on buttons, links and fields inside the row no longer reach it. When the click opens a page, prefer `rowHref`: see `table-row-links`.'
			}
		],
		removed: [
			{
				name: 'onrowDoubleClick',
				note: 'No double click on rows (see `doubleClickActive`).'
			},
			{
				name: 'oncolumnResize',
				note: 'Use `oncolumnstatechange({ columnState })`: it is called once at the end of a resize (v4 called `oncolumnResize` for every column on any mouseup in the page) and carries the widths of every column.',
				replacement: 'oncolumnstatechange'
			}
		]
	},
	snippets: {
		renamed: [
			{ from: 'customSnippet', to: 'cellSnippet', note: 'Still draws the cells of `custom` columns; a column can also have its own `cell` snippet. See `table-cells`.' },
			{ from: 'appendSnippet', to: 'actionsSnippet', note: 'The column of row buttons: always visible as in v4, and now pinned on the right while scrolling (`actionsVisibility="hover"` shows it only on hover and focus). Its header cell is no longer drawn by the snippet (v4 called it with `index: -1` and no item).' }
		],
		parameters: [
			{
				name: 'cellSnippet',
				v4: '{ index, columnIndex, header, item }',
				v5: '{ row, value, column }',
				note: '`item` → `row`, `header` → `column` (its `value` is now `key`), `value` is the value of the cell; `index` and `columnIndex` are gone.'
			},
			{
				name: 'actionsSnippet',
				v4: '{ index, item? }',
				v5: '{ row }',
				note: '`item` → `row`; drop the `{#if index === -1}` branch of the header cell.'
			}
		],
		removed: [
			{
				name: 'headerSnippet',
				note: 'Give the column its own `header` snippet (`{ column }`); the sort arrow and the info icon stay around it.'
			},
			{
				name: 'headerLabelSnippet',
				note: 'Give the column its own `header` snippet (`{ column }`).'
			},
			{
				name: 'prependSnippet',
				note: 'For checkboxes use `selectable` (with `bind:selected`); for anything else add a first column with a `cell` snippet, `pinned` if it must stay visible.'
			},
			{
				name: 'stickyAppendSnippet',
				note: 'The `actionsSnippet` column is always pinned on the right; its header has no content.'
			}
		]
	},
	cssVars: {
		renamed: [
			...both('background-color', 'background'),
			...both('header-background-color', 'header-background'),
			...both('header-font-weight', 'header-font-weight'),
			...both('header-padding', 'header-padding'),
			...both('separator-color', 'separator-color'),
			...both('width', 'width'),
			...both('row-hover-background-color', 'row-hover-background'),
			...both('loader-height', 'progress-height'),
			...both('loader-background-color', 'progress-color'),
			...both('resizer-color', 'resizer-color'),
			...both('non-resizable-header-width', 'control-size'),
			...both('sticked-background-color', 'pinned-background'),
			{ from: '--simple-table-header-hover-color', to: '--table-header-hover-color' },
			{ from: '--simple-table-default-hover-color', to: '--table-default-header-hover-color' },
			{ from: '--simple-table-header-font-size', to: '--table-header-font-size' },
			{ from: '--simple-table-max-height', to: '--table-max-height', note: 'The table scrolls inside and its header stays on top.' }
		],
		removed: [
			...gone('header-height', 'The header is as tall as its padding and text.', '--table-header-padding'),
			...gone('row-height', 'Rows are as tall as their padding and content.', '--table-cell-padding'),
			...gone('header-border-radius', 'The rounded corners are on the whole table.', '--table-border-radius'),
			...gone('header-label-margin', 'The label, the sort arrow and the info icon are spaced by the header.'),
			...gone('overflow-x', 'The table always scrolls sideways when it does not fit.'),
			...gone('loader-border-radius', 'The progress bar is always rounded.'),
			...['min-width', 'height', 'min-height'].flatMap((name) =>
				gone(name, 'Size the table with the `class` of `container` or a wrapper; for a scrolling table use `--table-max-height`.', undefined, false)
			),
			...gone('max-width', 'Size the table with `--table-width`, the `class` of `container` or a wrapper.', undefined, false)
		]
	},
	manual: [
		{
			id: 'table-columns',
			summary:
				'`headers` become `columns`: `value` → `key`, `type: { key, params }` → a flat `type` and options. `string` → `text` (or no type), `number` → `number` (now formatted and right-aligned), `date` with a luxon `format` → `date` or `datetime` with `dateFormat` (Intl options, language from `locale`), `custom` stays `custom`, `icon` and `checkbox` are gone (they ignored the value). `nullText` → `empty` (also when it was a function: use `format` or `cell`), `sortModify` → `sort` with `{ builder, direction }` instead of `{ builder, sortDirection }`, `minWidth`/`maxWidth`/`width` accept any CSS length, `pinned` stays, `locked` and `data` are gone.',
			action:
				'Rewrite each header object. A `date` column with `{ format: \'dd/MM/yyyy\', locale: \'it\' }` usually needs no options: the default is day, month and year in digits in the language of `locale`; luxon values still work. Remove `icon` columns or draw the icon with a `cell` snippet. Where a header had `width` in %, keep it: it is a preferred width; use `minWidth` when the column must not shrink.',
			when: { props: ['headers'] }
		},
		{
			id: 'table-cells',
			summary:
				'`customSnippet` (now `cellSnippet`) usually holds a chain `{#if header.value == \'a\'} … {:else if header.value == \'b\'} …`. It keeps working with `column.key`, but every column can carry its own `cell` snippet, and formatting that v4 apps did by hand is now built in: dates (`type: \'date\'`), money (`type: \'number\', numberFormat: { style: \'currency\', currency: \'EUR\' }`), yes/no (`type: \'boolean\'`), empty text (`empty`).',
			action:
				'Mechanically: `header.value` → `column.key`, `item` → `row`. Then, branch by branch, replace hand-made formatting with the column type, and move the remaining branches to top-level snippets referenced by `cell` in the column definition; delete `cellSnippet` when it is empty.',
			when: { snippets: ['customSnippet'] }
		},
		{
			id: 'table-sort',
			summary:
				'v4 SimpleTable only showed the arrow: the app sorted the items (or the server did). v5 sorts the rows by itself (`sorting="local"`, the default) by the value of the column, or with its `compare(a, b)`.',
			action:
				'Where `onsort` sorted the items in the app, delete that code and let the table sort. Where the server sorts (the handler reloads the data), add `sorting="manual"` and keep the handler as `onsortchange({ sort })`. Replace `bind:sortedBy` / `bind:sortDirection` with `bind:sort`.',
			when: { props: ['sortedBy', 'sortDirection'], events: ['onsort'] }
		},
		{
			id: 'table-row-links',
			summary:
				'About half of the row click handlers only navigate (`goto(\'/x/\' + item.id)`). `rowHref` makes the row a real link: Ctrl-click and middle click open a new tab, SvelteKit preloads it, keyboard and screen readers reach it.',
			action:
				'Where `onrowClick` only calls `goto(url)`, replace it with `rowHref={(row) => url}`. Keep `onrowclick` for actions that are not a page (opening a dialog, selecting).',
			when: { events: ['onrowClick'] }
		},
		{
			id: 'table-look',
			summary:
				'Default look changed to the prototype: bordered rounded box, small uppercase grey headers, 9px × 12px cells (v4: 60px rows), monospaced numbers and dates, "—" in empty cells, hover and selected rows tinted; below 640px of width the rows become cards (`cardBreakpoint`).',
			action:
				'Usually accept it. For the v4 density set `--table-cell-padding`; for blank empty cells pass `empty=""`; to keep the sideways scrolling on phones pass `cardBreakpoint={false}`. App CSS on `.simple-table`, `.item-tr`, `.thead` must target `.aurora-table`, `.aurora-table-row`, `.aurora-table-header` or use the `class` parts.'
		}
	],
	added: [
		'`sorting="manual"`, `onsortchange`, `compare` per column.',
		'Column types `datetime` and `boolean`, `value(row)`, `format`, `numberFormat`, `dateFormat`, `empty`, `align`, `hidden`, `resizable`, `info` (tooltip), `footer` (text or snippet), `cell` and `header` snippets.',
		'`selectable` (`single` / `multiple`, shift-click ranges) with `bind:selected`, `selectedAll`, `excluded`, `onselectionchange`.',
		'`expandedSnippet`, `bind:expanded`, `expandable`, `onexpandedchange`.',
		'`rowHref`, `rowKey`, keyboard support for `onrowclick`.',
		'`actionsVisibility="hover"`: the buttons of `actionsSnippet` show only on hover and focus, as in the prototype.',
		'`bind:columnState`, `oncolumnstatechange`, `columnsKey`; resizing with the keyboard.',
		'Cards below `cardBreakpoint`, `cardTitle`, `cardColumns` (the other columns behind "Show more fields").',
		'`loadingRows`, `caption`, `labels`, `bind:tableElement`, native attributes on the root, `data-cards`, `data-loading`, `data-resizing`, `data-actions-visibility`, `data-selected`, `data-expanded`.',
		'`--table-color`, `-row-background`, `-border`, `-border-radius`, `-font-size`, `-header-color`, `-header-letter-spacing`, `-header-text-transform`, `-header-sorted-color`, `-sort-icon-size`, `-info-icon-size`, `-cell-padding`, `-row-selected-*`, `-number-*`, `-date-*`, `-empty-color`, `-boolean-*`, `-pinned-shadow`, `-actions-*`, `-expand-icon-size`, `-detail-*`, `-footer-*`, `-loading-opacity`, `-resizer-width`, `-card-*`, `-focus-ring-*`, `-duration`, `-easing`.'
	]
} satisfies ComponentMigration;
