import { describe, expect, test } from 'vitest';
import V4Builder from '../../migrate/v4/utils/filters/builder';
import FilterBuilder from '../../src/lib/utils/filters/builder';

type Chain = (builder: any) => unknown;

const chains: [string, Chain][] = [
	['where key value', (b) => b.where('a', 1)],
	['where key operator value', (b) => b.where('a', '>=', 10)],
	['where with a Date', (b) => b.where('createdAt', '>=', new Date(2026, 8, 24))],
	['where with a boolean', (b) => b.where('active', '=', false)],
	['orWhere, whereNot, orWhereNot', (b) => b.where('a', 1).orWhere('b', '<', 2).whereNot('c', 3).orWhereNot('d', 'ilike', '%x%')],
	[
		'a = 1 AND (b = 2 OR c > 3)',
		(b) => b.where('a', 1).where((q: any) => q.where('b', '=', 2).orWhere('c', '>', 3))
	],
	[
		'nested groups',
		(b) =>
			b.where((q: any) =>
				q.where('a', 1).orWhere((r: any) => r.where('b', 2).whereNot((s: any) => s.where('c', 3)))
			)
	],
	['whereIn values and variants', (b) => b.whereIn('id', [1, 2, 3]).orWhereIn('id', ['x']).notWhereIn('s', ['a']).orNotWhereIn('s', ['b'])],
	[
		'whereIn subquery with join',
		(b) =>
			b.whereIn('items.id', (q: any) =>
				q
					.select('itemId')
					.from('item_tags')
					.join('tags', (on: any) => on.on('tags.id', 'item_tags.tagId'))
					.whereIn('tags.id', [4, 5])
					.orderBy('itemId', 'asc')
			)
	],
	['whereNull variants', (b) => b.whereNull('a').orWhereNull('b').notWhereNull('c').orNotWhereNull('d')],
	['whereColumn', (b) => b.whereColumn('a', 'b').orWhereColumn('c', '>', 'd')],
	['whereJsonSuperset', (b) => b.whereJsonSuperset('data', { kind: 'x' }).orWhereJsonSuperset('data', { n: 1 })],
	['whereRaw', (b) => b.whereRaw('a = ?', [1]).orWhereRaw('b is not null')],
	[
		'joins',
		(b) =>
			b
				.join('t1', (on: any) => on.on('t1.id', 't0.t1Id'))
				.leftJoin('t2', (on: any) => {
					on.on('t2.id', '=', 't0.t2Id');
					on.orOn('t2.code', 't0.code');
					on.orOn('t2.x', '<', 't0.y');
				})
				.rightJoin('t3', (on: any) => on.on('t3.a', 't0.a'))
	],
	['select, from, orderBy', (b) => b.select(['a', 'b']).select('c').from('t').orderBy('a', 'desc')]
];

describe('FilterBuilder: same JSON as v4', () => {
	for (const [name, chain] of chains) {
		test(name, () => {
			const v4 = new V4Builder();
			const v5 = new FilterBuilder();
			chain(v4);
			chain(v5);
			expect(JSON.stringify(v5.toJson())).toBe(JSON.stringify(v4.toJson()));
			expect(v5.modifiers).toEqual(v4.modifiers);
		});
	}

	test('hasModifier and hasWhereOnColumn give the v4 answers on ordinary queries', () => {
		const make = (b: any) =>
			b.where('a', 1).where((q: any) => q.where('b', 2).orWhereIn('c', [1])).whereNull('d');
		const v4 = make(new V4Builder());
		const v5 = make(new FilterBuilder());
		for (const column of ['a', 'b', 'c', 'd', 'e'])
			expect(v5.hasWhereOnColumn(column)).toBe(v4.hasWhereOnColumn(column));
		expect(v5.hasModifier((q: FilterBuilder) => q.where('a', 1))).toBe(true);
		expect(v5.hasModifier((q: FilterBuilder) => q.where('a', 2))).toBe(false);
	});
});

describe('FilterBuilder: v4 bugs', () => {
	test('v4 bug: where({ ... }) did nothing; now it adds an object condition', () => {
		expect(new V4Builder().where({ a: 1 }).toJson().modifiers).toEqual([]);
		expect(new FilterBuilder().where({ a: 1, b: 'x' }).toJson().modifiers).toEqual([
			{ method: 'where', kind: 'object', values: { a: 1, b: 'x' }, logicalOperator: 'and' }
		]);
	});

	test('v4 bug: where(key, operator, undefined) used the operator as value; now it is skipped', () => {
		expect(new V4Builder().where('d', '>', undefined as never).toJson().modifiers).toEqual([
			{ method: 'where', kind: 'simple', key: 'd', value: '>', logicalOperator: 'and' }
		]);
		expect(new FilterBuilder().where('d', '>', undefined).toJson().modifiers).toEqual([]);
	});

	test('v4 bug: toJson() returned the internal list; now changing it does not change the builder', () => {
		const builder = new FilterBuilder().where('a', 1);
		builder.toJson().modifiers.push({ method: 'from', from: 'x' });
		expect(builder.toJson().modifiers).toHaveLength(1);
	});

	test('v4 bug: hasWhereOnColumn ignored the compared column and the subquery key', () => {
		const builder = new FilterBuilder()
			.whereColumn('a', 'b')
			.whereIn('c', (q) => q.select('x').from('t'));
		expect(builder.hasWhereOnColumn('b')).toBe(true);
		expect(builder.hasWhereOnColumn('c')).toBe(true);
	});

	test('v4 bug: an empty string as third argument of on() was taken as missing', () => {
		const builder = new FilterBuilder().join('t', (on) => on.on('a', '=', ''));
		expect(builder.toJson().modifiers[0]).toMatchObject({ on: [{ from: 'a', operator: '=', to: '' }] });
	});
});

describe('FilterBuilder: additions', () => {
	test('Knex aliases produce the same modifiers', () => {
		expect(new FilterBuilder().whereNotIn('a', [1]).orWhereNotIn('b', [2]).toJson()).toEqual(
			new FilterBuilder().notWhereIn('a', [1]).orNotWhereIn('b', [2]).toJson()
		);
		expect(new FilterBuilder().whereNotNull('a').orWhereNotNull('b').toJson()).toEqual(
			new FilterBuilder().notWhereNull('a').orNotWhereNull('b').toJson()
		);
	});

	test('whereBetween adds two conditions and leaves an undefined end open', () => {
		expect(new FilterBuilder().whereBetween('n', [1, 9]).toJson()).toEqual(
			new FilterBuilder().where('n', '>=', 1).where('n', '<=', 9).toJson()
		);
		expect(new FilterBuilder().whereBetween('n', [undefined, 9]).toJson()).toEqual(
			new FilterBuilder().where('n', '<=', 9).toJson()
		);
	});

	test('fromJson and clone make independent copies, Dates included', () => {
		const date = new Date(2026, 8, 24);
		const builder = new FilterBuilder().where('d', '>=', date).orderBy('d');
		const copy = FilterBuilder.fromJson(builder.toJson());
		const other = builder.clone();
		expect(copy.toJson()).toEqual(builder.toJson());
		expect(other.toJson()).toEqual(builder.toJson());
		other.where('x', 1);
		expect(builder.toJson().modifiers).toHaveLength(2);
		expect((copy.toJson().modifiers[0] as { value: Date }).value).toBeInstanceOf(Date);
	});

	test('a where callback with a non-where modifier still throws, as in v4', () => {
		expect(() => new FilterBuilder().where((q) => q.orderBy('a'))).toThrow();
	});
});
