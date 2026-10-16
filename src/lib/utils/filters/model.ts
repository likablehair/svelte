import type { Item } from '../../components/simple/forms/item.js';
import type FilterBuilder from './builder.js';

/** How the conditions of a group are combined. */
export type FilterLogic = 'and' | 'or';

/** Kind of value an operator asks for, which decides the input shown to the user. */
export type FilterInput =
	| 'none'
	| 'text'
	| 'texts'
	| 'number'
	| 'numbers'
	| 'numberRange'
	| 'date'
	| 'dateRange'
	| 'datetime'
	| 'datetimeRange'
	| 'days'
	| 'relative'
	| 'period'
	| 'items'
	| 'column'
	| 'suggest'
	| 'custom';

/** Unit of a relative date (`inLast`, `inNext`, `olderThan`, `laterThan`). Minutes and hours need `withTime`. */
export type FilterTimeUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

/** Value of a relative date operator: an amount of units back or ahead of now. A plain number counts as days. */
export type FilterRelative = { amount: number; unit: FilterTimeUnit };

/** A period relative to today, for the date operator `period`. */
export type FilterPeriod =
	| 'today'
	| 'yesterday'
	| 'tomorrow'
	| 'thisWeek'
	| 'lastWeek'
	| 'nextWeek'
	| 'thisMonth'
	| 'lastMonth'
	| 'nextMonth'
	| 'thisQuarter'
	| 'lastQuarter'
	| 'nextQuarter'
	| 'thisYear'
	| 'lastYear'
	| 'nextYear'
	| 'monthToDate'
	| 'quarterToDate'
	| 'yearToDate';

/** An option of a select field: an `Item`, optionally standing for several values in the query. */
export type FilterItem<Data = unknown> = Item<Data> & {
	/** Values the option stands for in the query (for example "In progress" = four statuses). Defaults to `[value]`. */
	values?: (string | number)[];
};

/** Value of a condition. Its shape depends on the operator (see `FilterInput`). Dates are `yyyy-MM-dd` strings, so the whole tree is plain JSON. */
export type FilterConditionValue =
	| string
	| number
	| boolean
	| { from?: number | string; to?: number | string }
	| FilterItem[]
	| FilterPeriod
	| unknown;

/** A condition of the tree: a field, an operator and a value. */
export interface FilterCondition {
	/** Identity inside the tree, made by the helpers. Not shown anywhere. */
	id: string;
	/** `name` of the field. */
	field: string;
	/** Name of the operator, one of the field's. */
	operator: string;
	/** Value for the operator. */
	value?: FilterConditionValue;
	/** The user sees the condition but cannot change or remove it. */
	locked?: boolean;
	/** `id` of the preset that added the condition: the preset chip is on while its conditions are in the tree. */
	preset?: string;
}

/** A group of conditions and groups, combined with `logic`. The root of the tree is a group. */
export interface FilterGroup {
	/** Identity inside the tree, made by the helpers. */
	id: string;
	/** `and`: every item must hold; `or`: at least one. */
	logic: FilterLogic;
	/** Conditions and nested groups. */
	items: FilterNode[];
	/** The user cannot change or remove the group. */
	locked?: boolean;
}

/** A condition or a group. */
export type FilterNode = FilterCondition | FilterGroup;

/** A ready-made set of conditions shown as a chip that the user turns on and off ("Today · 18"). */
export interface FilterPreset {
	/** Identity of the preset, stored in the conditions it adds. */
	id: string;
	/** Text of the chip. */
	label: string;
	/** SVG path of an icon in the chip. */
	icon?: string;
	/** Number shown after the label (for example the matching rows). */
	count?: number | string;
	/** Conditions added when the chip is turned on. */
	conditions: Omit<FilterCondition, 'id' | 'preset'>[];
}

/** A set of filters saved by the user under a name (see `Filters` `savable`). */
export interface SavedFilter {
	/** Identity of the saved filters. */
	id: string;
	/** Name chosen by the user. */
	name: string;
	/** The saved tree. */
	value: FilterGroup;
}

