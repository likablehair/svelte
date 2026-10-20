import { FilterError } from './errors.js';
import { parseModifiers } from './parse.js';
import type { FilterableQuery, JoinClause } from './query.js';
import type { JoinModifier, LogicalOperator, Modifier, WhereModifier } from './types.js';

type Allowed = readonly string[] | ((name: string) => boolean);

/** Options of `applyModifiers` and of `FilterModifierApplier`. */
export interface ApplyOptions {
	/**
	 * The columns the filters may use, written as the frontend sends them (`name`, `users.name`):
	 * conditions, sorting, selected fields, join clauses and the JSON columns of raw casts. A list
	 * or a function. Without it every column is accepted.
	 */
	columns?: Allowed;
	/** The tables the filters may read with `from`, joins and subqueries. Without it every table is accepted. */
	tables?: Allowed;
	/**
	 * Wraps the values of `like` and `ilike` in `%`, as the copied appliers did. Only for frontends
	 * still on `@likable-hair/svelte` v4: the v5 filters already send the pattern, with `%` and `_`
	 * escaped.
	 */
	legacyLike?: boolean;
}

function permitted(allowed: Allowed | undefined, name: string): boolean {
	if (allowed === undefined) return true;
	return typeof allowed === 'function' ? allowed(name) : allowed.includes(name);
}

function withoutAlias(name: string): string {
	return name.split(/\s+as\s+/i)[0].trim();
}

function checkColumn(name: string, options: ApplyOptions) {
	if (!permitted(options.columns, withoutAlias(name)))
		throw new FilterError(`Column ${JSON.stringify(name)} is not allowed in filters`);
}

function checkTable(name: string, options: ApplyOptions) {
	if (!permitted(options.tables, withoutAlias(name)))
		throw new FilterError(`Table ${JSON.stringify(name)} is not allowed in filters`);
}

function check(modifiers: Modifier[], options: ApplyOptions) {
	if (options.columns === undefined && options.tables === undefined) return;
	for (const modifier of modifiers) {
		if (modifier.method === 'from') checkTable(modifier.from, options);
		else if (modifier.method === 'orderBy') checkColumn(modifier.sortBy, options);
		else if (modifier.method === 'select')
			for (const field of [modifier.fields].flat()) checkColumn(field, options);
		else if (modifier.method === 'join') {
			checkTable(modifier.table, options);
			for (const clause of modifier.on) {
				checkColumn(clause.from, options);
				checkColumn(clause.to, options);
			}
		} else if (modifier.kind === 'object')
			for (const key of Object.keys(modifier.values)) checkColumn(key, options);
		else if (modifier.kind === 'grouped') check(modifier.children, options);
		else if (modifier.kind === 'raw') {
			checkColumn(modifier.bindings![0] as string, options);
			if (modifier.clause.endsWith('??')) checkColumn(modifier.bindings![2] as string, options);
		} else {
			checkColumn(modifier.key, options);
			if (modifier.kind === 'column') checkColumn(modifier.column, options);
			if (modifier.kind === 'inBuilder') check(modifier.children, options);
		}
	}
}

function pick<T extends keyof FilterableQuery>(
	logicalOperator: LogicalOperator | undefined,
	and: T,
	or: T,
	andNot: T,
	orNot: T
): T {
	if (logicalOperator === 'or') return or;
	if (logicalOperator === 'andNot') return andNot;
	if (logicalOperator === 'orNot') return orNot;
	return and;
}

function applyJoin(query: FilterableQuery, modifier: JoinModifier) {
	const method = modifier.kind === 'left' ? 'leftJoin' : modifier.kind === 'right' ? 'rightJoin' : 'join';
	query[method](modifier.table, (clause: JoinClause) => {
		for (const on of modifier.on) clause[on.logicalOperator === 'or' ? 'orOn' : 'on'](on.from, on.operator, on.to);
	});
}

