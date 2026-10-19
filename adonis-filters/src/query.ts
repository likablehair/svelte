type Method = (...args: any[]) => unknown;

/**
 * The methods the applier calls on a query. Lucid query builders of AdonisJS 5, 6 and 7 (database
 * and model queries alike) have all of them, so any of them can be passed without importing
 * AdonisJS types into this package.
 */
export interface FilterableQuery {
	where: Method;
	orWhere: Method;
	whereNot: Method;
	orWhereNot: Method;
	whereIn: Method;
	orWhereIn: Method;
	whereNotIn: Method;
	orWhereNotIn: Method;
	whereNull: Method;
	orWhereNull: Method;
	whereNotNull: Method;
	orWhereNotNull: Method;
	whereColumn: Method;
	orWhereColumn: Method;
	whereJsonSuperset: Method;
	orWhereJsonSuperset: Method;
	whereNotJsonSuperset: Method;
	orWhereNotJsonSuperset: Method;
	whereRaw: Method;
	orWhereRaw: Method;
	join: Method;
	leftJoin: Method;
	rightJoin: Method;
	select: Method;
	from: Method;
	orderBy: Method;
}

export interface JoinClause {
	on: Method;
	orOn: Method;
}