/** A hop of a relation reached through a subquery: `key IN (SELECT select FROM from WHERE ...)`. */
export interface FilterThrough {
	/** Column of the outer query compared with the subquery (`users.id`). */
	key: string;
	/** Table of the subquery (`user_residences`). */
	from: string;
	/** Column selected by the subquery (`userId`). */
	select: string;
	/** Joins inside the subquery. */
	joins?: FilterJoin[];
	/** Fixed conditions inside the subquery. */
	where?: (builder: FilterBuilder) => void;
}

/** A join the field needs, added once per query however many conditions use it. */
export interface FilterJoin {
	/** Table, with an alias if needed (`suppliers as primary_supplier`). */
	table: string;
	/** `[from, to]` (equality) or `[from, operator, to]`. */
	on: [string, string] | [string, string, string];
	/** Default `left`, so the join itself filters nothing. */
	kind?: 'left' | 'inner';
}

/** An operator defined by the app for one field. */
export interface FilterOperatorDefinition {
	/** Name stored in the conditions. */
	name: string;
	/** Text between the field and the value (`is`, `≥`, `has tag`). */
	label: string;
	/** Input shown for the value. `custom` uses the field's `inputSnippet`. */
	input: FilterInput;
	/** Adds the query for a condition with this operator. Without it the field's `apply` is used. */
	apply?: (builder: FilterBuilder, condition: FilterCondition) => void;
}

/** What every field has. */
interface FieldBase {
	/** Identity of the field, stored in the conditions. */
	name: string;
	/** Name shown to the user. */
	label: string;
	/** SVG path of an icon shown in the list, the card and the pill. */
	icon?: string;
	/** Groups the fields in the list of "Add filter". */
	category?: string;
	/** Secondary text in the list of fields. */
	description?: string;
	/** Column of the query. Defaults to `name`. */
	column?: string;
	/** Joins added to the query when the field has a condition. */
	joins?: FilterJoin[];
	/** The condition is checked in a subquery on a related table (`column` is a column of the last hop). Several hops nest. */
	through?: FilterThrough | FilterThrough[];
	/** Operators offered, in this order: names of the built-in ones of the type, definitions of new ones, or a whole set (`basic`, `standard`, `all`). Defaults to the set chosen on `Filters` (`standard`). */
	operators?: FilterOperatorSet | (string | FilterOperatorDefinition)[];
	/** Operator of a new condition. Defaults to the first one. */
	defaultOperator?: string;
	/** Always shown as a pill in the bar, even without a condition. */
	pinned?: boolean;
	/** Never shown: its conditions (usually `locked`) only reach the query. */
	hidden?: boolean;
	/** Value of a new condition on this field (the card and the panel start with it). */
	defaultValue?: FilterConditionValue;
	/** Decides when a condition on this field is complete (it reaches the query and gets a pill). Defaults to a check on the value for the operator. */
	isComplete?: (condition: FilterCondition) => boolean;
	/** Replaces the whole query of a condition on this field. */
	apply?: (builder: FilterBuilder, condition: FilterCondition) => void;
	/** Query added when the field has no condition at all (for example "hide archived" until the user asks for them). */
	whenAbsent?: (builder: FilterBuilder) => void;
	/** Replaces the text of the value in the pill. */
	format?: (condition: FilterCondition) => string;
	/** Negative operators (`isNot`, `notContains`, `ne`, `notIn`, `noneOf`, `notBetween`) also keep the rows where the column is empty: "surname is not Rossi" shows the clients without a surname too. On by default (option of `Filters` / `filtersToBuilder`); this one wins. Needs a backend that knows `null` modifiers: pass `false` for backends E and E'. */
	negativesIncludeEmpty?: boolean;
	/** The value lives in a key of a JSONB column (`customFields.color`): equalities use `whereJsonSuperset`; with `cast` every operator works through a parametrized `whereRaw` (accepted only by backends that allow raw conditions). */
	json?: { column: string; key: string; cast?: 'text' | 'numeric' | 'date' | 'timestamp' | 'boolean' };
}

