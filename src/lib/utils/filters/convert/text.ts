import FilterBuilder, { type WhereModifier } from '../builder.js';
import type { FilterField } from '../model.js';
import { columnUnit } from './columns.js';
import { combine, type Context, type Unit } from './units.js';

const NEGATIVE = ['isNot', 'notContains', 'empty', 'ne', 'notIn', 'noneOf'];

const WITH_EMPTY = ['isNot', 'notContains', 'ne', 'notIn', 'noneOf', 'notBetween'];

export function includesEmpty(field: FilterField, operator: string, context: Context): boolean {
	return WITH_EMPTY.includes(operator) && (field.negativesIncludeEmpty ?? context.negativesIncludeEmpty);
}

export function orEmpty(column: string, unit: Unit): Unit {
	if (!unit.modifiers.length) return unit;
	const empty: Unit = { modifiers: new FilterBuilder().whereNull(column).modifiers as WhereModifier[], logic: 'and' };
	return combine([empty, unit], 'or');
}

const WORD_OPERATORS = new Map([
	['contains', 'contains'],
	['notContains', 'notContains'],
	['match', 'match'],
	['is', 'isWord'],
	['isNot', 'isNotWord']
]);

export function textUnit(field: FilterField, columns: string[], operator: string, value: unknown, context: Context): Unit {
	const negative = NEGATIVE.includes(operator);
	const empty = includesEmpty(field, operator, context);
	const across = (term: unknown, name = operator) =>
		combine(
			columns.map((column) => {
				const unit = columnUnit(field, column, name, term, context);
				return empty ? orEmpty(column, unit) : unit;
			}),
			negative ? 'and' : 'or'
		);
	const byWord = WORD_OPERATORS.get(operator);
	if (field.type === 'string' && field.words && byWord && typeof value === 'string') {
		const words = value.trim().split(/\s+/).filter(Boolean);
		return combine(
			words.map((word) => across(word, byWord)),
			negative ? 'or' : 'and'
		);
	}
	return across(value);
}
