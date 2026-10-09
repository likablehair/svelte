import type {
	ComponentMigration,
	CssVarRules,
	Removal,
	Rename,
	SnippetChange
} from '../types.js';
import { forwardedDatePicker, pickerChangedVars } from './DatePicker.js';

export function textFieldVars(prefix: string, component: string): CssVarRules {
	const where = `Only on a ${component}; elsewhere the SimpleTextField rules apply.`;
	const pair = (v4: string, v5: string, note?: string): Rename[] => [
		{
			from: `--simple-textfield-${v4}`,
			to: `--${prefix}-${v5}`,
			note: note ? `${where} ${note}` : where
		},
		{
			from: `--simple-textfield-default-${v4}`,
			to: `--${prefix}-default-${v5}`,
			note: note ? `${where} ${note}` : where
		}
	];
	const gone = (v4: string, note: string, replacement?: string): Removal[] => [
		{ name: `--simple-textfield-${v4}`, note: `${where} ${note}`, replacement },
		{
			name: `--simple-textfield-default-${v4}`,
			note: `${where} ${note}`,
			replacement: replacement?.replaceAll(`--${prefix}-`, `--${prefix}-default-`)
		}
	];
	return {
		renamed: [
			...pair(
				'width',
				'width',
				'v4: the field was 280px wide inside a `fit-content` wrapper; v5 default `100%` of the container.'
			),
			...pair('max-width', 'max-width'),
			...pair('outer-gap', 'outer-gap'),
			...pair('inner-gap', 'inner-gap'),
			...pair(
				'padding',
				'padding',
				`The height is fixed by \`--${prefix}-height\` (border-box), so vertical padding no longer makes the field taller: keep only the horizontal part (\`0.65rem 1rem\` → \`0 1rem\`).`
			),
			...pair(
				'height',
				'height',
				'v4 had no default (the padding gave about 38px); v5 is 36px including the border.'
			),
			...pair('border-radius', 'border-radius'),
			...pair('box-shadow', 'box-shadow'),
			...pair('font-size', 'font-size'),
			...pair('font-weight', 'font-weight'),
			...pair('color', 'color'),
			...pair('hint-font-size', 'hint-font-size'),
			...pair('hint-color', 'hint-color'),
			...pair('background-color', 'background'),
			...pair(
				'margin-bottom',
				'gap',
				'v4 spaced the field row from the hint row; v5 spaces label, field and hint.'
			),
			{
				from: '--simple-textfield-default-radius',
				to: `--${prefix}-default-border-radius`,
				note: `${where} The v4 name did not exist (no effect): the rename applies the intended radius; drop it to keep the v4 look.`
			},
			{
				from: '--simple-text-field-width',
				to: `--${prefix}-width`,
				note: `${where} No effect in v4 (wrong name, the field stayed 280px wide): the rename applies the intended width.`
			},
			{
				from: '--textfield-width',
				to: `--${prefix}-width`,
				note: `${where} No effect in v4 (the name never existed, the field stayed 280px wide): the rename applies the intended width.`
			}
		],
		removed: [
			...gone(
				'border',
				`Split in two: \`1px solid red\` → \`--${prefix}-border-width="1px"\` + \`--${prefix}-border-color="red"\`; \`none\` → border width \`0px\`.`,
				`--${prefix}-border-width + --${prefix}-border-color`
			),
			...gone(
				'focus-box-shadow',
				'Focus is a border color plus a ring.',
				`--${prefix}-focus-ring-width, --${prefix}-focus-ring-color, --${prefix}-focus-border-color`
			),
			...gone('focus-background-color', 'Focus no longer changes the background. Drop it.'),
			...gone('margin-left', 'Put the margin on `class.container` or in the parent layout.'),
			...gone('hint-margin-left', 'The hint is aligned with the field. Drop it.'),
			...gone('transition', 'Transitions follow `--global-duration` and `--global-ease`. Drop it.'),
			...gone('range-text-align', 'The range inputs are sized to their text. Drop it.'),
			{
				name: '--simple-textfield-default-margin',
				note: `${where} The name never existed in v4 (no effect): drop it, or put the margin on \`class.container\`.`
			}
		]
	};
}

const field = textFieldVars('date-picker-text-field', 'DatePickerTextField');

const noParameters = (name: string, icon: string): SnippetChange => ({
	name,
	v4: `{ ${icon}: string | undefined; iconSize: string }`,
	v5: 'none',
	note: 'The snippet takes no parameters: remove them from `{#snippet ...}`.'
});