/** A text field. */
export interface StringFilterField extends FieldBase {
	type: 'string';
	/** Several columns: a condition holds when any of them matches (`contains`), or when none does (`isNot`, `notContains`). */
	columns?: string[];
	/** Splits the text into words, for names split over `columns`: `contains` wants every word in some column; `is` wants every word as a whole word of some column, ignoring case unless `caseSensitive` ("mario rossi" finds Mario Rossi, Rossi Mario and Maria Grazia De Rossi with "maria rossi", not Mariolina Rossini); `notContains` and `isNot` are their exact opposites (some word is missing). The other operators compare the whole text. */
	words?: boolean;
	/** Tells upper and lower case apart. Without it every text operator ignores case: `contains` with `ilike`, `is`, `isNot`, `anyOf`, `noneOf`, `startsWith` and `endsWith` with a Postgres regex (`~*`). With it the equalities use `=`, `<>` and `in`, as in v4, which can use the column's index. */
	caseSensitive?: boolean;
	/** Suggestions while typing, for the `match` operator: picking one filters on its exact value (on `suggestColumn`), keeping the typed text filters with `contains`. */
	suggest?: (params: { searchText: string; signal: AbortSignal }) => Promise<FilterItem[]>;
	/** Column compared with the value of a picked suggestion. Defaults to `column`. */
	suggestColumn?: string;
	/** With `empty` / `notEmpty`, an empty string counts as empty too. Default `true`. */
	blankIsEmpty?: boolean;
	/** Placeholder of the input. */
	placeholder?: string;
}

/** A number field. */
export interface NumberFilterField extends FieldBase {
	type: 'number';
	/** Text after the value (`€`, `kg`). */
	unit?: string;
	/** Multiplies the typed value before the query (for example `1000` to type tons of a column in kilograms). */
	scale?: number;
	/** `step` of the input. */
	step?: number;
	/** Other columns the value can be compared with (`quantity < minimum quantity`): adds the column operators. */
	compareWith?: { column: string; label: string }[];
}

/** A date field. */
export interface DateFilterField extends FieldBase {
	type: 'date';
	/** The column is a `date` (no time): the query compares `yyyy-MM-dd` strings. Otherwise it compares timestamps from the start to the end of the local days. */
	dateOnly?: boolean;
	/** Periods offered by the `period` operator, in this order. */
	periods?: FilterPeriod[];
	/** The value has a time too: `before`, `after`, `between` and the relative operators compare instants (`yyyy-MM-ddTHH:mm`), and minutes and hours become available. */
	withTime?: boolean;
	/** Other columns the value can be compared with (`deliveredAt after promisedAt`): adds the column operators. */
	compareWith?: { column: string; label: string }[];
}

/** A field whose value is chosen among options. */
export interface SelectFilterField extends FieldBase {
	type: 'select';
	/** The options, when they are known. */
	items?: FilterItem[];
	/** Loads the options matching the typed text (from an API), instead of `items`. */
	searcher?: (params: { searchText: string; signal: AbortSignal }) => Promise<FilterItem[]>;
	/** How the options are picked: an autocomplete (default), toggle buttons (few options), or countries with flags. */
	view?: 'autocomplete' | 'toggle' | 'countries';
	/** Options added at the top of the list, such as "Me" for the current user. */
	shortcuts?: FilterItem[];
	/** Locale of the country names with `view: 'countries'`. */
	locale?: string;
	/** Placeholder of the input. */
	placeholder?: string;
	/** The column (or the JSON key, with `json`) holds a list of values: `in` = has any of (`&&`), `notIn` = has none of, `all` = has all of (`@>`), `empty` = null or `{}`. */
	array?: boolean;
}

/** A yes/no field. */
export interface BoolFilterField extends FieldBase {
	type: 'bool';
	/** Text of `isTrue` in the pill and the card. Default `Yes`. */
	trueLabel?: string;
	/** Text of `isFalse`. Default `No`. */
	falseLabel?: string;
	/** Query of `isTrue`, when it is not `column = true` (for example `whereColumn('quantity', '<', 'minQuantity')`). */
	whenTrue?: (builder: FilterBuilder) => void;
	/** Query of `isFalse`, when it is not `column = false`. */
	whenFalse?: (builder: FilterBuilder) => void;
	/** The column can be null: adds `empty` and `notEmpty`. */
	nullable?: boolean;
}

