import type { LucidModel, LucidRow, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder';
import type * as Library from '../../src/lib/utils/filters/builder.js';
import FilterModifierApplier, { applyModifiers } from '../src/index.js';
import type * as Package from '../src/index.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const contract: [
	Equal<Package.Modifier, Library.Modifier>,
	Equal<Package.WhereModifier, Library.WhereModifier>,
	Equal<Package.JoinModifier, Library.JoinModifier>,
	Equal<Package.JoinModifierOnClause, Library.JoinModifierOnClause>,
	Equal<Package.SelectModifier, Library.SelectModifier>,
	Equal<Package.FromModifier, Library.FromModifier>,
	Equal<Package.OrderByModifier, Library.OrderByModifier>,
	Equal<Package.WhereFilterValue, Library.WhereFilterValue>,
	Equal<Package.LogicalOperator, Library.LogicalOperator>,
	Equal<Package.JsonQuery, Library.JsonQuery>
] = [true, true, true, true, true, true, true, true, true, true];

export function lucidQueries(
	model: ModelQueryBuilderContract<LucidModel, LucidRow>,
	database: DatabaseQueryBuilderContract,
	either: ModelQueryBuilderContract<LucidModel, LucidRow> | DatabaseQueryBuilderContract,
	modifiers: Package.Modifier[]
) {
	const applier = new FilterModifierApplier();
	const sameModel: ModelQueryBuilderContract<LucidModel, LucidRow> = applier.applyModifiers(model, modifiers);
	const sameDatabase: DatabaseQueryBuilderContract = applyModifiers(database, modifiers, { columns: ['id'] });
	const sameEither: ModelQueryBuilderContract<LucidModel, LucidRow> | DatabaseQueryBuilderContract =
		applier.applyModifiers(either, modifiers);
	return [sameModel, sameDatabase, sameEither];
}
