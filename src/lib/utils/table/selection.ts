import { keyOf, type RowKey } from './values.js';

export interface Selection<Row> {
	selected: Row[];
	selectedAll: boolean;
	excluded: Row[];
}

function keySet<Row>(rows: Row[], rowKey: RowKey<Row>) {
	return new Set(rows.map((row) => keyOf(row, rowKey)));
}

export function selectionChecker<Row>(selection: Selection<Row>, rowKey: RowKey<Row>) {
	const keys = keySet(selection.selectedAll ? selection.excluded : selection.selected, rowKey);
	return (row: Row) => keys.has(keyOf(row, rowKey)) !== selection.selectedAll;
}

function withRows<Row>(list: Row[], rows: Row[], add: boolean, rowKey: RowKey<Row>): Row[] {
	const keys = keySet(rows, rowKey);
	const kept = list.filter((row) => !keys.has(keyOf(row, rowKey)));
	return add ? [...kept, ...rows] : kept;
}

export function setRowsSelected<Row>(
	selection: Selection<Row>,
	rows: Row[],
	on: boolean,
	rowKey: RowKey<Row>
): Selection<Row> {
	if (selection.selectedAll) {
		return { ...selection, excluded: withRows(selection.excluded, rows, !on, rowKey) };
	}
	return { ...selection, selected: withRows(selection.selected, rows, on, rowKey) };
}

export function pageSelectionState<Row>(
	rows: Row[],
	isSelected: (row: Row) => boolean
): 'none' | 'some' | 'all' {
	let count = 0;
	for (const row of rows) if (isSelected(row)) count++;
	if (count === 0) return 'none';
	return count === rows.length ? 'all' : 'some';
}

export function rowRange<Row>(
	rows: Row[],
	from: string | number,
	to: string | number,
	rowKey: RowKey<Row>
): Row[] {
	const start = rows.findIndex((row) => keyOf(row, rowKey) === from);
	const end = rows.findIndex((row) => keyOf(row, rowKey) === to);
	if (start < 0 || end < 0) return [];
	return rows.slice(Math.min(start, end), Math.max(start, end) + 1);
}
