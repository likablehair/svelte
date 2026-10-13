import type FilterBuilder from '../builder.js';
import type { WhereModifier } from '../builder.js';
import type { FilterThrough } from '../model.js';
import { emit, joinModifier, scratch, type Context, type Unit } from './units.js';

export function throughUnit(
	hops: FilterThrough[],
	inner: Unit | undefined,
	negate: boolean,
	context: Context
): Unit {
	const build = (sub: FilterBuilder, index: number) => {
		const hop = hops[index];
		sub.select(hop.select).from(hop.from);
		for (const join of hop.joins ?? []) {
			const modifier = joinModifier(join);
			sub.modifiers = [...sub.modifiers, modifier];
		}
		hop.where?.(sub);
		if (index + 1 < hops.length) sub.whereIn(hops[index + 1].key, (next) => build(next, index + 1));
		else if (inner?.modifiers.length) {
			const where = sub.modifiers.filter((modifier) => modifier.method === 'where') as WhereModifier[];
			const rest = sub.modifiers.filter((modifier) => modifier.method !== 'where');
			const merged = [...where];
			emit(merged, inner, 'and');
			sub.modifiers = [...rest, ...merged];
		}
	};
	return scratch((builder) => {
		if (negate) builder.notWhereIn(hops[0].key, (sub) => build(sub, 0));
		else builder.whereIn(hops[0].key, (sub) => build(sub, 0));
	}, context);
}
