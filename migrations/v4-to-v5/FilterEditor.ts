import type { ComponentMigration } from '../types.js';

export default {
	from: 'FilterEditor',
	to: 'FilterEditor',
	props: {
		renamed: [
			{
				from: 'lang',
				to: 'locale',
				note: 'Texts follow `locale`: `lang="it"` → `locale="it"`, or nothing when the root layout calls `setDefaultLocale("it")` (step `global-default-locale`); `lang="en"` → `locale="en"` only in an app with an Italian default.'
			}
		],
		removed: [
			{
				name: 'filter',
				replacement: 'field + condition',
				note: 'v4 took the whole `Filter` (definition and state). v5 takes the definition as `field` (a `FilterField`, see the Filters rule `filters-definitions`) and the state as `bind:condition` (a `FilterCondition`: `filterCondition(field.name, operator, value)`).'
			},
			{
				name: 'tmpFilter',
				replacement: 'condition',
				note: 'The working copy is `condition` itself (bindable): without `confirm` every change updates it and calls `onchange`; with `confirm` the edited condition reaches `onapply`.'
			},
			{ name: 'betweenFromLabel', replacement: 'labels.from', note: 'Label of the start of a range.' },
			{ name: 'betweenToLabel', replacement: 'labels.to', note: 'Label of the end of a range.' },
			{
				name: 'labelsMapper',
				replacement: 'labels.operators',
				note: 'Keyed by v5 operator name, one string each: see the `labelsMapper` removal of Filters.'
			},
			{
				name: 'forceApplyValid',
				note: 'Apply (and Enter) work only when the condition is complete (`isConditionComplete`). For custom inputs the rule is `isComplete: (condition) => ...` on the field; without it a custom value is complete when it is not `undefined`, `null`, `""`, an empty array or an empty object. Drop the prop.'
			},
			{
				name: 'editFilterMode',
				note: 'v4 only changed the margin (5% in one-edit). The card has its own padding (`--filter-editor-padding`).',
				drop: true
			},
			{
				name: 'mobile',
				note: 'v4 opened the operator dropdown in a drawer. Operators are side by side (up to four) or a native select, and the inputs open inline. Drop it.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { 'detail.tmpFilter': '', 'detail.filter': null, detail: null },
				type: 'FilterCondition',
				note: 'Called with the edited condition at every change of operator or value, only without `confirm`; v4 passed `{ detail: { filter, tmpFilter } }` (the original and the copy). With `confirm` use `onapply`.'
			}
		],
		removed: [
			{
				name: 'onclick',
				note: 'v4 put it on the operator selector (to stop clicks from closing an outer menu). Drop it.'
			},
			{
				name: 'onkeypress',
				note: 'v4 put it on the operator selector. Drop it.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'customSnippet',
				to: 'inputSnippet',
				note: 'It renders the value input of `custom` fields and of operators with `input: "custom"`; see `snippets.parameters`.'
			}
		],
		removed: [
			{
				name: 'filterActionsSnippet',
				replacement: 'confirm + onapply / oncancel, removable + onremove',
				note: 'The card draws its own actions: with `confirm`, Cancel and Apply (disabled until the condition is complete; Enter applies too); with `removable`, Remove; with `onclose`, a close button in the header. Move the code of the v4 buttons to those callbacks.'
			}
		],
		parameters: [
			{
				name: 'inputSnippet',
				v4: '{ filter: Filter | undefined }',
				v5: '{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }',
				note: 'v4 snippets changed `filter.value` in place; call `setValue(next)` instead, and put the validity rule in `isComplete` on the field (or pass `undefined` while the input is empty or invalid).'
			}
		]
	},
	cssVars: {
		removed: [
			{
				name: '--filters-button-cancel-color',
				note: 'Listed in the v4 docs of FilterEditor but never read by it. Drop it.'
			},
			{
				name: '--filters-button-cancel-background-color',
				note: 'Listed in the v4 docs of FilterEditor but never read by it. Drop it.'
			},
			{
				name: '--filters-wrapper-width',
				note: 'Listed in the v4 docs of FilterEditor but never read by it. The card width is `--filter-editor-width` (320px).',
				replacement: '--filter-editor-width'
			}
		]
	},
	manual: [
		{
			id: 'filter-editor-standalone',
			kind: 'edit',
			summary:
				'Used alone (outside Filters), the editor needs a field definition and a condition, and reports through callbacks instead of mutating `filter`.',
			action:
				'Convert the v4 `filter` object into a `FilterField` (Filters rule `filters-definitions` and `filters-modes`) and its state into `let condition = $state(filterCondition(field.name, field.defaultOperator ?? "<operator>", value))`, then `<FilterEditor {field} bind:condition />`. Where the app built a query from the edited filter, use `filtersToBuilder(createFilters([condition]), [field])`. Replace `filterActionsSnippet` buttons with `confirm` + `onapply` / `oncancel`. A v4 `advanced` filter (the user picked the mode) offers the `standard` operator set of its type: pass `operatorSet="basic"` or `"all"`, or `typeOperators`, as on Filters (`filters-operator-sets`); a fixed mode is `operators: ["<operator>"]` on the field.',
			when: { props: ['filter', 'tmpFilter'] }
		},
		{
			id: 'filter-editor-look',
			kind: 'review',
			summary:
				'New card: title with the field icon, operators as a segmented control (a select above four), then the input of the value; v4 had a Dropdown for the mode and inputs side by side, with a 5% margin in one-edit.',
			action:
				'Usually accept it. The card has no background or border of its own (Filters puts it on a Menu): when it is used alone, wrap it in the app surface. Size it with `--filter-editor-width`. Inputs have placeholders (`labels.value`, `labels.choose`, `labels.search`, `labels.amount`, or the field `placeholder`; v4 used the filter label in one-edit). Options picked in the Autocomplete show two chips and a "+N" counter, as the v4 `maxVisibleChips={2}`; lists of texts or numbers show three chips and a "+N" button that expands them until "Show less". `view: "toggle"` becomes an Autocomplete when its labels do not fit the card.'
		}
	],
	added: [
		'`confirm` (Cancel and Apply), `removable` (Remove), `autofocus`, `class`.',
		'`operatorSet` (`basic`, `standard` by default, `all`) and `typeOperators` for fields without `operators` (the v4 `advanced` choice of mode, see the Filters rule `filters-operator-sets`); an operator the field accepts but does not offer is shown as chosen.',
		'Callbacks `onapply`, `oncancel`, `onremove`, `onclose`.',
		'Inputs for every operator: number with unit, ranges, date and date range, date and time (`withTime`), periods, amount + unit for relative dates (`inLast`, `inNext`, `olderThan`, `laterThan`), lists of texts or numbers (`anyOf`, `noneOf`: chips, Enter or comma adds, Backspace removes), a column of `compareWith`, text with suggestions (`match`), autocomplete, remote search, countries, toggle chips.',
		'`data-type` on the root; `--filter-editor-*` variables for width, gap, padding, color, title, icon and operators.'
	]
} satisfies ComponentMigration;
