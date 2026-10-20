import FilterBuilder, { type Modifier, type WhereModifier } from './builder.js';
import { isConditionComplete, isFilterGroup, type FilterCondition, type FilterField, type FilterGroup } from './model.js';
import { groupUnit } from './convert/conditions.js';
import { emit, scratch, type Context } from './convert/units.js';

/** Options of `filtersToBuilder`. */
export interface FiltersToBuilderOptions {
	/** Builder to add the filters to (for example one with a search group). It is not changed: a copy is returned. */
	builder?: FilterBuilder;
	/** "Now" for relative dates (`period`, `inLast`, `inNext`). Defaults to the current date. */
	now?: Date;
	/** First day of the week for `thisWeek`, `lastWeek` and `nextWeek`, from 0 (Sunday) to 6. Default 1 (Monday). */
	weekStart?: number;
	/** Negative operators (`isNot`, `notContains`, `ne`, `notIn`, `noneOf`, `notBetween`) also keep the rows where the column is empty (null), which SQL leaves out. Default `true`. It sends `null` modifiers: pass `false` for the backends that do not know them (variants E and E'). A field's `negativesIncludeEmpty` wins. */
	negativesIncludeEmpty?: boolean;
}

/**
 * The query of a filter tree: joins first, then the conditions, then the `whenAbsent` queries of
 * the fields without conditions. Incomplete conditions are skipped. With `and` at the root the
 * conditions stay at the first level; with `or` they are wrapped in one group, so an OR never
 * reaches the first level of the query (where backends add their own conditions, such as the tenant).
 */
export function filtersToBuilder(
	tree: FilterGroup,
	fields: FilterField[],
	options: FiltersToBuilderOptions = {}
): FilterBuilder {
	const context: Context = {
		now: options.now ?? new Date(),
		weekStart: options.weekStart ?? 1,
		negativesIncludeEmpty: options.negativesIncludeEmpty ?? true,
		joins: new Map(),
		trailing: []
	};
	const byName = new Map(fields.map((field) => [field.name, field]));
	const root = groupUnit(tree, byName, context);
	const where: WhereModifier[] = [];
	emit(where, root, 'and');
	const used = new Set(
		collectFields(tree).filter((condition) => isConditionComplete(condition, byName.get(condition.field))).map((condition) => condition.field)
	);
	for (const field of fields)
		if (field.whenAbsent && !used.has(field.name)) emit(where, scratch(field.whenAbsent, context), 'and');
	const builder = options.builder?.clone() ?? new FilterBuilder();
	const existing = builder.modifiers;
	const joins = [...context.joins.values()].filter(
		(join) => !existing.some((modifier) => JSON.stringify(modifier) === JSON.stringify(join))
	);
	const leading = existing.filter((modifier) => modifier.method === 'join');
	const trailing = existing.filter((modifier) => modifier.method !== 'join');
	builder.modifiers = [...leading, ...joins, ...trailing, ...(where as Modifier[]), ...context.trailing];
	return builder;
}

function collectFields(tree: FilterGroup): FilterCondition[] {
	return tree.items.flatMap((node) => (isFilterGroup(node) ? collectFields(node) : [node]));
}
