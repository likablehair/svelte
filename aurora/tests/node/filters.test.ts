import { describe, expect, test } from 'vitest';
import FilterBuilder, { type Modifier } from '../../src/lib/utils/filters/builder';
import { filtersToBuilder } from '../../src/lib/utils/filters/convert';
import {
	DEFAULT_FILTER_LABELS,
	FILTER_LABELS_IT,
	filterLabels,
	operatorLabel,
	valueText,
	type FilterLabels
} from '../../src/lib/utils/filters/labels';
import {
	DEFAULT_OPERATORS,
	DEFAULT_PERIODS,
	FILTER_OPERATORS,
	OPERATOR_SETS,
	addFilterNode,
	clearFilters,
	conditionOperators,
	countFilters,
	createFilters,
	fieldOperators,
	filterCondition,
	filterConditions,
	filterGroup,
	filtersFromParam,
	filtersToParam,
	isConditionComplete,
	isFilterGroup,
	operatorOf,
	parseFilters,
	pruneFilters,
	removeFieldConditions,
	removeFilterNode,
	serializeFilters,
	updateFilterNode,
	type FilterField,
	type FilterGroup,
	type FilterNode,
	type FilterOperatorOptions
} from '../../src/lib/utils/filters/model';

const fields: FilterField[] = [
	{ name: 'name', label: 'Name', type: 'string', column: 'clients.name' },
	{ name: 'amount', label: 'Amount', type: 'number', column: 'amount' },
	{ name: 'createdAt', label: 'Created', type: 'date', column: 'createdAt' },
	{ name: 'day', label: 'Day', type: 'date', column: 'day', dateOnly: true },
	{
		name: 'status',
		label: 'Status',
		type: 'select',
		column: 'statusId',
		items: [
			{ value: 1, label: 'Open' },
			{ value: 'working', label: 'In progress', values: [2, 3, 4] }
		]
	},
	{ name: 'active', label: 'Active', type: 'bool', column: 'active' }
];

const modifiers = (tree = createFilters(), list = fields, now?: Date) =>
	filtersToBuilder(tree, list, { now, negativesIncludeEmpty: false }).toJson().modifiers;

const v4Path = new URL('../../../src/lib/utils/filters/filters.ts', import.meta.url).pathname;
const { default: V4Converter } = await import(/* @vite-ignore */ v4Path);

const v4 = (filter: Record<string, unknown>) =>
	new V4Converter().createBuilder({ filters: [{ active: true, label: 'x', name: 'x', ...filter } as never] }).toJson()
		.modifiers;

describe('filtersToBuilder: same query as v4 for the usual filters', () => {
	test('string contains', () => {
		const tree = createFilters([filterCondition('name', 'contains', 'Rossi')]);
		expect(modifiers(tree)).toEqual(v4({ type: 'string', column: 'clients.name', mode: 'contains', value: 'Rossi' }));
	});

	test('number equal, greater, lower and between', () => {
		const cases: [string, unknown, Record<string, unknown>][] = [
			['eq', 5, { mode: 'equal', value: 5 }],
			['gt', 5, { mode: 'greater', value: 5 }],
			['lt', 5, { mode: 'lower', value: 5 }],
			['between', { from: 1, to: 9 }, { mode: 'between', from: 1, to: 9 }],
			['between', { to: 9 }, { mode: 'between', to: 9 }]
		];
		for (const [operator, value, old] of cases)
			expect(modifiers(createFilters([filterCondition('amount', operator, value)]))).toEqual(
				v4({ type: 'number', column: 'amount', ...old })
			);
	});

	test('date equal and between are whole local days', () => {
		expect(modifiers(createFilters([filterCondition('createdAt', 'is', '2026-09-24')]))).toEqual(
			v4({ type: 'date', column: 'createdAt', mode: 'equal', value: new Date(2026, 8, 24) })
		);
		expect(
			modifiers(createFilters([filterCondition('createdAt', 'between', { from: '2026-09-01', to: '2026-09-30' })]))
		).toEqual(
			v4({ type: 'date', column: 'createdAt', mode: 'between', from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) })
		);
	});

	test('bool true', () => {
		expect(modifiers(createFilters([filterCondition('active', 'isTrue')]))).toEqual(
			v4({ type: 'bool', column: 'active', mode: 'equal', value: true, description: '' })
		);
	});
});

describe('filtersToBuilder: operators', () => {
	const one = (field: string, operator: string, value?: unknown, list = fields, now?: Date) =>
		modifiers(createFilters([filterCondition(field, operator, value)]), list, now);

	test('string operators, trimmed, with LIKE wildcards escaped', () => {
		expect(one('name', 'contains', ' 50%_off ')).toEqual([
			{ method: 'where', kind: 'simple', key: 'clients.name', operator: 'ilike', value: '%50\\%\\_off%', logicalOperator: 'and' }
		]);
		expect(one('name', 'notContains', 'x')[0]).toMatchObject({ operator: 'not ilike', value: '%x%' });
		expect(one('name', 'is', ' x ')[0]).toMatchObject({ operator: '~*', value: '^x$' });
		expect(one('name', 'isNot', 'x')[0]).toMatchObject({ operator: '!~*', value: '^x$' });
		expect(one('name', 'is', 'a.b (c)')[0]).toMatchObject({ operator: '~*', value: '^a\\.b \\(c\\)$' });
	});

	test('string empty counts blank strings, unless blankIsEmpty is false', () => {
		expect(one('name', 'empty')).toEqual([
			{
				method: 'where',
				kind: 'grouped',
				logicalOperator: 'and',
				children: [
					{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'clients.name' },
					{ method: 'where', kind: 'simple', key: 'clients.name', operator: '=', value: '', logicalOperator: 'or' }
				]
			}
		]);
		expect(one('name', 'notEmpty')).toEqual([
			{ method: 'where', kind: 'null', logicalOperator: 'andNot', key: 'clients.name' },
			{ method: 'where', kind: 'simple', key: 'clients.name', operator: '<>', value: '', logicalOperator: 'and' }
		]);
		const strict: FilterField[] = [{ name: 'name', label: 'Name', type: 'string', blankIsEmpty: false }];
		expect(one('name', 'empty', undefined, strict)).toEqual([
			{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'name' }
		]);
	});

	test('number operators, unit scale', () => {
		expect(one('amount', 'ne', 3)[0]).toMatchObject({ operator: '<>', value: 3 });
		expect(one('amount', 'gte', 3)[0]).toMatchObject({ operator: '>=', value: 3 });
		expect(one('amount', 'lte', 3)[0]).toMatchObject({ operator: '<=', value: 3 });
		const tons: FilterField[] = [{ name: 'weight', label: 'Weight', type: 'number', unit: 't', scale: 1000 }];
		expect(one('weight', 'gt', 1.5, tons)[0]).toMatchObject({ key: 'weight', operator: '>', value: 1500 });
	});

	test('v4 bug: date greater and lower used the raw value; before and after use whole days', () => {
		expect(one('createdAt', 'before', '2026-09-24')[0]).toMatchObject({ operator: '<', value: new Date(2026, 8, 24) });
		expect(one('createdAt', 'after', '2026-09-24')[0]).toMatchObject({
			operator: '>',
			value: new Date(2026, 8, 24, 23, 59, 59, 999)
		});
	});

	test('dateOnly columns compare yyyy-MM-dd strings (no time zone shift)', () => {
		expect(one('day', 'is', '2026-09-24')).toEqual([
			{ method: 'where', kind: 'simple', key: 'day', operator: '=', value: '2026-09-24', logicalOperator: 'and' }
		]);
		expect(one('day', 'between', { from: '2026-09-01' })).toEqual([
			{ method: 'where', kind: 'simple', key: 'day', operator: '>=', value: '2026-09-01', logicalOperator: 'and' }
		]);
	});

	test('relative dates use "now"', () => {
		const now = new Date(2026, 8, 24, 15);
		expect(one('day', 'period', 'thisMonth', fields, now).map((m) => (m as { value: string }).value)).toEqual([
			'2026-09-01',
			'2026-09-30'
		]);
		expect(one('day', 'period', 'thisWeek', fields, now).map((m) => (m as { value: string }).value)).toEqual([
			'2026-09-21',
			'2026-09-27'
		]);
		expect(one('day', 'period', 'lastQuarter', fields, now).map((m) => (m as { value: string }).value)).toEqual([
			'2026-04-01',
			'2026-06-30'
		]);
		expect(one('day', 'inLast', 30, fields, now).map((m) => (m as { value: string }).value)).toEqual([
			'2026-08-25',
			'2026-09-24'
		]);
	});

	test('select uses whereIn / notWhereIn and expands items that stand for several values', () => {
		expect(one('status', 'in', [{ value: 1 }, { value: 'working', values: [2, 3, 4] }])).toEqual([
			{ method: 'where', kind: 'in', logicalOperator: 'and', key: 'statusId', value: [1, 2, 3, 4] }
		]);
		expect(one('status', 'notIn', [{ value: 1 }, { value: 5 }])[0]).toMatchObject({ kind: 'in', logicalOperator: 'andNot' });
		expect(one('status', 'in', [{ value: 1 }])[0]).toMatchObject({ kind: 'simple', operator: '=', value: 1 });
		expect(one('status', 'notIn', [{ value: 1 }])[0]).toMatchObject({ kind: 'simple', operator: '<>', value: 1 });
		expect(one('status', 'empty')[0]).toMatchObject({ kind: 'null', logicalOperator: 'and' });
	});

	test('v4 bug: a false boolean could not be filtered', () => {
		expect(one('active', 'isFalse')[0]).toMatchObject({ key: 'active', operator: '=', value: false });
	});

	test('bool whenTrue / whenFalse replace the query', () => {
		const list: FilterField[] = [
			{
				name: 'low',
				label: 'Low stock',
				type: 'bool',
				whenTrue: (b) => b.whereColumn('quantity', '<', 'minQuantity'),
				whenFalse: (b) => b.whereColumn('quantity', '>=', 'minQuantity')
			}
		];
		expect(one('low', 'isTrue', undefined, list)[0]).toMatchObject({ kind: 'column', operator: '<', column: 'minQuantity' });
		expect(one('low', 'isFalse', undefined, list)[0]).toMatchObject({ kind: 'column', operator: '>=' });
	});
});

