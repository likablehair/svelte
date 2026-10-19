/** A value compared by a condition. Dates arrive as ISO strings once serialized. */
export type WhereFilterValue = string | number | Date | boolean;

/** How a condition joins the ones before it in its group. */
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

/** One step of the query sent by `FilterBuilder` of `@likable-hair/svelte`. */
export type Modifier = WhereModifier | JoinModifier | SelectModifier | FromModifier | OrderByModifier;

/** The JSON of `FilterBuilder.toJson()`. */
export type JsonQuery = { modifiers: Modifier[] };
