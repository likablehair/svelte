import qs from 'qs';
import { afterAll, describe, expect, test } from 'vitest';
import FilterBuilder from '../../src/lib/utils/filters/builder.js';
import { filtersToBuilder } from '../../src/lib/utils/filters/convert.js';
import { createFilters, filterCondition, filterGroup, type FilterField } from '../../src/lib/utils/filters/model.js';
import FilterModifierApplier, { applyModifiers, FilterError, parseModifiers, type Modifier } from '../src/index.js';
import { createDatabase } from './lucid.js';

const db = createDatabase();

afterAll(() => db.manager.closeAll());

const users = () => db.from('users').where('tenant_id', 1);

const sql = (modifiers: unknown, options = {}) => applyModifiers(users(), modifiers, options).toQuery();

const built = (callback: (builder: FilterBuilder) => void) => {
	const builder = new FilterBuilder();
	callback(builder);
	return builder.toJson();
};

const refused = (modifiers: unknown, message: RegExp, options = {}) => {
	expect(() => sql(modifiers, options)).toThrow(message);
	try {
		sql(modifiers, options);
	} catch (error) {
		expect(error).toBeInstanceOf(FilterError);
		expect((error as FilterError).status).toBe(400);
	}
};

describe('applyModifiers: conditions', () => {
	test('every condition goes inside one group, so an OR of the client keeps the tenant of the backend', () => {
		expect(sql(built((b) => b.where('a', 1).orWhere('b', 2)))).toBe(
			'select * from "users" where "tenant_id" = 1 and ("a" = 1 or "b" = 2)'
		);
	});

	test('without conditions the query is left alone', () => {
		expect(sql({ modifiers: [] })).toBe('select * from "users" where "tenant_id" = 1');
		expect(sql(undefined)).toBe('select * from "users" where "tenant_id" = 1');
		expect(sql(built((b) => b.orderBy('name', 'desc')))).toBe(
			'select * from "users" where "tenant_id" = 1 order by "name" desc'
		);
	});

	test('simple and object conditions with the four logical operators', () => {
		expect(
			sql(
				built((b) =>
					b
						.where('a', '>', 1)
						.orWhere('b', 'x')
						.whereNot('c', '<>', 3)
						.orWhereNot({ d: 4, e: 'y' })
						.where({ f: true })
				)
			)
		).toBe(
			'select * from "users" where "tenant_id" = 1 and ("a" > 1 or "b" = \'x\' and not "c" <> 3 or not ("d" = 4 and "e" = \'y\') and ("f" = true))'
		);
	});

	test('nested groups keep their logical operator', () => {
		expect(
			sql(
				built((b) =>
					b
						.where('a', 1)
						.orWhere((g) => g.where('b', 2).where((h) => h.where('c', 3).orWhere('d', 4)))
						.whereNot((g) => g.where('e', 5).orWhere('f', 6))
				)
			)
		).toBe(
			'select * from "users" where "tenant_id" = 1 and ("a" = 1 or ("b" = 2 and ("c" = 3 or "d" = 4)) and not ("e" = 5 or "f" = 6))'
		);
	});

	test('in, null, column and JSON superset conditions', () => {
		expect(
			sql(
				built((b) =>
					b
						.whereIn('a', [1, 2])
						.orWhereNotIn('b', ['x'])
						.whereNull('c')
						.orWhereNotNull('d')
						.whereColumn('e', '<', 'f')
						.orWhereColumn('g', 'h')
						.whereJsonSuperset('meta', { k: 1 })
						.orWhereJsonSuperset('tags', ['a'])
				)
			)
		).toBe(
			'select * from "users" where "tenant_id" = 1 and ("a" in (1, 2) or "b" not in (\'x\') and "c" is null or "d" is not null and "e" < "f" or "g" = "h" and "meta" @> \'{"k":1}\' or "tags" @> \'["a"]\')'
		);
	});

	test('negated JSON superset conditions use the negated methods', () => {
		const modifiers: Modifier[] = [
			{ method: 'where', kind: 'jsonSuperset', key: 'meta', value: { k: 1 }, logicalOperator: 'andNot' },
			{ method: 'where', kind: 'jsonSuperset', key: 'meta', value: { k: 2 }, logicalOperator: 'orNot' }
		];
		expect(sql(modifiers)).toBe(
			'select * from "users" where "tenant_id" = 1 and (not "meta" @> \'{"k":1}\' or not "meta" @> \'{"k":2}\')'
		);
	});

	test('subqueries apply their from, select, join and conditions', () => {
		expect(
			sql(
				built((b) =>
					b.whereIn('id', (s) =>
						s
							.from('orders')
							.where('total', '>', 10)
							.join('shops', (on) => on.on('shops.id', '=', 'orders.shop_id'))
							.select('orders.user_id')
					)
				)
			)
		).toBe(
			'select * from "users" where "tenant_id" = 1 and ("id" in (select "orders"."user_id" from "orders" inner join "shops" on "shops"."id" = "orders"."shop_id" where "total" > 10))'
		);
	});
});