describe('filtersToBuilder: structure', () => {
	test('AND at the root stays at the first level; OR is wrapped in one group', () => {
		const and = createFilters([filterCondition('name', 'is', 'a'), filterCondition('amount', 'eq', 1)]);
		expect(modifiers(and).map((m) => (m as { logicalOperator: string }).logicalOperator)).toEqual(['and', 'and']);
		const or = createFilters([filterCondition('name', 'is', 'a'), filterCondition('amount', 'eq', 1)], 'or');
		expect(modifiers(or)).toEqual([
			{
				method: 'where',
				kind: 'grouped',
				logicalOperator: 'and',
				children: [
					{ method: 'where', kind: 'simple', key: 'clients.name', operator: '~*', value: '^a$', logicalOperator: 'and' },
					{ method: 'where', kind: 'simple', key: 'amount', operator: '=', value: 1, logicalOperator: 'or' }
				]
			}
		]);
	});

	test('a multi-clause condition inside an OR group is parenthesized', () => {
		const tree = createFilters(
			[filterCondition('name', 'is', 'a'), filterCondition('amount', 'between', { from: 1, to: 9 })],
			'or'
		);
		const [group] = modifiers(tree) as { children: { kind: string; logicalOperator: string }[] }[];
		expect(group.children.map((child) => [child.kind, child.logicalOperator])).toEqual([
			['simple', 'and'],
			['grouped', 'or']
		]);
	});

	test('nested groups; a group with one condition adds no level; empty groups vanish', () => {
		const tree = createFilters([
			filterCondition('name', 'is', 'a'),
			filterGroup('or', [filterCondition('amount', 'eq', 1), filterCondition('amount', 'eq', 2)]),
			filterGroup('or', [filterCondition('active', 'isTrue')]),
			filterGroup('and', [filterCondition('name', 'contains', '')])
		]);
		expect(modifiers(tree).map((m) => (m as { kind: string }).kind)).toEqual(['simple', 'grouped', 'simple']);
	});

	test('incomplete conditions are skipped; locked ones apply', () => {
		const tree = createFilters([
			filterCondition('name', 'contains', '  '),
			filterCondition('amount', 'between', {}),
			filterCondition('status', 'in', []),
			filterCondition('active', 'isTrue', undefined, { locked: true }),
			filterCondition('unknown', 'is', 'x')
		]);
		expect(modifiers(tree)).toEqual([
			{ method: 'where', kind: 'simple', key: 'active', operator: '=', value: true, logicalOperator: 'and' }
		]);
	});

	test('several columns: any matches for positive operators, none for negative ones; words', () => {
		const list: FilterField[] = [
			{ name: 'who', label: 'Who', type: 'string', columns: ['firstName', 'lastName'], words: true }
		];
		const positive = one('who', 'contains', 'mario rossi', list);
		expect(positive).toHaveLength(2);
		expect(positive[0]).toMatchObject({ kind: 'grouped', children: [{ key: 'firstName', value: '%mario%' }, { key: 'lastName', logicalOperator: 'or' }] });
		const negative = one('who', 'isNot', 'x', list);
		expect(negative.map((m) => (m as { logicalOperator: string }).logicalOperator)).toEqual(['and', 'and']);
		function one(field: string, operator: string, value: unknown, list: FilterField[]) {
			return modifiers(createFilters([filterCondition(field, operator, value)]), list);
		}
	});

	describe('words: every text operator works word by word, and each negative is the exact opposite of its positive', () => {
		const list: FilterField[] = [
			{ name: 'who', label: 'Who', type: 'string', columns: ['firstName', 'lastName'], words: true },
			{ name: 'code', label: 'Code', type: 'string', columns: ['a', 'b'], words: true, caseSensitive: true },
			{ name: 'plain', label: 'Plain', type: 'string', columns: ['firstName', 'lastName'] }
		];
		const run = (field: string, operator: string, value: unknown) =>
			modifiers(createFilters([filterCondition(field, operator, value)]), list);
		const both = (q: FilterBuilder, operator: string, value: string, or: boolean) =>
			or ? q.where('firstName', operator, value).orWhere('lastName', operator, value) : q.where('firstName', operator, value).where('lastName', operator, value);

		test('contains: every word, in any column', () => {
			expect(run('who', 'contains', 'mario  rossi ')).toEqual(
				new FilterBuilder()
					.where((q) => both(q, 'ilike', '%mario%', true))
					.where((q) => both(q, 'ilike', '%rossi%', true))
					.toJson().modifiers
			);
		});

		test('notContains: the opposite of contains, so some word is in no column (Mario Bianchi stays)', () => {
			expect(run('who', 'notContains', 'mario rossi')).toEqual(
				new FilterBuilder()
					.where((group) =>
						group
							.where((q) => both(q, 'not ilike', '%mario%', false))
							.orWhere((q) => both(q, 'not ilike', '%rossi%', false))
					)
					.toJson().modifiers
			);
		});

		test('is: every word is a whole word of some column, ignoring case (Maria Grazia, De Rossi, Rossi Mario)', () => {
			expect(run('who', 'is', 'mario rossi')).toEqual(
				new FilterBuilder()
					.where((q) => both(q, '~*', '\\mmario\\M', true))
					.where((q) => both(q, '~*', '\\mrossi\\M', true))
					.toJson().modifiers
			);
		});

		test('isNot: the opposite of is, so some word is a whole word of no column', () => {
			expect(run('who', 'isNot', 'mario rossi')).toEqual(
				new FilterBuilder()
					.where((group) =>
						group
							.where((q) => both(q, '!~*', '\\mmario\\M', false))
							.orWhere((q) => both(q, '!~*', '\\mrossi\\M', false))
					)
					.toJson().modifiers
			);
		});

		test('case sensitive fields compare words with case, and regex characters are escaped', () => {
			const [first] = run('code', 'is', 'a.b') as { children: { operator: string; value: string }[] }[];
			expect(first.children.map((child) => [child.operator, child.value])).toEqual([
				['~', '\\ma\\.b\\M'],
				['~', '\\ma\\.b\\M']
			]);
			const [negative] = run('code', 'isNot', '(x)') as { operator: string; value: string; logicalOperator: string }[];
			expect([negative.operator, negative.value]).toEqual(['!~', '\\m\\(x\\)\\M']);
		});

		test('without words the whole text is compared, as before', () => {
			expect(run('plain', 'is', 'Mario Rossi')).toEqual(
				new FilterBuilder().where((q) => both(q, '~*', '^Mario Rossi$', true)).toJson().modifiers
			);
			expect(run('plain', 'notContains', 'mario rossi')).toEqual(
				new FilterBuilder().where('firstName', 'not ilike', '%mario rossi%').where('lastName', 'not ilike', '%mario rossi%').toJson().modifiers
			);
		});

		test('a single word gives the same query with and without words for contains', () => {
			expect(run('who', 'contains', 'rossi')).toEqual(run('plain', 'contains', 'rossi'));
		});
	});

	test('all on a column that holds one value: every value must match, so two values match nothing', () => {
		const list: FilterField[] = [
			{ name: 'service', label: 'Service', type: 'select', column: 'serviceId', items: [] }
		];
		const run = (value: unknown) => modifiers(createFilters([filterCondition('service', 'all', value)]), list);
		expect(run([{ value: 1 }])).toEqual(new FilterBuilder().where('serviceId', '=', 1).toJson().modifiers);
		expect(run([{ value: 1 }, { value: 2 }])).toEqual(
			new FilterBuilder().where('serviceId', '=', 1).where('serviceId', '=', 2).toJson().modifiers
		);
		expect(modifiers(createFilters([filterCondition('service', 'in', [{ value: 1 }, { value: 2 }])]), list)).toEqual(
			new FilterBuilder().whereIn('serviceId', [1, 2]).toJson().modifiers
		);
	});

	test('a JSON key with cast follows words like a column', () => {
		const list: FilterField[] = [
			{ name: 'notes', label: 'Notes', type: 'string', words: true, json: { column: 'customFields', key: 'notes', cast: 'text' } }
		];
		const result = modifiers(createFilters([filterCondition('notes', 'contains', 'red hair')]), list) as {
			kind: string;
			clause: string;
			bindings: unknown[];
			logicalOperator: string;
		}[];
		expect(result.map((modifier) => [modifier.kind, modifier.clause, modifier.bindings, modifier.logicalOperator])).toEqual([
			['raw', '(??#>>?)::text ilike ?', ['customFields', '{notes}', '%red%'], 'and'],
			['raw', '(??#>>?)::text ilike ?', ['customFields', '{notes}', '%hair%'], 'and']
		]);
	});

	describe('negativesIncludeEmpty: negative operators keep the empty rows too', () => {
		const list: FilterField[] = [
			{ name: 'name', label: 'Name', type: 'string', column: 'name' },
			{ name: 'who', label: 'Who', type: 'string', columns: ['first', 'last'], words: true },
			{ name: 'amount', label: 'Amount', type: 'number', column: 'amount' },
			{ name: 'day', label: 'Day', type: 'date', column: 'day', dateOnly: true },
			{ name: 'service', label: 'Service', type: 'select', column: 'serviceId', items: [] },
			{ name: 'labels', label: 'Labels', type: 'select', column: 'labels', array: true, items: [] },
			{ name: 'tag', label: 'Tag', type: 'select', column: 'tagId', through: { key: 'clients.id', from: 'client_tags', select: 'clientId' } },
			{ name: 'color', label: 'Color', type: 'select', json: { column: 'data', key: 'color' }, items: [] },
			{ name: 'nick', label: 'Nick', type: 'string', json: { column: 'data', key: 'nick', cast: 'text' } },
			{ name: 'own', label: 'Own', type: 'string', column: 'own', negativesIncludeEmpty: true },
			{ name: 'never', label: 'Never', type: 'string', column: 'never', negativesIncludeEmpty: false }
		];
		const run = (field: string, operator: string, value?: unknown, include = true) =>
			filtersToBuilder(createFilters([filterCondition(field, operator, value)]), list, { negativesIncludeEmpty: include }).toJson()
				.modifiers;
		const json = (build: (b: FilterBuilder) => void) => {
			const b = new FilterBuilder();
			build(b);
			return b.toJson().modifiers;
		};

		test('on by default; false gives the plain comparison', () => {
			expect(
				filtersToBuilder(createFilters([filterCondition('name', 'isNot', 'x')]), list).toJson().modifiers
			).toEqual(json((b) => b.where((q) => q.whereNull('name').orWhere('name', '!~*', '^x$'))));
			expect(run('name', 'isNot', 'x', false)).toEqual(json((b) => b.where('name', '!~*', '^x$')));
		});

		test('text, number, date and select negatives become "empty or …"', () => {
			expect(run('name', 'isNot', 'x')).toEqual(json((b) => b.where((q) => q.whereNull('name').orWhere('name', '!~*', '^x$'))));
			expect(run('name', 'notContains', 'x')).toEqual(json((b) => b.where((q) => q.whereNull('name').orWhere('name', 'not ilike', '%x%'))));
			expect(run('name', 'noneOf', ['a', 'b'])).toEqual(json((b) => b.where((q) => q.whereNull('name').orWhere('name', '!~*', '^(a|b)$'))));
			expect(run('amount', 'ne', 5)).toEqual(json((b) => b.where((q) => q.whereNull('amount').orWhere('amount', '<>', 5))));
			expect(run('amount', 'notBetween', { from: 1, to: 9 })).toEqual(
				json((b) => b.where((q) => q.whereNull('amount').orWhere('amount', '<', 1).orWhere('amount', '>', 9)))
			);
			expect(run('day', 'isNot', '2026-09-24')).toEqual(json((b) => b.where((q) => q.whereNull('day').orWhere('day', '<>', '2026-09-24'))));
			expect(run('service', 'notIn', [{ value: 1 }, { value: 2 }])).toEqual(
				json((b) => b.where((q) => q.whereNull('serviceId').orWhereNotIn('serviceId', [1, 2])))
			);
			expect(run('labels', 'notIn', [{ value: 'vip' }])).toEqual(
				json((b) => b.where((q) => q.whereNull('labels').orWhereNot('labels', '&&', ['vip'] as never)))
			);
		});

		test('several columns and words: every column part keeps its empty rows', () => {
			expect(run('who', 'isNot', 'mario')).toEqual(
				json((b) =>
					b
						.where((q) => q.whereNull('first').orWhere('first', '!~*', '\\mmario\\M'))
						.where((q) => q.whereNull('last').orWhere('last', '!~*', '\\mmario\\M'))
				)
			);
		});

		test('positives, empty and relations do not change; JSON keys add their null', () => {
			expect(run('name', 'is', 'x')).toEqual(json((b) => b.where('name', '~*', '^x$')));
			expect(run('amount', 'empty')).toEqual(json((b) => b.whereNull('amount')));
			expect(run('tag', 'notIn', [{ value: 1 }], true)).toEqual(run('tag', 'notIn', [{ value: 1 }], false));
			expect(run('color', 'notIn', [{ value: 'red' }])).toEqual(
				json((b) => b.where((q) => q.whereNull('data').orWhereNot((r) => r.orWhereJsonSuperset('data', { color: 'red' }))))
			);
			const [nick] = run('nick', 'isNot', 'Bob') as { kind: string; children: { kind: string; clause: string }[] }[];
			expect(nick.kind).toBe('grouped');
			expect(nick.children.map((child) => [child.kind, child.clause])).toEqual([
				['raw', '(??#>>?)::text is null'],
				['raw', '(??#>>?)::text !~* ?']
			]);
		});

		test('the field option wins over the global one', () => {
			expect(run('own', 'isNot', 'x', false)).toEqual(json((b) => b.where((q) => q.whereNull('own').orWhere('own', '!~*', '^x$'))));
			expect(run('never', 'isNot', 'x', true)).toEqual(json((b) => b.where('never', '!~*', '^x$')));
		});
	});

	test('a period the library does not know (from a URL or a saved filter) is incomplete and never breaks the query', () => {
		const condition = filterCondition('createdAt', 'period', 'lastDecade');
		const field = fields.find((candidate) => candidate.name === 'createdAt')!;
		expect(isConditionComplete(condition, field)).toBe(false);
		expect(() => modifiers(createFilters([condition]))).not.toThrow();
		expect(modifiers(createFilters([condition]))).toEqual([]);
		expect(isConditionComplete(filterCondition('createdAt', 'period', 'monthToDate'), field)).toBe(true);
		expect(modifiers(filtersFromParam(JSON.stringify({ logic: 'and', items: [{ field: 'createdAt', operator: 'period', value: 'nope' }] })))).toEqual([]);
	});

	test('joins are added once, first, and only when the field has a condition', () => {
		const join = { table: 'suppliers as s', on: ['s.id', 'goods.supplierId'] as [string, string] };
		const list: FilterField[] = [
			{ name: 'city', label: 'City', type: 'string', column: 's.city', joins: [join] },
			{ name: 'country', label: 'Country', type: 'string', column: 's.country', joins: [join] }
		];
		expect(modifiers(createFilters(), list)).toEqual([]);
		const result = modifiers(
			createFilters([filterCondition('city', 'is', 'Milano'), filterCondition('country', 'is', 'IT')]),
			list
		);
		expect(result[0]).toEqual({
			method: 'join',
			kind: 'left',
			on: [{ from: 's.id', operator: '=', to: 'goods.supplierId' }],
			table: 'suppliers as s'
		});
		expect(result.filter((m) => m.method === 'join')).toHaveLength(1);
		expect(result).toHaveLength(3);
	});

	test('relations through subqueries: in, notIn, empty, all, nested hops', () => {
		const list: FilterField[] = [
			{
				name: 'residence',
				label: 'Residence',
				type: 'select',
				column: 'residenceId',
				through: { key: 'users.id', from: 'user_residences', select: 'userId' }
			},
			{
				name: 'tag',
				label: 'Tag',
				type: 'select',
				column: 'tagId',
				through: [
					{ key: 'wallets.id', from: 'wallet_items', select: 'walletId' },
					{ key: 'wallet_items.id', from: 'item_tags', select: 'itemId' }
				]
			}
		];
		const run = (field: string, operator: string, value?: unknown) =>
			modifiers(createFilters([filterCondition(field, operator, value)]), list);
		expect(run('residence', 'in', [{ value: 7 }])).toEqual(
			new FilterBuilder()
				.whereIn('users.id', (q) => q.select('userId').from('user_residences').where('residenceId', '=', 7))
				.toJson().modifiers
		);
		expect(run('residence', 'notIn', [{ value: 7 }, { value: 8 }])).toEqual(
			new FilterBuilder()
				.notWhereIn('users.id', (q) => q.select('userId').from('user_residences').whereIn('residenceId', [7, 8]))
				.toJson().modifiers
		);
		expect(run('residence', 'empty')).toEqual(
			new FilterBuilder().notWhereIn('users.id', (q) => q.select('userId').from('user_residences')).toJson().modifiers
		);
		expect(run('residence', 'all', [{ value: 1 }, { value: 2 }]).map((m) => (m as { kind: string }).kind)).toEqual([
			'inBuilder',
			'inBuilder'
		]);
		expect(fieldOperators(list[0]).map((operator) => operator.name)).toContain('all');
		expect(run('tag', 'in', [{ value: 4 }])).toEqual(
			new FilterBuilder()
				.whereIn('wallets.id', (q) =>
					q
						.select('walletId')
						.from('wallet_items')
						.whereIn('wallet_items.id', (r) => r.select('itemId').from('item_tags').where('tagId', '=', 4))
				)
				.toJson().modifiers
		);
	});

	test('apply and custom operators replace the query; joins they add are moved first', () => {
		const list: FilterField[] = [
			{
				name: 'tags',
				label: 'Tags',
				type: 'custom',
				operators: [
					{
						name: 'hasAll',
						label: 'has all',
						input: 'custom',
						apply: (b, condition) => b.join('t', (on) => on.on('t.id', 'x.tId')).whereIn('t.id', condition.value as number[])
					}
				]
			},
			{ name: 'code', label: 'Code', type: 'string', apply: (b, condition) => b.where('code', 'ilike', `${condition.value}%`) }
		];
		const result = modifiers(
			createFilters([filterCondition('code', 'contains', 'AB'), filterCondition('tags', 'hasAll', [1, 2])]),
			list
		);
		expect(result.map((m) => m.method)).toEqual(['join', 'where', 'where']);
		expect(result[1]).toMatchObject({ key: 'code', value: 'AB%' });
	});

	test('a query of apply that mixes AND and OR is parenthesized; orderBy, select and from are kept', () => {
		const list: FilterField[] = [
			{ name: 'a', label: 'A', type: 'custom', apply: (b) => b.where('x', 1).orWhere('y', 2).orderBy('x', 'desc') },
			{ name: 'b', label: 'B', type: 'custom', apply: (b) => b.where('z', 1).where('w', 2).orWhere('k', 3) }
		];
		const result = modifiers(
			createFilters([filterCondition('a', 'custom', 'on'), filterCondition('b', 'custom', 'on')]),
			list
		);
		expect(result.map((m) => [m.method, (m as { kind?: string }).kind])).toEqual([
			['where', 'grouped'],
			['where', 'grouped'],
			['orderBy', undefined]
		]);
		expect(result[0]).toMatchObject({ logicalOperator: 'and', children: [{ key: 'x' }, { key: 'y', logicalOperator: 'or' }] });
	});

	test('custom fields have a default operator; isComplete and empty arrays or objects decide completeness', () => {
		const list: FilterField[] = [
			{ name: 'tags', label: 'Tags', type: 'custom', apply: (b, c) => b.whereIn('tagId', c.value as number[]) },
			{ name: 'code', label: 'Code', type: 'string', isComplete: (c) => typeof c.value === 'string' && c.value.length >= 3 }
		];
		expect(fieldOperators(list[0]).map((operator) => operator.name)).toEqual(['custom']);
		expect(isConditionComplete(filterCondition('tags', 'custom', []), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('tags', 'custom', {}), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('code', 'contains', 'AB'), list[1])).toBe(false);
		expect(
			modifiers(createFilters([filterCondition('tags', 'custom', [1, 2]), filterCondition('code', 'contains', 'ABC')]), list)
		).toHaveLength(2);
	});

	test('toQueryParam is the JSON of toJson in one string', () => {
		const builder = new FilterBuilder().whereIn('a', [1, 2]).where((q) => q.where('b', 1).orWhere('c', 2));
		expect(JSON.parse(builder.toQueryParam())).toEqual(JSON.parse(JSON.stringify(builder.toJson())));
	});

	test('whenAbsent applies only while the field has no condition', () => {
		const list: FilterField[] = [
			{ name: 'archived', label: 'Archived', type: 'bool', whenAbsent: (b) => b.where('archived', false), whenTrue: () => {} }
		];
		expect(modifiers(createFilters(), list)).toEqual([
			{ method: 'where', kind: 'simple', key: 'archived', value: false, logicalOperator: 'and' }
		]);
		expect(modifiers(createFilters([filterCondition('archived', 'isTrue')]), list)).toEqual([]);
	});

	test('an existing builder is extended, not changed', () => {
		const base = new FilterBuilder().leftJoin('a', (on) => on.on('a.id', 'b.aId')).where('tenant', 1);
		const before = base.toJson();
		const result = filtersToBuilder(createFilters([filterCondition('amount', 'eq', 2)]), fields, { builder: base });
		expect(base.toJson()).toEqual(before);
		expect(result.toJson().modifiers.map((m) => m.method)).toEqual(['join', 'where', 'where']);
	});
});

