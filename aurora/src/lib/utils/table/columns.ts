import type { TableColumn, TableColumnState } from './types.js';

export function fullColumnState<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined
): TableColumnState[] {
	const byKey = new Map(columns.map((column) => [column.key, column]));
	const seen = new Set<string>();
	const result: TableColumnState[] = [];
	for (const entry of state ?? []) {
		if (!byKey.has(entry.key) || seen.has(entry.key)) continue;
		seen.add(entry.key);
		result.push({ ...entry });
	}
	for (const column of columns) {
		if (seen.has(column.key)) continue;
		const entry: TableColumnState = { key: column.key, visible: !column.hidden };
		if (column.pinned) entry.pinned = true;
		result.push(entry);
	}
	return result;
}

export interface ResolvedColumn<Row> {
	column: TableColumn<Row>;
	width?: number;
	pinned: boolean;
}

export function visibleColumns<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined
): ResolvedColumn<Row>[] {
	const byKey = new Map(columns.map((column) => [column.key, column]));
	const shown = fullColumnState(columns, state)
		.filter((entry) => entry.visible)
		.map((entry) => {
			const column = byKey.get(entry.key)!;
			return { column, width: entry.width, pinned: entry.pinned ?? !!column.pinned };
		});
	return [...shown.filter((entry) => entry.pinned), ...shown.filter((entry) => !entry.pinned)];
}

export function withWidths(
	state: TableColumnState[],
	widths: Record<string, number>
): TableColumnState[] {
	return state.map((entry) =>
		entry.key in widths ? { ...entry, width: Math.round(widths[entry.key]) } : entry
	);
}

export function isColumnState(value: unknown): value is TableColumnState[] {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry &&
				typeof entry === 'object' &&
				typeof entry.key === 'string' &&
				typeof entry.visible === 'boolean' &&
				(entry.width === undefined || typeof entry.width === 'number') &&
				(entry.pinned === undefined || typeof entry.pinned === 'boolean')
		)
	);
}
