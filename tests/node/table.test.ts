import { describe, expect, test } from 'vitest';
import type { TableColumn } from '../../src/lib/utils/table/types.js';
import {
	cellFormatter,
	cellValue,
	columnAlign,
	isEmptyValue,
	keyOf,
	toDate
} from '../../src/lib/utils/table/values.js';
import { nextSort, sortRows } from '../../src/lib/utils/table/sort.js';
import {
	fullColumnState,
	isColumnState,
	visibleColumns,
	withWidths
} from '../../src/lib/utils/table/columns.js';
import {
	pageSelectionState,
	rowRange,
	selectionChecker,
	setRowsSelected
} from '../../src/lib/utils/table/selection.js';

type Row = { id: number; name: string | null; price?: number; day?: unknown; nested?: { city: string } };

const rows: Row[] = [
	{ id: 1, name: 'beta', price: 10, day: '2026-09-03' },
	{ id: 2, name: 'Alpha', price: 2, day: new Date(2026, 8, 1) },
	{ id: 3, name: null, price: undefined, day: null },
	{ id: 4, name: 'alpha 10', price: 30, day: 1788480000000 },
	{ id: 5, name: 'alpha 9', price: 2.5, day: { toJSDate: () => new Date(2026, 8, 2) } }
];

describe('values', () => {
	test('reads the key of a row from a property or a function', () => {
		expect(keyOf(rows[0], 'id')).toBe(1);
		expect(keyOf(rows[0], (row: Row) => `row-${row.id}`)).toBe('row-1');
	});

	test('reads the value of a column from the key or from value()', () => {
		expect(cellValue(rows[0], { key: 'name' })).toBe('beta');
		expect(cellValue({ id: 9, name: 'x', nested: { city: 'Rome' } }, { key: 'city', value: (row: Row) => row.nested?.city })).toBe('Rome');
	});

	test('treats null, undefined, empty strings and invalid numbers or dates as empty', () => {
		for (const value of [null, undefined, '', Number.NaN, new Date('nope')]) expect(isEmptyValue(value)).toBe(true);
		for (const value of [0, false, ' ', 'x', new Date()]) expect(isEmptyValue(value)).toBe(false);
	});

	test('turns dates, ISO strings, timestamps and luxon-like objects into a Date', () => {
		expect(toDate(new Date(2026, 0, 2))?.getDate()).toBe(2);
		expect(toDate('2026-09-03T10:00:00')?.getHours()).toBe(10);
		expect(toDate(0)?.getTime()).toBe(0);
		expect(toDate({ toJSDate: () => new Date(2026, 8, 2) })?.getDate()).toBe(2);
		expect(toDate('not a date')).toBeUndefined();
		expect(toDate({})).toBeUndefined();
	});

	test('formats numbers and dates with Intl in the locale', () => {
		const euro = cellFormatter({ key: 'price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }, 'it');
		expect(euro(1234.5, rows[0])).toBe('1234,50 €');
		expect(cellFormatter({ key: 'price', type: 'number' }, 'en')(1234.5, rows[0])).toBe('1,234.5');
		expect(cellFormatter({ key: 'day', type: 'date' }, 'it')(new Date(2026, 8, 3), rows[0])).toBe('03/09/2026');
		expect(cellFormatter({ key: 'day', type: 'datetime' }, 'it')('2026-09-03T09:05:00', rows[0])).toBe('03/09/2026, 09:05');
		expect(cellFormatter({ key: 'day', type: 'date', dateFormat: { month: 'long' } }, 'en')(new Date(2026, 8, 3), rows[0])).toBe('September');
	});

	test('falls back to the text of values it cannot format', () => {
		expect(cellFormatter({ key: 'price', type: 'number' }, 'en')('abc', rows[0])).toBe('abc');
		expect(cellFormatter({ key: 'day', type: 'date' }, 'en')('soon', rows[0])).toBe('soon');
	});

	test('format() wins over the type', () => {
		const column: TableColumn<Row> = { key: 'price', type: 'number', format: (value, row) => `${value} for ${row.name}` };
		expect(cellFormatter(column, 'en')(10, rows[0])).toBe('10 for beta');
	});

	test('aligns numbers at the end unless the column says otherwise', () => {
		expect(columnAlign({ key: 'a', type: 'number' })).toBe('end');
		expect(columnAlign({ key: 'a' })).toBe('start');
		expect(columnAlign({ key: 'a', type: 'number', align: 'center' })).toBe('center');
	});
});

describe('sorting', () => {
	test('cycles ascending, descending, unsorted, and starts again on another column', () => {
		expect(nextSort(undefined, 'name')).toEqual({ key: 'name', direction: 'asc' });
		expect(nextSort({ key: 'name', direction: 'asc' }, 'name')).toEqual({ key: 'name', direction: 'desc' });
		expect(nextSort({ key: 'name', direction: 'desc' }, 'name')).toBeUndefined();
		expect(nextSort({ key: 'name', direction: 'desc' }, 'price')).toEqual({ key: 'price', direction: 'asc' });
	});

	test('sorts text with the collator: case and accents ignored, numbers in natural order, empty values last', () => {
		const columns: TableColumn<Row>[] = [{ key: 'name' }];
		const names = (sorted: Row[]) => sorted.map((row) => row.name);
		expect(names(sortRows(rows, columns, { key: 'name', direction: 'asc' }, 'en'))).toEqual(['Alpha', 'alpha 9', 'alpha 10', 'beta', null]);
		expect(names(sortRows(rows, columns, { key: 'name', direction: 'desc' }, 'en'))).toEqual(['beta', 'alpha 10', 'alpha 9', 'Alpha', null]);
	});

	test('sorts numbers and dates by value', () => {
		const columns: TableColumn<Row>[] = [{ key: 'price', type: 'number' }, { key: 'day', type: 'date' }];
		expect(sortRows(rows, columns, { key: 'price', direction: 'asc' }, 'en').map((row) => row.id)).toEqual([2, 5, 1, 4, 3]);
		expect(sortRows(rows, columns, { key: 'day', direction: 'asc' }, 'en').map((row) => row.id)).toEqual([2, 5, 1, 4, 3]);
		expect(sortRows(rows, columns, { key: 'day', direction: 'desc' }, 'en').map((row) => row.id)).toEqual([4, 1, 5, 2, 3]);
	});

	test('uses compare() of the column, reversed for descending', () => {
		const columns: TableColumn<Row>[] = [{ key: 'id', compare: (a, b) => (a.id % 2) - (b.id % 2) || a.id - b.id }];
		expect(sortRows(rows, columns, { key: 'id', direction: 'asc' }, 'en').map((row) => row.id)).toEqual([2, 4, 1, 3, 5]);
		expect(sortRows(rows, columns, { key: 'id', direction: 'desc' }, 'en').map((row) => row.id)).toEqual([5, 3, 1, 4, 2]);
	});

	test('keeps the rows as they are without a sort or with an unknown column, and never changes the array', () => {
		const copy = [...rows];
		expect(sortRows(rows, [{ key: 'name' }], undefined, 'en')).toBe(rows);
		expect(sortRows(rows, [{ key: 'name' }], { key: 'missing', direction: 'asc' }, 'en')).toBe(rows);
		sortRows(rows, [{ key: 'name' }], { key: 'name', direction: 'asc' }, 'en');
		expect(rows).toEqual(copy);
	});
});

describe('column state', () => {
	const columns: TableColumn<Row>[] = [
		{ key: 'name' },
		{ key: 'price', hidden: true },
		{ key: 'day', pinned: true },
		{ key: 'id' }
	];

	test('fills the state with the defaults of the columns', () => {
		expect(fullColumnState(columns, undefined)).toEqual([
			{ key: 'name', visible: true },
			{ key: 'price', visible: false },
			{ key: 'day', visible: true, pinned: true },
			{ key: 'id', visible: true }
		]);
	});

	test('follows the saved order, drops unknown and repeated keys, appends new columns', () => {
		const state = [
			{ key: 'id', visible: true, width: 80 },
			{ key: 'gone', visible: true },
			{ key: 'price', visible: true },
			{ key: 'id', visible: false }
		];
		expect(fullColumnState(columns, state).map((entry) => entry.key)).toEqual(['id', 'price', 'name', 'day']);
	});

	test('shows the visible columns, pinned ones first', () => {
		const shown = visibleColumns(columns, [
			{ key: 'id', visible: true, width: 80 },
			{ key: 'name', visible: true, pinned: true },
			{ key: 'day', visible: true, pinned: false }
		]);
		expect(shown.map((entry) => [entry.column.key, entry.pinned, entry.width])).toEqual([
			['name', true, undefined],
			['id', false, 80],
			['day', false, undefined]
		]);
	});

	test('writes rounded widths', () => {
		expect(withWidths([{ key: 'a', visible: true }, { key: 'b', visible: false }], { a: 120.6 })).toEqual([
			{ key: 'a', visible: true, width: 121 },
			{ key: 'b', visible: false }
		]);
	});

	test('recognizes a valid saved state', () => {
		expect(isColumnState([{ key: 'a', visible: true, width: 10, pinned: false }])).toBe(true);
		expect(isColumnState([])).toBe(true);
		expect(isColumnState([{ key: 'a' }])).toBe(false);
		expect(isColumnState([{ key: 'a', visible: true, width: '10px' }])).toBe(false);
		expect(isColumnState({ key: 'a', visible: true })).toBe(false);
		expect(isColumnState(null)).toBe(false);
	});
});

describe('selection', () => {
	const none = { selected: [] as Row[], selectedAll: false, excluded: [] as Row[] };

	test('checks rows by key, also when the objects are new', () => {
		const isSelected = selectionChecker({ ...none, selected: [{ ...rows[1] }] }, 'id');
		expect(rows.map(isSelected)).toEqual([false, true, false, false, false]);
	});

	test('in "all" mode every row is selected except the excluded ones', () => {
		const isSelected = selectionChecker({ ...none, selectedAll: true, excluded: [rows[0]] }, 'id');
		expect(rows.map(isSelected)).toEqual([false, true, true, true, true]);
	});

	test('adds and removes rows without duplicates', () => {
		const added = setRowsSelected({ ...none, selected: [rows[0]] }, [rows[0], rows[1]], true, 'id');
		expect(added.selected.map((row) => row.id)).toEqual([1, 2]);
		expect(setRowsSelected(added, [rows[0]], false, 'id').selected.map((row) => row.id)).toEqual([2]);
	});

	test('in "all" mode deselecting excludes the rows and selecting brings them back', () => {
		const all = { ...none, selectedAll: true };
		const excluded = setRowsSelected(all, [rows[2]], false, 'id');
		expect(excluded.excluded.map((row) => row.id)).toEqual([3]);
		expect(setRowsSelected(excluded, [rows[2]], true, 'id').excluded).toEqual([]);
	});

	test('tells whether none, some or all the shown rows are selected', () => {
		expect(pageSelectionState(rows, () => false)).toBe('none');
		expect(pageSelectionState(rows, (row) => row.id === 1)).toBe('some');
		expect(pageSelectionState(rows, () => true)).toBe('all');
		expect(pageSelectionState([], () => true)).toBe('none');
	});

	test('returns the rows between two keys, in either direction', () => {
		expect(rowRange(rows, 2, 4, 'id').map((row) => row.id)).toEqual([2, 3, 4]);
		expect(rowRange(rows, 4, 2, 'id').map((row) => row.id)).toEqual([2, 3, 4]);
		expect(rowRange(rows, 2, 99, 'id')).toEqual([]);
	});
});