export default {
	from: 'DatePickerTextField',
	to: 'DatePickerTextField',
	props: {
		renamed: [
			{
				from: 'menuOpened',
				to: 'open',
				note: 'Bindable with no default: `undefined` counts as closed. The calendar closes by itself after a choice (`closeOnSelect`), on Escape, Tab and outside clicks: keep `bind:open` only where the app reads it. See `date-picker-text-field-day-click`.'
			},
			{
				from: 'type',
				to: 'range',
				note: 'A boolean now: see `props.values`. A dynamic `type={t}` → `range={t === "dateRange"}`.'
			},
			{
				from: 'pattern',
				to: 'format',
				note: 'Only the tokens `dd`, `MM` and `yyyy`, with any separator (v4 accepted luxon tokens; hours were lost anyway). Without it the format now comes from `locale` (`it` dd/MM/yyyy, `en` MM/dd/yyyy): `pattern="dd/MM/yyyy"` can be dropped when `locale="it"` is set.'
			},
			{
				from: 'mobileDialog',
				to: 'mobileDrawer',
				note: 'Same default (`true`): up to 1024px the calendar button opens the calendar in a bottom Drawer (v4: a centered Dialog). See `date-picker-text-field-mobile`.'
			}
		],
		removed: [
			{
				name: 'openingId',
				note: 'Opening a menu closes the others by itself (v4 needed a shared id such as `"advanced-filter"`). Drop it.'
			},
			{
				name: 'flipOnOverflow',
				note: 'Always on: the menu flips when there is no room. Drop it; `placement` chooses the side.'
			},
			{
				name: 'selectedYear',
				note: 'Not exposed any more: the calendar opens on the month of the date (or the current one). Read the year of `selectedDate` if needed.'
			},
			{
				name: 'selectedMonth',
				note: 'Not exposed any more: the calendar opens on the month of the date (or the current one). Read the month of `selectedDate` if needed.'
			},
			{
				name: 'visibleMonth',
				note: 'Not exposed any more: the calendar opens on the month of `selectedDate` (or the current one). Drop it; to open on a given month, set the date.'
			},
			{
				name: 'visibleYear',
				note: 'Not exposed any more: the calendar opens on the year of `selectedDate` (or the current one). Drop it.'
			},
			{
				name: 'minYearInRange',
				note: 'Use `min`, a `Date`, which limits typing, the days and the years of the calendar: `minYearInRange={1900}` → `min={new Date(1900, 0, 1)}`. Usually drop it: without `min` any year can be typed and the year view starts at 1900 (v4 default 1970).'
			},
			{
				name: 'maxYearInRange',
				note: 'Use `max`, a `Date`: `maxYearInRange={2100}` → `max={new Date(2100, 11, 31)}`. Usually drop it: without `max` any year can be typed and the year view ends at 2100 (the v4 default).'
			}
		],
		changed: [
			{
				name: 'selectedDate',
				note: 'Still bindable, a `Date` at local midnight. It is `undefined` while the text is not a valid date (as in v4), and typed dates outside `min` / `max` or disabled by `isDateDisabled` are not accepted. With `range`, the start.'
			},
			{
				name: 'selectedDateTo',
				note: 'Still bindable, the end of the range; a typed end before the start is not accepted.'
			},
			{
				name: 'disabled',
				note: 'Native `disabled` on the inputs and the calendar button: the field cannot be focused and the calendar does not open (v4 passed it to the calendar and the text field separately).'
			},
			{
				name: 'placeholder',
				note: 'Same meaning. Without it the format chip at the end of the field tells what to type.'
			},
			{
				name: 'class',
				note: 'One flat object: `activator` → `container`, `textfield.container` → `container`, `textfield.row` → `row`, `textfield.field` → `field`, `textfield.input` → `input`, `textfield.hint` → `hint`; new `label` and `picker` (the DatePicker).'
			}
		],
		defaults: [
			{
				name: 'locale',
				v4: "'it'",
				v5: "'en'",
				keepV4: 'locale="it"',
				note: 'IMPORTANT. v4 had no `locale`: it was always Italian, dd/MM/yyyy, weeks from Monday. v5 defaults to English, MM/dd/yyyy, weeks from Sunday: without `locale="it"` a typed "05/03/2026" is read as May 3. Add `locale="it"` to every usage (and every app wrapper) that omits it.'
			},
			{
				name: 'closeOnSelect',
				v4: 'false',
				v5: 'true',
				keepV4: 'closeOnSelect={false}',
				note: 'v4 had no prop and kept the menu open; apps closed it in `ondayClick`. Do not add `closeOnSelect={false}` where the app closed the menu itself: delete that handler instead.'
			},
			{
				name: 'placement',
				v4: "'bottom'",
				v5: "'bottom-start'",
				keepV4: 'placement="bottom"',
				note: 'v4 centered the 300px menu under the field; v5 aligns it to the start of the field. Visible only when the field is narrower than the calendar.'
			}
		],
		values: [
			{
				name: 'range',
				values: { dateRange: 'true', singleDate: 'false' },
				note: 'For values that came from `type`: `type="dateRange"` → `range`, `type="singleDate"` → drop the attribute.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'oninput',
				to: 'onchange',
				argument: { 'detail.datetime': 'selectedDate', 'detail.type': null, detail: '' },
				type: '{ selectedDate: Date | undefined; selectedDateTo: Date | undefined }',
				note: '`e.detail.datetime` was the date of the input that changed (`e.detail.type` `from` or `to`): without `range` it is `e.selectedDate`; with `range` read `e.selectedDate` and `e.selectedDateTo` and drop the `type` test. `onchange` fires when the value changes (typing a whole valid date or making it invalid, the calendar, the clear button), not at every key; `oninput` is now the native event of the input.'
			}
		],
		removed: [
			{
				name: 'ondayClick',
				note: 'Choosing a day now closes the calendar by itself (`closeOnSelect`): a handler that only closed the menu (`() => (menuOpened = false)`) must be deleted, together with `bind:menuOpened` if nothing else reads it. Other handlers move to `onchange({ selectedDate, selectedDateTo })` (v4 `e.detail.dateStat` → `e.selectedDate`, a `Date`). See `date-picker-text-field-day-click`.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'prependInnerSnippet',
				to: 'iconSnippet',
				note: 'It replaces only the calendar icon: the button around it keeps opening the calendar, so remove click handlers that toggled `menuOpened`. No parameters (`prependInnerIcon`, `iconSize` are gone).'
			}
		],
		removed: [
			{
				name: 'activatorSnippet',
				note: 'It replaced the field but could not connect the mask (v4 handed out `mask`, `handleInputChange`, ...). Use the props and snippets of the field (`label`, `hint`, `class`, `prependSnippet`, `appendSnippet`, `appendInnerSnippet`, `iconSnippet`) and the `--date-picker-text-field-*` variables.'
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
		removed: [...(field.removed ?? []), ...forwardedDatePicker()]
	},
	manual: [
		{
			id: 'date-picker-text-field-day-click',
			summary:
				'`ondayClick` is gone and the calendar closes by itself after a choice (with `range`, after the end). Most v4 usages had `bind:menuOpened={open}` plus `ondayClick={() => (open = false)}` only to close it.',
			action:
				'Delete `ondayClick` handlers that only close the menu, and `bind:menuOpened` / `bind:open` with its variable when nothing else reads it. Move any other code of the handler to `onchange({ selectedDate, selectedDateTo })` or to a `$derived` / `$effect` on the bound `selectedDate`.',
			when: { events: ['ondayClick'], props: ['menuOpened'] }
		},
		{
			id: 'date-picker-text-field-typing',
			summary:
				'Typing accepts digits only and adds the separators of `format`; paste (also `yyyy-MM-dd`) and autofill work, and the value updates on `input` (v4: on keydown after 30ms). A whole date that does not exist, is outside `min` / `max` or disabled, or an unfinished one when the field loses focus, shows the error state with `invalidText` (English "Enter a valid date") and makes the form invalid (`setCustomValidity`). Clicking a month or a year in the calendar no longer empties the text.',
			action:
				'Pass `invalidText` in the app language (`invalidText="Data non valida"`). Forms sent with `novalidate` or by script should still check `selectedDate`. Remove app code that validated or reformatted the typed text.'
		},
		{
			id: 'date-picker-text-field-range',
			summary:
				'With `range` the field has a start and an end input separated by an arrow, named by `startLabel` / `endLabel` (English defaults) after the `label`; a typed end before the start, or start after the end, is not accepted.',
			action:
				'Pass `startLabel` and `endLabel` in the app language (`startLabel="Data di inizio"`, `endLabel="Data di fine"`). `placeholder` and `placeholderTo` keep their meaning.',
			when: { props: ['type'] }
		},
		{
			id: 'date-picker-text-field-mobile',
			summary:
				'Up to 1024px the calendar button opens the calendar in a bottom Drawer titled `drawerTitle ?? label` (v4: a centered Dialog); focusing the field does not open it and the field stays typable with the numeric keyboard. The server renders the desktop variant.',
			action:
				'Pass `label` or `drawerTitle` so the drawer has a title, and `closeLabel` / `openLabel` in the app language. `mobileDrawer={false}` keeps the menu on every screen.'
		},
		{
			id: 'date-picker-text-field-keyboard',
			summary:
				'The inputs are comboboxes: focus or click opens the calendar (desktop), Arrow Down moves the focus into it, Escape closes it and returns to the field, Tab closes it and moves on, Enter with the calendar open closes it without submitting the form.',
			action:
				'Check forms where Enter in an open date field was expected to submit, and end-to-end tests that clicked v4 calendar cells: use `getByRole("combobox")` and `getByRole("gridcell", { name: <full date> })`.'
		},
		{
			id: 'date-picker-text-field-look',
			summary:
				'The field is 36px high with a border, the mono font, the calendar button at the start and a chip with the format at the end ("dd/mm/yyyy"), and it fills its container (v4: a 280px filled grey SimpleTextField in a `fit-content` wrapper). The calendar is a DatePicker in a Menu with the library surface (v4: 300px panel with the colored header).',
			action:
				'Set `--date-picker-text-field-width="280px"` where the v4 width mattered (fields in a row, toolbars, filters). `showFormat={false}` hides the chip when a `placeholder` already shows the format. Pass `label` instead of a separate label element when the app had one.'
		},
		{
			id: 'date-picker-text-field-picker-variables',
			summary:
				'`--date-picker-*` and `--calendar-*` variables set on the field still reach the calendar, now also in the mobile drawer; the renamed and removed ones are listed in `cssVars.removed`. Apps often passed `--date-picker-header-color` with `--calendar-selected-day-color` set to `primary-foreground` for the v4 colored header.',
			action:
				'Drop the `--date-picker-header-*` variables and a `--calendar-selected-day-color` that only gave the text color on primary (the default). The shadow and border of the popup belong to the Menu (`--menu-box-shadow`, `--menu-border-radius`, ...), not to `--date-picker-box-shadow`. Apply the Calendar rules to the other `--calendar-*` names.',
			when: { cssVars: pickerChangedVars }
		},
		{
			id: 'date-picker-text-field-ids',
			summary:
				'The inputs get generated ids (v4: fixed `from` and `to`, duplicated when a page had two fields).',
			action:
				'Replace `#from` / `#to` selectors, `getElementById("from")`, `<label for="from">` and test locators with the `id` prop (the start input; the end one is `<id>-to`), `label`, or `bind:input` / `bind:inputTo`.',
			scope: 'app'
		},
		{
			id: 'date-picker-text-field-wrappers',
			summary:
				'Several apps wrap the field (`StandardDatePickerTextfield` in addibox, contattorapido, new-vigipass, stramoniumai); some wrappers forward only a few props (new-vigipass drops `menuOpened`, `ondayClick` and the rest).',
			action:
				'Migrate the wrapper first: type its props as `ComponentProps<typeof DatePickerTextField>` and spread `{...rest}` on the field, set `locale="it"` (and Italian `invalidText`, `startLabel`, `endLabel`, `openLabel`, `closeLabel`) inside the wrapper, and rename what it forwards (`menuOpened` → `open`, `type` → `range`, `oninput` → `onchange`). Then migrate its call sites with the same rules, since they pass the v4 names.',
			scope: 'app'
		},
		{
			id: 'date-picker-text-field-markup',
			summary:
				'Markup and classes changed: `.date-picker-activator` and the SimpleTextField classes (`.textfield-container`, `.textfield`, `.row`, `.hint`) → `.aurora-date-picker-text-field` (`data-state`, `data-disabled`, `data-readonly`, `data-open`, `data-range`), `-label`, `-row`, `-control`, `-hint`; the calendar is `.aurora-date-picker` inside `.aurora-date-picker-text-field-menu` or the drawer.',
			action:
				'Rewrite app `:global(...)` selectors that target the v4 markup, or use the `class` parts and the `--date-picker-text-field-*` variables.',
			scope: 'app'
		}
	],
	added: [
		'`label`, `labelSnippet`, `hint`, `hintSnippet`, `state`, `stateIconSnippet`, `invalidText`.',
		'`min`, `max`, `isDateDisabled`, `weekStart`, `format`.',
		'`name` / `nameTo`: hidden inputs that submit `yyyy-MM-dd`; `required`, `readonly`, `id`.',
		'`clearable`, `clearLabel`, `clearSnippet`; `showFormat`, `formatLabel`, `formatSnippet`.',
		'`drawerTitle`, `closeLabel`, `openLabel`, `startLabel`, `endLabel`.',
		'`daySnippet`, `dayAppendSnippet`, `weekdayFormat`, `showOutsideDays` (forwarded to the calendar).',
		'`bind:input`, `bind:inputTo`; native attributes and events of the (start) input.',
		'`--date-picker-text-field-*` variables for the label, field, icons, format chip, separator, states and hint.'
	]
} satisfies ComponentMigration;
