import type { ComponentMigration, EventChange, Removal } from '../types.js';

const unchanged = (name: string, type: string, note: string): EventChange => ({
	name,
	argument: {},
	type,
	note
});

const rule = {
	from: 'Autocomplete',
	to: 'Autocomplete',
	props: {
		renamed: [
			{
				from: 'menuOpened',
				to: 'open',
				note: 'Bindable with no default: `undefined` counts as closed. The list closes itself (outside click, Escape, Tab, a single pick), so keep `bind:open` where the app reads it.'
			},
			{ from: 'emptySearchTextOnMenuClose', to: 'clearSearchOnClose' },
			{
				from: 'menuAnchor',
				to: 'placement',
				note: 'The values change too: see `props.values`.'
			}
		],
		removed: [
			{
				name: 'openingId',
				note: 'It was ignored in v4 (a fixed id shared by every Autocomplete). Opening a list closes the others by itself: drop the prop.'
			},
			{
				name: 'menuStayInViewport',
				note: 'Always on: the list shifts to stay in the viewport. Drop the prop.'
			},
			{
				name: 'menuFlipOnOverflow',
				note: 'Always on: the list flips to the other side when there is no room. Drop the prop.'
			},
			{
				name: 'adaptInputWidth',
				note: 'The input always fills the free space of the line, at least `--autocomplete-input-min-width` (60px). Drop the prop.'
			},
			{
				name: 'minWidth',
				note: 'v4 applied `min-width: 200px` by default. Use `class.container` with app CSS (`min-width`), or `--autocomplete-width` for a fixed width.'
			},
			{
				name: 'height',
				note: 'The field grows with its chips; its minimum height is `--autocomplete-min-height` (36px from `--global-input-height`). `height` still type-checks (it is an `<input>` attribute) but does nothing: remove it.',
				replacement: '--autocomplete-min-height'
			},
			{
				name: 'menuWidth',
				note: 'The list is always as wide as the field. To make it wider or narrower set `--menu-min-width` / `--menu-max-width` on the Autocomplete (`--menu-width` has no effect because the width is written inline).',
				replacement: '--menu-min-width'
			},
			{
				name: 'menuBoxShadow',
				note: 'Set the Menu variable on the Autocomplete. The default v4 shadow used a v4 color token: drop it unless the app really wants a custom shadow.',
				replacement: '--menu-box-shadow'
			},
			{
				name: 'menuBorderRadius',
				note: 'Set the Menu variable on the Autocomplete.',
				replacement: '--menu-border-radius'
			}
		],
		toCssVar: [
			{
				name: 'width',
				cssVar: '--autocomplete-width',
				note: 'The default is now `100%` of the container (v4: `auto`, at least 200px). `width` still type-checks (it is an `<input>` attribute) but no longer sizes the component.'
			},
			{ name: 'maxWidth', cssVar: '--autocomplete-max-width' },
			{
				name: 'menuMaxHeight',
				cssVar: '--autocomplete-menu-max-height',
				note: 'Same default, `300px`.'
			}
		],
		defaults: [
			{
				name: 'placement',
				v4: "'bottom-center'",
				v5: "'bottom-start'",
				keepV4: 'placement="bottom"',
				note: 'Visible only when the list is wider than the field (`--menu-min-width`).'
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
				name: 'searchFunction',
				v4: '(item: Item, searchText: string | undefined) => boolean',
				v5: '(item: Item<Data>, searchText: string) => boolean',
				note: 'Called only while `searchText` is not empty. The default search now ignores accents and matches `label ?? value`: a custom function that only did that can be dropped.'
			},
			{
				name: 'items',
				v4: 'Item<any>[]',
				v5: 'Item<Data>[]',
				note: '`Item` is exported from the package root (`import { type Item } from "@likable-hair/svelte"`), its `Data` defaults to `unknown` and `icon` is an SVG path.'
			},
			{
				name: 'values',
				v4: 'Item<any>[]',
				v5: 'Item<Data>[]',
				note: 'Same `Item` type change as `items`.'
			},
			{
				name: 'class',
				v4: '{ activator?: string; menu?: string; simpleTextfield?: ...; hint?: string }',
				v5: '{ container?, label?, field?, input?, chip?, menu?, option?, hint?: string }',
				note: '`activator` → `container` (whole component) or `field` (the bordered box). `menu` is now on the Menu element, not on the `<ul>` inside it. `simpleTextfield` had no effect: drop it. `hint` is on the hint element itself.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: '' },
				type: '{ select?: Item<Data>; unselect?: Item<Data>; selection: Item<Data>[] }',
				note: 'With single selection, picking another option now reports the replaced one in `unselect` (v4: `undefined`).'
			},
			unchanged('onfocus', 'FocusEvent', 'Native event of the input; v4 passed no argument.'),
			unchanged('onblur', 'FocusEvent', 'Native event of the input; v4 passed no argument.'),
			unchanged(
				'onkeydown',
				'KeyboardEvent',
				'Native event of the input, as in v4. Calling `preventDefault()` in it now skips the built-in key handling (arrows, Enter, Backspace, Escape).'
			),
			unchanged(
				'onclose',
				'() => void',
				'Fires on every close of the list; v4 fired it only when the mobile drawer closed.'
			)
		]
	},
	snippets: {
		removed: [
			{
				name: 'menuSnippet',
				note: 'It replaced the whole list without parameters. Use `itemSnippet` / `itemLabelSnippet` / `itemIconSnippet` / `itemAppendSnippet` for the options, `loadingSnippet` and `emptySnippet` for the status rows, `--menu-*` and `--autocomplete-option-*` for the look.'
			}
		],
		parameters: [
			{
				name: 'itemSnippet',
				v4: '{ item, index, selected }',
				v5: '{ item, index, selected, highlighted }',
				note: 'It now replaces the content of the option, not the option: see the manual step.'
			},
			{
				name: 'selectionContainerSnippet',
				v4: '{ values, searchText, disabled, openMenu, handleKeyDown, unselect, select }',
				v5: '{ values, searchText, disabled, openMenu, handleKeyDown, unselect, select, attributes }',
				note: 'Spread `attributes` (combobox role and ARIA state) on the focusable element of the custom trigger and call `handleKeyDown` from its `onkeydown`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--autocomplete-background-color', to: '--autocomplete-background' },
			{ from: '--autocomplete-default-background-color', to: '--autocomplete-default-background' },
			{
				from: '--autocomplete-focus-border',
				to: '--autocomplete-focus-border-color',
				note: 'Takes a color now, not a border shorthand: keep only the color of the value.'
			},
			{
				from: '--autocomplete-default-focus-border',
				to: '--autocomplete-default-focus-border-color',
				note: 'Takes a color now, not a border shorthand: keep only the color of the value.'
			},
			{
				from: '--autocomplete-selected-item-background-color',
				to: '--autocomplete-option-selected-background'
			},
			{
				from: '--autocomplete-default-selected-item-background-color',
				to: '--autocomplete-default-option-selected-background'
			},
			{ from: '--autocomplete-selected-item-color', to: '--autocomplete-option-selected-color' },
			{
				from: '--autocomplete-default-selected-item-color',
				to: '--autocomplete-default-option-selected-color'
			},
			{
				from: '--autocomplete-focused-item-background-color',
				to: '--autocomplete-option-highlighted-background'
			},
			{
				from: '--autocomplete-default-focused-item-background-color',
				to: '--autocomplete-default-option-highlighted-background'
			},
			{ from: '--autocomplete-focused-item-color', to: '--autocomplete-option-highlighted-color' },
			{
				from: '--autocomplete-default-focused-item-color',
				to: '--autocomplete-default-option-highlighted-color'
			},
			{
				from: '--autocomplete-hover-item-background-color',
				to: '--autocomplete-option-highlighted-background',
				note: 'Hover and keyboard highlight are one state now: if the focused variable is set too, keep one value.'
			},
			{
				from: '--autocomplete-default-hover-item-background-color',
				to: '--autocomplete-default-option-highlighted-background',
				note: 'Hover and keyboard highlight are one state now: if the focused variable is set too, keep one value.'
			},
			{
				from: '--autocomplete-hover-item-color',
				to: '--autocomplete-option-highlighted-color',
				note: 'Hover and keyboard highlight are one state now: if the focused variable is set too, keep one value.'
			},
			{
				from: '--autocomplete-default-hover-item-color',
				to: '--autocomplete-default-option-highlighted-color',
				note: 'Hover and keyboard highlight are one state now: if the focused variable is set too, keep one value.'
			},
			{
				from: '--autocomplete-input-margin-left',
				to: '--autocomplete-input-padding',
				note: 'The value changes: v4 took a left margin (`4px`), v5 a padding shorthand (default `0 6px`). Write `0 <value>`.'
			},
			{
				from: '--autocomplete-default-input-margin-left',
				to: '--autocomplete-default-input-padding',
				note: 'The value changes: v4 took a left margin (`4px`), v5 a padding shorthand (default `0 6px`). Write `0 <value>`.'
			},
			{
				from: '--autocomplete-input-width',
				to: '--autocomplete-input-min-width',
				note: 'It is a minimum now: the input grows to fill the line.'
			},
			{
				from: '--autocomplete-default-input-width',
				to: '--autocomplete-default-input-min-width',
				note: 'It is a minimum now: the input grows to fill the line.'
			}
		],
		removed: [
			{
				name: '--autocomplete-border',
				note: 'Split in two variables.',
				replacement: '--autocomplete-border-width + --autocomplete-border-color'
			},
			{
				name: '--autocomplete-default-border',
				note: 'Split in two variables (v4 read it but never defined it).',
				replacement: '--autocomplete-default-border-width + --autocomplete-default-border-color'
			},
			{
				name: '--autocomplete-focus-box-shadow',
				note: 'Focus is a ring of fixed shape now.',
				replacement: '--autocomplete-focus-ring-width + --autocomplete-focus-ring-color'
			},
			{
				name: '--autocomplete-default-focus-box-shadow',
				note: 'Focus is a ring of fixed shape now.',
				replacement:
					'--autocomplete-default-focus-ring-width + --autocomplete-default-focus-ring-color'
			},
			...['--autocomplete-options-max-width', '--autocomplete-default-options-max-width'].map(
				(name) => ({
					name,
					note: 'Options are as wide as the list and their labels wrap. Drop the override; to size the list use `--menu-min-width` / `--menu-max-width`.'
				})
			),
			...['--autocomplete-hint-margin-left', '--autocomplete-default-hint-margin-left'].map(
				(name) => ({
					name,
					note: 'The hint is aligned with the field. Drop the override, or use `class.hint` with app CSS.'
				})
			)
		]
	},
	manual: [
		{
			id: 'autocomplete-item-icon',
			summary:
				'`Item.icon` is an SVG path (v4: an MDI class name) and `Item` is exported from the package root.',
			action:
				'Apply the global icon transform to every `icon` in the `items` and `values` data (`"mdi-account"` → `mdiAccount` from `@mdi/js`). Import `type Item` from `@likable-hair/svelte` instead of the component module; with TypeScript, `Item` without a type argument now has `data: unknown`, so pass the type (`Item<{ price: number }>`) where the app reads `item.data`.',
			when: { props: ['items', 'values'] }
		},
		{
			id: 'autocomplete-strict-equality',
			summary:
				'Values are compared with `===` (v4 mixed `==` and `===`) and duplicate `value`s in `items` or `values` throw.',
			action:
				'Check that `values` use the same type as `items` (`{ value: 1 }` and `{ value: "1" }` are different options now: ids read from the URL or a form are strings) and that `items` has no duplicate `value`.',
			when: { props: ['values', 'items'] }
		},
		{
			id: 'autocomplete-keyboard',
			summary:
				'It is an ARIA combobox: the focus stays in the input and options are not tab stops (neither is the v4 wrapper). While typing, the first match is highlighted and Enter picks it without submitting the form; Backspace on an empty field removes the last value; Escape closes the list and keeps the focus; the arrows do not move the caret.',
			action:
				'Check forms where Enter in the field was expected to submit while an option is highlighted, and end-to-end tests that tabbed into the options or clicked the wrapper; use `getByRole("combobox")` and `getByRole("option")`.'
		},
		{
			id: 'autocomplete-close-on-select',
			summary: '`closeOnSelect={true}` now also closes the list with `multiple` (v4 ignored it there).',
			action: 'Remove `closeOnSelect` from `multiple` usages that must keep the list open.',
			when: { props: ['closeOnSelect'] }
		},
		{
			id: 'autocomplete-search-text',
			summary:
				'`searchText` keeps its initial value (v4 erased it after mount) and becomes `""` (not `undefined`) when the list closes.',
			action: 'Replace checks like `searchText === undefined` with `!searchText`.',
			when: { props: ['searchText'] }
		},
		{
			id: 'autocomplete-onchange-unselect',
			summary:
				'With single selection, picking another option calls `onchange` with the replaced value in `unselect` as well as the new one in `select`.',
			action:
				'Check handlers that treat `unselect` as "the user cleared the field": test `select === undefined` (or `selection.length === 0`) instead.',
			when: { events: ['onchange'] }
		},
		{
			id: 'autocomplete-disabled',
			summary:
				'`disabled` disables the native input: it gets no focus, the list does not open and chips have no remove button. With `mandatory` the last chip has no remove button either.',
			action:
				'Check flows that relied on focusing or opening a disabled Autocomplete (v4 only faded it).',
			when: { props: ['disabled', 'mandatory'] }
		},
		{
			id: 'autocomplete-mobile-drawer',
			summary:
				'With `mobileDrawer`, on screens up to 1024px the list opens in a bottom drawer that has its own search field and a title (`drawerTitle ?? label`); the field on the page becomes read-only. v4 showed only the list. The server renders the desktop variant.',
			action:
				'Pass `label` or `drawerTitle` so the drawer has a title; pass `drawerSearch={false}` for short lists that need no search.',
			when: { props: ['mobileDrawer'] }
		},
		{
			id: 'autocomplete-item-snippet',
			summary:
				'`itemSnippet` replaces the content of an option, not the option: the row keeps its click handling, `role="option"`, the selected and highlighted states and their styles.',
			action:
				'Remove from the snippet the wrapper that drew the row (click handlers, padding, selected or focused backgrounds) and keep only the content; use `selected` and `highlighted` from the parameters for content that changes with the state.',
			when: { snippets: ['itemSnippet'] }
		},
		{
			id: 'autocomplete-item-label-snippet',
			summary:
				'`itemLabelSnippet` replaces only the label: the `item.icon` and the check mark of selected options stay (v4 dropped the icon).',
			action:
				'If the snippet drew the icon itself, remove it from the snippet or move it to `itemIconSnippet`.',
			when: { snippets: ['itemLabelSnippet'] }
		},
		{
			id: 'autocomplete-hint-snippet',
			summary:
				'`hintSnippet` renders inside the hint element (linked to the input with `aria-describedby`) instead of in place of it.',
			action: 'Remove wrappers or margins the snippet added to position itself under the field.',
			when: { snippets: ['hintSnippet'] }
		},
		{
			id: 'autocomplete-look',
			summary:
				'New look: the field uses the `--global-input-*` base (36px minimum height, input border and focus ring), takes 100% of the container width, chips are primary `sm` Chips, the selected options are tinted with a check mark (v4: filled primary) and the list is as wide as the field, at most 300px high.',
			action:
				'Check layouts where an Autocomplete sat in a row next to other elements: set `--autocomplete-width` (a length or `auto`) or size its container. Drop `--chip-*` overrides that targeted the v4 chips if they now look wrong.'
		},
		{
			id: 'autocomplete-internal-classes',
			summary:
				'Internal classes changed: `.selection-container` → `.aurora-autocomplete-field`, `.autocomplete-input` → `.aurora-autocomplete-field input`, `.selection-item` → `.aurora-autocomplete-option`, `.focused` → `[data-highlighted]`, `.selected` → `[data-selected]`, `.not-visible-chip-number` → `.aurora-autocomplete-counter`, `.hint` → `.aurora-autocomplete-hint`, `li.item-N` → `[role="option"]`.',
			action:
				'Rewrite app `:global(...)` selectors that target them, or replace them with `--autocomplete-*` variables.',
			scope: 'app'
		}
	],
	added: [
		'`label` (linked to the input), `labelSnippet`, `id`.',
		'`state` (`error` | `success`) with `stateIconSnippet`; `error` sets `aria-invalid`.',
		'`name`: a hidden input per selected value, submitted with the form.',
		'`icon` and `iconSnippet` at the start of the field.',
		'`loading` with `loadingText` / `loadingSnippet`; `noResultsText` / `emptySnippet({ searchText })` when nothing matches.',
		'`removeLabel` (chip remove buttons), `drawerSearch`, `drawerTitle`, `closeLabel` (mobile drawer).',
		'`chipIconSnippet`, `itemIconSnippet`, `itemAppendSnippet`.',
		'`bind:input` and the native attributes and events of the `<input>`.',
		'`data-state`, `data-disabled`, `data-open`, `data-loading` on the root element.',
		'`--autocomplete-*` variables for the label, chips gap, counter, spinner, options, match highlight, status rows and drawer.'
	]
} satisfies ComponentMigration;

export default rule;

export function forwarded(prefix: string, skip: string[] = []) {
	const keep = <T extends { name: string }>(list: T[]) =>
		list.filter((item) => !skip.includes(item.name));
	const removal = (name: string, replacement: string, lead: string, note?: string): Removal => ({
		name,
		note: note ? `${lead} ${note}` : lead,
		replacement
	});
	return {
		props: {
			renamed: rule.props.renamed,
			removed: [
				...keep(rule.props.removed),
				...keep(rule.props.toCssVar).map((r) =>
					removal(r.name, r.cssVar, 'A CSS variable of the inner Autocomplete now.', r.note)
				)
			],
			defaults: keep(rule.props.defaults),
			values: rule.props.values,
			types: keep(rule.props.types)
		},
		events: rule.events,
		snippets: rule.snippets,
		cssVars: {
			removed: [
				...rule.cssVars.renamed.map((r) =>
					removal(r.from, r.to, 'Renamed in the inner Autocomplete.', r.note)
				),
				...rule.cssVars.removed
			]
		},
		manual: rule.manual
			.filter((step) => !skip.includes(step.id))
			.map((step) => ({ ...step, id: step.id.replace(/^autocomplete-/, `${prefix}-`) }))
	};
}