function applyOther(query: FilterableQuery, modifier: Exclude<Modifier, WhereModifier>) {
	if (modifier.method === 'join') applyJoin(query, modifier);
	else if (modifier.method === 'select') query.select(...[modifier.fields].flat());
	else if (modifier.method === 'from') query.from(modifier.from);
	else query.orderBy(modifier.sortBy, modifier.sortDirection);
}

function applyWhere(query: FilterableQuery, modifier: WhereModifier, options: ApplyOptions) {
	const { logicalOperator } = modifier;
	if (modifier.kind === 'simple') {
		const method = pick(logicalOperator, 'where', 'orWhere', 'whereNot', 'orWhereNot');
		if (modifier.operator === undefined) query[method](modifier.key, modifier.value);
		else {
			const like = options.legacyLike && (modifier.operator === 'like' || modifier.operator === 'ilike');
			query[method](modifier.key, modifier.operator, like ? `%${modifier.value}%` : modifier.value);
		}
	} else if (modifier.kind === 'object')
		query[pick(logicalOperator, 'where', 'orWhere', 'whereNot', 'orWhereNot')]((group: FilterableQuery) => {
			group.where(modifier.values);
		});
	else if (modifier.kind === 'grouped')
		query[pick(logicalOperator, 'where', 'orWhere', 'whereNot', 'orWhereNot')]((group: FilterableQuery) => {
			for (const child of modifier.children) applyWhere(group, child, options);
		});
	else if (modifier.kind === 'in')
		query[pick(logicalOperator, 'whereIn', 'orWhereIn', 'whereNotIn', 'orWhereNotIn')](modifier.key, modifier.value);
	else if (modifier.kind === 'inBuilder')
		query[pick(logicalOperator, 'whereIn', 'orWhereIn', 'whereNotIn', 'orWhereNotIn')](
			modifier.key,
			(subquery: FilterableQuery) => {
				for (const child of modifier.children)
					if (child.method === 'where') applyWhere(subquery, child, options);
					else applyOther(subquery, child);
			}
		);
	else if (modifier.kind === 'null')
		query[pick(logicalOperator, 'whereNull', 'orWhereNull', 'whereNotNull', 'orWhereNotNull')](modifier.key);
	else if (modifier.kind === 'column') {
		const method = logicalOperator === 'or' ? 'orWhereColumn' : 'whereColumn';
		if (modifier.operator === undefined) query[method](modifier.key, modifier.column);
		else query[method](modifier.key, modifier.operator, modifier.column);
	} else if (modifier.kind === 'jsonSuperset')
		query[
			pick(logicalOperator, 'whereJsonSuperset', 'orWhereJsonSuperset', 'whereNotJsonSuperset', 'orWhereNotJsonSuperset')
		](modifier.key, modifier.value);
	else query[logicalOperator === 'or' ? 'orWhereRaw' : 'whereRaw'](modifier.clause, modifier.bindings ?? []);
}

/**
 * Applies the filters of `@likable-hair/svelte` (`FilterBuilder` JSON) to a Lucid query of AdonisJS
 * 5, 6 or 7 and returns it. All the conditions go inside one `where` group, so an OR sent by the
 * client never escapes the conditions the backend already put on the query (the tenant, the
 * owner). `modifiers` is read with `parseModifiers`: anything malformed or not allowed throws
 * `FilterError` (400).
 */
export function applyModifiers<Q extends FilterableQuery>(query: Q, modifiers: unknown, options: ApplyOptions = {}): Q {
	const parsed = parseModifiers(modifiers);
	check(parsed, options);
	const wheres = parsed.filter((modifier): modifier is WhereModifier => modifier.method === 'where');
	if (wheres.length > 0)
		query.where((group: FilterableQuery) => {
			for (const modifier of wheres) applyWhere(group, modifier, options);
		});
	for (const modifier of parsed) if (modifier.method !== 'where') applyOther(query, modifier);
	return query;
}