describe('applyModifiers: joins, select, from, sorting', () => {
	test('joins with on and orOn, select, sorting', () => {
		expect(
			sql(
				built((b) =>
					b
						.leftJoin('shops', (on) => {
							on.on('shops.id', '=', 'users.shop_id');
							on.orOn('shops.owner_id', '=', 'users.id');
						})
						.rightJoin('teams', (on) => on.on('teams.id', '=', 'users.team_id'))
						.select(['users.id', 'shops.name as shop'])
						.orderBy('users.name', 'asc')
				)
			)
		).toBe(
			'select "users"."id", "shops"."name" as "shop" from "users" left join "shops" on "shops"."id" = "users"."shop_id" or "shops"."owner_id" = "users"."id" right join "teams" on "teams"."id" = "users"."team_id" where "tenant_id" = 1 order by "users"."name" asc'
		);
	});

	test('from replaces the table', () => {
		expect(sql([{ method: 'from', from: 'archived_users' }])).toBe(
			'select * from "archived_users" where "tenant_id" = 1'
		);
	});
});

describe('applyModifiers: values', () => {
	test('the pattern sent by the v5 filters is used as it is', () => {
		const fields: FilterField[] = [{ name: 'name', label: 'Name', type: 'string' }];
		const modifiers = filtersToBuilder(createFilters([filterCondition('name', 'contains', '50%_off')]), fields).toJson();
		expect(sql(modifiers)).toBe(
			'select * from "users" where "tenant_id" = 1 and ("name" ilike E\'%50\\\\%\\\\_off%\')'
		);
	});

	test('Postgres arrays are compared with a list as the value', () => {
		const fields: FilterField[] = [{ name: 'labels', label: 'Labels', type: 'select', array: true }];
		const run = (operator: string) =>
			sql(filtersToBuilder(createFilters([filterCondition('labels', operator, [{ value: 'vip' }, { value: 'new' }])]), fields).toJson());
		expect(run('in')).toBe('select * from "users" where "tenant_id" = 1 and ("labels" && \'{"vip","new"}\')');
		expect(run('all')).toBe('select * from "users" where "tenant_id" = 1 and ("labels" @> \'{"vip","new"}\')');
	});

	test('legacyLike wraps like and ilike in % as the copied appliers did, for v4 frontends', () => {
		const modifiers = built((b) => b.where('name', 'ilike', 'bo').orWhere('code', 'like', 'X').orWhere('id', '=', 'bo'));
		expect(sql(modifiers, { legacyLike: true })).toBe(
			'select * from "users" where "tenant_id" = 1 and ("name" ilike \'%bo%\' or "code" like \'%X%\' or "id" = \'bo\')'
		);
	});
});

