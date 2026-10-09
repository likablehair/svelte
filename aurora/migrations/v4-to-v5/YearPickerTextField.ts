import type { ComponentMigration, SnippetChange } from '../types.js';
import { textFieldVars } from './DatePickerTextField.js';

const field = textFieldVars('year-picker-text-field', 'YearPickerTextField');

const noParameters = (name: string, icon: string): SnippetChange => ({
	name,
	v4: `{ ${icon}: string | undefined; iconSize: string }`,
	v5: 'none',
	note: 'The snippet takes no parameters: remove them from `{#snippet ...}`.'
});

export default {
	from: 'YearPickerTextField',
	to: 'YearPickerTextField',
	props: {
		renamed: [
			{
				from: 'menuOpened',
				to: 'open',
				note: 'Bindable with no default (v4: `false`); `undefined` counts as closed. The menu closes by itself after a choice, on Escape, Tab and outside clicks.'
			},
			{
				from: 'mobileDialog',
				to: 'mobileDrawer',
				note: 'Same default (`true`): up to 1024px the calendar button opens the years in a bottom Drawer (v4: a centered Dialog, which ignored the year limits).'
			},
			{
				from: 'minYearInRange',
				to: 'min',
				note: 'Same number and default (1900). It now limits typing and the grid on every screen.'
			},
			{
				from: 'maxYearInRange',
				to: 'max',
				note: 'Same number and default (2100).'
			}
		],
		removed: [
			{
				name: 'openingId',
				note: 'v4 gave every YearPickerTextField the same fixed id. Opening a menu closes the others by itself: drop it.'
			}
		],
		changed: [
			{
				name: 'selectedYear',
				note: 'Still bindable. It is `undefined` while the text is not a valid year, and the text empties when the app sets it to `undefined` (v4 kept the old text).'
			},
			{
				name: 'disabled',
				note: 'Native `disabled` on the input and the calendar button: the field cannot be focused and the menu does not open.'
			},
			{
				name: 'class',
				note: 'One flat object: `activator` → `container`, `textfield.container` → `container`, `textfield.row` → `row`, `textfield.field` → `field`, `textfield.input` → `input`, `textfield.hint` → `hint`; new `label` and `picker` (the YearSelector).'
			}
		],
		defaults: [
			{
				name: 'closeOnSelect',
				v4: 'false',
				v5: 'true',
				keepV4: 'closeOnSelect={false}',
				note: 'v4 had no prop and kept the menu open after a click.'
			},
			{
				name: 'placement',
				v4: "'bottom'",
				v5: "'bottom-start'",
				keepV4: 'placement="bottom"',
				note: 'v4 centered the 300px menu under the field; v5 aligns it to the start of the field.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onyearClick',
				to: 'onchange',
				argument: { 'detail.year': 'year', detail: '' },
				type: '{ year: number | undefined }',
				note: '`e.detail.year` → `e.year`. `onchange` fires on every change of the year (grid, typing a whole valid year or making it invalid, clear button); a click on the selected year keeps it (v4 cleared it), closes the menu and does not call `onchange`. If the usage also has `oninput`, merge the two handlers into one.'
			},
			{
				name: 'oninput',
				to: 'onchange',
				argument: { 'detail.year': 'year', detail: '' },
				type: '{ year: number | undefined }',
				note: '`e.detail.year` → `e.year`. It fires when the year changes, not at every key; `oninput` is now the native event of the input.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'prependInnerSnippet',
				to: 'iconSnippet',
				note: 'It replaces only the calendar icon: the button around it keeps opening the years, so remove click handlers that toggled `menuOpened`. No parameters (`prependInnerIcon`, `iconSize` are gone).'
			}
		],
		removed: [
			{
				name: 'activatorSnippet',
				note: 'It replaced the field but could not connect the mask. Use the props and snippets of the field (`label`, `hint`, `class`, `prependSnippet`, `appendSnippet`, `appendInnerSnippet`, `iconSnippet`, `chevronSnippet`) and the `--year-picker-text-field-*` variables.'
			}
		],
		parameters: [
			noParameters('prependSnippet', 'prependIcon'),
			noParameters('appendSnippet', 'appendIcon'),
			noParameters('appendInnerSnippet', 'appendInnerIcon')
		]
	},
	cssVars: {
		renamed: field.renamed,
		removed: [
			...(field.removed ?? []),
			{
				name: '--button-max-width',
				note: 'Listed in the v4 docs of YearPickerTextField but never read by it. Drop it.'
			}
		]
	},
	manual: [
		{
			id: 'year-picker-text-field-typing',
			summary:
				'Typing accepts four digits; a year outside `min` / `max`, or an unfinished one when the field loses focus, shows the error state with `invalidText` (English "Enter a valid year") and makes the form invalid. The value updates on `input` (v4: on keydown after 30ms).',
			action: 'Pass `invalidText` in the app language (`invalidText="Anno non valido"`).'
		},
		{
			id: 'year-picker-text-field-look',
			summary:
				'The field is 36px high with a border, the calendar button at the start and a chevron at the end, and fills its container (v4: a 280px filled grey SimpleTextField). The years are a 4-column YearSelector in a Menu (desktop) or a bottom Drawer titled `drawerTitle ?? label` (mobile).',
			action:
				'Set `--year-picker-text-field-width` where the v4 width mattered; pass `label` or `drawerTitle`, and `openLabel` / `closeLabel` in the app language. The menu size is `--year-picker-text-field-menu-width` and `-menu-padding`.'
		},
		{
			id: 'year-picker-text-field-markup',
			summary:
				'Markup and classes changed: `.year-picker-activator` and the SimpleTextField classes → `.aurora-year-picker-text-field` (`data-state`, `data-disabled`, `data-readonly`, `data-open`), `-label`, `-row`, `-control`, `-hint`; the input is a combobox with a generated id.',
			action:
				'Rewrite app `:global(...)` selectors that target the v4 markup, or use the `class` parts and the `--year-picker-text-field-*` variables.',
			scope: 'app'
		}
	],
	added: [
		'`label`, `labelSnippet`, `hint`, `hintSnippet`, `state`, `stateIconSnippet`, `invalidText`.',
		'`name` (hidden input with the year), `required`, `readonly`, `id`.',
		'`clearable`, `clearLabel`, `clearSnippet`, `chevronSnippet`.',
		'`drawerTitle`, `closeLabel`, `openLabel`.',
		'`bind:input`; native attributes and events of the input; Arrow Down moves the focus into the years.',
		'`--year-picker-text-field-*` variables for the label, field, icons, states, hint and menu.'
	]
} satisfies ComponentMigration;
