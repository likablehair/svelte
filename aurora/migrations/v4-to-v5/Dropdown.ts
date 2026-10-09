import type { ComponentMigration } from '../types.js';

export default {
	from: 'Dropdown',
	to: 'Dropdown',
	props: {
		renamed: [
			{
				from: 'menuOpened',
				to: 'open',
				note: 'Bindable with no default: `undefined` counts as closed.'
			},
			{
				from: 'menuAnchor',
				to: 'placement',
				note: 'The values change too: see `props.values`.'
			}
		],
		removed: [
			{
				name: 'searchText',
				note: 'It had no effect in v4: the Dropdown has no search field. Typing a letter on the button jumps to the first option that starts with it. Drop the prop.'
			},
			{
				name: 'maxVisibleChips',
				note: 'It had no effect in v4: the button shows a text, not chips. `selectionText` decides the text. Drop the prop.'
			},
			{
				name: 'openingId',
				note: 'Opening a list closes the others by itself. Drop the prop.'
			},
			{
				name: 'menuWidth',
				note: 'The list is as wide as the button and at least `--dropdown-menu-min-width` (220px). To change the minimum set that variable; `--menu-max-width` caps it.',
				replacement: '--dropdown-menu-min-width'
			},
			{
				name: 'height',
				note: 'The trigger is a Button: use `size` (sm 28px, md 34px, lg 40px) or `--button-height` on the Dropdown.'
			}
		],
		changed: [
			{
				name: 'lang',
				native: true,
				note: 'No longer a prop: it still type-checks but becomes the native `lang` attribute of the button, which would mark the English texts as Italian. Delete it. Texts are props, in English by default: `placeholder` ("Select"), `selectionText(values)` ("N selected"), `clearLabel`, `closeLabel`, `noResultsText`; for `lang="it"` pass `placeholder="Seleziona"` and the other texts in Italian.'
			}
		],
		toCssVar: [
			{
				name: 'width',
				cssVar: '--dropdown-width',
				note: 'Default `fit-content`; `--dropdown-max-width` (default `100%`) caps it and long texts are cut with an ellipsis.'
			},
			{ name: 'minWidth', cssVar: '--dropdown-min-width' }
		],
		defaults: [
			{
				name: 'placement',
				v4: "'bottom-center'",
				v5: "'bottom-start'",
				keepV4: 'placement="bottom"',
				note: 'The list is at least 220px wide, often wider than the button: it is now aligned to the left edge of the button instead of centered.'
			},
			{
				name: 'values',
				v4: '[]',
				v5: 'undefined',
				note: 'With `bind:values` on an uninitialized variable, the variable stays `undefined` until something is selected: initialize it to `[]` where the app reads `values.length` or `values[0]`.'
			}
		],
		values: [
			{
				name: 'placement',
				values: {
					bottom: 'bottom-start',
					'bottom-center': 'bottom',
					up: 'top-start',
					'up-center': 'top',
					left: 'left-start',
					'left-center': 'left',
					right: 'right-start',
					'right-center': 'right'
				},
				note: 'For values that came from `menuAnchor`. `"bottom"`, `"left"` and `"right"` still type-check but now mean centered.'
			}
		],
		types: [
			{
				name: 'items',
				v4: 'Item<any>[]',
				v5: 'Item<Data>[]',
				note: '`Item` is exported from the package root, its `Data` defaults to `unknown` and `Item.icon` is an SVG path.'
			}
		],
		icons: ['icon']
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: '' },
				type: '{ select?: Item<Data>; unselect?: Item<Data>; selection: Item<Data>[] }',
				note: 'With single selection, picking another option now reports the replaced one in `unselect`. The clear button reports the first removed value in `unselect` and `selection: []`, as in v4.'
			}
		]
	},
	snippets: {
		parameters: [
			{
				name: 'labelSnippet',
				v4: '{ values, items, searchText, generatedLabel, placeholder, clearable, handleCloseClick }',
				v5: '{ label }',
				note: 'Changed meaning: see the manual step `dropdown-label-snippet`.'
			}
		]
	},
	cssVars: {
		removed: [
			{
				name: '--dropdown-button-padding',
				note: 'The trigger is a Button: set the Button variable on the Dropdown.',
				replacement: '--button-padding'
			},
			{
				name: '--dropdown-button-color',
				note: 'The trigger is a Button: set the Button variable on the Dropdown (the clear button follows it).',
				replacement: '--button-color'
			},
			{
				name: '--dropdown-button-border-radius',
				note: 'The trigger is a Button: set the Button variable on the Dropdown.',
				replacement: '--button-border-radius'
			},
			{
				name: '--dropdown-button-height',
				note: 'The trigger is a Button: use `size`, or set the Button variable on the Dropdown.',
				replacement: '--button-height'
			},
			{
				name: '--dropdown-button-background-color',
				note: 'The trigger is a Button: set the Button variable on the Dropdown.',
				replacement: '--button-background'
			},
			{
				name: '--dropdown-button-border',
				note: 'Split in two Button variables, set on the Dropdown.',
				replacement: '--button-border-width + --button-border-color'
			},
			{
				name: '--dropdown-button-hover-color',
				note: 'v4 used it for both the hover background and the hover text color: set the Button variables on the Dropdown.',
				replacement: '--button-hover-background + --button-hover-color'
			},
			{
				name: '--dropdown-button-focus-color',
				note: 'Focus is a ring now, not a color change.',
				replacement: '--button-focus-ring-color'
			},
			{
				name: '--dropdown-button-focus-box-shadow',
				note: 'Focus is an outline ring now.',
				replacement: '--button-focus-ring-width, --button-focus-ring-color, --button-focus-ring-offset'
			},
			{
				name: '--dropdown-button-active-color',
				note: 'The pressed state is a transform now. Drop the override.',
				replacement: '--button-active-transform'
			},
			{
				name: '--dropdown-button-active-box-shadow',
				note: 'The pressed state is a transform now. Drop the override.',
				replacement: '--button-active-transform'
			},
			{
				name: '--dropdown-button-box-sizing',
				note: 'The Button is always `border-box`. Drop the override.'
			}
		]
	},
	manual: [
		{
			id: 'dropdown-label-snippet',
			summary:
				'`labelSnippet` changed meaning: v4 replaced the whole button content, v5 `labelSnippet({ label })` renders only the prefix label before the selection.',
			action:
				'Move the v4 snippet to `valueSnippet({ values, text, placeholder })` for the selection text (`generatedLabel` → `text`), `iconSnippet({ icon })` for the icon, `chevronSnippet({ open })` for the arrow and `clearSnippet` for the clear icon. `handleCloseClick` is gone: the clear button is built in with `clearable`, or clear with `values = []`. `items`, `searchText` and `clearable` are no longer parameters: read them from the app state.',
			when: { snippets: ['labelSnippet'] }
		},
		{
			id: 'dropdown-selection-text',
			summary:
				'With more than one value the button reads "N selected" (v4: always the Italian "N Selezionati", also with `lang="en"`).',
			action:
				'For Italian pass `selectionText={(values) => values.length === 1 ? String(values[0].label) : `${values.length} selezionati`}`.',
			when: { props: ['multiple'] }
		},
		{
			id: 'dropdown-trigger',
			summary:
				'The trigger is a `Button` (`variant="secondary"`, `size="md"`, 34px high) with the combobox role; v4 used a grey translucent button 38.78px high. Clicking it opens and closes the list, Enter, Space and the arrows open and pick, a letter jumps to the first option that starts with it, and Backspace never removes values.',
			action:
				'Check toolbars and filter rows: use `variant`, `size` and `--button-*` on the Dropdown for the v4 look. Remove app workarounds that closed the list on a second click. End-to-end tests find it with `getByRole("combobox", { name: label })`.'
		},
		{
			id: 'dropdown-clear',
			summary:
				'The clear X is a separate `<button>` ("Clear selection", `clearLabel`) next to the trigger, shown in place of the arrow while something is selected; clicking it does not open the list and gives the focus back to the trigger.',
			action:
				'Rewrite app CSS that targeted the X inside the v4 button; restyle it with `--dropdown-clear-*` or replace the icon with `clearSnippet`.'
		},
		{
			id: 'dropdown-disabled',
			summary:
				'`disabled` disables the native button and hides the clear button; in v4 the list still opened and the X still cleared.',
			action: 'Check flows that relied on clearing or opening a disabled Dropdown.',
			when: { props: ['disabled'] }
		},
		{
			id: 'dropdown-mobile-drawer',
			summary:
				'With `mobileDrawer`, on screens up to 1024px the list opens in a bottom drawer without a search field, titled with `label`, with the list focused. The server renders the desktop variant.',
			action: 'Pass `label` so the drawer has a title.',
			when: { props: ['mobileDrawer'] }
		},
		{
			id: 'dropdown-item-label-snippet',
			summary:
				'`itemLabelSnippet` replaces only the label of an option: the `item.icon` and the check mark of selected options stay (v4 dropped the icon).',
			action:
				'If the snippet drew the icon itself, remove it from the snippet; `itemSnippet` replaces the whole content of the option.',
			when: { snippets: ['itemLabelSnippet'] }
		},
		{
			id: 'dropdown-item-icon',
			summary: '`Item.icon` of the options is an SVG path (v4: an MDI class name).',
			action:
				'Apply the global icon transform to every `icon` in the `items` and `values` data (`"mdi-sort"` → `mdiSort` from `@mdi/js`).',
			when: { props: ['items', 'values'] }
		},
		{
			id: 'dropdown-strict-equality',
			summary:
				'Values are compared with `===` (v4 mixed `==` and `===`) and duplicate `value`s in `items` or `values` throw.',
			action:
				'Check that `values` use the same type as `items` (`1` and `"1"` are different options now) and that `items` has no duplicate `value`.',
			when: { props: ['values', 'items'] }
		}
	],
	added: [
		'`label`: a prefix inside the button ("Sort by: Newest") and the accessible name.',
		'`name` (a hidden input per selected value), `closeOnSelect`.',
		'`variant` (default `secondary`) and `size` (default `md`) of the Button.',
		'`selectionText(values)`, `clearLabel`, `closeLabel`, `noResultsText`.',
		'`bind:buttonElement`, native `<button>` attributes and events, `class` object (`container`, `button`, `label`, `value`, `clear`, `menu`, `option`).',
		'Snippets `iconSnippet`, `valueSnippet`, `chevronSnippet`, `clearSnippet`, `itemSnippet`, `emptySnippet`; callback `onclose`.',
		'`--dropdown-*` variables (width, label, placeholder, chevron, clear button, menu minimum width); `--button-*` variables now reach the trigger.',
		'`data-open`, `data-disabled` on the root and `data-empty` on the trigger.'
	]
} satisfies ComponentMigration;
