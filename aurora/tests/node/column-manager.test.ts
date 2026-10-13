import { describe, expect, test } from 'vitest';
import type { TableColumn, TableColumnState } from '../../src/lib/utils/table/types.js';
import { fullColumnState } from '../../src/lib/utils/table/columns.js';
import {
	arrangeColumnState,
	canHideColumn,
	columnGroupRange,
	columnKind,
	defaultColumnState,
	foldText,
	highlightParts,
	moveColumn,
	sameColumnState,
	setColumnPinned,
	setColumnVisible
} from '../../src/lib/utils/table/manager.js';

const columns: TableColumn[] = [
	{ key: 'code', pinned: true },
	{ key: 'name', required: true },
	{ key: 'price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } },
	{ key: 'stock', type: 'number' },
	{ key: 'notes', hidden: true }
];

const keys = (state: TableColumnState[]) =>
	state.map((entry) => `${entry.visible ? '' : '-'}${entry.pinned ? '*' : ''}${entry.key}`);

describe('column manager state', () => {
	test('the default view keeps the order of the columns, pinned first and hidden last', () => {
		expect(keys(defaultColumnState(columns))).toEqual(['*code', 'name', 'price', 'stock', '-notes']);
		expect(keys(arrangeColumnState(columns, [{ key: 'stock', visible: true, pinned: true }]))).toEqual([
			'*stock',
			'*code',
			'name',
			'price',
			'-notes'
		]);
	});

	test('a required column is visible even when the saved state hides it', () => {
		expect(fullColumnState(columns, [{ key: 'name', visible: false }])[0]).toEqual({ key: 'name', visible: true });
		expect(fullColumnState([{ key: 'name', required: true, hidden: true }], undefined)).toEqual([
			{ key: 'name', visible: true }
		]);
	});

	test('showing a column appends it to the visible ones, hiding it unpins it', () => {
		const shown = setColumnVisible(columns, undefined, 'notes', true);
		expect(keys(shown)).toEqual(['*code', 'name', 'price', 'stock', 'notes']);
		const hidden = setColumnVisible(columns, shown, 'code', false);
		expect(keys(hidden)).toEqual(['name', 'price', 'stock', 'notes', '-code']);
		expect(hidden.at(-1)).toEqual({ key: 'code', visible: false, pinned: false });
	});

	test('required columns and the last visible column cannot be hidden', () => {
		expect(canHideColumn(columns, defaultColumnState(columns), 'name')).toBe(false);
		expect(keys(setColumnVisible(columns, undefined, 'name', false))).toEqual(keys(defaultColumnState(columns)));
		const single: TableColumn[] = [{ key: 'a' }, { key: 'b', hidden: true }];
		expect(canHideColumn(single, defaultColumnState(single), 'a')).toBe(false);
		expect(keys(setColumnVisible(single, undefined, 'a', false))).toEqual(['a', '-b']);
	});

	test('pinning moves a column to the end of the pinned ones, unpinning to the start of the others', () => {
		const pinned = setColumnPinned(columns, undefined, 'stock', true);
		expect(keys(pinned)).toEqual(['*code', '*stock', 'name', 'price', '-notes']);
		const unpinned = setColumnPinned(columns, pinned, 'code', false);
		expect(keys(unpinned)).toEqual(['*stock', 'code', 'name', 'price', '-notes']);
		expect(unpinned[1]).toEqual({ key: 'code', visible: true, pinned: false });
		expect(setColumnPinned(columns, unpinned, 'name', true).find((entry) => entry.key === 'name')).toEqual({
			key: 'name',
			visible: true,
			pinned: true
		});
	});

	test('a column moves only among the columns of its group', () => {
		const state = setColumnPinned(columns, undefined, 'stock', true);
		expect(columnGroupRange(columns, state, 'stock')).toEqual([0, 1]);
		expect(columnGroupRange(columns, state, 'price')).toEqual([2, 3]);
		expect(keys(moveColumn(columns, state, 'stock', 0))).toEqual(['*stock', '*code', 'name', 'price', '-notes']);
		expect(keys(moveColumn(columns, state, 'price', 0))).toEqual(['*code', '*stock', 'price', 'name', '-notes']);
		expect(keys(moveColumn(columns, state, 'name', 9))).toEqual(['*code', '*stock', 'price', 'name', '-notes']);
		expect(keys(moveColumn(columns, state, 'notes', 0))).toEqual(keys(state));
	});

	test('widths survive the edits', () => {
		const state: TableColumnState[] = [{ key: 'price', visible: true, width: 140 }];
		expect(setColumnPinned(columns, state, 'price', true)[1]).toEqual({
			key: 'price',
			visible: true,
			width: 140,
			pinned: true
		});
		expect(sameColumnState(defaultColumnState(columns), arrangeColumnState(columns, state))).toBe(false);
		expect(sameColumnState(defaultColumnState(columns), arrangeColumnState(columns, undefined))).toBe(true);
	});

	test('the kind of a column comes from its type and its number format', () => {
		expect(columns.map(columnKind)).toEqual(['text', 'text', 'currency', 'number', 'text']);
		expect(columnKind({ key: 'rate', type: 'number', numberFormat: { style: 'percent' } })).toBe('percent');
		expect(columnKind({ key: 'flag', type: 'boolean' })).toBe('boolean');
		expect(columnKind({ key: 'chip', type: 'custom' })).toBe('custom');
	});
});

describe('column manager search', () => {
	test('folds case and accents', () => {
		expect(foldText('Città ÈLITE')).toBe('citta elite');
	});

	test('highlights every match in the original text, accents included', () => {
		expect(highlightParts('Ultima visita', 'vis')).toEqual([
			{ text: 'Ultima ', match: false },
			{ text: 'vis', match: true },
			{ text: 'ita', match: false }
		]);
		expect(highlightParts('Città e città', 'CITTA')).toEqual([
			{ text: 'Città', match: true },
			{ text: ' e ', match: false },
			{ text: 'città', match: true }
		]);
		expect(highlightParts('Note', '  ')).toEqual([{ text: 'Note', match: false }]);
		expect(highlightParts('Note', 'x')).toEqual([{ text: 'Note', match: false }]);
	});
});
