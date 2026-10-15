import type { ComponentMigration } from '../types.js';

export default {
	from: 'GlobalSearchTextField',
	to: 'GlobalSearchTextField',
	props: {
		renamed: [
			{ from: 'searchButtonText', to: 'label', note: 'Also the name of the search box. Defaults to "Search" in the language of `locale`.' },
			{ from: 'searchDialogOpened', to: 'open', note: 'Still bindable.' }
		],
		removed: [
			{
				name: 'transitionDuration',
				note: 'The palette is a library `Dialog`: set `--dialog-duration` on the app CSS instead.',
				replacement: '--dialog-duration'
			}
		],
		changed: [
			{
				name: 'searcher',
				note: 'Receives `{ searchText, signal }` and is called 300ms after the last keystroke (`debounceTimeout`), from 1 character (`searchThreshold`); pass `signal` to `fetch` so older searches stop. It returns `GlobalSearchItem[]`: see the `global-search-text-field-results` step.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onselect',
				argument: { 'detail.element': 'item' },
				type: '{ item: GlobalSearchItem<Data>; event: MouseEvent | KeyboardEvent }',
				note: '`item` is the result returned by `searcher`, with the v5 field names. The dialog now closes by itself after the choice: drop `searchDialogOpened = false` in the handler.'
			},
			{
				name: 'ontoggleSearchDialog',
				to: 'onclose',
				argument: { 'detail.opened': null },
				type: '() => void',
				note: 'Called whenever the dialog closes (v4 only on the toggle, with `opened`). To react to the opening, watch `bind:open`.'
			}
		]
	},
	snippets: {
		renamed: [{ from: 'searchButtonSnippet', to: 'triggerSnippet', note: '`{ toggleSearchDialog }` → `{ open, shortcut }`.' }],
		removed: [
			{ name: 'searchButtonIconSnippet', note: 'Use `triggerSnippet` to draw the whole button.', replacement: 'triggerSnippet' },
			{ name: 'searchButtonTextSnippet', note: 'Use `label`, or `triggerSnippet`.', replacement: 'label' },
			{ name: 'searchButtonShortcutSnippet', note: 'Use `triggerSnippet`; `shortcut` is its text.', replacement: 'triggerSnippet' },
			{ name: 'searchBarSnippet', note: 'The search box belongs to the palette; it could not be replaced in a working way in v4 either.' },
			{
				name: 'searchResultsSnippet',
				note: 'Replace the parts instead: `itemSnippet({ item, active, parts })` for a row, `groupSnippet` for a section title, `emptySnippet` for "nothing found".',
				replacement: 'itemSnippet'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--global-search-text-field-ring-color', to: '--global-search-text-field-border-color' },
			{ from: '--global-search-text-field-hover-ring-color', to: '--global-search-text-field-hover-border-color' },
			{ from: '--global-search-text-field-background-color', to: '--global-search-text-field-background' }
		],
		removed: [
			...[
				'--search-results-width',
				'--search-results-max-width',
				'--search-results-height',
				'--search-results-max-height',
				'--search-results-margin',
				'--search-results-background-color',
				'--search-results-border-color',
				'--search-results-border-radius'
			].map((name) => ({
				name,
				note: 'The results are part of the palette: size it with `--global-search-text-field-dialog-width`, `-dialog-max-height` and `-dialog-top`, and style it with the `--dialog-*` variables.'
			}))
		],
		changed: [
			{
				name: '--global-search-text-field-max-width',
				note: 'Default 220px instead of 28rem; `--global-search-text-field-height` 32px instead of 2rem; `--global-search-text-field-border-radius` the radius of the fields instead of a pill.'
			}
		]
	},
	manual: [
		{
			id: 'global-search-text-field-results',
			summary:
				'Results are `GlobalSearchItem`: `{ value, label, description?, icon?, href?, group?, data? }` instead of `{ name, title, subtitle?, url?, data? }`, and `href` now works.',
			action:
				'In `searcher` rename `name` → `value`, `title` → `label`, `subtitle` → `description`, `url` → `href`. Where `onselect` only called `goto(url)`, set `href` on the results and drop the handler. Add `group` ("Clients", "Pages"...) instead of telling the kinds of result apart by their subtitle. Import `GlobalSearchItem` from the library.'
		},
		{
			id: 'global-search-text-field-mobile',
			summary: 'On screens up to 768px the button shows only the magnifier and the palette takes the whole screen, with a Cancel button.',
			action: 'Remove the wrappers or CSS that hid the search on phones, unless the app really wants it hidden there.'
		},
		{
			id: 'global-search-text-field-shortcut',
			summary:
				'Ctrl+K (⌘K on a Mac) now prevents the browser shortcut and is ignored inside other text fields; the label says Ctrl on Windows and Linux.',
			action: 'Pass `shortcut={false}` where the app uses Ctrl+K for something else, or another letter in `shortcut`. An app without a `searcher` should not render the component.'
		},
		{
			id: 'global-search-text-field-texts',
			summary: 'Texts come from `locale` (`it`, `en`): "Sorry, nothing found" and "Search with ❤️" are gone.',
			action: 'Pass `locale` or call `setDefaultLocale`; `emptyText`, `errorText` and `footerSnippet` change the messages.'
		}
	],
	added: [
		'`GlobalSearchItem` type exported, with `href`, `group` and `icon`.',
		'Debounced searches with `signal` (`debounceTimeout`, `searchThreshold`), errors with `errorText` and `onerror`.',
		'Combobox with arrows, Enter and the searched text highlighted; keyboard hints from `locale`.',
		'`shortcut` (letter or `false`), `placeholder`, `emptyText`, `cancelLabel`, `locale`.',
		'`itemSnippet`, `groupSnippet`, `emptySnippet`, `footerSnippet`; `class.dialog`; `bind:buttonElement`.',
		'`data-open`, `data-compact` on the root and `data-state` on the dialog; every `--global-search-text-field-*` variable.'
	]
} satisfies ComponentMigration;