/** A field with an input of the app. */
export interface CustomFilterField extends FieldBase {
	type: 'custom';
}

/** A filterable field: what the app declares for each column the user can filter. */
export type FilterField =
	| StringFilterField
	| NumberFilterField
	| DateFilterField
	| SelectFilterField
	| BoolFilterField
	| CustomFilterField;

/** A built-in operator. */
export interface BuiltInOperator {
	name: string;
	input: FilterInput;
	/** The operator is the negation of `positive` (used for relations through subqueries). */
	negates?: string;
}

const operators = (list: [string, FilterInput, string?][]): BuiltInOperator[] =>
	list.map(([name, input, negates]) => ({ name, input, negates }));

/** Built-in operators of each field type, in their default order. */
export const FILTER_OPERATORS: Record<FilterField['type'], BuiltInOperator[]> = {
	string: operators([
		['contains', 'text'],
		['notContains', 'text', 'contains'],
		['is', 'text'],
		['isNot', 'text', 'is'],
		['startsWith', 'text'],
		['endsWith', 'text'],
		['anyOf', 'texts'],
		['noneOf', 'texts', 'anyOf'],
		['match', 'suggest'],
		['empty', 'none'],
		['notEmpty', 'none', 'empty'],
		['like', 'text'],
		['ilike', 'text']
	]),
	number: operators([
		['eq', 'number'],
		['ne', 'number', 'eq'],
		['gt', 'number'],
		['gte', 'number'],
		['lt', 'number'],
		['lte', 'number'],
		['between', 'numberRange'],
		['notBetween', 'numberRange', 'between'],
		['anyOf', 'numbers'],
		['noneOf', 'numbers', 'anyOf'],
		['columnEq', 'column'],
		['columnNe', 'column'],
		['columnGt', 'column'],
		['columnGte', 'column'],
		['columnLt', 'column'],
		['columnLte', 'column'],
		['empty', 'none'],
		['notEmpty', 'none', 'empty']
	]),
	date: operators([
		['is', 'date'],
		['isNot', 'date', 'is'],
		['before', 'date'],
		['after', 'date'],
		['onOrBefore', 'date'],
		['onOrAfter', 'date'],
		['between', 'dateRange'],
		['notBetween', 'dateRange', 'between'],
		['period', 'period'],
		['inLast', 'relative'],
		['inNext', 'relative'],
		['olderThan', 'relative'],
		['laterThan', 'relative'],
		['columnEq', 'column'],
		['columnNe', 'column'],
		['columnGt', 'column'],
		['columnGte', 'column'],
		['columnLt', 'column'],
		['columnLte', 'column'],
		['empty', 'none'],
		['notEmpty', 'none', 'empty']
	]),
	select: operators([
		['in', 'items'],
		['notIn', 'items', 'in'],
		['all', 'items'],
		['empty', 'none'],
		['notEmpty', 'none', 'empty']
	]),
	bool: operators([
		['isTrue', 'none'],
		['isFalse', 'none'],
		['empty', 'none'],
		['notEmpty', 'none', 'empty']
	]),
	custom: operators([['custom', 'custom']])
};

/** How many operators the fields offer: `basic` the essential ones, `standard` the common ones (default), `all` every built-in one. */
export type FilterOperatorSet = 'basic' | 'standard' | 'all';