describe('applyModifiers: raw conditions', () => {
	const fields: FilterField[] = [
		{ name: 'visits', label: 'Visits', type: 'number', json: { column: 'data', key: 'stats.visits', cast: 'numeric' } },
		{ name: 'nick', label: 'Nick', type: 'string', json: { column: 'data', key: 'nick', cast: 'text' } }
	];
	const run = (field: string, operator: string, value?: unknown) =>
		sql(filtersToBuilder(createFilters([filterCondition(field, operator, value as never)]), fields).toJson());

	test('the JSON casts of the filters are accepted', () => {
		expect(run('visits', 'gt', 5)).toBe(
			'select * from "users" where "tenant_id" = 1 and (("data"#>>\'{stats,visits}\')::numeric > 5)'
		);
		expect(run('visits', 'anyOf', [1, 2])).toBe(
			'select * from "users" where "tenant_id" = 1 and (("data"#>>\'{stats,visits}\')::numeric = any(\'{1,2}\'))'
		);
		expect(run('nick', 'empty')).toBe(
			'select * from "users" where "tenant_id" = 1 and ((("data"#>>\'{nick}\')::text is null or ("data"#>>\'{nick}\')::text = \'\'))'
		);
		expect(run('nick', 'startsWith', 'B.')).toBe(
			'select * from "users" where "tenant_id" = 1 and (("data"#>>\'{nick}\')::text ~* E\'^B\\\\.\')'
		);
	});

	test('any other raw condition is refused', () => {
		const raw = (clause: string, bindings?: unknown[]) => [{ method: 'where', kind: 'raw', clause, bindings }];
		refused(raw('1 = 1'), /Raw conditions are not allowed/);
		refused(raw('(??#>>?)::text = ? or 1 = 1', ['data', '{a}', 'x']), /Raw conditions are not allowed/);
		refused(raw('(??#>>?)::text = ?', ['data', '{a}']), /Raw bindings do not match/);
		refused(raw('(??#>>?)::text = ?', ['data', "{a}'); drop table users; --", 'x']), /JSON path/);
		refused(raw('(??#>>?)::text = ?', ['data', '{a}', { x: 1 }]), /must be a string/);
	});
});

describe('applyModifiers: allowed columns and tables', () => {
	const options = { columns: ['name', 'shop_id', 'shops.id', 'data', 'id'], tables: ['shops'] };

	test('conditions, sorting, joins and subqueries inside the lists pass', () => {
		expect(
			sql(
				built((b) =>
					b
						.where('name', 'x')
						.orWhere((g) => g.whereIn('id', (s) => s.from('shops').select('id')))
						.join('shops', (on) => on.on('shops.id', '=', 'shop_id'))
						.orderBy('name')
				),
				options
			)
		).toBe(
			'select * from "users" inner join "shops" on "shops"."id" = "shop_id" where "tenant_id" = 1 and ("name" = \'x\' or ("id" in (select "id" from "shops"))) order by "name" asc'
		);
	});

	test('a column or a table outside the lists is refused, at any depth', () => {
		refused(built((b) => b.where('password', 'x')), /Column "password" is not allowed/, options);
		refused(built((b) => b.where((g) => g.orWhere({ name: 'x', role: 'admin' }))), /Column "role"/, options);
		refused(built((b) => b.orderBy('salary')), /Column "salary"/, options);
		refused(built((b) => b.select('secret as name')), /Column "secret as name"/, options);
		refused(built((b) => b.whereColumn('name', 'token')), /Column "token"/, options);
		refused(built((b) => b.whereIn('id', (s) => s.from('tenants').select('id'))), /Table "tenants"/, options);
		refused(built((b) => b.join('tenants', (on) => on.on('shops.id', '=', 'shop_id'))), /Table "tenants"/, options);
		refused(built((b) => b.whereRaw('(??#>>?)::text = ?', ['secrets', '{a}', 'x'])), /Column "secrets"/, options);
		refused([{ method: 'from', from: 'tenants' }], /Table "tenants"/, options);
	});

	test('the lists can be functions', () => {
		const columns = (name: string) => !name.startsWith('secret');
		expect(sql(built((b) => b.where('name', 'x')), { columns })).toContain('"name" = \'x\'');
		refused(built((b) => b.where('secret_note', 'x')), /Column "secret_note"/, { columns });
	});
});

