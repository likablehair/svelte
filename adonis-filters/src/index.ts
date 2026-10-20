import { applyModifiers, type ApplyOptions } from './apply.js';
import type { FilterableQuery } from './query.js';

export { applyModifiers, type ApplyOptions } from './apply.js';
export { parseModifiers, OPERATORS } from './parse.js';
export { FilterError } from './errors.js';
export type { FilterableQuery } from './query.js';
export type {
	FromModifier,
	JoinModifier,
	JoinModifierOnClause,
	JsonQuery,
	LogicalOperator,
	Modifier,
	OrderByModifier,
	SelectModifier,
	WhereFilterValue,
	WhereModifier
} from './types.js';

/**
 * The class the backends copied, with the same call: `new FilterModifierApplier().applyModifiers(query,
 * modifiers)`. The options given to the constructor apply to every call; those of a call win.
 */
export default class FilterModifierApplier {
	readonly options: ApplyOptions;

	constructor(options: ApplyOptions = {}) {
		this.options = options;
	}

	/** See `applyModifiers`. */
	applyModifiers<Q extends FilterableQuery>(query: Q, modifiers: unknown, options?: ApplyOptions): Q {
		return applyModifiers(query, modifiers, { ...this.options, ...options });
	}
}

export { FilterModifierApplier };