describe('tree helpers', () => {
	test('add, update, remove, clear keep the tree immutable and prune empty groups', () => {
		const condition = filterCondition('name', 'is', 'a');
		const group = filterGroup('or', [filterCondition('amount', 'eq', 1)]);
		let tree = createFilters();
		const empty = tree;
		tree = addFilterNode(tree, condition);
		tree = addFilterNode(tree, group);
		tree = addFilterNode(tree, filterCondition('amount', 'eq', 2), group.id);
		expect(empty.items).toHaveLength(0);
		expect(filterConditions(tree)).toHaveLength(3);
		tree = updateFilterNode(tree, condition.id, { value: 'b' });
		expect(filterConditions(tree)[0].value).toBe('b');
		tree = removeFieldConditions(tree, 'amount');
		expect(tree.items).toHaveLength(1);
		tree = addFilterNode(tree, filterCondition('active', 'isTrue', undefined, { locked: true }));
		tree = clearFilters(tree);
		expect(filterConditions(tree).map((c) => c.field)).toEqual(['active']);
		expect(removeFilterNode(tree, filterConditions(tree)[0].id).items).toEqual([]);
	});

	test('serialize and parse round trip; unknown fields and garbage are dropped', () => {
		const tree = createFilters([
			filterCondition('createdAt', 'between', { from: '2026-09-01', to: '2026-09-30' }),
			filterGroup('or', [filterCondition('status', 'in', [{ value: 1, label: 'Open' }]), filterCondition('gone', 'is', 'x')])
		]);
		const parsed = parseFilters(serializeFilters(tree), fields);
		expect(parsed.items[0]).toEqual(tree.items[0]);
		expect(filterConditions(parsed).map((c) => c.field)).toEqual(['createdAt', 'status']);
		expect(parseFilters('not json').items).toEqual([]);
		expect(parseFilters(null).logic).toBe('and');
	});

	test('completeness and count', () => {
		const field = fields[2];
		expect(isConditionComplete(filterCondition('createdAt', 'is', '2026-9-1'), field)).toBe(false);
		expect(isConditionComplete(filterCondition('createdAt', 'between', { to: '2026-09-01' }), field)).toBe(true);
		expect(isConditionComplete(filterCondition('createdAt', 'nope', '2026-09-01'), field)).toBe(false);
		const tree = createFilters([
			filterCondition('name', 'is', 'a'),
			filterCondition('name', 'is', ''),
			filterCondition('amount', 'empty')
		]);
		expect(countFilters(tree, fields)).toBe(2);
		expect(countFilters(tree, [{ ...fields[0], hidden: true }, fields[1]])).toBe(1);
	});
});

const NOW = new Date(2026, 8, 24, 15, 30);

const where = (key: string, operator: string, value: unknown, logicalOperator = 'and') => ({
	method: 'where',
	kind: 'simple',
	key,
	operator,
	value,
	logicalOperator
});

const grouped = (children: unknown[], logicalOperator = 'and') => ({
	method: 'where',
	kind: 'grouped',
	logicalOperator,
	children
});

const raw = (clause: string, bindings: unknown[], logicalOperator = 'and') => ({
	method: 'where',
	kind: 'raw',
	logicalOperator,
	clause,
	bindings
});

function query(list: FilterField[], field: string, operator: string, value?: unknown, now = NOW): Modifier[] {
	return modifiers(createFilters([filterCondition(field, operator, value)]), list, now);
}

function names(field: FilterField, options?: FilterOperatorOptions) {
	return fieldOperators(field, options).map((operator) => operator.name);
}

function pairs(list: Modifier[]) {
	return list.map((modifier) => {
		const { operator, value } = modifier as { operator: string; value: unknown };
		return [operator, value];
	});
}

describe('filtersToBuilder: text operators of "all the modes"', () => {
	const list: FilterField[] = [
		{ name: 'code', label: 'Code', type: 'string' },
		{ name: 'exact', label: 'Exact', type: 'string', caseSensitive: true },
		{ name: 'who', label: 'Who', type: 'string', columns: ['first', 'last'] }
	];
	const run = (field: string, operator: string, value?: unknown) => query(list, field, operator, value);

	test('startsWith and endsWith are case-insensitive regular expressions, trimmed, with special characters escaped', () => {
		expect(run('code', 'startsWith', ' a.b*(c) ')).toEqual([where('code', '~*', '^a\\.b\\*\\(c\\)')]);
		expect(run('code', 'endsWith', '$5+[x]')).toEqual([where('code', '~*', '\\$5\\+\\[x\\]$')]);
		expect(run('code', 'startsWith', '^a|b?{2}\\')).toEqual([where('code', '~*', '^\\^a\\|b\\?\\{2\\}\\\\')]);
		expect(run('code', 'startsWith', '50%_off')).toEqual([where('code', '~*', '^50%_off')]);
	});

	test('caseSensitive: startsWith and endsWith use ~, contains and notContains use like / not like', () => {
		expect(run('exact', 'startsWith', 'AB')).toEqual([where('exact', '~', '^AB')]);
		expect(run('exact', 'endsWith', 'AB')).toEqual([where('exact', '~', 'AB$')]);
		expect(run('exact', 'contains', ' A_b% ')).toEqual([where('exact', 'like', '%A\\_b\\%%')]);
		expect(run('exact', 'notContains', 'x')).toEqual([where('exact', 'not like', '%x%')]);
		expect(run('code', 'contains', 'x')).toEqual([where('code', 'ilike', '%x%')]);
	});

	test('anyOf / noneOf ignore case with one regex; trimmed, blanks dropped, special characters escaped', () => {
		expect(run('code', 'anyOf', [' a ', '', '  '])).toEqual([where('code', '~*', '^a$')]);
		expect(run('code', 'noneOf', ['a'])).toEqual([where('code', '!~*', '^a$')]);
		expect(run('code', 'anyOf', ['a', ' b ', '', 'c.d'])).toEqual([where('code', '~*', '^(a|b|c\\.d)$')]);
		expect(run('code', 'noneOf', ['a', 'b'])).toEqual([where('code', '!~*', '^(a|b)$')]);
		expect(run('code', 'anyOf', ['', ' '])).toEqual([]);
	});

	test('caseSensitive: anyOf / noneOf are = / <> for one value, whereIn / notWhereIn for more, as in v4', () => {
		expect(run('exact', 'anyOf', [' a ', '', '  '])).toEqual([where('exact', '=', 'a')]);
		expect(run('exact', 'noneOf', ['a'])).toEqual([where('exact', '<>', 'a')]);
		expect(run('exact', 'anyOf', ['a', ' b ', ''])).toEqual([
			{ method: 'where', kind: 'in', logicalOperator: 'and', key: 'exact', value: ['a', 'b'] }
		]);
		expect(run('exact', 'noneOf', ['a', 'b'])).toEqual([
			{ method: 'where', kind: 'in', logicalOperator: 'andNot', key: 'exact', value: ['a', 'b'] }
		]);
		expect(run('exact', 'is', ' AB ')).toEqual([where('exact', '=', 'AB')]);
		expect(run('exact', 'isNot', 'AB')).toEqual([where('exact', '<>', 'AB')]);
	});

	test('anyOf / noneOf complete only with a value that is not blank', () => {
		expect(isConditionComplete(filterCondition('code', 'anyOf', ['', ' ']), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('code', 'anyOf', []), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('code', 'anyOf', 'a'), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('code', 'anyOf', ['', 'a']), list[0])).toBe(true);
	});

	test('anyOf on several columns matches any column, noneOf matches none', () => {
		expect(run('who', 'anyOf', ['a', 'b'])).toEqual([
			grouped([
				{ method: 'where', kind: 'simple', logicalOperator: 'and', key: 'first', operator: '~*', value: '^(a|b)$' },
				{ method: 'where', kind: 'simple', logicalOperator: 'or', key: 'last', operator: '~*', value: '^(a|b)$' }
			])
		]);
		expect(run('who', 'noneOf', ['a'])).toEqual([where('first', '!~*', '^a$'), where('last', '!~*', '^a$')]);
	});

	test('the default text operators are the standard set; the set all has every one, each negative beside its positive', () => {
		expect(names(list[0])).toEqual(['contains', 'notContains', 'is', 'isNot', 'empty', 'notEmpty']);
		expect(names(list[0], { set: 'all' })).toEqual([
			'contains',
			'notContains',
			'is',
			'isNot',
			'startsWith',
			'endsWith',
			'anyOf',
			'noneOf',
			'empty',
			'notEmpty'
		]);
		expect(fieldOperators(list[0], { set: 'all' }).find((operator) => operator.name === 'anyOf')?.input).toBe('texts');
	});
});

