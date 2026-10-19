import { FilterError } from './errors.js';
import type {
	FromModifier,
	JoinModifier,
	JoinModifierOnClause,
	LogicalOperator,
	Modifier,
	SelectModifier,
	WhereFilterValue,
	WhereModifier
} from './types.js';

const LOGICAL_OPERATORS = ['and', 'or', 'andNot', 'orNot'];

const MAX_DEPTH = 32;

/** The comparison operators accepted in conditions and join clauses. */
export const OPERATORS = [
	'not ilike',
	'not like',
	'ilike',
	'like',
	'!~*',
	'!~',
	'~*',
	'~',
	'<>',
	'!=',
	'<=',
	'>=',
	'<',
	'>',
	'=',
	'@>',
	'<@',
	'&&'
] as const;

const CASTS = ['text', 'numeric', 'date', 'timestamp', 'boolean'];

const EXPRESSION = String.raw`\(\?\?#>>\?\)::(?:${CASTS.join('|')})`;
const OPERATOR = `(?:${OPERATORS.map((operator) => operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;

const RAW_FORMS = [
	{ pattern: new RegExp(`^(?:not )?${EXPRESSION} ${OPERATOR} \\?$`), third: 'value' },
	{ pattern: new RegExp(`^${EXPRESSION} is (?:not )?null$`), third: 'none' },
	{ pattern: new RegExp(`^${EXPRESSION} (?:= any|<> all)\\(\\?\\)$`), third: 'list' },
	{ pattern: new RegExp(`^${EXPRESSION} ${OPERATOR} \\?\\?$`), third: 'column' }
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function fail(message: string): never {
	throw new FilterError(message);
}

function list(value: unknown, what: string): unknown[] {
	if (Array.isArray(value)) return value;
	if (isRecord(value)) {
		const keys = Object.keys(value);
		if (keys.every((key) => /^\d+$/.test(key)))
			return keys.sort((a, b) => Number(a) - Number(b)).map((key) => value[key]);
	}
	return fail(`${what} must be a list`);
}

function text(value: unknown, what: string): string {
	if (typeof value !== 'string' || value.trim() === '') fail(`${what} must be a non-empty string`);
	return value;
}

function filterValue(value: unknown, what: string): WhereFilterValue {
	if (value === null) return value as unknown as WhereFilterValue;
	if (typeof value === 'string' || typeof value === 'boolean' || value instanceof Date) return value;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	return fail(`${what} must be a string, a number, a boolean or a date`);
}

function conditionValue(value: unknown, what: string): WhereFilterValue {
	const indexed = isRecord(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => /^\d+$/.test(key));
	if (Array.isArray(value) || indexed)
		return list(value, what).map((item) => filterValue(item, what)) as never;
	return filterValue(value, what);
}

function operator(value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined;
	const name = typeof value === 'string' ? value.trim().toLowerCase() : value;
	if (!(OPERATORS as readonly unknown[]).includes(name)) fail(`Operator ${JSON.stringify(value)} is not allowed`);
	return name as string;
}

function logical(value: unknown, allowNot: boolean): LogicalOperator | undefined {
	if (value === undefined || value === null) return undefined;
	if (!LOGICAL_OPERATORS.includes(value as string) || (!allowNot && String(value).endsWith('Not')))
		fail(`Logical operator ${JSON.stringify(value)} is not allowed here`);
	return value as LogicalOperator;
}

function raw(value: Record<string, unknown>): { clause: string; bindings: WhereFilterValue[] } {
	const clause = text(value.clause, 'A raw clause');
	const bindings = value.bindings === undefined ? [] : list(value.bindings, 'Raw bindings');
	const form = RAW_FORMS.find((candidate) => candidate.pattern.test(clause));
	if (!form) fail('Raw conditions are not allowed, except the JSON casts sent by the filters');
	if (bindings.length !== (form.third === 'none' ? 2 : 3)) fail('Raw bindings do not match the clause');
	const [column, path, third] = bindings;
	text(column, 'A raw column');
	if (typeof path !== 'string' || !/^\{[^{}]*\}$/.test(path)) fail('A raw JSON path must look like {key,subkey}');
	if (form.third === 'column') text(third, 'A raw column');
	if (form.third === 'value') filterValue(third, 'A raw binding');
	if (form.third === 'list') list(third, 'A raw list').forEach((item) => filterValue(item, 'A raw binding'));
	return {
		clause,
		bindings: (form.third === 'list' ? [column, path, list(third, 'A raw list')] : bindings) as WhereFilterValue[]
	};
}

function where(value: Record<string, unknown>, depth: number): WhereModifier {
	if (depth > MAX_DEPTH) fail('Filters are nested too deeply');
	const kind = value.kind;
	if (kind === 'simple') {
		const name = operator(value.operator);
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			key: text(value.key, 'A key'),
			...(name === undefined ? {} : { operator: name }),
			value: conditionValue(value.value, 'A value')
		};
	}
	if (kind === 'object') {
		if (!isRecord(value.values)) fail('The values of an object condition must be an object');
		const values = Object.fromEntries(
			Object.entries(value.values).map(([key, item]) => [text(key, 'A key'), filterValue(item, 'A value')])
		);
		return { method: 'where', kind, logicalOperator: logical(value.logicalOperator, true), values };
	}
	if (kind === 'grouped')
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			children: list(value.children, 'The children of a group').map((child) => {
				if (!isRecord(child) || child.method !== 'where') fail('A group may contain only conditions');
				return where(child, depth + 1);
			})
		};
	if (kind === 'in')
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			key: text(value.key, 'A key'),
			value: list(value.value, 'The values of an in condition').map((item) => filterValue(item, 'A value'))
		};
	if (kind === 'inBuilder')
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			key: text(value.key, 'A key'),
			children: list(value.children, 'A subquery').map((child) => {
				const parsed = modifier(child, depth + 1);
				if (parsed.method === 'orderBy') fail('A subquery may not be sorted');
				return parsed;
			})
		};
	if (kind === 'null')
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			key: text(value.key, 'A key')
		};
	if (kind === 'column') {
		const name = operator(value.operator);
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, false) as 'and' | 'or' | undefined,
			key: text(value.key, 'A key'),
			...(name === undefined ? {} : { operator: name }),
			column: text(value.column, 'A column')
		};
	}
	if (kind === 'jsonSuperset') {
		if (typeof value.value !== 'object' || value.value === null) fail('A JSON superset must be an object or a list');
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, true),
			key: text(value.key, 'A key'),
			value: value.value
		};
	}
	if (kind === 'raw')
		return {
			method: 'where',
			kind,
			logicalOperator: logical(value.logicalOperator, false) as 'and' | 'or' | undefined,
			...raw(value)
		};
	return fail(`Condition kind ${JSON.stringify(kind)} is not supported`);
}

function join(value: Record<string, unknown>): JoinModifier {
	if (value.kind !== 'inner' && value.kind !== 'left' && value.kind !== 'right')
		fail(`Join kind ${JSON.stringify(value.kind)} is not supported`);
	return {
		method: 'join',
		kind: value.kind,
		table: text(value.table, 'A joined table'),
		on: list(value.on, 'The clauses of a join').map((clause): JoinModifierOnClause => {
			if (!isRecord(clause)) fail('A join clause must be an object');
			return {
				from: text(clause.from, 'A join column'),
				operator: operator(clause.operator) ?? fail('A join clause needs an operator'),
				to: text(clause.to, 'A join column'),
				logicalOperator: logical(clause.logicalOperator, false) as 'and' | 'or' | undefined
			};
		})
	};
}

function modifier(value: unknown, depth: number): Modifier {
	if (!isRecord(value)) return fail('A modifier must be an object');
	if (value.method === 'where') return where(value, depth);
	if (value.method === 'join') return join(value);
	if (value.method === 'select') {
		const fields = typeof value.fields === 'string' ? value.fields : list(value.fields, 'Selected fields');
		return {
			method: 'select',
			fields: typeof fields === 'string' ? text(fields, 'A field') : fields.map((field) => text(field, 'A field'))
		} satisfies SelectModifier;
	}
	if (value.method === 'from') return { method: 'from', from: text(value.from, 'A table') } satisfies FromModifier;
	if (value.method === 'orderBy') {
		const direction = typeof value.sortDirection === 'string' ? value.sortDirection.toLowerCase() : 'asc';
		if (direction !== 'asc' && direction !== 'desc') fail('A sort direction must be asc or desc');
		return { method: 'orderBy', sortBy: text(value.sortBy, 'A sort column'), sortDirection: direction };
	}
	return fail(`Modifier method ${JSON.stringify(value.method)} is not supported`);
}

/**
 * Reads the filters sent by the frontend and checks their shape. Accepts `filtersBuilder.toJson()`
 * (`{ modifiers }`), its `modifiers` alone, or the string of `toQueryParam()`; turns back into lists
 * the arrays the query-string parser made into objects (more than 20 items). Missing filters give an
 * empty list. Throws `FilterError` (400) for anything else, unknown operators and raw conditions
 * other than the JSON casts of the filters.
 */
export function parseModifiers(input: unknown): Modifier[] {
	let json = input;
	if (json === undefined || json === null || json === '') return [];
	if (typeof json === 'string') {
		try {
			json = JSON.parse(json);
		} catch {
			fail('Filters are not valid JSON');
		}
	}
	if (isRecord(json) && 'modifiers' in json) json = json.modifiers ?? [];
	return list(json, 'Modifiers').map((item) => modifier(item, 0));
}
