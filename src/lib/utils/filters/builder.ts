export type WhereFilterValue = string | number | Date | boolean;

export type LogicalOperator = 'and' | 'or' | 'andNot' | 'orNot';

export type FromModifier = { method: 'from'; from: string };

export type SelectModifier = { method: 'select'; fields: string | string[] };

export type OrderByModifier = { method: 'orderBy'; sortBy: string; sortDirection: 'asc' | 'desc' };

export type JoinModifierOnClause = {
	from: string;
	operator: string;
	to: string;
	logicalOperator?: 'and' | 'or';
};

export type JoinModifier = {
	method: 'join';
	kind: 'inner' | 'left' | 'right';
	table: string;
	on: JoinModifierOnClause[];
};

export type WhereModifier =
	| { method: 'where'; kind: 'simple'; logicalOperator?: LogicalOperator; key: string; operator?: string; value: WhereFilterValue }
	| { method: 'where'; kind: 'object'; logicalOperator?: LogicalOperator; values: Record<string, WhereFilterValue> }
	| { method: 'where'; kind: 'grouped'; logicalOperator?: LogicalOperator; children: WhereModifier[] }
	| { method: 'where'; kind: 'in'; logicalOperator?: LogicalOperator; key: string; value: WhereFilterValue[] }
	| {
			method: 'where';
			kind: 'inBuilder';
			logicalOperator?: LogicalOperator;
			key: string;
			children: (WhereModifier | SelectModifier | JoinModifier | FromModifier)[];
	  }
	| { method: 'where'; kind: 'null'; logicalOperator?: LogicalOperator; key: string }
	| { method: 'where'; kind: 'column'; logicalOperator?: 'and' | 'or'; key: string; operator?: string; column: string }
	| { method: 'where'; kind: 'jsonSuperset'; logicalOperator?: LogicalOperator; key: string; value: object }
	| { method: 'where'; kind: 'raw'; logicalOperator?: 'and' | 'or'; clause: string; bindings?: WhereFilterValue[] };

export type Modifier = WhereModifier | JoinModifier | SelectModifier | FromModifier | OrderByModifier;

export type JsonQuery = { modifiers: Modifier[] };

type Callback = (builder: FilterBuilder) => void;
type WhereArguments =
	| [Callback]
	| [Record<string, WhereFilterValue>]
	| [string, WhereFilterValue]
	| [string, string, WhereFilterValue | undefined];

function clone<T>(value: T): T {
	if (value instanceof Date) return new Date(value.getTime()) as T;
	if (Array.isArray(value)) return value.map(clone) as T;
	if (value && typeof value === 'object')
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])) as T;
	return value;
}