describe('filtersToBuilder: match (suggest)', () => {
	const suggest = async () => [];
	const list: FilterField[] = [
		{
			name: 'product',
			label: 'Product',
			type: 'string',
			column: 'products.name',
			suggestColumn: 'products.code',
			suggest
		},
		{ name: 'brand', label: 'Brand', type: 'string', column: 'brands.name', suggest },
		{ name: 'tag', label: 'Tag', type: 'string', suggest },
		{ name: 'who', label: 'Who', type: 'string', columns: ['first', 'last'], words: true, suggest }
	];
	const run = (field: string, value: unknown) => query(list, field, 'match', value);

	test('offered only with suggest, as the first operator', () => {
		expect(names(list[0])[0]).toBe('match');
		expect(fieldOperators(list[0])[0].input).toBe('suggest');
		expect(names(list[0]).slice(1)).toEqual(names({ name: 'plain', label: 'Plain', type: 'string' }));
		expect(names({ name: 'plain', label: 'Plain', type: 'string' })).not.toContain('match');
	});

	test('a typed text is contains on the columns, word by word with words', () => {
		expect(run('product', ' sham ')).toEqual([where('products.name', 'ilike', '%sham%')]);
		expect(run('who', 'mario rossi')).toEqual([
			grouped([where('first', 'ilike', '%mario%'), where('last', 'ilike', '%mario%', 'or')]),
			grouped([where('first', 'ilike', '%rossi%'), where('last', 'ilike', '%rossi%', 'or')])
		]);
	});

	test('a picked item is = on suggestColumn, else on column, else on the name', () => {
		expect(run('product', { value: 'P-100', label: 'P-100 Shampoo' })).toEqual([where('products.code', '=', 'P-100')]);
		expect(run('brand', { value: 7, label: 'Acme' })).toEqual([where('brands.name', '=', 7)]);
		expect(run('tag', { value: 'vip' })).toEqual([where('tag', '=', 'vip')]);
		expect(run('who', { value: 3, label: 'Mario Rossi' })).toEqual([where('who', '=', 3)]);
	});

	test('completeness: a non-blank text or an object with a value', () => {
		const complete = (value: unknown) => isConditionComplete(filterCondition('product', 'match', value), list[0]);
		expect(complete('')).toBe(false);
		expect(complete('  ')).toBe(false);
		expect(complete({ label: 'x' })).toBe(false);
		expect(complete(undefined)).toBe(false);
		expect(complete('a')).toBe(true);
		expect(complete({ value: 'P-100' })).toBe(true);
	});
});

describe('filtersToBuilder: number operators of "all the modes"', () => {
	const list: FilterField[] = [
		{ name: 'amount', label: 'Amount', type: 'number' },
		{ name: 'weight', label: 'Weight', type: 'number', column: 'weightKg', scale: 1000 },
		{
			name: 'quantity',
			label: 'Quantity',
			type: 'number',
			compareWith: [
				{ column: 'minQuantity', label: 'Minimum' },
				{ column: 'maxQuantity', label: 'Maximum' }
			]
		}
	];
	const run = (field: string, operator: string, value?: unknown) => query(list, field, operator, value);

	test('notBetween: both ends are an OR group, one end is one condition; the scale applies', () => {
		expect(run('weight', 'notBetween', { from: 1, to: 2.5 })).toEqual([
			grouped([where('weightKg', '<', 1000), where('weightKg', '>', 2500, 'or')])
		]);
		expect(run('weight', 'notBetween', { from: 1 })).toEqual([where('weightKg', '<', 1000)]);
		expect(run('weight', 'notBetween', { to: 2 })).toEqual([where('weightKg', '>', 2000)]);
		expect(run('weight', 'notBetween', {})).toEqual([]);
	});

	test('notBetween inside an OR group joins its two ends to the others with OR', () => {
		const tree = createFilters(
			[filterCondition('amount', 'notBetween', { from: 10, to: 90 }), filterCondition('amount', 'eq', 50)],
			'or'
		);
		expect(modifiers(tree, list)).toEqual([
			grouped([where('amount', '<', 10), where('amount', '>', 90, 'or'), where('amount', '=', 50, 'or')])
		]);
	});

	test('anyOf / noneOf are scaled, with = / <> for one value', () => {
		expect(run('weight', 'anyOf', [1, 2.5])).toEqual([
			{ method: 'where', kind: 'in', logicalOperator: 'and', key: 'weightKg', value: [1000, 2500] }
		]);
		expect(run('weight', 'noneOf', [1, 2])).toEqual([
			{ method: 'where', kind: 'in', logicalOperator: 'andNot', key: 'weightKg', value: [1000, 2000] }
		]);
		expect(run('weight', 'anyOf', [1, Number.NaN])).toEqual([where('weightKg', '=', 1000)]);
		expect(run('amount', 'noneOf', [3])).toEqual([where('amount', '<>', 3)]);
		expect(isConditionComplete(filterCondition('amount', 'anyOf', [Number.NaN]), list[0])).toBe(false);
		expect(isConditionComplete(filterCondition('amount', 'anyOf', [0]), list[0])).toBe(true);
	});

	test('column operators are offered only with compareWith, before empty / notEmpty', () => {
		const columns = ['columnEq', 'columnNe', 'columnGt', 'columnGte', 'columnLt', 'columnLte'];
		expect(names(list[0])).not.toContain('columnEq');
		expect(names(list[0], { set: 'all' })).not.toContain('columnEq');
		expect(names(list[2])).toEqual([
			'eq',
			'ne',
			'gt',
			'gte',
			'lt',
			'lte',
			'between',
			...columns,
			'empty',
			'notEmpty'
		]);
		expect(names(list[2], { set: 'all' })).toEqual([
			'eq',
			'ne',
			'gt',
			'gte',
			'lt',
			'lte',
			'between',
			'notBetween',
			'anyOf',
			'noneOf',
			...columns,
			'empty',
			'notEmpty'
		]);
		expect(names({ ...list[2], compareWith: [] } as FilterField)).not.toContain('columnEq');
		expect(names({ ...list[2], compareWith: [] } as FilterField, { set: 'all' })).not.toContain('columnEq');
	});

	test('column operators are whereColumn with their symbol; the column must be listed in compareWith', () => {
		const symbols = { columnEq: '=', columnNe: '<>', columnGt: '>', columnGte: '>=', columnLt: '<', columnLte: '<=' };
		for (const [operator, symbol] of Object.entries(symbols))
			expect(run('quantity', operator, 'minQuantity')).toEqual([
				{ method: 'where', kind: 'column', key: 'quantity', operator: symbol, column: 'minQuantity', logicalOperator: 'and' }
			]);
		const complete = (value: unknown) =>
			isConditionComplete(filterCondition('quantity', 'columnLt', value), list[2]);
		expect(complete('maxQuantity')).toBe(true);
		expect(complete('price')).toBe(false);
		expect(complete(undefined)).toBe(false);
		expect(run('quantity', 'columnLt', 'price')).toEqual([]);
		expect(isConditionComplete(filterCondition('amount', 'columnLt', 'minQuantity'), list[0])).toBe(false);
	});

	test('a column operator in an OR group is joined with OR', () => {
		const tree = createFilters(
			[filterCondition('quantity', 'eq', 0), filterCondition('quantity', 'columnLt', 'minQuantity')],
			'or'
		);
		expect(modifiers(tree, list)).toEqual([
			grouped([
				where('quantity', '=', 0),
				{ method: 'where', kind: 'column', key: 'quantity', operator: '<', column: 'minQuantity', logicalOperator: 'or' }
			])
		]);
	});
});

