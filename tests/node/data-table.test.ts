import { describe, expect, test } from 'vitest';
import FilterBuilder from '../../src/lib/utils/filters/builder.js';
import { createFilters, filterCondition, type FilterField } from '../../src/lib/utils/filters/model.js';
import {
	completeFilters,
	filterQuery,
	hasMoreRows,
	pageRange,
	resolvePageCount,
	searchBuilder,
	selectionCount,
	sortedQuery
} from '../../src/lib/utils/table/query.js';
import type { TableColumn } from '../../src/lib/utils/table/types.js';

const fields: FilterField[] = [
	{ name: 'status', label: 'Status', type: 'string', column: 'bookings.status' },
	{ name: 'amount', label: 'Amount', type: 'number', column: 'bookings.amount' }
];

describe('searchBuilder', () => {
	test('is empty without text or columns', () => {
		expect(searchBuilder('', ['name']).toJson().modifiers).toEqual([]);
		expect(searchBuilder('luca', undefined).toJson().modifiers).toEqual([]);
		expect(searchBuilder('luca', []).toJson().modifiers).toEqual([]);
		expect(searchBuilder('   ', ['name']).toJson().modifiers).toEqual([]);
	});

	test('v4 bug: the search is word by word, one AND group per word, each word in any column', () => {
		const modifiers = searchBuilder('  mario   rossi ', ['first', 'last']).toJson().modifiers as any[];
		expect(modifiers).toHaveLength(2);
		expect(modifiers.map((group) => [group.kind, group.logicalOperator])).toEqual([
			['grouped', 'and'],
			['grouped', 'and']
		]);
		expect(modifiers.map((group) => group.children.map((child: any) => [child.key, child.value, child.logicalOperator]))).toEqual([
			[
				['first', '%mario%', 'and'],
				['last', '%mario%', 'or']
			],
			[
				['first', '%rossi%', 'and'],
				['last', '%rossi%', 'or']
			]
		]);
	});

	test('one word gives the same query as before, a single group', () => {
		expect(searchBuilder('luca', ['first', 'last']).toJson().modifiers).toEqual(
			new FilterBuilder()
				.where((group) => group.where('first', 'ilike', '%luca%').orWhere('last', 'ilike', '%luca%'))
				.toJson().modifiers
		);
	});

	test('is one OR group of ilike, one per column, with LIKE wildcards escaped', () => {
		const [group] = searchBuilder('50%_off', ['first', 'last']).toJson().modifiers as any[];
		expect(group).toMatchObject({ method: 'where', kind: 'grouped', logicalOperator: 'and' });
		expect(group.children).toEqual([
			{ method: 'where', kind: 'simple', key: 'first', operator: 'ilike', value: '%50\\%\\_off%', logicalOperator: 'and' },
			{ method: 'where', kind: 'simple', key: 'last', operator: 'ilike', value: '%50\\%\\_off%', logicalOperator: 'or' }
		]);
	});
});

describe('filterQuery', () => {
	test('puts the search group before the filters', () => {
		const tree = createFilters([filterCondition('status', 'is', 'confirmed')]);
		const modifiers = filterQuery({
			search: 'luca',
			searchColumns: ['name'],
			filterValue: tree,
			filterFields: fields
		}).toJson().modifiers as any[];
		expect(modifiers).toHaveLength(2);
		expect(modifiers[0].kind).toBe('grouped');
		expect(JSON.stringify(modifiers[1])).toContain('bookings.status');
	});

	test('skips incomplete conditions', () => {
		const tree = createFilters([filterCondition('amount', 'gt', undefined)]);
		expect(filterQuery({ search: '', filterValue: tree, filterFields: fields }).toJson().modifiers).toEqual([]);
	});
});

describe('completeFilters', () => {
	test('drops incomplete conditions but keeps locked ones', () => {
		const tree = createFilters([
			filterCondition('status', 'is', 'confirmed'),
			filterCondition('amount', 'gt', undefined),
			filterCondition('amount', 'gt', undefined, { locked: true })
		]);
		expect(completeFilters(tree, fields).items.map((item: any) => item.operator)).toEqual(['is', 'gt']);
	});
});

describe('sortedQuery', () => {
	const columns: TableColumn[] = [
		{ key: 'name' },
		{ key: 'client', sort: ({ builder, direction }) => builder.orderBy('last', direction).orderBy('first', direction) }
	];

	test('orders by the key, or through the sort of the column, on a copy', () => {
		const base = new FilterBuilder().where('a', 1);
		expect(sortedQuery(base, { key: 'name', direction: 'desc' }, columns).toJson().modifiers.at(-1)).toEqual({
			method: 'orderBy',
			sortBy: 'name',
			sortDirection: 'desc'
		});
		expect(
			sortedQuery(base, { key: 'client', direction: 'asc' }, columns)
				.toJson()
				.modifiers.slice(1)
				.map((modifier: any) => modifier.sortBy)
		).toEqual(['last', 'first']);
		expect(base.toJson().modifiers).toHaveLength(1);
		expect(sortedQuery(base, undefined, columns).toJson().modifiers).toHaveLength(1);
	});
});

describe('pagination helpers', () => {
	test('resolvePageCount prefers the total and has at least one page', () => {
		expect(resolvePageCount(45, 20, undefined)).toBe(3);
		expect(resolvePageCount(0, 20, undefined)).toBe(1);
		expect(resolvePageCount(undefined, 20, 7)).toBe(7);
		expect(resolvePageCount(undefined, 20, undefined)).toBeUndefined();
	});

	test('v4 bug: the range starts from 1 and ends at the last row shown', () => {
		expect(pageRange(1, 20, 20)).toEqual({ from: 1, to: 20 });
		expect(pageRange(3, 20, 5)).toEqual({ from: 41, to: 45 });
	});

	test('hasMoreRows uses the total, then the page count, then a full last batch', () => {
		expect(hasMoreRows(40, 2, 20, 45, undefined)).toBe(true);
		expect(hasMoreRows(45, 3, 20, 45, undefined)).toBe(false);
		expect(hasMoreRows(40, 2, 20, undefined, 3)).toBe(true);
		expect(hasMoreRows(60, 3, 20, undefined, 3)).toBe(false);
		expect(hasMoreRows(40, 2, 20, undefined, undefined)).toBe(true);
		expect(hasMoreRows(35, 2, 20, undefined, undefined)).toBe(false);
	});

	test('selectionCount counts the exclusions against the total', () => {
		expect(selectionCount({ selected: [1, 2], selectedAll: false, excluded: [] }, 45)).toBe(2);
		expect(selectionCount({ selected: [], selectedAll: true, excluded: [1] }, 45)).toBe(44);
		expect(selectionCount({ selected: [], selectedAll: true, excluded: [] }, undefined)).toBeUndefined();
	});
});