/** The operators of each set, per field type, in their order. Options of a field add theirs (`suggest` → `match`, `compareWith` → column operators, `array` / `through` → `all`, `nullable` → `empty` / `notEmpty`). */
export const OPERATOR_SETS: Record<FilterOperatorSet, Record<FilterField['type'], string[]>> = {
	basic: {
		string: ['contains', 'is'],
		number: ['eq', 'between'],
		date: ['is', 'between', 'period'],
		select: ['in'],
		bool: ['isTrue', 'isFalse'],
		custom: ['custom']
	},
	standard: {
		string: ['contains', 'notContains', 'is', 'isNot', 'empty', 'notEmpty'],
		number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
		date: ['is', 'before', 'after', 'between', 'period', 'inLast', 'empty', 'notEmpty'],
		select: ['in', 'notIn', 'empty', 'notEmpty'],
		bool: ['isTrue', 'isFalse'],
		custom: ['custom']
	},
	all: {
		string: [
			'contains',
			'notContains',
			'is',
			'isNot',
			'startsWith',
			'endsWith',
			'anyOf',
			'noneOf',
			'empty',
			'notEmpty'
		],
		number: [
			'eq',
			'ne',
			'gt',
			'gte',
			'lt',
			'lte',
			'between',
			'notBetween',
			'anyOf',
			'noneOf',
			'empty',
			'notEmpty'
		],
		date: [
			'is',
			'isNot',
			'before',
			'after',
			'onOrBefore',
			'onOrAfter',
			'between',
			'notBetween',
			'period',
			'inLast',
			'inNext',
			'olderThan',
			'laterThan',
			'empty',
			'notEmpty'
		],
		select: ['in', 'notIn', 'empty', 'notEmpty'],
		bool: ['isTrue', 'isFalse'],
		custom: ['custom']
	}
};

/** Operators offered by fields without `operators` when nothing else is chosen: the `standard` set. */
export const DEFAULT_OPERATORS = OPERATOR_SETS.standard;

/** Which operators the fields without `operators` offer: a set and, per type, an own list. */
export interface FilterOperatorOptions {
	/** Set of the fields without `operators`. Default `standard`. */
	set?: FilterOperatorSet;
	/** Own list per field type, instead of the set (for example `{ date: ['is', 'between'] }`). */
	byType?: Partial<Record<FilterField['type'], string[]>>;
}

const COLUMN_OPERATORS = ['columnEq', 'columnNe', 'columnGt', 'columnGte', 'columnLt', 'columnLte'];

const JSON_OPERATORS = ['is', 'isNot', 'eq', 'ne', 'anyOf', 'noneOf', 'in', 'notIn', 'all', 'isTrue', 'isFalse'];

/** Periods offered by default by the `period` operator. */
export const DEFAULT_PERIODS: FilterPeriod[] = [
	'today',
	'yesterday',
	'tomorrow',
	'thisWeek',
	'lastWeek',
	'nextWeek',
	'thisMonth',
	'lastMonth',
	'nextMonth',
	'monthToDate',
	'thisQuarter',
	'lastQuarter',
	'nextQuarter',
	'quarterToDate',
	'thisYear',
	'lastYear',
	'nextYear',
	'yearToDate'
];

/** An operator as a field offers it: built-in or defined by the app. */
export interface FieldOperator {
	name: string;
	input: FilterInput;
	negates?: string;
	/** Present for operators defined by the app. */
	definition?: FilterOperatorDefinition;
}

export function holdsMany(field: FilterField): boolean {
	return field.type === 'select' && (!!field.through || !!field.array);
}

function timed(field: FilterField, operator: BuiltInOperator): FieldOperator {
	if (field.type !== 'date' || !field.withTime || operator.name === 'is' || operator.name === 'isNot')
		return operator;
	if (operator.input === 'date') return { ...operator, input: 'datetime' };
	if (operator.input === 'dateRange') return { ...operator, input: 'datetimeRange' };
	return operator;
}

