import { fullColumnState } from './columns.js';
import type { TableColumn, TableColumnState } from './types.js';

export type ColumnKind =
	| 'text'
	| 'number'
	| 'currency'
	| 'percent'
	| 'date'
	| 'datetime'
	| 'boolean'
	| 'custom';

export function columnKind(column: TableColumn): ColumnKind {
	const type = column.type ?? 'text';
	if (type !== 'number') return type;
	if (column.numberFormat?.style === 'currency') return 'currency';
	if (column.numberFormat?.style === 'percent') return 'percent';
	return 'number';
}

function columnMap<Row>(columns: TableColumn<Row>[]) {
	return new Map(columns.map((column) => [column.key, column]));
}

export function isEntryPinned(entry: TableColumnState, column: TableColumn | undefined): boolean {
	return entry.pinned ?? !!column?.pinned;
}

function withPinned(
	entry: TableColumnState,
	column: TableColumn | undefined,
	pinned: boolean
): TableColumnState {
	const { pinned: _, ...rest } = entry;
	if (pinned) return { ...rest, pinned: true };
	return column?.pinned ? { ...rest, pinned: false } : rest;
}

export function arrangeColumnState<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined
): TableColumnState[] {
	const byKey = columnMap(columns);
	const full = fullColumnState(columns, state);
	const pinned = (entry: TableColumnState) => isEntryPinned(entry, byKey.get(entry.key));
	return [
		...full.filter((entry) => entry.visible && pinned(entry)),
		...full.filter((entry) => entry.visible && !pinned(entry)),
		...full.filter((entry) => !entry.visible)
	];
}

export function defaultColumnState<Row>(columns: TableColumn<Row>[]): TableColumnState[] {
	return arrangeColumnState(columns, undefined);
}

function pinnedCount<Row>(columns: TableColumn<Row>[], state: TableColumnState[]): number {
	const byKey = columnMap(columns);
	return state.filter((entry) => entry.visible && isEntryPinned(entry, byKey.get(entry.key))).length;
}

export function canHideColumn<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[],
	key: string
): boolean {
	const column = columns.find((candidate) => candidate.key === key);
	if (!column || column.required) return false;
	return state.filter((entry) => entry.visible).length > 1;
}

export function setColumnVisible<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined,
	key: string,
	visible: boolean
): TableColumnState[] {
	const arranged = arrangeColumnState(columns, state);
	const index = arranged.findIndex((entry) => entry.key === key);
	if (index === -1 || arranged[index].visible === visible) return arranged;
	if (!visible && !canHideColumn(columns, arranged, key)) return arranged;
	const column = columns.find((candidate) => candidate.key === key);
	const rest = arranged.filter((entry) => entry.key !== key);
	const entry = visible
		? { ...arranged[index], visible }
		: { ...withPinned(arranged[index], column, false), visible };
	rest.splice(rest.filter((other) => other.visible).length, 0, entry);
	return arrangeColumnState(columns, rest);
}

export function setColumnPinned<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined,
	key: string,
	pinned: boolean
): TableColumnState[] {
	const arranged = arrangeColumnState(columns, state);
	const index = arranged.findIndex((entry) => entry.key === key);
	if (index === -1 || !arranged[index].visible) return arranged;
	const column = columns.find((candidate) => candidate.key === key);
	if (isEntryPinned(arranged[index], column) === pinned) return arranged;
	const rest = arranged.filter((entry) => entry.key !== key);
	rest.splice(pinnedCount(columns, rest), 0, withPinned(arranged[index], column, pinned));
	return arrangeColumnState(columns, rest);
}

export function columnGroupRange<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[],
	key: string
): [number, number] {
	const pins = pinnedCount(columns, state);
	const visible = state.filter((entry) => entry.visible).length;
	const entry = state.find((candidate) => candidate.key === key);
	const column = columns.find((candidate) => candidate.key === key);
	return entry && isEntryPinned(entry, column) ? [0, pins - 1] : [pins, visible - 1];
}

export function moveColumn<Row>(
	columns: TableColumn<Row>[],
	state: TableColumnState[] | undefined,
	key: string,
	index: number
): TableColumnState[] {
	const arranged = arrangeColumnState(columns, state);
	const from = arranged.findIndex((entry) => entry.key === key);
	if (from === -1 || !arranged[from].visible) return arranged;
	const [min, max] = columnGroupRange(columns, arranged, key);
	const to = Math.min(Math.max(index, min), max);
	if (to === from) return arranged;
	const next = [...arranged];
	const [entry] = next.splice(from, 1);
	next.splice(to, 0, entry);
	return next;
}

export function sameColumnState(a: TableColumnState[], b: TableColumnState[]): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function foldText(text: string): string {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
}

export interface TextPart {
	text: string;
	match: boolean;
}

export function highlightParts(text: string, query: string): TextPart[] {
	const needle = foldText(query.trim());
	if (!needle) return [{ text, match: false }];
	let folded = '';
	const origin: number[] = [];
	let position = 0;
	for (const char of text) {
		for (const piece of foldText(char)) {
			folded += piece;
			origin.push(position);
		}
		position += char.length;
	}
	origin.push(text.length);
	const ranges: [number, number][] = [];
	let from = folded.indexOf(needle);
	while (from !== -1) {
		const end = from + needle.length;
		const start = origin[from];
		const stop = end < folded.length ? origin[end] : text.length;
		const last = ranges.at(-1);
		if (last && last[1] >= start) last[1] = Math.max(last[1], stop);
		else ranges.push([start, stop]);
		from = folded.indexOf(needle, end);
	}
	if (!ranges.length) return [{ text, match: false }];
	const parts: TextPart[] = [];
	let cursor = 0;
	for (const [start, stop] of ranges) {
		if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
		parts.push({ text: text.slice(start, stop), match: true });
		cursor = stop;
	}
	if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
	return parts;
}
