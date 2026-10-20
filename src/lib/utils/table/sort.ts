import type { TableColumn, TableSort } from './types.js';
import { cellValue, isEmptyValue, toDate } from './values.js';

export function nextSort(sort: TableSort | undefined, key: string): TableSort | undefined {
	if (sort?.key !== key) return { key, direction: 'asc' };
	if (sort.direction === 'asc') return { key, direction: 'desc' };
	return undefined;
}

function comparable(value: unknown, type: TableColumn['type']): number | string | undefined {
	if (type === 'date' || type === 'datetime') return toDate(value)?.getTime();
	if (type === 'number') {
		const number = typeof value === 'number' ? value : Number(value);
		return Number.isNaN(number) ? undefined : number;
	}
	if (type === 'boolean') return value ? 1 : 0;
	if (typeof value === 'number') return value;
	const date = value instanceof Date || (value as { toJSDate?: unknown })?.toJSDate ? toDate(value) : undefined;
	if (date) return date.getTime();
	return String(value);
}

export function sortRows<Row>(
	rows: Row[],
	columns: TableColumn<Row>[],
	sort: TableSort | undefined,
	locale: string
): Row[] {
	if (!sort) return rows;
	const column = columns.find((candidate) => candidate.key === sort.key);
	if (!column) return rows;
	const sign = sort.direction === 'desc' ? -1 : 1;

	if (column.compare) {
		const compare = column.compare;
		return [...rows].sort((a, b) => sign * compare(a, b));
	}

	const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
	const keyed = rows.map((row) => {
		const value = cellValue(row, column);
		return { row, value: isEmptyValue(value) ? undefined : comparable(value, column.type) };
	});
	keyed.sort((a, b) => {
		if (a.value === undefined) return b.value === undefined ? 0 : 1;
		if (b.value === undefined) return -1;
		if (typeof a.value === 'number' && typeof b.value === 'number') return sign * (a.value - b.value);
		return sign * collator.compare(String(a.value), String(b.value));
	});
	return keyed.map((entry) => entry.row);
}
