import type { Snippet } from 'svelte';
import type FilterBuilder from '../filters/builder.js';
import type { FilterGroup } from '../filters/model.js';

/** A column of a `Table`: what it shows, how it formats, sorts and sizes it. */
export interface TableColumn<Row = any> {
	/** Unique key of the column. Without `value` it is also the property of the row that the column shows. */
	key: string;
	/** Text of the header. */
	label?: string;
	/** How the value is formatted and sorted: `text` as is, `number` with `Intl.NumberFormat` (right-aligned, monospaced digits), `date` and `datetime` with `Intl.DateTimeFormat` (a `Date`, an ISO string, a timestamp or an object with `toJSDate()` such as a luxon `DateTime`), `boolean` as a check mark when true, `custom` with the `cellSnippet` of the table (sorted as text). Defaults to `text`. */
	type?: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'custom';
	/** Reads the value of the column from a row, for nested or computed values. Defaults to `row[key]`. */
	value?: (row: Row) => unknown;
	/** Turns the value into the text of the cell, instead of the formatting of `type`. Not called for empty values. */
	format?: (value: any, row: Row) => string;
	/** Options of `Intl.NumberFormat` for `number` columns, for example `{ style: 'currency', currency: 'EUR' }`. */
	numberFormat?: Intl.NumberFormatOptions;
	/** Options of `Intl.DateTimeFormat` for `date` and `datetime` columns. Defaults to the day, the month and the year in digits, plus hours and minutes for `datetime`. */
	dateFormat?: Intl.DateTimeFormatOptions;
	/** Text of an empty cell (`null`, `undefined`, an empty string). Defaults to the `empty` of the table. */
	empty?: string;
	/** Horizontal alignment of the header and the cells. Defaults to `end` for numbers, else `start`. */
	align?: 'start' | 'center' | 'end';
	/** Preferred width of the column, any CSS length (`120px`, `20%`): columns still shrink to fit the table, `minWidth` keeps them wider and makes the table scroll. A width set by resizing wins. */
	width?: string;
	/** Minimum width of the column, any CSS length. */
	minWidth?: string;
	/** Maximum width of the column, any CSS length: longer text is cut with an ellipsis. */
	maxWidth?: string;
	/** The header becomes a button that sorts by this column: ascending, descending, then unsorted. */
	sortable?: boolean;
	/** Compares two rows when the table sorts by this column on its own, instead of comparing the values. Return a negative number when `a` comes first in ascending order. */
	compare?: (a: Row, b: Row) => number;
	/** Adds the sorting by this column to the query sent to the backend, instead of `orderBy(key, direction)`. Used when the table does not sort on its own (`sorting="manual"`, `DataTable`). */
	sort?: (params: { builder: FilterBuilder; direction: 'asc' | 'desc' }) => FilterBuilder;
	/** Keeps the column visible on the left while the table scrolls sideways. Pinned columns are moved before the others; they scroll like the others while, together with the checkboxes and the actions, they would take more than half of the table. */
	pinned?: boolean;
	/** Hides the column until it is shown through `columnState` (for example with a `ColumnManager`). */
	hidden?: boolean;
	/** The column is always shown: `columnState` cannot hide it and the `ColumnManager` has no button to hide it. */
	required?: boolean;
	/** SVG path of the icon of the column in the `ColumnManager`. Defaults to an icon of its `type`. */
	icon?: string;
	/** Description of the column in the `ColumnManager`, also matched by its search. Defaults to `info`. */
	description?: string;
	/** With `resizable` on the table, `false` keeps this column at its size. */
	resizable?: boolean;
	/** Explanation of the column, shown in a tooltip next to the header. */
	info?: string;
	/** Content of the column in the footer of the table: a text, or a snippet that receives every row, for example to show a total. */
	footer?: string | Snippet<[{ rows: Row[]; column: TableColumn<Row> }]>;
	/** Content of the cells of this column, instead of the formatted value. */
	cell?: Snippet<[{ row: Row; value: any; column: TableColumn<Row> }]>;
	/** Content of the header of this column, instead of `label`. The sort arrow and the info icon stay. */
	header?: Snippet<[{ column: TableColumn<Row> }]>;
}

/** The sorting of a table: the key of the column and the direction. */
export interface TableSort {
	/** Key of the sorted column. */
	key: string;
	/** `asc` from the smallest value, `desc` from the largest. */
	direction: 'asc' | 'desc';
}

/** What the user changed about a column, in display order: plain data, ready to be saved. */
export interface TableColumnState {
	/** Key of the column. */
	key: string;
	/** Whether the column is shown. */
	visible: boolean;
	/** Width in pixels set by resizing. */
	width?: number;
	/** Whether the column is pinned on the left. */
	pinned?: boolean;
}

/** What a `DataTable` asks the server for. A change of page, page size, sorting, search or filters makes a new query. */
export interface DataTableQuery {
	/** Page to show, from 1. In `infinite` mode, the batch to load. */
	page: number;
	/** Rows per page, or per batch in `infinite` mode. */
	pageSize: number;
	/** Current sorting, if any. */
	sort?: TableSort;
	/** Text of the search field, trimmed: empty without a search. */
	search: string;
	/** Tree of the filters (the `value` of `Filters`), with complete conditions only. */
	filterValue: FilterGroup;
	/** The whole query for the backend: filters, search (an `ilike` group on `searchColumns`) and sorting. Send `builder.toJson()` together with `page` and `pageSize`. */
	builder: FilterBuilder;
}

/** What the `loader` of a `DataTable` returns. */
export interface DataTableLoadResult<Row = any> {
	/** Rows of the requested page or batch. */
	rows: Row[];
	/** Number of rows of the whole result, on every page. */
	total?: number;
	/** Number of pages, when the backend gives it instead of `total`. */
	pageCount?: number;
}

/** What the `onclick` of a `DataTableAction` receives. */
export interface DataTableActionContext<Row = any> {
	/** Selected rows (empty while `selectedAll`). */
	selected: Row[];
	/** Every row of the result is selected, except `excluded`. */
	selectedAll: boolean;
	/** Rows left out of `selectedAll`. */
	excluded: Row[];
	/** Number of selected rows; `undefined` when every row is selected and the total is unknown. */
	count: number | undefined;
	/** Empties the selection. */
	clear: () => void;
	/** The native click. */
	event: MouseEvent;
}

/** An action on the selected rows of a `DataTable`, drawn as a button of the selection bar. */
export interface DataTableAction<Row = any> {
	/** Text of the button. */
	label: string;
	/** SVG path of the icon. */
	icon?: string;
	/** `danger` for destructive actions, in the error color. */
	variant?: 'default' | 'danger';
	/** The action cannot run; with `disabledInfo` a tooltip says why. */
	disabled?: boolean;
	/** Shows a spinner on the button. The button also spins while the promise returned by `onclick` is pending. */
	loading?: boolean;
	/** Explanation of the action, in a tooltip on the button. */
	info?: string;
	/** Why the action is disabled, in a tooltip on the button. */
	disabledInfo?: string;
	/** Runs the action. Return a promise to show a spinner until it settles. */
	onclick: (context: DataTableActionContext<Row>) => void | Promise<unknown>;
}