/** The operators a field offers, in order: its own `operators`, else the list of its type in `options`, else the chosen set, plus those its options add. */
export function fieldOperators(field: FilterField, options: FilterOperatorOptions = {}): FieldOperator[] {
	const builtIn = FILTER_OPERATORS[field.type];
	const own = Array.isArray(field.operators) ? field.operators : undefined;
	const set = typeof field.operators === 'string' ? field.operators : (options.set ?? 'standard');
	let list: (string | FilterOperatorDefinition)[] = own ?? [
		...(typeof field.operators !== 'string' && options.byType?.[field.type]
			? options.byType[field.type]!
			: OPERATOR_SETS[set][field.type])
	];
	if (!own) {
		const names = list as string[];
		if (holdsMany(field) && set !== 'basic' && !names.includes('all'))
			names.splice(Math.max(names.indexOf('notIn'), names.indexOf('in')) + 1, 0, 'all');
		if (field.type === 'string' && field.suggest && !names.includes('match')) names.unshift('match');
		if ((field.type === 'number' || field.type === 'date') && field.compareWith?.length) {
			const at = names.indexOf('empty');
			names.splice(at === -1 ? names.length : at, 0, ...COLUMN_OPERATORS.filter((name) => !names.includes(name)));
		}
		if (field.type === 'bool' && field.nullable)
			for (const name of ['empty', 'notEmpty']) if (!names.includes(name)) names.push(name);
		if (field.json && !field.json.cast) list = names.filter((name) => JSON_OPERATORS.includes(name));
	}
	return list.flatMap((entry) => {
		if (typeof entry !== 'string') return [{ name: entry.name, input: entry.input, definition: entry }];
		const operator = builtIn.find((candidate) => candidate.name === entry);
		return operator ? [timed(field, operator)] : [];
	});
}

export function conditionOperators(
	field: FilterField,
	operator: string,
	options: FilterOperatorOptions = {}
): FieldOperator[] {
	const offered = fieldOperators(field, options);
	const current = operatorOf(field, operator);
	return current && !offered.some((candidate) => candidate.name === current.name) ? [...offered, current] : offered;
}

/** The operator of a condition: an operator the field defines, or any built-in one of its type, even when the field does not offer it (conditions from presets, URLs or code keep working). A JSON key without `cast` accepts only the equalities it can query. */
export function operatorOf(field: FilterField, name: string): FieldOperator | undefined {
	const defined = Array.isArray(field.operators)
		? field.operators.find((entry): entry is FilterOperatorDefinition => typeof entry !== 'string' && entry.name === name)
		: undefined;
	if (defined) return { name, input: defined.input, definition: defined };
	if (field.json && !field.json.cast && !JSON_OPERATORS.includes(name)) return undefined;
	const operator = FILTER_OPERATORS[field.type].find((candidate) => candidate.name === name);
	return operator && timed(field, operator);
}

let counter = 0;