describe('filtersToBuilder: date operators of "all the modes"', () => {
	const list: FilterField[] = [
		{ name: 'created', label: 'Created', type: 'date', column: 'createdAt' },
		{ name: 'due', label: 'Due', type: 'date', column: 'dueDate', dateOnly: true },
		{
			name: 'delivered',
			label: 'Delivered',
			type: 'date',
			column: 'deliveredAt',
			withTime: true,
			compareWith: [{ column: 'promisedAt', label: 'Promised' }]
		}
	];
	const run = (field: string, operator: string, value?: unknown, now = NOW) => query(list, field, operator, value, now);
	const endOfDay = (year: number, month: number, day: number) => new Date(year, month, day, 23, 59, 59, 999);

	test('notBetween: outside the whole days, the yyyy-MM-dd days or the instants', () => {
		expect(run('created', 'notBetween', { from: '2026-09-01', to: '2026-09-30' })).toEqual([
			grouped([where('createdAt', '<', new Date(2026, 8, 1)), where('createdAt', '>', endOfDay(2026, 8, 30), 'or')])
		]);
		expect(run('due', 'notBetween', { from: '2026-09-01', to: '2026-09-30' })).toEqual([
			grouped([where('dueDate', '<', '2026-09-01'), where('dueDate', '>', '2026-09-30', 'or')])
		]);
		expect(run('due', 'notBetween', { to: '2026-09-30' })).toEqual([where('dueDate', '>', '2026-09-30')]);
		expect(run('created', 'notBetween', { from: '2026-09-01' })).toEqual([
			where('createdAt', '<', new Date(2026, 8, 1))
		]);
		expect(run('delivered', 'notBetween', { from: '2026-09-01T08:00', to: '2026-09-01T18:30' })).toEqual([
			grouped([
				where('deliveredAt', '<', new Date(2026, 8, 1, 8, 0)),
				where('deliveredAt', '>', new Date(2026, 8, 1, 18, 30), 'or')
			])
		]);
	});

	test('relative operators in days, weeks, months and years count whole days from today', () => {
		expect(pairs(run('due', 'inLast', { amount: 2, unit: 'weeks' }))).toEqual([
			['>=', '2026-09-10'],
			['<=', '2026-09-24']
		]);
		expect(pairs(run('due', 'inNext', { amount: 1, unit: 'months' }))).toEqual([
			['>=', '2026-09-24'],
			['<=', '2026-10-24']
		]);
		expect(pairs(run('due', 'inNext', { amount: 1, unit: 'years' }))).toEqual([
			['>=', '2026-09-24'],
			['<=', '2027-09-24']
		]);
		expect(pairs(run('due', 'olderThan', { amount: 3, unit: 'days' }))).toEqual([['<', '2026-09-21']]);
		expect(pairs(run('due', 'laterThan', { amount: 3, unit: 'days' }))).toEqual([['>', '2026-09-27']]);
		expect(pairs(run('created', 'inLast', { amount: 2, unit: 'days' }))).toEqual([
			['>=', new Date(2026, 8, 22)],
			['<=', endOfDay(2026, 8, 24)]
		]);
		expect(pairs(run('created', 'olderThan', { amount: 1, unit: 'months' }))).toEqual([['<', new Date(2026, 7, 24)]]);
		expect(pairs(run('created', 'laterThan', { amount: 1, unit: 'weeks' }))).toEqual([['>', endOfDay(2026, 9, 1)]]);
		expect(pairs(run('created', 'inLast', { amount: 1, unit: 'months' }, new Date(2026, 2, 31, 9)))).toEqual([
			['>=', new Date(2026, 1, 28)],
			['<=', endOfDay(2026, 2, 31)]
		]);
	});

	test('a plain number is a number of days (the value of the first version)', () => {
		expect(run('due', 'inLast', 14)).toEqual(run('due', 'inLast', { amount: 2, unit: 'weeks' }));
		expect(run('due', 'olderThan', 3)).toEqual(run('due', 'olderThan', { amount: 3, unit: 'days' }));
		expect(run('created', 'inNext', 0)).toEqual([
			where('createdAt', '>=', new Date(2026, 8, 24)),
			where('createdAt', '<=', endOfDay(2026, 8, 24))
		]);
	});

	test('minutes and hours compare instants from now', () => {
		expect(run('delivered', 'inLast', { amount: 30, unit: 'minutes' })).toEqual([
			where('deliveredAt', '>=', new Date(2026, 8, 24, 15, 0)),
			where('deliveredAt', '<=', NOW)
		]);
		expect(run('delivered', 'inNext', { amount: 2, unit: 'hours' })).toEqual([
			where('deliveredAt', '>=', NOW),
			where('deliveredAt', '<=', new Date(2026, 8, 24, 17, 30))
		]);
		expect(run('delivered', 'olderThan', { amount: 90, unit: 'minutes' })).toEqual([
			where('deliveredAt', '<', new Date(2026, 8, 24, 14, 0))
		]);
		expect(run('delivered', 'laterThan', { amount: 1, unit: 'hours' })).toEqual([
			where('deliveredAt', '>', new Date(2026, 8, 24, 16, 30))
		]);
	});

	test('relative completeness: a number or { amount, unit } not below zero', () => {
		const complete = (value: unknown) => isConditionComplete(filterCondition('created', 'inLast', value), list[0]);
		expect(complete(0)).toBe(true);
		expect(complete({ amount: 0, unit: 'days' })).toBe(true);
		expect(complete({ amount: 3, unit: 'months' })).toBe(true);
		expect(complete(-1)).toBe(false);
		expect(complete({ amount: -1, unit: 'days' })).toBe(false);
		expect(complete({ amount: undefined, unit: 'days' })).toBe(false);
		expect(complete('3')).toBe(false);
		expect(complete(undefined)).toBe(false);
	});

	test('the new periods: next quarter and year, month, quarter and year to date', () => {
		const period = (value: string, now = NOW) => pairs(run('due', 'period', value, now)).map(([, day]) => day);
		expect(period('nextQuarter')).toEqual(['2026-10-01', '2026-12-31']);
		expect(period('nextQuarter', new Date(2026, 10, 15))).toEqual(['2027-01-01', '2027-03-31']);
		expect(period('nextYear')).toEqual(['2027-01-01', '2027-12-31']);
		expect(period('monthToDate')).toEqual(['2026-09-01', '2026-09-24']);
		expect(period('quarterToDate')).toEqual(['2026-07-01', '2026-09-24']);
		expect(period('yearToDate')).toEqual(['2026-01-01', '2026-09-24']);
		expect(pairs(run('created', 'period', 'monthToDate'))).toEqual([
			['>=', new Date(2026, 8, 1)],
			['<=', endOfDay(2026, 8, 24)]
		]);
		expect(DEFAULT_PERIODS).toEqual(
			expect.arrayContaining(['nextQuarter', 'nextYear', 'monthToDate', 'quarterToDate', 'yearToDate'])
		);
	});

	test('withTime: date inputs become date and time, except is and isNot', () => {
		const inputs = Object.fromEntries(
			fieldOperators(list[2], { set: 'all' }).map((operator) => [operator.name, operator.input])
		);
		expect(inputs).toMatchObject({
			is: 'date',
			isNot: 'date',
			before: 'datetime',
			after: 'datetime',
			onOrBefore: 'datetime',
			onOrAfter: 'datetime',
			between: 'datetimeRange',
			notBetween: 'datetimeRange',
			period: 'period',
			inLast: 'relative'
		});
		expect(Object.fromEntries(fieldOperators(list[2]).map((operator) => [operator.name, operator.input]))).toMatchObject({
			is: 'date',
			before: 'datetime',
			after: 'datetime',
			between: 'datetimeRange'
		});
		expect(fieldOperators(list[0]).find((operator) => operator.name === 'before')?.input).toBe('date');
		expect(FILTER_OPERATORS.date.find((operator) => operator.name === 'before')?.input).toBe('date');
	});

	test('withTime: before, after, on or before, on or after and between compare instants', () => {
		expect(run('delivered', 'before', '2026-09-24T10:30')).toEqual([
			where('deliveredAt', '<', new Date(2026, 8, 24, 10, 30))
		]);
		expect(run('delivered', 'after', '2026-09-24T10:30')).toEqual([
			where('deliveredAt', '>', new Date(2026, 8, 24, 10, 30))
		]);
		expect(run('delivered', 'onOrBefore', '2026-09-24T00:00')).toEqual([
			where('deliveredAt', '<=', new Date(2026, 8, 24))
		]);
		expect(run('delivered', 'onOrAfter', '2026-09-24T23:59')).toEqual([
			where('deliveredAt', '>=', new Date(2026, 8, 24, 23, 59))
		]);
		expect(run('delivered', 'between', { from: '2026-09-24T08:00', to: '2026-09-24T12:00' })).toEqual([
			where('deliveredAt', '>=', new Date(2026, 8, 24, 8, 0)),
			where('deliveredAt', '<=', new Date(2026, 8, 24, 12, 0))
		]);
		expect(run('delivered', 'between', { to: '2026-09-24T12:00' })).toEqual([
			where('deliveredAt', '<=', new Date(2026, 8, 24, 12, 0))
		]);
		expect(run('delivered', 'is', '2026-09-24')).toEqual([
			where('deliveredAt', '>=', new Date(2026, 8, 24)),
			where('deliveredAt', '<=', endOfDay(2026, 8, 24))
		]);
	});

	test('withTime: completeness of the date-and-time values', () => {
		const complete = (operator: string, value: unknown) =>
			isConditionComplete(filterCondition('delivered', operator, value), list[2]);
		expect(complete('before', '2026-09-24T10:30')).toBe(true);
		expect(complete('before', '2026-09-24')).toBe(false);
		expect(complete('before', '2026-09-24T1:30')).toBe(false);
		expect(complete('before', '2026-09-24T10:30:00')).toBe(false);
		expect(complete('between', { from: '2026-09-24' })).toBe(false);
		expect(complete('between', { to: '2026-09-24T23:59' })).toBe(true);
		expect(complete('notBetween', {})).toBe(false);
		expect(complete('is', '2026-09-24')).toBe(true);
		expect(complete('is', '2026-09-24T10:30')).toBe(false);
		expect(run('delivered', 'before', '2026-09-24')).toEqual([]);
	});

	test('column operators on dates', () => {
		expect(names(list[0])).not.toContain('columnGt');
		expect(names(list[2]).slice(-8)).toEqual([
			'columnEq',
			'columnNe',
			'columnGt',
			'columnGte',
			'columnLt',
			'columnLte',
			'empty',
			'notEmpty'
		]);
		expect(run('delivered', 'columnGt', 'promisedAt')).toEqual([
			{ method: 'where', kind: 'column', key: 'deliveredAt', operator: '>', column: 'promisedAt', logicalOperator: 'and' }
		]);
		expect(run('delivered', 'columnLte', 'shippedAt')).toEqual([]);
	});
});

describe('filtersToBuilder: Postgres arrays and nullable booleans', () => {
	const list: FilterField[] = [
		{
			name: 'labels',
			label: 'Labels',
			type: 'select',
			array: true,
			column: 'clients.labels',
			items: [
				{ value: 'vip', label: 'VIP' },
				{ value: 'care', label: 'Care', values: ['hair', 'skin'] }
			]
		},
		{ name: 'service', label: 'Service', type: 'select', column: 'serviceId' },
		{ name: 'vip', label: 'VIP', type: 'bool', nullable: true, column: 'clients.vip' },
		{ name: 'paid', label: 'Paid', type: 'bool', column: 'paid' }
	];
	const run = (field: string, operator: string, value?: unknown) => query(list, field, operator, value);

	test('in is && (contains any), all is @> (contains all), notIn is NOT &&, even with one value', () => {
		expect(run('labels', 'in', [{ value: 'vip' }])).toEqual([where('clients.labels', '&&', ['vip'])]);
		expect(run('labels', 'in', [{ value: 'vip' }, { value: 'care', values: ['hair', 'skin'] }])).toEqual([
			where('clients.labels', '&&', ['vip', 'hair', 'skin'])
		]);
		expect(run('labels', 'all', [{ value: 'vip' }, { value: 'new' }])).toEqual([
			where('clients.labels', '@>', ['vip', 'new'])
		]);
		expect(run('labels', 'notIn', [{ value: 'vip' }])).toEqual([where('clients.labels', '&&', ['vip'], 'andNot')]);
	});

	test("empty is null or '{}' (a string: query strings drop empty arrays); notEmpty is the opposite", () => {
		expect(run('labels', 'empty')).toEqual([
			grouped([
				{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'clients.labels' },
				where('clients.labels', '=', '{}', 'or')
			])
		]);
		expect(run('labels', 'notEmpty')).toEqual([
			{ method: 'where', kind: 'null', logicalOperator: 'andNot', key: 'clients.labels' },
			where('clients.labels', '<>', '{}')
		]);
	});

	test('all is offered only where a row holds several values: arrays (also in a JSON key) and relations', () => {
		expect(names(list[0])).toEqual(['in', 'notIn', 'all', 'empty', 'notEmpty']);
		expect(names(list[1])).toEqual(['in', 'notIn', 'empty', 'notEmpty']);
		expect(names({ ...list[1], json: { column: 'data', key: 'service' } } as FilterField)).toEqual(['in', 'notIn']);
		expect(names({ ...list[1], array: true, json: { column: 'data', key: 'langs' } } as FilterField)).toEqual(['in', 'notIn', 'all']);
		expect(
			names({ ...list[1], through: { key: 'a.id', from: 'b', select: 'aId' } } as FilterField)
		).toContain('all');
	});

	test('nullable booleans add empty and notEmpty: whereNull / notWhereNull', () => {
		expect(names(list[2])).toEqual(['isTrue', 'isFalse', 'empty', 'notEmpty']);
		expect(names(list[2], { set: 'basic' })).toEqual(['isTrue', 'isFalse', 'empty', 'notEmpty']);
		expect(names(list[2], { set: 'all' })).toEqual(['isTrue', 'isFalse', 'empty', 'notEmpty']);
		expect(names(list[3])).toEqual(['isTrue', 'isFalse']);
		expect(names(list[3], { set: 'all' })).toEqual(['isTrue', 'isFalse']);
		expect(run('vip', 'empty')).toEqual([{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'clients.vip' }]);
		expect(run('vip', 'notEmpty')).toEqual([
			{ method: 'where', kind: 'null', logicalOperator: 'andNot', key: 'clients.vip' }
		]);
		expect(run('vip', 'isFalse')).toEqual([where('clients.vip', '=', false)]);
		expect(run('paid', 'empty')).toEqual([{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'paid' }]);
	});
});