describe('parseModifiers', () => {
	test('accepts the JSON, its modifiers and the string of toQueryParam', () => {
		const builder = new FilterBuilder().where('a', 1);
		expect(parseModifiers(builder.toJson())).toEqual(builder.toJson().modifiers);
		expect(parseModifiers(builder.toJson().modifiers)).toEqual(builder.toJson().modifiers);
		expect(parseModifiers(builder.toQueryParam())).toEqual(builder.toJson().modifiers);
		expect(parseModifiers(null)).toEqual([]);
	});

	test('turns back into lists the arrays the query string made into objects', () => {
		const values = Array.from({ length: 25 }, (_, index) => `v${index}`);
		const json = new FilterBuilder().whereIn('code', values).where((g) => g.where('a', 1).orWhere('b', 2)).toJson();
		const sent = qs.parse(qs.stringify({ filtersBuilder: json })) as { filtersBuilder: unknown };
		expect(Array.isArray((sent.filtersBuilder as { modifiers: [{ value: unknown }] }).modifiers[0].value)).toBe(false);
		expect(parseModifiers(sent.filtersBuilder)).toEqual([
			{ method: 'where', kind: 'in', key: 'code', value: values, logicalOperator: 'and' },
			{
				method: 'where',
				kind: 'grouped',
				logicalOperator: 'and',
				children: [
					{ method: 'where', kind: 'simple', key: 'a', value: '1', logicalOperator: 'and' },
					{ method: 'where', kind: 'simple', key: 'b', value: '2', logicalOperator: 'or' }
				]
			}
		]);
	});

	test('refuses malformed filters with a 400', () => {
		refused('{ not json', /not valid JSON/);
		refused({ modifiers: 'x' }, /Modifiers must be a list/);
		refused([{ method: 'delete' }], /Modifier method "delete" is not supported/);
		refused([{ method: 'where', kind: 'exists', key: 'a' }], /Condition kind "exists" is not supported/);
		refused([{ method: 'where', kind: 'simple', key: 'a', operator: '= 1 or', value: 1 }], /Operator "= 1 or" is not allowed/);
		refused([{ method: 'where', kind: 'simple', key: '', value: 1 }], /A key must be a non-empty string/);
		refused([{ method: 'where', kind: 'simple', key: 'a', value: { $ne: 1 } }], /A value must be a string/);
		refused([{ method: 'where', kind: 'column', key: 'a', column: 'b', logicalOperator: 'andNot' }], /not allowed here/);
		refused([{ method: 'where', kind: 'grouped', children: [{ method: 'orderBy', sortBy: 'a' }] }], /only conditions/);
		refused([{ method: 'orderBy', sortBy: 'a', sortDirection: 'up' }], /asc or desc/);
		refused([{ method: 'join', kind: 'cross', table: 't', on: [] }], /Join kind "cross"/);
		let deep: unknown = { method: 'where', kind: 'simple', key: 'a', value: 1 };
		for (let level = 0; level < 40; level += 1) deep = { method: 'where', kind: 'grouped', children: [deep] };
		refused([deep], /nested too deeply/);
	});
});

describe('FilterModifierApplier', () => {
	test('same call as the copied class, with options from the constructor and from the call', () => {
		const applier = new FilterModifierApplier({ columns: ['name'] });
		const modifiers = built((b) => b.where('name', 'ilike', 'bo'));
		expect(applier.applyModifiers(users(), modifiers).toQuery()).toBe(
			'select * from "users" where "tenant_id" = 1 and ("name" ilike \'bo\')'
		);
		expect(applier.applyModifiers(users(), modifiers, { legacyLike: true }).toQuery()).toContain("'%bo%'");
		expect(() => applier.applyModifiers(users(), built((b) => b.where('role', 'x')))).toThrow(FilterError);
	});

	test('works with the filters of a real tree, root in OR', () => {
		const fields: FilterField[] = [
			{ name: 'name', label: 'Name', type: 'string' },
			{ name: 'age', label: 'Age', type: 'number' },
			{ name: 'status', label: 'Status', type: 'select' }
		];
		const tree = createFilters(
			[
				filterCondition('name', 'contains', 'bo'),
				filterGroup('and', [filterCondition('age', 'gt', 18), filterCondition('status', 'in', [{ value: 'a' }, { value: 'b' }])])
			],
			'or'
		);
		const modifiers = filtersToBuilder(tree, fields).toJson().modifiers;
		expect(new FilterModifierApplier().applyModifiers(users(), modifiers).toQuery()).toBe(
			'select * from "users" where "tenant_id" = 1 and (("name" ilike \'%bo%\' or ("age" > 18 and "status" in (\'a\', \'b\'))))'
		);
	});
});