function equal(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
	if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const keysA = Object.keys(a).filter((key) => (a as Record<string, unknown>)[key] !== undefined);
	const keysB = Object.keys(b).filter((key) => (b as Record<string, unknown>)[key] !== undefined);
	if (keysA.length !== keysB.length) return false;
	return keysA.every((key) =>
		equal((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
	);
}

/** Builds the `on` clauses of a join. */
export class OnClauseBuilder {
	private clauses: JoinModifierOnClause[] = [];

	get json(): JoinModifierOnClause[] {
		return this.clauses;
	}

	/** `from = to`, or `from operator to`. */
	public on(from: string, to: string): void;
	public on(from: string, operator: string, to: string): void;
	public on(first: string, second: string, third?: string): void {
		this.clauses.push(
			third === undefined
				? { from: first, operator: '=', to: second }
				: { from: first, operator: second, to: third }
		);
	}

	/** Like `on`, joined with OR to the previous clause. */
	public orOn(from: string, to: string): void;
	public orOn(from: string, operator: string, to: string): void;
	public orOn(first: string, second: string, third?: string): void {
		this.clauses.push(
			third === undefined
				? { from: first, operator: '=', to: second, logicalOperator: 'or' }
				: { from: first, operator: second, to: third, logicalOperator: 'or' }
		);
	}
}

/**
 * Knex-like query builder whose `toJson()` (a list of `modifiers`) is sent to the backend, which
 * replays it on its ORM query. Every method returns the builder, so calls can be chained; a
 * callback (`where(q => q.where(...).orWhere(...))`) builds a parenthesized group.
 */
export default class FilterBuilder {
	private _modifiers: Modifier[] = [];

	/** Builds a builder from the output of `toJson()` (for example filters saved in storage). */
	static fromJson(json: JsonQuery | Modifier[]): FilterBuilder {
		const builder = new FilterBuilder();
		builder._modifiers = clone(Array.isArray(json) ? json : json.modifiers);
		return builder;
	}

	/** A copy of the modifiers. */
	public get modifiers(): Modifier[] {
		return clone(this._modifiers);
	}

	public set modifiers(value: Modifier[]) {
		this._modifiers = clone(value);
	}

	/** An independent copy of the builder. */
	public clone(): FilterBuilder {
		return FilterBuilder.fromJson(this._modifiers);
	}

	/** A group (callback), an object of equalities, `key = value` or `key operator value`. A condition whose value is `undefined` is skipped. */
	public where(callback: Callback): FilterBuilder;
	public where(values: Record<string, WhereFilterValue>): FilterBuilder;
	public where(key: string, value: WhereFilterValue): FilterBuilder;
	public where(key: string, operator: string, value: WhereFilterValue | undefined): FilterBuilder;
	public where(...args: WhereArguments): FilterBuilder {
		return this.applyWhere('and', args);
	}

	/** Like `where`, joined with OR. */
	public orWhere(callback: Callback): FilterBuilder;
	public orWhere(values: Record<string, WhereFilterValue>): FilterBuilder;
	public orWhere(key: string, value: WhereFilterValue): FilterBuilder;
	public orWhere(key: string, operator: string, value: WhereFilterValue | undefined): FilterBuilder;
	public orWhere(...args: WhereArguments): FilterBuilder {
		return this.applyWhere('or', args);
	}

	/** Like `where`, negated. */
	public whereNot(callback: Callback): FilterBuilder;
	public whereNot(values: Record<string, WhereFilterValue>): FilterBuilder;
	public whereNot(key: string, value: WhereFilterValue): FilterBuilder;
	public whereNot(key: string, operator: string, value: WhereFilterValue | undefined): FilterBuilder;
	public whereNot(...args: WhereArguments): FilterBuilder {
		return this.applyWhere('andNot', args);
	}

	/** Like `where`, negated and joined with OR. */
	public orWhereNot(callback: Callback): FilterBuilder;
	public orWhereNot(values: Record<string, WhereFilterValue>): FilterBuilder;
	public orWhereNot(key: string, value: WhereFilterValue): FilterBuilder;
	public orWhereNot(key: string, operator: string, value: WhereFilterValue | undefined): FilterBuilder;
	public orWhereNot(...args: WhereArguments): FilterBuilder {
		return this.applyWhere('orNot', args);
	}

	/** `key >= from AND key <= to`; an `undefined` end is left open. */
	public whereBetween(key: string, [from, to]: [WhereFilterValue | undefined, WhereFilterValue | undefined]): FilterBuilder {
		if (from !== undefined) this.where(key, '>=', from);
		if (to !== undefined) this.where(key, '<=', to);
		return this;
	}

	/** Compares two columns: `key = column` or `key operator column`. */
	public whereColumn(key: string, column: string): FilterBuilder;
	public whereColumn(key: string, operator: string, column: string): FilterBuilder;
	public whereColumn(key: string, second: string, third?: string): FilterBuilder {
		return this.applyColumn('and', key, second, third);
	}

	/** Like `whereColumn`, joined with OR. */
	public orWhereColumn(key: string, column: string): FilterBuilder;
	public orWhereColumn(key: string, operator: string, column: string): FilterBuilder;
	public orWhereColumn(key: string, second: string, third?: string): FilterBuilder {
		return this.applyColumn('or', key, second, third);
	}

	/** The JSON column `key` contains `object`. */
	public whereJsonSuperset(key: string, object: object): FilterBuilder {
		this._modifiers.push({ method: 'where', kind: 'jsonSuperset', key, value: object, logicalOperator: 'and' });
		return this;
	}

	/** Like `whereJsonSuperset`, joined with OR. */
	public orWhereJsonSuperset(key: string, object: object): FilterBuilder {
		this._modifiers.push({ method: 'where', kind: 'jsonSuperset', key, value: object, logicalOperator: 'or' });
		return this;
	}

	/** `key IN (values)`, or `key IN (subquery)` built by the callback with `select`, `from`, `where` and joins. */
	public whereIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.applyIn('and', key, values);
	}

	/** Like `whereIn`, joined with OR. */
	public orWhereIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.applyIn('or', key, values);
	}

	/** `key NOT IN (...)`. */
	public notWhereIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.applyIn('andNot', key, values);
	}

	/** `key NOT IN (...)`, joined with OR. */
	public orNotWhereIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.applyIn('orNot', key, values);
	}

	/** Same as `notWhereIn` (Knex name). */
	public whereNotIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.notWhereIn(key, values);
	}

	/** Same as `orNotWhereIn` (Knex name). */
	public orWhereNotIn(key: string, values: WhereFilterValue[] | Callback): FilterBuilder {
		return this.orNotWhereIn(key, values);
	}

	/** `key IS NULL`. */
	public whereNull(key: string): FilterBuilder {
		return this.applyNull('and', key);
	}

	/** `key IS NULL`, joined with OR. */
	public orWhereNull(key: string): FilterBuilder {
		return this.applyNull('or', key);
	}

	/** `key IS NOT NULL`. */
	public notWhereNull(key: string): FilterBuilder {
		return this.applyNull('andNot', key);
	}

	/** `key IS NOT NULL`, joined with OR. */
	public orNotWhereNull(key: string): FilterBuilder {
		return this.applyNull('orNot', key);
	}

	/** Same as `notWhereNull` (Knex name). */
	public whereNotNull(key: string): FilterBuilder {
		return this.notWhereNull(key);
	}

	/** Same as `orNotWhereNull` (Knex name). */
	public orWhereNotNull(key: string): FilterBuilder {
		return this.orNotWhereNull(key);
	}

	/** A raw SQL condition. Backends should not accept it from clients: prefer the other methods. */
	public whereRaw(clause: string, bindings?: WhereFilterValue[]): FilterBuilder {
		this._modifiers.push({ method: 'where', kind: 'raw', logicalOperator: 'and', clause, bindings });
		return this;
	}

	/** Like `whereRaw`, joined with OR. */
	public orWhereRaw(clause: string, bindings?: WhereFilterValue[]): FilterBuilder {
		this._modifiers.push({ method: 'where', kind: 'raw', logicalOperator: 'or', clause, bindings });
		return this;
	}

	/** Inner join: `join('tags', on => on.on('tags.id', 'items.tagId'))`. */
	public join(table: string, callback: (on: OnClauseBuilder) => void): FilterBuilder {
		return this.applyJoin('inner', table, callback);
	}

	/** Left join. */
	public leftJoin(table: string, callback: (on: OnClauseBuilder) => void): FilterBuilder {
		return this.applyJoin('left', table, callback);
	}

	/** Right join. */
	public rightJoin(table: string, callback: (on: OnClauseBuilder) => void): FilterBuilder {
		return this.applyJoin('right', table, callback);
	}

	/** Columns to select (in subqueries). */
	public select(fields: string | string[]): FilterBuilder {
		this._modifiers.push({ method: 'select', fields });
		return this;
	}

	/** Table of a subquery. */
	public from(from: string): FilterBuilder {
		this._modifiers.push({ method: 'from', from });
		return this;
	}

	/** Sorting. */
	public orderBy(sortBy: string, sortDirection: 'asc' | 'desc' = 'asc'): FilterBuilder {
		this._modifiers.push({ method: 'orderBy', sortBy, sortDirection });
		return this;
	}

	/** Whether every modifier added by the callback is already in the builder. */
	public hasModifier(callback: (builder: FilterBuilder) => FilterBuilder | void): boolean {
		const probe = new FilterBuilder();
		const result = callback(probe) ?? probe;
		return result._modifiers.every((wanted) =>
			this._modifiers.some((modifier) => equal(wanted, modifier))
		);
	}

	/** Whether a condition (at any depth, subqueries included) uses `column`. */
	public hasWhereOnColumn(column: string, modifiers: Modifier[] = this._modifiers): boolean {
		return modifiers.some((modifier) => {
			if (modifier.method !== 'where') return false;
			if (modifier.kind === 'grouped' || modifier.kind === 'inBuilder')
				return (
					(modifier.kind === 'inBuilder' && modifier.key === column) ||
					this.hasWhereOnColumn(column, modifier.children as Modifier[])
				);
			if (modifier.kind === 'object') return column in modifier.values;
			if (modifier.kind === 'column') return modifier.key === column || modifier.column === column;
			if (modifier.kind === 'raw') return false;
			return modifier.key === column;
		});
	}

	/**
	 * `toJson()` as one JSON string, to send the query in a single query-string parameter
	 * (`?filtersBuilder=...`). Query-string parsers (qs in AdonisJS) stop at a nesting depth of 5
	 * and turn arrays longer than 20 into objects, so groups inside groups and subqueries get lost
	 * in GET requests; a JSON string has no such limit. The backend reads it with
	 * `typeof input === 'string' ? JSON.parse(input) : input`.
	 */
	public toQueryParam(): string {
		return JSON.stringify(this.toJson());
	}

	/** The JSON sent to the backend: `{ modifiers }`. A copy: changing it does not change the builder. */
	public toJson(): JsonQuery {
		return { modifiers: clone(this._modifiers) };
	}

	private applyWhere(logicalOperator: LogicalOperator, args: WhereArguments): FilterBuilder {
		const [first, second, third] = args;
		if (typeof first === 'function') {
			const group = new FilterBuilder();
			first(group);
			if (!group._modifiers.every((modifier) => modifier.method === 'where'))
				throw new Error('inconsistent json query from where callback');
			this._modifiers.push({
				method: 'where',
				kind: 'grouped',
				logicalOperator,
				children: group._modifiers as WhereModifier[]
			});
		} else if (typeof first === 'object') {
			this._modifiers.push({ method: 'where', kind: 'object', values: first, logicalOperator });
		} else if (args.length >= 3) {
			if (third === undefined) return this;
			this._modifiers.push({
				method: 'where',
				kind: 'simple',
				key: first,
				operator: second as string,
				value: third,
				logicalOperator
			});
		} else if (second !== undefined) {
			this._modifiers.push({ method: 'where', kind: 'simple', key: first, value: second, logicalOperator });
		}
		return this;
	}

	private applyColumn(
		logicalOperator: 'and' | 'or',
		key: string,
		second: string,
		third?: string
	): FilterBuilder {
		this._modifiers.push(
			third === undefined
				? { method: 'where', kind: 'column', key, column: second, logicalOperator }
				: { method: 'where', kind: 'column', key, operator: second, column: third, logicalOperator }
		);
		return this;
	}

	private applyIn(
		logicalOperator: LogicalOperator,
		key: string,
		values: WhereFilterValue[] | Callback
	): FilterBuilder {
		if (typeof values === 'function') {
			const subquery = new FilterBuilder();
			values(subquery);
			this._modifiers.push({
				method: 'where',
				kind: 'inBuilder',
				logicalOperator,
				key,
				children: subquery._modifiers.filter(
					(modifier) => modifier.method !== 'orderBy'
				) as (WhereModifier | SelectModifier | JoinModifier | FromModifier)[]
			});
		} else {
			this._modifiers.push({ method: 'where', kind: 'in', logicalOperator, key, value: values });
		}
		return this;
	}

	private applyNull(logicalOperator: LogicalOperator, key: string): FilterBuilder {
		this._modifiers.push({ method: 'where', kind: 'null', logicalOperator, key });
		return this;
	}

	private applyJoin(
		kind: 'inner' | 'left' | 'right',
		table: string,
		callback: (on: OnClauseBuilder) => void
	): FilterBuilder {
		const on = new OnClauseBuilder();
		callback(on);
		this._modifiers.push({ method: 'join', kind, on: on.json, table });
		return this;
	}
}
