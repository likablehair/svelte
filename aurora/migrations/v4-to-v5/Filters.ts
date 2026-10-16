import type { ComponentMigration, Removal } from '../types.js';

const both = (
	name: string,
	note: string,
	replacement?: string,
	defaultReplacement?: string
): Removal[] => [
	{ name: `--filters-${name}`, note, replacement },
	{ name: `--filters-default-${name}`, note, replacement: defaultReplacement }
];

const menuNote =
	'v5 has no multi-edit cards: one condition is edited in the FilterEditor card, which sits on a Menu surface (as do the field list and the panel). Set the Menu variable on Filters (it reaches all three) or drop it.';
const editorNote =
	'v5 has no multi-edit cards: the closest is the FilterEditor card shown under a pill or after "+ Add filter". Set the FilterEditor variable on Filters (it reaches the card).';

export default {
	from: 'Filters',
	to: 'Filters',
	props: {
		renamed: [
			{
				from: 'showActiveFilters',
				to: 'showPills',
				note: 'Same meaning (one pill per applied condition in the bar), on every screen size. `pinned` fields stay in the bar only when it is true.'
			},
			{
				from: 'dateLocale',
				to: 'locale',
				note: 'BCP 47 locale of dates and numbers in pills and inputs, and of every text; `"it"` and `"en"` keep working. When both `lang` and `dateLocale` are set, keep one `locale` with the language of the app.'
			},
			{
				from: 'lang',
				to: 'locale',
				note: 'Texts follow `locale`: `lang="it"` → `locale="it"` (every label, operator and period in Italian, the lists and the calendar included), or nothing when the root layout calls `setDefaultLocale("it")` (step `global-default-locale`); `lang="en"` → `locale="en"` only in an app with an Italian default. See `filters-labels`.'
			}
		],
		collect: [
			{
				into: 'labels',
				props: [
					{ from: 'addFilterLabel', key: 'filters' },
					{ from: 'filterTitleLabel', key: 'filters' },
					{ from: 'cancelFilterLabel', key: 'cancel' },
					{ from: 'applyFilterLabel', key: 'apply' },
					{ from: 'trueString', key: 'yes' },
					{ from: 'falseString', key: 'no' }
				],
				note: 'Texts come from `locale`; `labels` overrides single ones. Remove an entry that only repeats the default of the language.'
			}
		],
		removed: [
			{
				name: 'filters',
				replacement: 'fields + value',
				note: 'v4 kept definition and state in one `Filter[]` (`active`, `value` / `values` / `from` / `to`, `mode`). v5 takes `fields: FilterField[]` (definitions only, usually a constant) and `bind:value` (a `FilterGroup` tree of conditions from `createFilters` / `filterCondition`). Convert each definition with `filters-definitions` and the applied state with `filters-initial-value`.'
			},
			{
				name: 'addFilterLabel',
				replacement: 'labels.filters',
				note: 'Text of the button that opens the filters (v4 default "Filters" / "Filtri"). "+ Add filter" is `labels.addFilter`.'
			},
			{
				name: 'cancelFilterLabel',
				replacement: 'labels.cancel',
				note: 'Cancel exists only with `confirm`.'
			},
			{
				name: 'applyFilterLabel',
				replacement: 'labels.apply',
				note: 'Apply exists only with `confirm`; without it every complete change applies by itself.'
			},
			{
				name: 'filterTitleLabel',
				replacement: 'labels.filters',
				note: 'v4 title of the field list and of the multi-edit dialog ("Filter by"). The v5 panel and bottom sheet are titled `labels.filters`; the field list has a search (`labels.searchFields`).'
			},
			{
				name: 'betweenSeparator',
				note: 'Ranges in pills read "start – end", or "from X" / "to Y" with `labels.from` / `labels.to`. Drop it.'
			},
			{
				name: 'trueString',
				replacement: 'labels.yes, or trueLabel on the bool field',
				note: 'Text of a true bool condition in the pill and the card.'
			},
			{
				name: 'falseString',
				replacement: 'labels.no, or falseLabel on the bool field',
				note: 'Text of a false bool condition (v4 could not filter on false).'
			},
			{
				name: 'labelsMapper',
				replacement: 'labels.operators',
				note: 'Keyed by v5 operator name, one string each (v4 had `short` and `extended`: keep the short one). v4 keys map to: `equal` → `is` (text, date), `eq` (number), `in` (select); `different` → `notIn`; `greater` → `gt` / `after`; `lower` → `lt` / `before`; `between`, `contains`, `like`, `ilike` unchanged.'
			},
			{
				name: 'editFilterMode',
				note: 'Both modes are replaced by one UI: "+ Add filter" opens the field list and then the card of one condition (like one-edit), the "Filters" button opens a panel with every condition in rows (instead of the multi-edit dialog of cards). Drop it.'
			},
			{
				name: 'drawerSpace',
				replacement: '--drawer-size',
				note: 'The mobile bottom sheet is as tall as its content, at most 90dvh. For a fixed height set `--drawer-size="85vh"` (and `--drawer-max-size` if larger than 90dvh) on Filters: it reaches the inner Drawer. Usually drop it.'
			},
			{
				name: 'multiEditTabs',
				replacement: 'category on each field',
				note: 'v4 split the multi-edit dialog in tabs and matched `filter.tabName` with `tab.name`. Set `category` on each field to the **label** of its v4 tab (the text shown as a heading in the field list), then drop the prop.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onapplyFilter',
				to: 'onchange',
				argument: {},
				type: '{ value: FilterGroup; builder: FilterBuilder }',
				note: 'v4 passed nothing and the handler rebuilt the query with `FilterConverter`. v5 passes the tree (complete conditions only) and the ready `FilterBuilder` (`filtersToBuilder(value, fields, { builder })`): use `e.builder` instead of converting. It fires for every change of the query (add, edit, remove, clear, presets), after `applyDelay` (300 ms) or at Apply with `confirm`. See `filters-onchange`.'
			},
			{
				name: 'onremoveFilter',
				to: 'onremove',
				argument: { 'detail.filter': null, detail: '' },
				type: '{ conditions: FilterCondition[] }',
				note: 'Called with the complete conditions the user removed (× of a pill, Remove in the card, a panel row, Clear, a preset turned off); v4 passed the cleared `Filter`. `e.detail.filter.name` → `e.conditions[i].field`, its old value → `e.conditions[i].value`. Removals also call `onchange`: when the handler only reloaded the data (usually the same function as `onapplyFilter`), delete it instead of renaming, or the data loads twice. When it only reset the state of a custom input, delete it too (the input reads the condition value). Keep `onremove` only for app state outside the filters. If `onremoveAllFilters` is also set, merge both into one `onremove`.'
			},
			{
				name: 'onremoveAllFilters',
				to: 'onremove',
				argument: {},
				type: '{ conditions: FilterCondition[] }',
				note: 'Clear and Clear all call `onremove` once with every condition removed (the `locked` ones stay), then `onchange`. Same advice as `onremoveFilter`: usually delete the handler; if both v4 callbacks are set, keep one `onremove`.'
			},
			{
				name: 'onaddFilterClick',
				to: 'onopen',
				argument: {},
				type: "{ view: 'fields' | 'editor' | 'panel'; field?: FilterField }",
				note: 'v4 fired it when the filter button was clicked, before the list or dialog opened. `onopen` fires for the field list (`view: "fields"`, "+ Add filter"), the card of one field (`"editor"`, with `field`) and the panel (`"panel"`, also on mobile for "+ Add filter"): wrap the body in `if (e.view === "fields" || e.view === "panel")` to keep the v4 timing. When it only loaded the options of select fields, prefer `searcher` on the field, or load them in `onopen` with `e.view === "editor" && e.field?.name === "x"` and pass reactive `fields`.'
			}
		],
		removed: [
			{
				name: 'onclick',
				note: 'v4 put it on the inner field list (to stop clicks from closing an outer menu). Drop it.'
			},
			{
				name: 'onkeydown',
				note: 'v4 put it on the inner field list. Drop it.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'customSnippet',
				to: 'inputSnippet',
				note: 'Parameters changed (see `snippets.parameters`) and it renders only the value input of one condition: see `filters-custom`.'
			},
			{
				from: 'customChipSnippet',
				to: 'pillSnippet',
				note: 'It replaces the text of every pill, not only custom ones: branch on `field.name`. For a different value text only, prefer `format` on the field. See `filters-pill-snippet`.'
			}
		],
		removed: [
			{
				name: 'contentSnippet',
				note: 'It replaced the body of the multi-edit dialog (DynamicFilters master-detail inside DynamicTable). The v5 panel lists every condition in rows and cannot be replaced: drop the snippet and its DynamicFilters.'
			}
		],
		parameters: [
			{
				name: 'inputSnippet',
				v4: '{ filter: Filter | undefined; updateFunction: (filterName, newValue, newValid) => void; mAndDown: boolean }',
				v5: '{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }',
				note: '`filter.name` → `field.name`; `filter.value` → `value`; `updateFunction(name, v, valid)` → `setValue(v)`, with the validity rule moved to `isComplete` on the field (or `setValue(valid ? v : undefined)`); `mAndDown` has no counterpart (the input sits in the card or in a panel row, both narrow).'
			},
			{
				name: 'pillSnippet',
				v4: '{ filter: Filter }',
				v5: '{ condition: FilterCondition; field: FilterField; operator: string; value: string }',
				note: '`filter.value` / `values` / `from` / `to` → `condition.value`; `operator` and `value` are the texts the pill would show. The pill keeps its edit and remove buttons.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--filters-wrapper-width',
				to: '--filters-width',
				note: 'Default `100%` of the container (v4 `auto`).'
			}
		],
		removed: [
			{
				name: '--filters-default-wrapper-width',
				note: 'No default variable in v5: set `--filters-width` on the instance.',
				replacement: '--filters-width'
			},
			...both(
				'button-height',
				'The "Filters" button is a `size="sm"` Button (28px). `--button-height` set on Filters changes every button inside it (Clear and the panel buttons too). Usually drop it.'
			),
			...both(
				'button-border-radius',
				'The "Filters" button follows the Button radius of the theme. `--button-border-radius` set on Filters changes every button inside it. Usually drop it.'
			),
			{
				name: '--filters-button-cancel-color',
				note: 'Cancel is a text Button and exists only with `confirm`. Drop it.'
			},
			{
				name: '--filters-button-cancel-default-color',
				note: 'Cancel is a text Button and exists only with `confirm`. Drop it.'
			},
			{
				name: '--filters-button-cancel-background-color',
				note: 'Cancel is a text Button and exists only with `confirm`. Drop it.'
			},
			{
				name: '--filters-button-cancel-default-background-color',
				note: 'Cancel is a text Button and exists only with `confirm`. Drop it.'
			},
			...both(
				'one-edit-menu-max-height',
				'Max height of the v4 menu with the list of fields. The v5 field list is a Menu: set `--menu-max-height` on Filters (it also limits the card and the panel).',
				'--menu-max-height'
			),
			...both('card-background-color', menuNote, '--menu-background'),
			...both(
				'card-border',
				`${menuNote} The border is split: \`--menu-border-width\` + \`--menu-border-color\`.`,
				'--menu-border-width + --menu-border-color'
			),
			...both('card-border-radius', menuNote, '--menu-border-radius'),
			...both('card-box-shadow', menuNote, '--menu-box-shadow'),
			...both('card-hover-box-shadow', 'Cards have no hover state in v5. Drop it.'),
			...both('card-hover-transition', 'Cards have no hover state in v5. Drop it.'),
			...both(
				'card-padding',
				editorNote,
				'--filter-editor-padding',
				'--filter-editor-default-padding'
			),
			...both(
				'card-title-font-weight',
				editorNote,
				'--filter-editor-title-font-weight',
				'--filter-editor-default-title-font-weight'
			),
			...both(
				'card-title-font-size',
				editorNote,
				'--filter-editor-title-font-size',
				'--filter-editor-default-title-font-size'
			),
			...both(
				'card-title-color',
				`${editorNote} It colors the whole card text, not only the title; the title icon is \`--filter-editor-icon-color\`.`,
				'--filter-editor-color',
				'--filter-editor-default-color'
			),
			...both(
				'card-title-margin-bottom',
				`${editorNote} It is the gap between every part of the card.`,
				'--filter-editor-gap',
				'--filter-editor-default-gap'
			)
		]
	},
	manual: [
		{
			id: 'filters-definitions',
			kind: 'edit',
			summary:
				'Each v4 `Filter` (definition and state in one object) becomes a `FilterField` (definition only) in `fields`.',
			action:
				'For each object of the v4 `filters` array write a field, keeping the same order: `name`, `label`, `type` (`string` | `number` | `date` | `select` | `bool` | `custom`) and `column` unchanged (`column` now defaults to `name`). `icon`: MDI class → SVG path (global icon transform); `iconColor` has no counterpart (drop it). `tabName` → `category` (the label of the v4 tab, see `multiEditTabs`). `advanced: false` (or absent) with a `mode` (a fixed mode) → `operators: ["<v5 operator>"]` (one operator: the card shows no operator choice); `advanced: true` (the user picked the mode) → omit `operators`, so the field offers the operator set of Filters (`filters-operator-sets`), or list the ones to offer, and set `defaultOperator` to the v5 operator of `mode`. Map `mode` with `filters-modes`. select: `items` keep `{ value, label, icon }` (icon → SVG path), `view: "toggle" | "autocomplete"` unchanged. bool: v4 only filtered on true, so `operators: ["isTrue"]` keeps it; drop `operators` to offer true and false. bool `description` (the v4 checkbox text) → `trueLabel` when it names the true state ("Only active"), otherwise drop it; do not copy it to the field `description`, which is the secondary text in the field list. `betweenModeSingleTextField` → drop (a date `between` always shows one range field). `hidden` did nothing in v4: drop it (v5 `hidden` really hides the field). `multiString` and `choice` were never applied by v4: rewrite them as a `string` field with `columns` or a `select`. `active`, `value`, `values`, `from`, `to` are state: move the applied ones to `value` with `filters-initial-value`; a value set without `active` (it only prefilled the editor) → `defaultValue` on the field, in the v5 shape. `modify` → `filters-modify`; `type: "custom"` → `filters-custom`. Without `operators` a field offers the `standard` set of its type (`filters-operator-sets`), which has more than the v4 modes (string `isNot`, `notContains`; number `ne`, `gte`, `lte`; date `period`, `inLast`; `empty` / `notEmpty` on most types): on apps whose backend is variant E or E\' (`global-filter-backends`) pass `operatorSet="basic"` (or `typeOperators`) to Filters to leave out `empty` / `notEmpty`, which those appliers reject. v4 used the filter label as placeholder of the one-edit inputs; v5 shows `labels.value`, `labels.choose` (options) or `labels.search` (`searcher`, `suggest`): give string and select fields a `placeholder` where the app wants its own text. Type the array as `FilterField[]` (`import { type FilterField } from "@likable-hair/svelte"`), keep it out of `$state` unless items change at runtime (then `$derived`), and pass it as `fields`.',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-modes',
			kind: 'edit',
			summary: 'v4 `mode` values become v5 operator names, per type.',
			action:
				'string: `equal` → `is`; `contains` → `contains`; `like` → `like`, `ilike` → `ilike` (same JSON as v4: the value is sent without `%`). On backends that add `%` themselves (variants A–E, see `global-filter-backends`) v4 like/ilike behaved as "contains": prefer `contains` (it sends `ilike "%v%"` with `%` and `_` escaped, same results there); on epass / new-vigipass (no automatic `%`) v4 ilike was a case-insensitive equality: keep `ilike`. number: `equal` → `eq`, `greater` → `gt`, `lower` → `lt`, `between` → `between` (open ends as in v4). date: `equal` → `is` (whole local day, same JSON), `between` → `between` (whole days, same JSON), `lower` → `before` (< start of the day: same results as v4), `greater` → `after`, which is now after the **whole** chosen day (v4 compared the raw midnight value, so the chosen day was included for timestamp columns): use `onOrAfter` to keep including it. Add `dateOnly: true` to fields on `date` columns (no time): the query then compares `yyyy-MM-dd` strings. select: `equal` → `in` (one value: `where(column, "=", v)`; several: `whereIn`; v4 sent a group of `orWhere`), `different` → `notIn` (`<>` or `notWhereIn`). bool `equal` → `isTrue`.',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-initial-value',
			kind: 'edit',
			summary:
				'Applied state (`active: true` with `value` / `values` / `from` / `to`) moves from the definitions to the `value` tree.',
			action:
				'Build the initial tree with `createFilters([...])` and one `filterCondition(name, operator, value)` per v4 filter that had `active: true`: text and number → the value; number between → `{ from, to }` (either may be missing); date → `toISODate(date)` (`"2026-10-09"`), date between → `{ from: toISODate(from), to: toISODate(to) }`; select → the `values` array as it is (`{ value, label }` items; the label is shown in the pill); bool → no value (`filterCondition("paid", "isTrue")`); custom → the value the custom input works with. Operators that v4 did not have (when a `modify` became one): `anyOf` / `noneOf` → an array of strings or numbers; `notBetween` → `{ from, to }`; `inLast`, `inNext`, `olderThan`, `laterThan` → `{ amount: 30, unit: "days" }` (or `30`); `period` → its name (`"thisMonth"`); date fields with `withTime` → `"2026-10-09T14:30"` (`{ from, to }` of those for ranges; `is` / `isNot` stay `yyyy-MM-dd`); `columnEq` … `columnLte` → the `column` of a `compareWith` entry; `match` → the typed text, or `{ value, label }` of a picked suggestion; `empty`, `notEmpty`, `isTrue`, `isFalse` → no value. `let value = $state(createFilters([...]))` and `<Filters {fields} bind:value />`. v4 definitions with a value but without `active` only prefilled the editor: move that value to `defaultValue` on the field (same v5 shape), so a new condition on it starts with it. Constraints the user must not remove → `filterCondition(..., { locked: true })` (also on a `hidden: true` field for invisible ones). Where v4 code built the query from that state (`new FilterConverter().createBuilder({ filters })`), build it with `filtersToBuilder(value, fields)`.',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-modify',
			kind: 'edit',
			summary:
				'`modify({ builder, value, values, mode })` is gone: declarative field options cover what apps used it for; `apply(builder, condition)` is the fallback.',
			action:
				'Replace each `modify` by the first option that expresses it: joins to reach the column → `joins: [{ table, on: [from, to] }]` (left join by default, added once and before the conditions) and `column: "table.column"`; `whereIn(key, (q) => q.select(x).from(bridge).where...)` on a bridge table → `through: { key, from: bridge, select: x, joins?, where? }` (an array for several hops; `notIn` / `empty` become `notWhereIn` on the same subquery); OR over several columns, also word by word → string `columns: [...]` + `words: true`; `%v%` added by hand → operator `contains`; `v%` / `%v` → `startsWith` / `endsWith`; a case-sensitive `like` → `caseSensitive: true`; `whereIn` / `notWhereIn` on a list of typed codes or numbers → string or number `anyOf` / `noneOf`; whole-day date ranges written by hand → `between` (built in), their negation → `notBetween`; `whereNull` (also `OR = ""`) → operator `empty` (strings treat `""` as empty by default, `blankIsEmpty`; a bool column that can be null → `nullable: true`); a comparison with another column of the same row (`whereColumn("quantity", "<", "minQuantity")`, `whereColumn("deliveredAt", ">", "promisedAt")`) → on a number or date field `compareWith: [{ column, label }]` (operators `columnEq` … `columnLte`, the user picks the column) or, as a fixed yes / no ("Below minimum"), bool `whenTrue` / `whenFalse` with the `whereColumn`; any other bool that becomes another condition → `whenTrue` / `whenFalse` (they run at every query build, so `new Date()` or app `$state` read inside stay current, and a change of that state re-emits `onchange`); relative dates computed by hand (`new Date()` minus N days: "last 30 days", "older than a year", "next 2 weeks") → date `inLast`, `inNext`, `olderThan`, `laterThan` with `{ amount, unit }` (`FilterRelative`: `days`, `weeks`, `months`, `years`, also `minutes` / `hours` with `withTime`; a plain number = days) or `period` (`today` … `yearToDate`); "valid now" on two date columns → bool `whenTrue: (b) => b.where("validFrom", "<=", new Date()).where("validTo", ">=", new Date())`, or two date conditions `onOrBefore` / `onOrAfter` with `toISODate(new Date())` (fixed when built, e.g. in a preset); a timestamp compared with a date and a time → date `withTime: true` (values `yyyy-MM-ddTHH:mm`); a key of a JSONB column (`whereJsonSuperset("customFields", { color: v })`, nested objects) → `json: { column: "customFields", key: "color" }` (dots for nested keys: `"stats.visits"`; the field `column` is not used), only equalities (`is`, `isNot`, `eq`, `ne`, `anyOf`, `noneOf`, `in`, `notIn`, `all`, `isTrue`, `isFalse`); comparisons on a JSON key (`whereRaw("(customFields->>\'visits\')::numeric > ?")`) → `json: { column, key, cast: "numeric" }` (`text`, `numeric`, `date`, `timestamp`, `boolean`; every operator), which sends `kind: "raw"` and works only on appliers of variant B (on the others the comparison needs a backend change, see `global-filter-backends`); a Postgres array column (`whereRaw("labels && ?")`, `@>`) → select `array: true` (`in` = contains any of, `all` = contains all of, `empty` = null or `{}`); "pick a suggestion (exact match) or keep the typed text (contains)" (addibox `CompanyFilter`, `WarehouseProductFilter`) → string `suggest: ({ searchText, signal }) => items` + `suggestColumn` (column compared with the picked value, default `column`), operator `match` (added first by default); a query applied when the field has no condition ("hide archived" unless asked) → `whenAbsent` (with `operators: ["isTrue"]` and an empty `whenTrue` for "Show archived"); values multiplied (tons → kg) → number `scale` (+ `unit`); one option standing for several values → item `values: [...]`; fixed hidden constraints → `hidden` field + `locked` condition. Only otherwise write `apply: (builder, condition) => { ... }` on the field (it replaces the query of every operator) or an operator definition `{ name, label, input, apply }` in `operators`: read `condition.value` instead of `value` / `values` / `{ from, to }` and `condition.operator` instead of `mode`. Differences: dates arrive as `yyyy-MM-dd` strings (`parseISODate`), selects as `FilterItem[]` (`.map((i) => i.value)`), ranges as `{ from?, to? }`; mutate `builder` and return nothing (a returned builder is ignored, so `return builder.where(...)` still works but `return new FilterBuilder()...` does not). Joins go before the conditions, `orderBy` / `select` / `from` after them (a v4 `modify` that sorted keeps working); a query that mixes `where` and `orWhere` is wrapped in a group, so it never puts an OR at the first level. An operator definition without `apply` uses the field `apply`. Operators outside the `standard` set (`startsWith`, `endsWith`, `anyOf`, `noneOf`, `notBetween`, `onOrBefore`, `onOrAfter`, `inNext`, `olderThan`, `laterThan`) are offered only when listed in the field `operators` or with `operatorSet="all"` (`filters-operator-sets`).',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-operator-sets',
			kind: 'review',
			summary:
				'v4 `advanced` (the user picks the mode among those of the type) becomes the operator sets: `operatorSet` on Filters (`basic`, `standard` by default, `all`), `typeOperators` per type, `operators` per field (a list or a set name).',
			action:
				'Choose the operators for the app, not field by field. Filters that were `advanced: true` stay without `operators` and get `standard` (every v4 mode except `like` / `ilike`, plus `isNot`, `notContains`, `ne`, `gte`, `lte`, `period`, `inLast`, `empty`, `notEmpty`); pass `operatorSet="all"` only where users need every built-in operator (`startsWith`, `endsWith`, `anyOf`, `noneOf`, `notBetween`, `onOrBefore`, `onOrAfter`, `inNext`, `olderThan`, `laterThan`), and `operatorSet="basic"` for simple pages and for backends E / E\' (string `contains`, `is`; number `eq`, `between`; date `is`, `between`, `period`; select `in`; no `empty` / `notEmpty`). When the fields of one type need the same list, pass `typeOperators={{ date: ["is", "between", "period"] }}` instead of repeating `operators`; a field `operators` wins over both, as a list (fixed v4 modes stay `operators: ["<operator>"]`) or as a set name (`operators: "all"`). Options still add their operators to any set (`suggest` → `match`, `compareWith` → column operators, `array` / `through` / `json` → `all` outside `basic`, `nullable` → `empty` / `notEmpty`). An operator a rule maps to that is outside the chosen set (`startsWith` for a `v%` modify, `anyOf` for a list of codes) must be listed in `operators` to be offered; in presets, `defaultOperator`, saved filters, the URL or app code any built-in operator of the type works anyway (the card and the panel show it as chosen), except the non-equalities of a `json` key without `cast`, which stay incomplete. A FilterEditor used alone takes the same `operatorSet` and `typeOperators`.',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-custom',
			kind: 'edit',
			summary:
				'`type: "custom"` filters (value from `customSnippet` + `updateFunction`, query from `modify`) become `type: "custom"` + `apply` + `inputSnippet`, or better a declarative type.',
			action:
				'First check whether a built-in type does the job (details in `filters-modify`): entity picker with remote search + `whereIn` → `type: "select"` with `searcher: ({ searchText, signal }) => fetch(...)` returning `{ value, label }[]` and `shortcuts: [{ value: me.id, label: "Me" }]` for "assigned to me"; static list → `select` with `items`; countries with flags → `select` with `view: "countries"`; tags of a category with AND/OR → `select` with `through` (operator `all` = has all of, `in` = any of); a Postgres array column → `select` with `array: true`; a free list of codes → string `anyOf` / `noneOf` (outside `standard`: list them in `operators`); "pick a suggestion or keep the typed text" (an Autocomplete that allowed free text) → string `suggest` + `suggestColumn` (operator `match`); missing value → operator `empty`; relative dates ("last 30 days", "valid now") → date `period`, `inLast`, `inNext`, `olderThan`, `laterThan` (`{ amount, unit }`), or bool `whenTrue`; date and time pickers → date `withTime: true`; comparison with another column → `compareWith`; JSONB custom fields → `json: { column, key, cast? }` (equalities without `cast`; with `cast` every operator, backends of variant B only); units → number `unit` + `scale`. Otherwise keep `type: "custom"`, move the v4 `modify` body to `apply: (builder, condition) => { ... }` on the field (see `filters-modify`; without `operators` the field gets the built-in operator `custom`, shown without text), and move the input into one `inputSnippet` on Filters, branching on `field.name`: `{#snippet inputSnippet({ field, value, setValue })}{#if field.name === "x"}<MyInput {value} onchange={(v) => setValue(v)} />{/if}{/snippet}`. Validity: v4 `updateFunction(name, v, valid)` → `setValue(v)`, and the rule that computed `valid` moves to `isComplete: (condition) => ...` on the field (or call `setValue(valid ? v : undefined)`). Without `isComplete` a custom value is complete when it is not `undefined`, `null`, `""`, an empty array or an empty object. The value is plain data in the tree: keep it JSON-serializable. Pills show text and numbers as they are, arrays joined by ", " (items by label) and nothing for objects: give the field `format: (condition) => text` otherwise. Several operators (`is` / `is not`) → `operators: [{ name, label, input: "custom" }]`, read `condition.operator` in `apply`. Remove the app code that reset the custom inputs on remove / remove all: the input reads `value`.',
			when: { snippets: ['customSnippet'], props: ['filters'] }
		},
		{
			id: 'filters-onchange',
			kind: 'edit',
			summary:
				'One `onchange({ value, builder })` reloads the data for every change, removals included, and it carries the query; `onremove` and `onopen` are only for side effects.',
			action:
				'Keep one `onchange` (from `onapplyFilter`) that reloads the data with `e.builder` (the query of the filters, already on top of the `builder` prop): `onchange={({ builder }) => reload(builder)}`. Remove the `FilterConverter` / `Converter` calls inside the old handlers. `e.value` holds only complete conditions. Handlers of `onremoveFilter` / `onremoveAllFilters` that reloaded the data (often the same function) must be deleted, not renamed to `onremove`, or every removal loads twice. To combine with a search or a sort, pass that query as the `builder` prop (Filters re-emits `onchange` when it changes) or call `filtersToBuilder(value, fields, { builder: base })` yourself. `onchange` does not fire on mount: build the first query with `filtersToBuilder(value, fields)` (also in `+page.ts` / `+page.server.ts` load functions). It fires only when the query changes, 300 ms after the last change (`applyDelay`; with `confirm` at Apply), and also when the app changes `value` itself: remove manual reloads that followed a programmatic change, or they run twice. Without `confirm` the user sees the result while editing; add `confirm` only where each query is expensive.',
			when: { events: ['onapplyFilter', 'onremoveFilter', 'onremoveAllFilters'] }
		},
		{
			id: 'filters-programmatic-state',
			kind: 'edit',
			summary:
				'App code that changed the v4 array by hand (`filters[i].active = false`, `filters[i].value = x`, `filters = filters`) works on the tree with helpers now.',
			action:
				'Rewrite on `value` (a new tree each time; the helpers do not mutate). With `bind:value` assign it; without a bound value Filters keeps its own state, and passing `value={createFilters()}` clears it. Remove all → `value = clearFilters(value)` (keeps `locked`) or `createFilters()`; remove one field → `value = removeFieldConditions(value, "name")`; set or replace one → `value = addFilterNode(removeFieldConditions(value, "name"), filterCondition("name", "is", "x"))`; read a value → `filterConditions(value).find((c) => c.field === "name")?.value`; count → `countFilters(value, fields)`. Items loaded after mount: keep `fields` in a `$derived` (or `$state`) that includes them, or use `searcher`. Saved state (stores, sessionStorage, URL presets, saved views) → see `global-filter-state` (`serializeFilters` / `parseFilters`, `filtersToParam` / `filtersFromParam`, `savable` / `savedKey` / `bind:saved`).',
			when: { props: ['filters'] }
		},
		{
			id: 'filters-labels',
			kind: 'review',
			summary:
				'Texts follow `locale` (Italian and English built in) with single texts in one `labels` object (`FilterLabels`), and dates and numbers follow `locale` too. The codemod renames `lang` to `locale` and moves the label props into `labels`.',
			action:
				'Where the root layout calls `setDefaultLocale("it")`, drop `locale="it"`: it picks every Italian text anyway. Drop `labels` entries that only repeat the default of the language. `labelsMapper` → `labels.operators` (see the `labelsMapper` removal). App wrappers around Filters should set them inside the wrapper.',
			when: { props: ['lang', 'labelsMapper', 'dateLocale'] }
		},
		{
			id: 'filters-append-snippet',
			kind: 'review',
			summary:
				'`appendSnippet` still renders right after the filter buttons; page actions now have their own `actionsSnippet`, pushed to the end of the bar.',
			action:
				'Most v4 `appendSnippet` contents are page actions ("New", sync, export / import buttons): move them to `actionsSnippet`. Keep `appendSnippet` for content that belongs next to the filters (a count, a toggle). A search field that the app placed before the filters goes in `prependSnippet`.',
			when: { snippets: ['appendSnippet'] }
		},
		{
			id: 'filters-pill-snippet',
			kind: 'edit',
			summary: '`customChipSnippet` → `pillSnippet`, which replaces the text of every pill.',
			action:
				'If the snippet only formatted the value of custom filters, remove it and give those fields `format: (condition) => text` (the pill keeps field and operator; without it arrays show joined by ", " and objects show nothing). Otherwise rename it to `pillSnippet`, render the default text for other fields (`{field.label} {operator} {value}`) and read `condition.value` instead of `filter.value`. Drop the chip markup and the close button from the snippet: the pill keeps its buttons.',
			when: { snippets: ['customChipSnippet'] }
		},
		{
			id: 'filters-look',
			kind: 'review',
			summary:
				'New UI: a bar with the "Filters" button (with the count), one pill per condition (field · operator · value, click to edit, × to remove), "+ Add filter" and Clear; the card of one condition; a panel (880px, `--filters-panel-width`) with every condition in rows, where, with `maxDepth`, every filter is a box with "Add nested filter" and the root has one "Add filter"; a bottom sheet up to 1024px. v4 had a button with a dot, chips, menus or a dialog of cards.',
			action:
				'Check layouts that placed Filters in a row: it now takes 100% of the width (`--filters-width`) and its bar wraps. End-to-end tests: the buttons are "Filters", "Add filter", "Clear" (or the `labels`), pills are buttons named "Edit filter: …", the field list is a listbox, the card a group with radio operators; in the panel each row has "Remove filter" and, with `maxDepth`, "Add nested filter" (there is no "Add group"), and "Add filter" appears once in the bar and once per group (take the last for the root group). Options picked in an Autocomplete show two chips and a "+N" counter (`maxVisibleChips` 2, as in the v4 FilterEditor; 1 in the panel rows); lists of texts or numbers show three chips (two in the rows) and a "+N" button that expands them until "Show less". In the panel rows `view: "toggle"` fields become an Autocomplete when their labels do not fit, and dates show their format as placeholder. A click outside closes only the innermost open menu (an open list inside the panel first, then the panel). App CSS that targeted `.filters-wrapper`, `.filter-button`, `.filter-slot`, `.chip-content`, `.drawer-multi-filter` must use the `aurora-filters-*` classes, `class` parts or `--filters-*` variables.'
		}
	],
	added: [
		'`fields` options: `columns` + `words`, `joins`, `through`, `json` (`{ column, key, cast? }`: a key of a JSONB column; equalities through `whereJsonSuperset`, every operator with `cast` through a parametrized `whereRaw`), `operators` (subset or app-defined), `defaultOperator`, `defaultValue`, `isComplete`, `apply`, `whenAbsent`, `hidden`, `pinned`, `category`, `description`, `format`; string `blankIsEmpty`, `placeholder`, `caseSensitive`, `suggest` + `suggestColumn`; number `unit`, `scale`, `step`, `compareWith`; date `dateOnly`, `periods`, `withTime`, `compareWith`; select `searcher`, `shortcuts`, `view: "countries"`, `locale`, `array` (Postgres array column), item `values`; bool `trueLabel`, `falseLabel`, `whenTrue`, `whenFalse`, `nullable`.',
		'Operator sets instead of v4 `advanced`: `operatorSet` (`basic`, `standard` by default, `all`) and `typeOperators` (a list per type) on Filters and FilterEditor, a set name as field `operators` (`operators: "all"`), `OPERATOR_SETS`, `fieldOperators(field, { set, byType })`; conditions with a built-in operator the field does not offer (presets, URL, saved filters, code) still apply and are shown as chosen.',
		'Text operators ignore case by default, `is` / `isNot` / `anyOf` / `noneOf` included (anchored regex `~*`; v4 sent `=`: add `caseSensitive: true` to keep `=` / `in` and the index). `negativesIncludeEmpty` (Filters, field or `filtersToBuilder`, default `true`) makes the negatives keep the empty rows: it sends `kind: "null"`, so apps on backends E / E\' pass `negativesIncludeEmpty={false}`. On relations and arrays `in` / `notIn` read "has any of" / "has none of"; `all` needs `through` or `array`. Operators: string `isNot`, `notContains`, `startsWith`, `endsWith` (Postgres regex `~*`, `~` with `caseSensitive`), `anyOf`, `noneOf`, `match` (with `suggest`), `empty`, `notEmpty`; number `ne`, `gte`, `lte`, `notBetween`, `anyOf`, `noneOf`, `empty`, `notEmpty`; date `isNot`, `onOrBefore`, `onOrAfter`, `notBetween`, `period`, `inLast`, `inNext`, `olderThan`, `laterThan`, `empty`, `notEmpty`; number and date `columnEq`, `columnNe`, `columnGt`, `columnGte`, `columnLt`, `columnLte` (with `compareWith`); select `notIn`, `all` (with `through`, `array` or `json`), `empty`, `notEmpty`; bool `isFalse`, `empty` and `notEmpty` (with `nullable`).',
		'Relative dates take `{ amount, unit }` (`FilterRelative`, units `FilterTimeUnit`: `minutes` and `hours` with `withTime`, `days`, `weeks`, `months`, `years`; a plain number = days); periods `today` … `yearToDate`, with `nextQuarter`, `nextYear`, `monthToDate`, `quarterToDate`, `yearToDate`; date and time values `yyyy-MM-ddTHH:mm` with `withTime`.',
		'The same field can appear in several conditions; `allowOr` (AND / OR) and `maxDepth` (nested groups: every filter is a box whose "Add nested filter" turns it into a group or adds a row to it, OR under AND with `allowOr`; one "Add filter" at the root) in the panel.',
		'`pinned` fields always in the bar and `presets` chips (`{ id, label, icon, count, conditions }`), on while every condition of the preset is in the tree (same field, operator and value, however it was added; locked only with locked).',
		'Value inputs with placeholders (`labels.value`, `labels.choose`, `labels.search`, `labels.amount`, or the field `placeholder`) and limited chips (Autocomplete `maxVisibleChips` 2 in the card and 1 in the panel rows; lists of texts or numbers 3 / 2 with a "+N" button and "Show less").',
		'Saved filters: `savable` (a "Saved filters" menu: save the current conditions under a name, apply, delete), `saved` (bindable `SavedFilter[]` `{ id, name, value }`, to keep them in the backend), `savedKey` (keeps them in `localStorage`), `onsavedchange(saved)`.',
		'`confirm` (draft with Cancel / Apply), `applyDelay`, `builder` (base query), `weekStart`, `mobileDrawer`, `class` parts (`container`, `bar`, `pill`, `panel`).',
		'`prependSnippet`, `actionsSnippet`.',
		'Helpers: `createFilters`, `filterCondition`, `filterGroup`, `addFilterNode`, `updateFilterNode`, `removeFilterNode`, `removeFieldConditions`, `clearFilters`, `pruneFilters`, `filterConditions`, `findFilterNode`, `isFilterGroup`, `isConditionComplete`, `countFilters`, `serializeFilters`, `parseFilters`, `filtersToParam` / `filtersFromParam` (the tree in a URL parameter), `filtersToBuilder`, `fieldOperators`, `operatorOf`, `FILTER_OPERATORS`, `OPERATOR_SETS`, `DEFAULT_OPERATORS` (the `standard` set), `DEFAULT_PERIODS`, `filterLabels`, `DEFAULT_FILTER_LABELS`, `FILTER_LABELS_IT`; `FilterBuilder.toQueryParam()`; types `FilterRelative`, `FilterTimeUnit`, `FilterOperatorSet`, `FilterOperatorOptions`, `SavedFilter`.',
		'`labels` texts for the new parts: `units`, `unit`, `addValue`, `addNestedFilter`, `choose`, `search`, `amount`, `showLess`, `time`, `compareWith`, `savedFilters`, `saveFilters`, `saveAs`, `save`, `deleteSaved`, `noSaved`, plus the new operators and periods (all in `FILTER_LABELS_IT`).',
		'`data-count` and `data-open` on the root; `--filters-*` variables for gap, pills, count, "Add filter", connective and panel.'
	]
} satisfies ComponentMigration;