export function filterId(): string {
	counter = (counter + 1) % 1e9;
	return `f${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Whether a node is a group. */
export function isFilterGroup(node: FilterNode): node is FilterGroup {
	return 'items' in node;
}

/** A new tree (or group): `createFilters()` is an empty AND root. */
export function createFilters(items: FilterNode[] = [], logic: FilterLogic = 'and'): FilterGroup {
	return { id: filterId(), logic, items };
}

/** A new condition, for building a tree in code (presets, URL parameters, defaults). */
export function filterCondition(
	field: string,
	operator: string,
	value?: FilterConditionValue,
	options: { locked?: boolean } = {}
): FilterCondition {
	return { id: filterId(), field, operator, value, ...options };
}

/** A new group, for building a tree in code. */
export function filterGroup(logic: FilterLogic, items: FilterNode[], options: { locked?: boolean } = {}): FilterGroup {
	return { id: filterId(), logic, items, ...options };
}

/** Every condition of the tree, depth first. */
export function filterConditions(tree: FilterGroup): FilterCondition[] {
	return tree.items.flatMap((node) => (isFilterGroup(node) ? filterConditions(node) : [node]));
}

/** The node with this id and the group that contains it. */
export function findFilterNode(
	tree: FilterGroup,
	id: string
): { node: FilterNode; parent: FilterGroup | undefined } | undefined {
	if (tree.id === id) return { node: tree, parent: undefined };
	for (const node of tree.items) {
		if (node.id === id) return { node, parent: tree };
		if (isFilterGroup(node)) {
			const found = findFilterNode(node, id);
			if (found) return found;
		}
	}
	return undefined;
}

function mapTree(tree: FilterGroup, map: (node: FilterNode) => FilterNode | undefined): FilterGroup {
	return {
		...tree,
		items: tree.items.flatMap((node) => {
			const mapped = map(node);
			if (!mapped) return [];
			return [isFilterGroup(mapped) ? mapTree(mapped, map) : mapped];
		})
	};
}

/** A copy of the tree with `node` added to the group `groupId` (default: the root). */
export function addFilterNode(tree: FilterGroup, node: FilterNode, groupId = tree.id): FilterGroup {
	if (tree.id === groupId) return { ...tree, items: [...tree.items, node] };
	return mapTree(tree, (current) =>
		current.id === groupId && isFilterGroup(current)
			? { ...current, items: [...current.items, node] }
			: current
	);
}

/** A copy of the tree with the node `id` changed. */
export function updateFilterNode<Node extends FilterNode>(
	tree: FilterGroup,
	id: string,
	patch: Partial<Node>
): FilterGroup {
	if (tree.id === id) return { ...tree, ...(patch as Partial<FilterGroup>) };
	return mapTree(tree, (node) => (node.id === id ? ({ ...node, ...patch } as FilterNode) : node));
}

/** A copy of the tree without the node `id`. Groups left empty are removed too. */
export function removeFilterNode(tree: FilterGroup, id: string): FilterGroup {
	return pruneFilters(mapTree(tree, (node) => (node.id === id ? undefined : node)));
}

/** A copy of the tree without the conditions on `field` (except locked ones). */
export function removeFieldConditions(tree: FilterGroup, field: string): FilterGroup {
	return pruneFilters(
		mapTree(tree, (node) =>
			!isFilterGroup(node) && node.field === field && !node.locked ? undefined : node
		)
	);
}

/** A copy of the tree with only the locked nodes. */
export function clearFilters(tree: FilterGroup): FilterGroup {
	return pruneFilters(mapTree(tree, (node) => (node.locked ? node : isFilterGroup(node) ? node : undefined)));
}

/** A copy of the tree without empty groups, where a group left with one item (not locked) becomes that item. The root stays. */
export function pruneFilters(tree: FilterGroup): FilterGroup {
	return {
		...tree,
		items: tree.items.flatMap((node): FilterNode[] => {
			if (!isFilterGroup(node)) return [node];
			const pruned = pruneFilters(node);
			if (!pruned.items.length) return [];
			return pruned.items.length === 1 && !pruned.locked ? pruned.items : [pruned];
		})
	};
}

/** Whether the value of a condition is complete for its operator. Incomplete conditions do not reach the query. */
export function isConditionComplete(condition: FilterCondition, field: FilterField | undefined): boolean {
	if (!field) return false;
	const operator = operatorOf(field, condition.operator);
	if (!operator) return false;
	if (field.isComplete) return field.isComplete(condition);
	const value = condition.value;
	const isNumber = (input: unknown) => typeof input === 'number' && Number.isFinite(input);
	const isDate = (input: unknown) => typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input);
	const isDatetime = (input: unknown) =>
		typeof input === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input);
	switch (operator.input) {
		case 'none':
			return true;
		case 'text':
			return typeof value === 'string' && value.trim() !== '';
		case 'texts':
			return Array.isArray(value) && value.some((entry) => typeof entry === 'string' && entry.trim() !== '');
		case 'number':
		case 'days':
			return isNumber(value);
		case 'numbers':
			return Array.isArray(value) && value.some(isNumber);
		case 'relative':
			return (
				(isNumber(value) && (value as number) >= 0) ||
				(!!value && typeof value === 'object' && isNumber((value as FilterRelative).amount) && (value as FilterRelative).amount >= 0)
			);
		case 'date':
			return isDate(value);
		case 'datetime':
			return isDatetime(value);
		case 'numberRange':
		case 'dateRange':
		case 'datetimeRange': {
			if (!value || typeof value !== 'object') return false;
			const { from, to } = value as { from?: unknown; to?: unknown };
			const ok =
				operator.input === 'numberRange' ? isNumber : operator.input === 'dateRange' ? isDate : isDatetime;
			return ok(from) || ok(to);
		}
		case 'period':
			return typeof value === 'string' && (DEFAULT_PERIODS as string[]).includes(value);
		case 'items':
			return Array.isArray(value) && value.length > 0;
		case 'column':
			return (
				typeof value === 'string' &&
				(field.type === 'number' || field.type === 'date') &&
				!!field.compareWith?.some((other) => other.column === value)
			);
		case 'suggest':
			return (
				(typeof value === 'string' && value.trim() !== '') ||
				(!!value && typeof value === 'object' && 'value' in (value as object))
			);
		case 'custom':
			if (value === undefined || value === null || value === '') return false;
			if (Array.isArray(value)) return value.length > 0;
			if (typeof value === 'object' && !(value instanceof Date)) return Object.keys(value).length > 0;
			return true;
	}
}

/** Number of complete conditions the user sees (fields not hidden), for the badge of the Filters button. */
export function countFilters(tree: FilterGroup, fields: FilterField[]): number {
	return filterConditions(tree).filter((condition) => {
		const field = fields.find((candidate) => candidate.name === condition.field);
		return !!field && !field.hidden && isConditionComplete(condition, field);
	}).length;
}

/** The tree as a JSON string, to keep it in a URL, a store or the session. */
export function serializeFilters(tree: FilterGroup): string {
	return JSON.stringify(tree);
}

/** The tree as a short string for a URL parameter (no identities): `?filters=${encodeURIComponent(filtersToParam(value))}`. Read it back with `filtersFromParam`. */
export function filtersToParam(tree: FilterGroup): string {
	const strip = (node: FilterNode): unknown =>
		isFilterGroup(node)
			? { logic: node.logic, items: node.items.map(strip), ...(node.locked ? { locked: true } : {}) }
			: {
					field: node.field,
					operator: node.operator,
					...(node.value !== undefined ? { value: node.value } : {}),
					...(node.locked ? { locked: true } : {}),
					...(node.preset ? { preset: node.preset } : {})
				};
	return JSON.stringify(strip(tree));
}

/** A tree from `filtersToParam` (or `serializeFilters`), with new identities; unknown fields are dropped when `fields` is given. Invalid input gives an empty tree. */
export function filtersFromParam(text: string | null | undefined, fields?: FilterField[]): FilterGroup {
	return readFilters(text, fields, true);
}

/** A tree from `serializeFilters` (or any JSON of the same shape). Unknown fields are dropped when `fields` is given; invalid input gives an empty tree. */
export function parseFilters(json: string | null | undefined, fields?: FilterField[]): FilterGroup {
	return readFilters(json, fields, false);
}

function readFilters(json: string | null | undefined, fields: FilterField[] | undefined, fresh: boolean): FilterGroup {
	try {
		const parsed = JSON.parse(json ?? '');
		const tree = normalize(parsed, fields, fresh);
		return tree && isFilterGroup(tree) ? pruneFilters(tree) : createFilters();
	} catch {
		return createFilters();
	}
}

function normalize(input: unknown, fields: FilterField[] | undefined, fresh: boolean): FilterNode | undefined {
	if (!input || typeof input !== 'object') return undefined;
	const node = input as Record<string, unknown>;
	const id = !fresh && typeof node.id === 'string' ? node.id : filterId();
	if (Array.isArray(node.items)) {
		return {
			id,
			logic: node.logic === 'or' ? 'or' : 'and',
			items: node.items.flatMap((item) => {
				const normalized = normalize(item, fields, fresh);
				return normalized ? [normalized] : [];
			}),
			...(node.locked ? { locked: true } : {})
		};
	}
	if (typeof node.field !== 'string' || typeof node.operator !== 'string') return undefined;
	if (fields && !fields.some((field) => field.name === node.field)) return undefined;
	return {
		id,
		field: node.field,
		operator: node.operator,
		value: node.value as FilterConditionValue,
		...(node.locked ? { locked: true } : {}),
		...(typeof node.preset === 'string' ? { preset: node.preset } : {})
	};
}
