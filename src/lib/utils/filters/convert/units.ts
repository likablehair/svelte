import FilterBuilder, { type JoinModifier, type Modifier, type WhereModifier } from '../builder.js';
import type { FilterJoin, FilterLogic } from '../model.js';

export type Unit = { modifiers: WhereModifier[]; logic: FilterLogic };

export interface Context {
	now: Date;
	weekStart: number;
	negativesIncludeEmpty: boolean;
	joins: Map<string, JoinModifier>;
	trailing: Modifier[];
}

export const EMPTY: Unit = { modifiers: [], logic: 'and' };

function connect(modifier: WhereModifier, connective: FilterLogic): WhereModifier {
	const negated = modifier.logicalOperator?.endsWith('Not');
	if (modifier.kind === 'column' || modifier.kind === 'raw')
		return { ...modifier, logicalOperator: connective };
	return { ...modifier, logicalOperator: negated ? `${connective}Not` : connective } as WhereModifier;
}

export function emit(target: WhereModifier[], unit: Unit, parentLogic: FilterLogic): void {
	if (!unit.modifiers.length) return;
	const connective = target.length === 0 ? 'and' : parentLogic;
	if (unit.modifiers.length === 1 || unit.logic === parentLogic) {
		const [first, ...rest] = unit.modifiers;
		target.push(connect(first, connective), ...rest);
		return;
	}
	target.push({ method: 'where', kind: 'grouped', logicalOperator: connective, children: unit.modifiers });
}

export function combine(units: Unit[], logic: FilterLogic): Unit {
	const present = units.filter((unit) => unit.modifiers.length);
	if (present.length === 1) return present[0];
	const modifiers: WhereModifier[] = [];
	for (const unit of present) emit(modifiers, unit, logic);
	return { modifiers, logic };
}

export function scratch(build: (builder: FilterBuilder) => void, context: Context): Unit {
	const builder = new FilterBuilder();
	build(builder);
	const modifiers: WhereModifier[] = [];
	for (const modifier of builder.modifiers) {
		if (modifier.method === 'where') modifiers.push(modifier);
		else if (modifier.method === 'join') context.joins.set(JSON.stringify(modifier), modifier);
		else context.trailing.push(modifier);
	}
	const connectives = new Set(
		modifiers.slice(1).map((modifier) => (modifier.logicalOperator ?? 'and').replace('Not', ''))
	);
	if (connectives.size <= 1) return { modifiers, logic: connectives.has('or') ? 'or' : 'and' };
	return {
		modifiers: [{ method: 'where', kind: 'grouped', logicalOperator: 'and', children: modifiers }],
		logic: 'and'
	};
}

export function joinModifier(join: FilterJoin): JoinModifier {
	const [from, second, third] = join.on;
	return {
		method: 'join',
		kind: join.kind ?? 'left',
		on: [third === undefined ? { from, operator: '=', to: second } : { from, operator: second, to: third }],
		table: join.table
	};
}
