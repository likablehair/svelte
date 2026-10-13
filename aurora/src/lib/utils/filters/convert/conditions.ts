import FilterBuilder, { type WhereModifier } from '../builder.js';
import {
	isConditionComplete,
	isFilterGroup,
	operatorOf,
	type FilterCondition,
	type FilterField,
	type FilterGroup,
	type FilterItem
} from '../model.js';
import { jsonUnit } from './json.js';
import { textUnit } from './text.js';
import { throughUnit } from './through.js';
import { EMPTY, combine, joinModifier, scratch, type Context, type Unit } from './units.js';

function plainUnit(field: FilterField, operator: string, value: unknown, context: Context): Unit {
	if (field.type === 'string' && operator === 'match' && value && typeof value === 'object') {
		const b = new FilterBuilder().where(
			field.suggestColumn ?? field.column ?? field.name,
			'=',
			(value as FilterItem).value
		);
		return { modifiers: b.modifiers as WhereModifier[], logic: 'and' };
	}
	const columns =
		field.type === 'string' && field.columns?.length ? field.columns : [field.column ?? field.name];
	return textUnit(field, columns, operator, value, context);
}

function conditionUnit(condition: FilterCondition, field: FilterField, context: Context): Unit {
	const operator = operatorOf(field, condition.operator);
	if (!operator) return EMPTY;
	if (operator.definition?.apply)
		return scratch((builder) => operator.definition!.apply!(builder, condition), context);
	if (field.apply) return scratch((builder) => field.apply!(builder, condition), context);
	if (field.type === 'custom') return EMPTY;
	if (field.json) return jsonUnit(field, operator.name, condition.value, context);
	if (!field.through) return plainUnit(field, operator.name, condition.value, context);
	const hops = Array.isArray(field.through) ? field.through : [field.through];
	if (operator.name === 'empty') return throughUnit(hops, undefined, true, context);
	if (operator.name === 'notEmpty') return throughUnit(hops, undefined, false, context);
	if (operator.name === 'all' && Array.isArray(condition.value))
		return combine(
			(condition.value as FilterItem[]).map((item) =>
				throughUnit(hops, plainUnit(field, 'in', [item], context), false, context)
			),
			'and'
		);
	if (operator.negates)
		return throughUnit(hops, plainUnit(field, operator.negates, condition.value, context), true, context);
	return throughUnit(hops, plainUnit(field, operator.name, condition.value, context), false, context);
}

export function groupUnit(group: FilterGroup, fields: Map<string, FilterField>, context: Context): Unit {
	const units = group.items.map((node): Unit => {
		if (isFilterGroup(node)) return groupUnit(node, fields, context);
		const field = fields.get(node.field);
		if (!field || !isConditionComplete(node, field)) return EMPTY;
		for (const join of field.joins ?? []) {
			const modifier = joinModifier(join);
			context.joins.set(JSON.stringify(modifier), modifier);
		}
		return conditionUnit(node, field, context);
	});
	return combine(units, group.logic);
}
