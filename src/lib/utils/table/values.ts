import type { TableColumn } from './types.js';

export type RowKey<Row> = string | ((row: Row) => string | number);

export function keyOf<Row>(row: Row, rowKey: RowKey<Row>): string | number {
	if (typeof rowKey === 'function') return rowKey(row);
	return (row as Record<string, string | number>)[rowKey];
}

export function cellValue<Row>(row: Row, column: TableColumn<Row>): unknown {
	if (column.value) return column.value(row);
	return (row as Record<string, unknown>)[column.key];
}

export function isEmptyValue(value: unknown): boolean {
	return (
		value === null ||
		value === undefined ||
		value === '' ||
		(typeof value === 'number' && Number.isNaN(value)) ||
		(value instanceof Date && Number.isNaN(value.getTime()))
	);
}

export function toDate(value: unknown): Date | undefined {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
	if (typeof value === 'number' || typeof value === 'string') {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}
	if (value && typeof (value as { toJSDate?: unknown }).toJSDate === 'function') {
		return toDate((value as { toJSDate: () => Date }).toJSDate());
	}
	return undefined;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
	...DATE_FORMAT,
	hour: '2-digit',
	minute: '2-digit'
};

export type CellFormatter = (value: unknown, row: unknown) => string;

export function cellFormatter<Row>(column: TableColumn<Row>, locale: string): CellFormatter {
	if (column.format) return column.format as CellFormatter;
	switch (column.type) {
		case 'number': {
			const formatter = new Intl.NumberFormat(locale, column.numberFormat);
			return (value) => {
				const number = typeof value === 'number' ? value : Number(value);
				return Number.isNaN(number) ? String(value) : formatter.format(number);
			};
		}
		case 'date':
		case 'datetime': {
			const formatter = new Intl.DateTimeFormat(
				locale,
				column.dateFormat ?? (column.type === 'date' ? DATE_FORMAT : DATETIME_FORMAT)
			);
			return (value) => {
				const date = toDate(value);
				return date ? formatter.format(date) : String(value);
			};
		}
		case 'boolean':
			return (value) => String(Boolean(value));
		default:
			return (value) => String(value);
	}
}

export function columnAlign<Row>(column: TableColumn<Row>): 'start' | 'center' | 'end' {
	return column.align ?? (column.type === 'number' ? 'end' : 'start');
}