describe('filtersToBuilder: JSONB keys', () => {
	const superset = (value: object, logicalOperator = 'and') => ({
		method: 'where',
		kind: 'jsonSuperset',
		key: 'customFields',
		value,
		logicalOperator
	});
	const list: FilterField[] = [
		{
			name: 'color',
			label: 'Color',
			type: 'select',
			json: { column: 'customFields', key: 'color' },
			items: [
				{ value: 'red', label: 'Red' },
				{ value: 'dark', label: 'Dark', values: ['brown', 'black'] }
			]
		},
		{ name: 'visits', label: 'Visits', type: 'number', json: { column: 'customFields', key: 'stats.visits' } },
		{ name: 'nick', label: 'Nick', type: 'string', json: { column: 'customFields', key: 'nick' } },
		{ name: 'langs', label: 'Languages', type: 'select', array: true, json: { column: 'customFields', key: 'langs' } },
		{ name: 'vip', label: 'VIP', type: 'bool', json: { column: 'customFields', key: 'flags.vip' } },
		{ name: 'birth', label: 'Birth', type: 'date', json: { column: 'customFields', key: 'birth' } }
	];
	const run = (field: string, operator: string, value?: unknown) => query(list, field, operator, value);

	test('without cast only the operators whereJsonSuperset can express are offered', () => {
		const all = { set: 'all' } as const;
		expect(names(list[0])).toEqual(['in', 'notIn']);
		expect(names(list[0], all)).toEqual(['in', 'notIn']);
		expect(names(list[3])).toEqual(['in', 'notIn', 'all']);
		expect(names(list[1])).toEqual(['eq', 'ne']);
		expect(names(list[1], all)).toEqual(['eq', 'ne', 'anyOf', 'noneOf']);
		expect(names(list[2])).toEqual(['is', 'isNot']);
		expect(names(list[2], all)).toEqual(['is', 'isNot', 'anyOf', 'noneOf']);
		expect(names({ ...list[2], suggest: async () => [] } as FilterField, all)).toEqual(['is', 'isNot', 'anyOf', 'noneOf']);
		expect(names(list[4])).toEqual(['isTrue', 'isFalse']);
		expect(names(list[5])).toEqual(['is']);
		expect(names(list[5], all)).toEqual(['is', 'isNot']);
		expect(names({ ...list[1], compareWith: [{ column: 'x', label: 'X' }] } as FilterField, all)).not.toContain('columnEq');
	});

	test('one value is whereJsonSuperset on the nested key', () => {
		expect(run('visits', 'eq', 5)).toEqual([superset({ stats: { visits: 5 } })]);
		expect(run('nick', 'is', 'Bob')).toEqual([superset({ nick: 'Bob' })]);
		expect(run('color', 'in', [{ value: 'red', label: 'Red' }])).toEqual([superset({ color: 'red' })]);
		expect(run('vip', 'isTrue')).toEqual([superset({ flags: { vip: true } })]);
		expect(run('vip', 'isFalse')).toEqual([superset({ flags: { vip: false } })]);
	});

	test('several values are an OR group; negatives are a whereNot group', () => {
		expect(run('color', 'in', [{ value: 'red' }, { value: 'dark', values: ['brown', 'black'] }])).toEqual([
			grouped([superset({ color: 'red' }, 'or'), superset({ color: 'brown' }, 'or'), superset({ color: 'black' }, 'or')])
		]);
		expect(run('visits', 'anyOf', [1, 2])).toEqual([
			grouped([superset({ stats: { visits: 1 } }, 'or'), superset({ stats: { visits: 2 } }, 'or')])
		]);
		expect(run('color', 'notIn', [{ value: 'red' }])).toEqual([grouped([superset({ color: 'red' }, 'or')], 'andNot')]);
		expect(run('nick', 'isNot', 'Bob')).toEqual([grouped([superset({ nick: 'Bob' }, 'or')], 'andNot')]);
		expect(run('nick', 'noneOf', ['a', 'b'])).toEqual([
			grouped([superset({ nick: 'a' }, 'or'), superset({ nick: 'b' }, 'or')], 'andNot')
		]);
		expect(run('visits', 'ne', 3)).toEqual([grouped([superset({ stats: { visits: 3 } }, 'or')], 'andNot')]);
	});

	test('arrays: each value is wrapped in an array; all is one superset with every value', () => {
		expect(run('langs', 'in', [{ value: 'en' }])).toEqual([superset({ langs: ['en'] })]);
		expect(run('langs', 'in', [{ value: 'en' }, { value: 'it' }])).toEqual([
			grouped([superset({ langs: ['en'] }, 'or'), superset({ langs: ['it'] }, 'or')])
		]);
		expect(run('langs', 'all', [{ value: 'en' }, { value: 'it' }])).toEqual([superset({ langs: ['en', 'it'] })]);
		expect(run('color', 'all', [{ value: 'red' }, { value: 'dark', values: ['brown', 'black'] }])).toEqual([
			superset({ color: ['red', 'brown', 'black'] })
		]);
	});

	test('in an OR group a negative JSON condition keeps its NOT', () => {
		const tree = createFilters(
			[filterCondition('nick', 'is', 'Bob'), filterCondition('color', 'notIn', [{ value: 'red' }])],
			'or'
		);
		expect(modifiers(tree, list)).toEqual([
			grouped([superset({ nick: 'Bob' }), grouped([superset({ color: 'red' }, 'or')], 'orNot')])
		]);
	});

	test('the values are cleaned as on a column: texts trimmed, blanks dropped, numbers scaled', () => {
		expect(run('nick', 'is', ' Bob ')).toEqual([superset({ nick: 'Bob' })]);
		expect(run('nick', 'anyOf', [' a ', '', 'b'])).toEqual([
			grouped([superset({ nick: 'a' }, 'or'), superset({ nick: 'b' }, 'or')])
		]);
		const kilos: FilterField[] = [
			{ name: 'weight', label: 'Weight', type: 'number', scale: 1000, json: { column: 'customFields', key: 'kg' } }
		];
		expect(query(kilos, 'weight', 'eq', 1.5)).toEqual([superset({ kg: 1500 })]);
		expect(query(kilos, 'weight', 'anyOf', [1, 2])).toEqual([
			grouped([superset({ kg: 1000 }, 'or'), superset({ kg: 2000 }, 'or')])
		]);
	});
});

describe('filtersToBuilder: JSONB keys with cast', () => {
	const json = (key: string, cast: 'text' | 'numeric' | 'date' | 'timestamp' | 'boolean') => ({
		column: 'customFields',
		key,
		cast
	});
	const list: FilterField[] = [
		{
			name: 'visits',
			label: 'Visits',
			type: 'number',
			json: json('stats.visits', 'numeric'),
			compareWith: [{ column: 'clients.minVisits', label: 'Minimum' }]
		},
		{ name: 'nick', label: 'Nick', type: 'string', json: json('nick', 'text') },
		{ name: 'birth', label: 'Birth', type: 'date', json: json('birth', 'date') },
		{ name: 'seen', label: 'Seen', type: 'date', json: json('seen', 'timestamp') },
		{ name: 'color', label: 'Color', type: 'select', json: json('color', 'text') },
		{ name: 'vip', label: 'VIP', type: 'bool', nullable: true, json: json('vip', 'boolean') }
	];
	const run = (field: string, operator: string, value?: unknown) => query(list, field, operator, value);
	const visits = (clause: string, value?: unknown, logicalOperator = 'and') =>
		raw(
			`(??#>>?)::numeric ${clause}`,
			value === undefined ? ['customFields', '{stats,visits}'] : ['customFields', '{stats,visits}', value],
			logicalOperator
		);

	test('every operator of the set is offered', () => {
		const plain: FilterField = { name: 'plain', label: 'Plain', type: 'string' };
		expect(names(list[1])).toEqual(names(plain));
		expect(names(list[1], { set: 'all' })).toEqual(names(plain, { set: 'all' }));
		expect(names(list[3])).toContain('inLast');
		expect(names(list[3], { set: 'all' })).toContain('olderThan');
	});

	test('comparisons are raw clauses (??#>>?)::cast <op> ? with column, path and value as bindings', () => {
		expect(run('visits', 'gt', 5)).toEqual([visits('> ?', 5)]);
		expect(run('visits', 'eq', 5)).toEqual([visits('= ?', 5)]);
		expect(run('visits', 'ne', 5)).toEqual([visits('<> ?', 5)]);
		expect(run('visits', 'between', { from: 1, to: 9 })).toEqual([visits('>= ?', 1), visits('<= ?', 9)]);
		expect(run('visits', 'notBetween', { from: 1, to: 9 })).toEqual([grouped([visits('< ?', 1), visits('> ?', 9, 'or')])]);
		expect(run('nick', 'contains', 'bo')).toEqual([raw('(??#>>?)::text ilike ?', ['customFields', '{nick}', '%bo%'])]);
		expect(run('nick', 'notContains', 'bo')).toEqual([raw('(??#>>?)::text not ilike ?', ['customFields', '{nick}', '%bo%'])]);
		expect(run('nick', 'startsWith', 'B.')).toEqual([raw('(??#>>?)::text ~* ?', ['customFields', '{nick}', '^B\\.'])]);
		expect(run('vip', 'isTrue')).toEqual([raw('(??#>>?)::boolean = ?', ['customFields', '{vip}', true])]);
	});

	test('null checks are "is null" / "is not null"', () => {
		expect(run('visits', 'empty')).toEqual([visits('is null')]);
		expect(run('visits', 'notEmpty')).toEqual([visits('is not null')]);
		expect(run('vip', 'empty')).toEqual([raw('(??#>>?)::boolean is null', ['customFields', '{vip}'])]);
		expect(run('nick', 'empty')).toEqual([
			grouped([
				raw('(??#>>?)::text is null', ['customFields', '{nick}']),
				raw('(??#>>?)::text = ?', ['customFields', '{nick}', ''], 'or')
			])
		]);
	});

	test('lists are = any(?) / <> all(?), one value = ? / <> ?', () => {
		expect(run('visits', 'anyOf', [1, 2])).toEqual([visits('= any(?)', [1, 2])]);
		expect(run('visits', 'noneOf', [1, 2])).toEqual([visits('<> all(?)', [1, 2])]);
		expect(run('color', 'in', [{ value: 'red' }, { value: 'blue' }])).toEqual([
			raw('(??#>>?)::text = any(?)', ['customFields', '{color}', ['red', 'blue']])
		]);
		expect(run('color', 'notIn', [{ value: 'red' }])).toEqual([raw('(??#>>?)::text <> ?', ['customFields', '{color}', 'red'])]);
	});

	test('a date cast compares yyyy-MM-dd strings; a timestamp cast compares instants', () => {
		expect(run('birth', 'is', '2026-09-24')).toEqual([raw('(??#>>?)::date = ?', ['customFields', '{birth}', '2026-09-24'])]);
		expect(run('birth', 'before', '2026-09-24')).toEqual([raw('(??#>>?)::date < ?', ['customFields', '{birth}', '2026-09-24'])]);
		expect(run('birth', 'period', 'thisMonth')).toEqual([
			raw('(??#>>?)::date >= ?', ['customFields', '{birth}', '2026-09-01']),
			raw('(??#>>?)::date <= ?', ['customFields', '{birth}', '2026-09-30'])
		]);
		expect(run('seen', 'onOrAfter', '2026-09-24')).toEqual([
			raw('(??#>>?)::timestamp >= ?', ['customFields', '{seen}', new Date(2026, 8, 24)])
		]);
	});

	test('in an OR group the raw clauses are joined with OR', () => {
		const tree = createFilters([filterCondition('visits', 'gt', 5), filterCondition('nick', 'is', 'Bob')], 'or');
		expect(modifiers(tree, list)).toEqual([
			grouped([visits('> ?', 5), raw('(??#>>?)::text ~* ?', ['customFields', '{nick}', '^Bob$'], 'or')])
		]);
	});

	test('column operators compare the key with the other column (??), never a fake column', () => {
		expect(run('visits', 'columnLt', 'clients.minVisits')).toEqual([visits('< ??', 'clients.minVisits')]);
		expect(JSON.stringify(run('visits', 'columnGte', 'clients.minVisits'))).not.toContain('__json__');
	});
});

describe('URL parameter', () => {
	const strip = (node: FilterNode): unknown =>
		isFilterGroup(node)
			? { ...node, id: undefined, items: node.items.map(strip) }
			: { ...node, id: undefined };
	const ids = (tree: FilterGroup): string[] => [
		tree.id,
		...tree.items.flatMap((node) => (isFilterGroup(node) ? ids(node) : [node.id]))
	];
	const tree = () =>
		createFilters([
			filterCondition('name', 'is', 'a', { locked: true }),
			{ ...filterCondition('amount', 'eq', 1), preset: 'cheap' },
			filterGroup(
				'or',
				[filterCondition('active', 'isTrue'), filterCondition('createdAt', 'between', { from: '2026-09-01' })],
				{ locked: true }
			)
		]);

	test('filtersToParam drops the ids and keeps value, locked and preset', () => {
		const param = filtersToParam(tree());
		expect(param).not.toContain('"id"');
		expect(JSON.parse(param)).toEqual({
			logic: 'and',
			items: [
				{ field: 'name', operator: 'is', value: 'a', locked: true },
				{ field: 'amount', operator: 'eq', value: 1, preset: 'cheap' },
				{
					logic: 'or',
					locked: true,
					items: [
						{ field: 'active', operator: 'isTrue' },
						{ field: 'createdAt', operator: 'between', value: { from: '2026-09-01' } }
					]
				}
			]
		});
	});

	test('filtersFromParam gives back the same conditions with new ids', () => {
		const original = tree();
		const back = filtersFromParam(filtersToParam(original), fields);
		expect(strip(back)).toEqual(strip(original));
		expect(filtersToParam(back)).toBe(filtersToParam(original));
		expect(new Set(ids(back)).size).toBe(ids(original).length);
		for (const id of ids(back)) {
			expect(id).toEqual(expect.any(String));
			expect(ids(original)).not.toContain(id);
		}
		expect(modifiers(back)).toEqual(modifiers(original));
	});

	test('filtersFromParam: new ids from serializeFilters too; unknown fields and garbage are dropped', () => {
		const original = tree();
		const back = filtersFromParam(serializeFilters(original), fields);
		expect(strip(back)).toEqual(strip(original));
		for (const id of ids(back)) expect(ids(original)).not.toContain(id);
		const withUnknown = filtersFromParam(
			JSON.stringify({ logic: 'or', items: [{ field: 'gone', operator: 'is', value: 'x' }, { field: 'name', operator: 'is' }] }),
			fields
		);
		expect(withUnknown.logic).toBe('or');
		expect(filterConditions(withUnknown).map((condition) => condition.field)).toEqual(['name']);
		expect(filtersFromParam('{', fields).items).toEqual([]);
		expect(filtersFromParam(null).items).toEqual([]);
		expect(filtersFromParam(undefined).logic).toBe('and');
		expect(parseFilters(serializeFilters(original)).id).toBe(original.id);
	});
});

describe('pruneFilters', () => {
	test('drops empty groups and turns a group of one item into that item, except locked groups and the root', () => {
		const lone = filterCondition('amount', 'lt', 10);
		const inner = filterCondition('paid', 'isTrue');
		const locked = filterGroup('or', [filterCondition('client', 'is', 'x')]);
		locked.locked = true;
		const tree = createFilters([
			filterGroup('or', [lone]),
			filterGroup('and', []),
			filterGroup('or', [filterGroup('and', [inner])]),
			locked
		]);
		const pruned = pruneFilters(tree);
		expect(pruned.id).toBe(tree.id);
		expect(pruned.items).toEqual([lone, inner, locked]);
		const root = createFilters([lone], 'or');
		expect(pruneFilters(root)).toEqual(root);
	});
});

describe('labels', () => {
	const keys = (object: object) => Object.keys(object).sort();

	test('FILTER_LABELS_IT has every text, operator, period and unit of DEFAULT_FILTER_LABELS', () => {
		expect(keys(FILTER_LABELS_IT)).toEqual(keys(DEFAULT_FILTER_LABELS));
		expect(keys(FILTER_LABELS_IT.operators)).toEqual(keys(DEFAULT_FILTER_LABELS.operators));
		expect(keys(FILTER_LABELS_IT.periods)).toEqual(keys(DEFAULT_FILTER_LABELS.periods));
		expect(keys(FILTER_LABELS_IT.units)).toEqual(keys(DEFAULT_FILTER_LABELS.units));
	});

	test('FILTER_LABELS_IT translates every text: only symbols and words shared by both languages stay the same', () => {
		const same: string[] = [];
		const walk = (it: Record<string, unknown>, en: Record<string, unknown>, path: string) => {
			for (const [key, text] of Object.entries(en)) {
				if (text && typeof text === 'object')
					walk(it[key] as Record<string, unknown>, text as Record<string, unknown>, `${path}${key}.`);
				else if (it[key] === text) same.push(`${path}${key}`);
			}
		};
		walk(
			FILTER_LABELS_IT as unknown as Record<string, unknown>,
			DEFAULT_FILTER_LABELS as unknown as Record<string, unknown>,
			''
		);
		expect(same.sort()).toEqual([
			'no',
			'operators.custom',
			'operators.eq',
			'operators.gt',
			'operators.gte',
			'operators.lt',
			'operators.lte',
			'operators.ne'
		]);
	});

	test('locale picks the built-in texts of its language; labels change only what they pass', () => {
		expect(filterLabels({}, 'it')).toEqual(FILTER_LABELS_IT);
		expect(filterLabels(undefined, 'it-IT')).toEqual(FILTER_LABELS_IT);
		expect(filterLabels({}, 'IT_ch').filters).toBe(FILTER_LABELS_IT.filters);
		expect(filterLabels({}, 'de')).toEqual(DEFAULT_FILTER_LABELS);
		expect(filterLabels()).toEqual(DEFAULT_FILTER_LABELS);
		const mixed = filterLabels({ filters: 'Ricerca', operators: { contains: 'ha dentro' } }, 'it');
		expect([mixed.filters, mixed.addFilter, mixed.operators.contains, mixed.operators.is]).toEqual([
			'Ricerca',
			FILTER_LABELS_IT.addFilter,
			'ha dentro',
			FILTER_LABELS_IT.operators.is
		]);
	});

	test('a field that holds several values says "has any of", "has none of", "has all of"', () => {
		const tags = { name: 'tags', label: 'Tags', type: 'select', through: { key: 'a.id', from: 'b', select: 'aId' } } as FilterField;
		const labels = { name: 'labels', label: 'Labels', type: 'select', array: true } as FilterField;
		const service = { name: 'service', label: 'Service', type: 'select' } as FilterField;
		const english = filterLabels();
		const italian = filterLabels({}, 'it');
		for (const field of [tags, labels]) {
			expect(['in', 'notIn', 'all'].map((name) => operatorLabel(field, name, english))).toEqual(['has any of', 'has none of', 'has all of']);
			expect(['in', 'notIn', 'all'].map((name) => operatorLabel(field, name, italian))).toEqual([
				'ne ha almeno uno tra',
				'non ne ha nessuno tra',
				'li ha tutti'
			]);
		}
		expect(['in', 'notIn'].map((name) => operatorLabel(service, name, english))).toEqual(['is', 'is not']);
	});

	test('every built-in operator and every period has a text', () => {
		const operators = new Set(Object.values(FILTER_OPERATORS).flatMap((list) => list.map((operator) => operator.name)));
		expect([...operators].filter((name) => !(name in DEFAULT_FILTER_LABELS.operators))).toEqual([]);
		expect(keys(DEFAULT_FILTER_LABELS.periods)).toEqual([...DEFAULT_PERIODS].sort());
	});

	test('filterLabels merges partial operators, periods and units', () => {
		const labels = filterLabels({ units: { weeks: 'settimane' }, operators: { anyOf: 'uno di' } } as unknown as Partial<FilterLabels>);
		expect(labels.units).toEqual({ ...DEFAULT_FILTER_LABELS.units, weeks: 'settimane' });
		expect(labels.operators.anyOf).toBe('uno di');
		expect(labels.operators.noneOf).toBe('is none of');
	});
});

describe('valueText of the new inputs', () => {
	const labels = filterLabels();
	const list: Record<string, FilterField> = {
		code: { name: 'code', label: 'Code', type: 'string' },
		amount: { name: 'amount', label: 'Amount', type: 'number', unit: '€' },
		delivered: { name: 'delivered', label: 'Delivered', type: 'date', withTime: true },
		created: { name: 'created', label: 'Created', type: 'date' },
		quantity: {
			name: 'quantity',
			label: 'Quantity',
			type: 'number',
			compareWith: [{ column: 'minQuantity', label: 'Minimum' }]
		},
		product: { name: 'product', label: 'Product', type: 'string', suggest: async () => [] }
	};
	const text = (field: string, operator: string, value: unknown, texts = labels, locale = 'en') =>
		valueText(filterCondition(field, operator, value), list[field], texts, locale);
	const datetime = (date: Date, locale = 'en') =>
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);

	test('lists of texts and numbers show two values and how many more', () => {
		expect(text('code', 'anyOf', ['a', 'b'])).toBe('a, b');
		expect(text('code', 'anyOf', ['a', 'b', 'c', 'd'])).toBe('a, b +2');
		expect(text('code', 'noneOf', ['a'])).toBe('a');
		expect(text('code', 'anyOf', [])).toBe('');
		expect(text('amount', 'anyOf', [1, 2.5, 3])).toBe('1 €, 2.5 € +1');
		expect(text('amount', 'anyOf', [1234.5], labels, 'it')).toBe('1234,5 €');
	});

	test('date and time, and ranges of them', () => {
		expect(text('delivered', 'before', '2026-09-24T10:30')).toBe(datetime(new Date(2026, 8, 24, 10, 30)));
		expect(text('delivered', 'before', '2026-09-24T10:30', labels, 'it')).toBe(
			datetime(new Date(2026, 8, 24, 10, 30), 'it')
		);
		expect(text('delivered', 'before', '2026-09-24')).toBe('');
		expect(text('delivered', 'between', { from: '2026-09-24T08:00', to: '2026-09-25T18:00' })).toBe(
			`${datetime(new Date(2026, 8, 24, 8))} – ${datetime(new Date(2026, 8, 25, 18))}`
		);
		expect(text('delivered', 'notBetween', { from: '2026-09-24T08:00' })).toBe(
			`from ${datetime(new Date(2026, 8, 24, 8))}`
		);
		expect(text('delivered', 'is', '2026-09-24')).toBe('Sep 24, 2026');
	});

	test('relative dates: amount and unit, a plain number is days', () => {
		expect(text('created', 'inLast', { amount: 2, unit: 'weeks' })).toBe('2 weeks');
		expect(text('created', 'olderThan', 5)).toBe('5 days');
		expect(text('delivered', 'inNext', { amount: 30, unit: 'minutes' })).toBe('30 minutes');
		expect(text('created', 'inLast', { amount: 2, unit: 'weeks' }, filterLabels(FILTER_LABELS_IT))).toBe('2 settimane');
		expect(text('created', 'inLast', undefined)).toBe('');
	});

	test('a column shows its label from compareWith', () => {
		expect(text('quantity', 'columnLt', 'minQuantity')).toBe('Minimum');
		expect(text('quantity', 'columnLt', 'other')).toBe('other');
	});

	test('a suggestion shows the label of the picked item, or the typed text', () => {
		expect(text('product', 'match', { value: 'P-100', label: 'P-100 Shampoo' })).toBe('P-100 Shampoo');
		expect(text('product', 'match', { value: 'P-100' })).toBe('P-100');
		expect(text('product', 'match', 'sham')).toBe('sham');
		expect(text('product', 'match', undefined)).toBe('');
	});
});

describe('operator sets', () => {
	const COLUMNS = ['columnEq', 'columnNe', 'columnGt', 'columnGte', 'columnLt', 'columnLte'];
	const types = Object.keys(FILTER_OPERATORS) as FilterField['type'][];
	const plain: Record<FilterField['type'], FilterField> = {
		string: { name: 'code', label: 'Code', type: 'string' },
		number: { name: 'amount', label: 'Amount', type: 'number' },
		date: { name: 'due', label: 'Due', type: 'date' },
		select: { name: 'status', label: 'Status', type: 'select' },
		bool: { name: 'paid', label: 'Paid', type: 'bool' },
		custom: { name: 'tags', label: 'Tags', type: 'custom' }
	};
	const perType = (options?: FilterOperatorOptions) =>
		Object.fromEntries(types.map((type) => [type, names(plain[type], options)]));

	test('DEFAULT_OPERATORS is the standard set; basic is in standard, standard in all, all in the built-in order', () => {
		expect(DEFAULT_OPERATORS).toBe(OPERATOR_SETS.standard);
		for (const type of types) {
			const builtIn = FILTER_OPERATORS[type].map((operator) => operator.name);
			const { basic, standard, all } = {
				basic: OPERATOR_SETS.basic[type],
				standard: OPERATOR_SETS.standard[type],
				all: OPERATOR_SETS.all[type]
			};
			expect(basic.filter((name) => !standard.includes(name))).toEqual([]);
			expect(standard.filter((name) => !all.includes(name))).toEqual([]);
			for (const list of [basic, standard, all])
				expect(list).toEqual([...list].sort((a, b) => builtIn.indexOf(a) - builtIn.indexOf(b)));
		}
	});

	test('all is every built-in operator except those an option adds and the v4 like / ilike', () => {
		const optional: Record<FilterField['type'], string[]> = {
			string: ['match', 'like', 'ilike'],
			number: COLUMNS,
			date: COLUMNS,
			select: ['all'],
			bool: ['empty', 'notEmpty'],
			custom: []
		};
		for (const type of types)
			expect(OPERATOR_SETS.all[type]).toEqual(
				FILTER_OPERATORS[type].map((operator) => operator.name).filter((name) => !optional[type].includes(name))
			);
	});

	test('fields without operators offer the standard set; set picks basic or all', () => {
		expect(perType()).toEqual(perType({ set: 'standard' }));
		expect(perType()).toEqual({
			string: ['contains', 'notContains', 'is', 'isNot', 'empty', 'notEmpty'],
			number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
			date: ['is', 'before', 'after', 'between', 'period', 'inLast', 'empty', 'notEmpty'],
			select: ['in', 'notIn', 'empty', 'notEmpty'],
			bool: ['isTrue', 'isFalse'],
			custom: ['custom']
		});
		expect(perType({ set: 'basic' })).toEqual({
			string: ['contains', 'is'],
			number: ['eq', 'between'],
			date: ['is', 'between', 'period'],
			select: ['in'],
			bool: ['isTrue', 'isFalse'],
			custom: ['custom']
		});
		expect(perType({ set: 'all' })).toEqual(OPERATOR_SETS.all);
	});

	test('byType replaces the set for its types only; unknown names are dropped and the order is kept', () => {
		const options: FilterOperatorOptions = { set: 'basic', byType: { date: ['olderThan', 'is', 'nope', 'gt'] } };
		expect(names(plain.date, options)).toEqual(['olderThan', 'is']);
		expect(names(plain.string, options)).toEqual(['contains', 'is']);
		expect(names(plain.date, { byType: { string: ['is'] } })).toEqual(names(plain.date));
	});

	test("a field's operators win: a list over byType and the set, a set name over both", () => {
		const options: FilterOperatorOptions = { set: 'basic', byType: { date: ['is'], string: ['is'] } };
		expect(names({ ...plain.date, operators: ['after', 'before'] }, options)).toEqual(['after', 'before']);
		expect(names({ ...plain.date, operators: 'all' }, options)).toEqual(OPERATOR_SETS.all.date);
		expect(names({ ...plain.string, operators: 'standard' }, options)).toEqual(OPERATOR_SETS.standard.string);
		expect(names({ ...plain.string, operators: 'basic' }, { set: 'all' })).toEqual(['contains', 'is']);
	});

	test('suggest adds match first to any set and to byType, never to an own list', () => {
		const field: FilterField = { ...plain.string, suggest: async () => [] } as FilterField;
		for (const set of ['basic', 'standard', 'all'] as const)
			expect(names(field, { set })).toEqual(['match', ...OPERATOR_SETS[set].string]);
		expect(names(field, { byType: { string: ['is'] } })).toEqual(['match', 'is']);
		expect(names({ ...field, operators: 'basic' } as FilterField)).toEqual(['match', 'contains', 'is']);
		expect(names({ ...field, operators: ['is'] } as FilterField)).toEqual(['is']);
	});

	test('compareWith adds the column operators before empty, or at the end when the list has no empty', () => {
		const number: FilterField = { ...plain.number, compareWith: [{ column: 'min', label: 'Min' }] } as FilterField;
		const date: FilterField = { ...plain.date, compareWith: [{ column: 'promisedAt', label: 'Promised' }] } as FilterField;
		expect(names(number, { set: 'basic' })).toEqual(['eq', 'between', ...COLUMNS]);
		expect(names(number).slice(-8)).toEqual([...COLUMNS, 'empty', 'notEmpty']);
		expect(names(date, { set: 'all' }).slice(-8)).toEqual([...COLUMNS, 'empty', 'notEmpty']);
		expect(names(number, { byType: { number: ['gt', 'columnLt', 'empty'] } })).toEqual([
			'gt',
			'columnLt',
			'columnEq',
			'columnNe',
			'columnGt',
			'columnGte',
			'columnLte',
			'empty'
		]);
		expect(names({ ...number, operators: ['eq'] } as FilterField)).toEqual(['eq']);
	});

	test('array (also in a JSON key) and through add all after notIn (or in) except in basic; a JSON key with one value does not', () => {
		const through = { key: 'a.id', from: 'b', select: 'aId' };
		expect(names({ ...plain.select, json: { column: 'data', key: 'x' } } as FilterField)).toEqual(['in', 'notIn']);
		for (const option of [{ array: true }, { through }, { array: true, json: { column: 'data', key: 'x' } }]) {
			const field = { ...plain.select, ...option } as FilterField;
			expect(names(field, { set: 'basic' })).toEqual(['in']);
			expect(names(field)).toEqual(
				'json' in option ? ['in', 'notIn', 'all'] : ['in', 'notIn', 'all', 'empty', 'notEmpty']
			);
			expect(names(field, { set: 'all' })).toEqual(names(field));
			expect(names(field, { byType: { select: ['in', 'empty'] } })).toEqual(
				'json' in option ? ['in', 'all'] : ['in', 'all', 'empty']
			);
			expect(names({ ...field, operators: 'basic' } as FilterField, { set: 'all' })).toEqual(['in']);
			expect(names({ ...field, operators: ['in'] } as FilterField)).toEqual(['in']);
		}
		expect(names({ ...plain.select, array: true } as FilterField, { set: 'basic', byType: { select: ['in'] } })).toEqual(['in']);
	});

	test('nullable adds empty and notEmpty to booleans in every set and in byType', () => {
		const field = { ...plain.bool, nullable: true } as FilterField;
		expect(names(field, { set: 'basic' })).toEqual(['isTrue', 'isFalse', 'empty', 'notEmpty']);
		expect(names(field, { byType: { bool: ['isTrue', 'empty'] } })).toEqual(['isTrue', 'empty', 'notEmpty']);
		expect(names({ ...field, operators: ['isTrue'] } as FilterField)).toEqual(['isTrue']);
	});

	test('a JSON key without cast keeps only the equalities of any set', () => {
		const json = { json: { column: 'data', key: 'k' } };
		const field = (type: FilterField['type']) => ({ ...plain[type], ...json }) as FilterField;
		expect(names(field('string'), { set: 'basic' })).toEqual(['is']);
		expect(names(field('number'), { set: 'basic' })).toEqual(['eq']);
		expect(names(field('date'))).toEqual(['is']);
		expect(names(field('number'), { byType: { number: ['gt', 'eq', 'anyOf'] } })).toEqual(['eq', 'anyOf']);
		expect(names({ ...field('number'), json: { column: 'data', key: 'k', cast: 'numeric' } } as FilterField)).toEqual(
			names(plain.number)
		);
	});

	test('withTime turns the date inputs of every set into date and time', () => {
		const field = { ...plain.date, withTime: true } as FilterField;
		expect(fieldOperators(field, { set: 'basic' }).map((operator) => [operator.name, operator.input])).toEqual([
			['is', 'date'],
			['between', 'datetimeRange'],
			['period', 'period']
		]);
		expect(fieldOperators(field, { byType: { date: ['onOrAfter'] } })[0].input).toBe('datetime');
	});

	test('operatorOf accepts any built-in operator of the type, offered or not, and the listed definitions', () => {
		const near = { name: 'near', label: 'near', input: 'text' as const };
		const field: FilterField = { name: 'code', label: 'Code', type: 'string', operators: ['is', near] };
		expect(operatorOf(field, 'is')).toMatchObject({ name: 'is', input: 'text' });
		expect(operatorOf(field, 'startsWith')).toMatchObject({ name: 'startsWith', input: 'text' });
		expect(operatorOf(field, 'noneOf')).toMatchObject({ name: 'noneOf', input: 'texts', negates: 'anyOf' });
		expect(operatorOf(field, 'match')).toMatchObject({ name: 'match', input: 'suggest' });
		expect(operatorOf(field, 'near')).toEqual({ name: 'near', input: 'text', definition: near });
		expect(operatorOf(field, 'gt')).toBeUndefined();
		expect(operatorOf(field, 'nope')).toBeUndefined();
		expect(operatorOf({ ...field, operators: 'basic' } as FilterField, 'near')).toBeUndefined();
		expect(operatorOf({ ...field, operators: 'basic' } as FilterField, 'endsWith')?.name).toBe('endsWith');
		const delivered = { ...plain.date, withTime: true, operators: 'basic' } as FilterField;
		expect(operatorOf(delivered, 'onOrBefore')?.input).toBe('datetime');
		expect(operatorOf(delivered, 'olderThan')?.input).toBe('relative');
		expect(operatorOf(plain.select, 'all')?.input).toBe('items');
		expect(operatorOf(plain.bool, 'empty')?.input).toBe('none');
	});

	test('conditionOperators: the offered operators, plus the one of the condition when it is accepted but not offered', () => {
		const field: FilterField = { name: 'code', label: 'Code', type: 'string', operators: ['contains', 'is'] };
		const list = (operator: string, options?: FilterOperatorOptions) =>
			conditionOperators(field, operator, options).map((candidate) => candidate.name);
		expect(list('is')).toEqual(['contains', 'is']);
		expect(list('startsWith')).toEqual(['contains', 'is', 'startsWith']);
		expect(list('gt')).toEqual(['contains', 'is']);
		expect(list('')).toEqual(['contains', 'is']);
		expect(conditionOperators(plain.date, 'olderThan', { set: 'basic' }).map((candidate) => candidate.name)).toEqual([
			'is',
			'between',
			'period',
			'olderThan'
		]);
		expect(conditionOperators({ ...plain.date, withTime: true } as FilterField, 'onOrAfter').at(-1)?.input).toBe('datetime');
	});

	test('v5 fix: a JSON key without cast refuses the operators it cannot query, so they never look applied', () => {
		const list: FilterField[] = [{ name: 'nick', label: 'Nick', type: 'string', json: { column: 'data', key: 'nick' } }];
		const field = list[0];
		expect(operatorOf(field, 'contains')).toBeUndefined();
		expect(operatorOf(field, 'empty')).toBeUndefined();
		expect(operatorOf(field, 'anyOf')?.input).toBe('texts');
		const tree = createFilters([filterCondition('nick', 'contains', 'bo')]);
		expect(isConditionComplete(filterConditions(tree)[0], field)).toBe(false);
		expect(countFilters(tree, list)).toBe(0);
		expect(modifiers(tree, list)).toEqual([]);
		const cast = { ...field, json: { column: 'data', key: 'nick', cast: 'text' } } as FilterField;
		expect(operatorOf(cast, 'contains')?.input).toBe('text');
	});

	test('conditions with operators the field does not offer (presets, URLs, saved filters, code) still apply', () => {
		const list: FilterField[] = [
			{ name: 'code', label: 'Code', type: 'string', operators: ['is'] },
			{ name: 'amount', label: 'Amount', type: 'number', operators: 'basic' },
			{ name: 'due', label: 'Due', type: 'date', dateOnly: true },
			{ name: 'paid', label: 'Paid', type: 'bool' }
		];
		const tree = createFilters([
			filterCondition('code', 'startsWith', 'AB'),
			filterCondition('amount', 'notBetween', { from: 1, to: 9 }),
			filterCondition('due', 'olderThan', { amount: 3, unit: 'days' }),
			filterCondition('paid', 'empty')
		]);
		for (const condition of filterConditions(tree))
			expect(isConditionComplete(condition, list.find((field) => field.name === condition.field))).toBe(true);
		expect(countFilters(tree, list)).toBe(4);
		const expected = [
			where('code', '~*', '^AB'),
			grouped([where('amount', '<', 1), where('amount', '>', 9, 'or')]),
			where('due', '<', '2026-09-21'),
			{ method: 'where', kind: 'null', logicalOperator: 'and', key: 'paid' }
		];
		expect(modifiers(tree, list, NOW)).toEqual(expected);
		expect(modifiers(filtersFromParam(filtersToParam(tree), list), list, NOW)).toEqual(expected);
		expect(modifiers(parseFilters(serializeFilters(tree), list), list, NOW)).toEqual(expected);
		const labels = filterLabels();
		expect(operatorLabel(list[0], 'startsWith', labels)).toBe('starts with');
		expect(valueText(filterConditions(tree)[1], list[1], labels, 'en')).toBe('1 – 9');
		expect(valueText(filterConditions(tree)[2], list[2], labels, 'en')).toBe('3 days');
	});
});

describe('labels of the inputs', () => {
	test('choose, search, amount, showLess and unit in English and Italian', () => {
		const pick = ({ choose, search, amount, showLess, unit }: FilterLabels) => ({ choose, search, amount, showLess, unit });
		expect(pick(DEFAULT_FILTER_LABELS)).toEqual({
			choose: 'Choose…',
			search: 'Search…',
			amount: 'Amount',
			showLess: 'Show less',
			unit: 'Unit'
		});
		expect(pick(FILTER_LABELS_IT)).toEqual({
			choose: 'Scegli…',
			search: 'Cerca…',
			amount: 'Quantità',
			showLess: 'Mostra meno',
			unit: 'Unità'
		});
	});
});
