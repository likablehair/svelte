import type { ComponentMigration, EventChange } from '../types.js';

const native = (name: string, type: string, note: string): EventChange => ({
	name,
	argument: {},
	type,
	note
});

export default {
	from: 'SearchBar',
	to: 'SearchBar',
	props: {
		changed: [
			{
				name: 'value',
				note: 'Still bindable. The clear button and Escape set it to `""` (and call `onsearch("")`): checks like `value === undefined` → `!value`.'
			},
			{
				name: 'placeholder',
				note: 'Still the native placeholder, and now also the accessible name when there is no `label` / `aria-label` (v4 left the field unnamed): see `search-bar-label`.'
			},
			{
				name: 'class',
				note: 'Same keys: `container` on the root (now `role="search"`), `icon` on the magnifier (an `Icon` SVG of 18px, v4 a 20px stroked SVG), `input` on the `<input>`.'
			}
		],
		defaults: [
			{
				name: 'clearable',
				v4: 'false',
				v5: 'true',
				keepV4: 'clearable={false}',
				note: 'New prop: while the field has text a × button empties it. v4 had none (the native one of `type="search"` stays hidden). Keep it unless the app draws its own clear button.'
			}
		],
		types: [
			{
				name: 'input',
				v4: 'HTMLElement',
				v5: 'HTMLInputElement',
				note: '`bind:input` still gives the native input; the variable can be typed `HTMLInputElement` now. It is `undefined` with `inputSnippet`.'
			}
		]
	},
	events: {
		changed: [
			native(
				'oninput',
				'Event',
				'Native input event, as in v4. A handler that debounced the search with `setTimeout` should become `onsearch`: see `search-bar-onsearch`.'
			),
			native('onchange', 'Event', 'Native change event, as in v4.'),
			native(
				'onkeydown',
				'KeyboardEvent',
				'Native event, as in v4, called before the built-in keys: Enter now calls `onsearch` and does not submit the form, Escape with text empties the field. Call `preventDefault()` in the handler to skip them. See `search-bar-keyboard`.'
			),
			native('onfocus', 'FocusEvent', 'Native event, as in v4.'),
			native('onblur', 'FocusEvent', 'Native event, as in v4.')
		]
	},
	cssVars: {
		changed: [
			{
				name: '--search-bar-height',
				note: 'Default 40px (v4 3rem = 48px). Set it to `3rem` for the v4 height.'
			},
			{
				name: '--search-bar-border-radius',
				note: 'Default the input radius of the theme (`--global-input-radius`; v4 0.5rem).'
			},
			{
				name: '--search-bar-padding',
				note: 'Default `0 6px 0 12px` (v4 `0 1rem`): the end is narrower because the clear button, spinner or search button sit there.'
			},
			{
				name: '--search-bar-ring-color',
				note: 'Color of the ring at rest only; hover and focus have `--search-bar-hover-ring-color` and `--search-bar-focus-ring-color` (focus also a glow, `--search-bar-focus-glow-color`). Default the input border color (v4 contrast-100).'
			},
			{
				name: '--search-bar-ring-width',
				note: 'Default the input border width of the theme (v4 1px).'
			},
			{
				name: '--search-bar-background-color',
				note: 'Default the input background (v4 background-100). A v4 color token in the value must be replaced (global color tokens).'
			},
			{
				name: '--search-bar-font-size',
				note: 'Default the input font size (`--global-input-font-size`; v4 .875rem).'
			},
			{
				name: '--search-bar-line-height',
				note: 'Default `1.5` (v4 `1.5rem`); the input now fills the height of the bar.'
			},
			{
				name: '--search-bar-max-width',
				note: 'Default `none` (v4 read an undefined default, which gave the same result).'
			}
		]
	},
	manual: [
		{
			id: 'search-bar-label',
			kind: 'review',
			summary:
				'v4 gave every SearchBar the fixed id `search-content` and an `aria-labelledby` pointing to itself: duplicate ids and a field with no accessible name. v5 names the field and the `role="search"` landmark with `label`, else `aria-label`, else the placeholder.',
			action:
				'Give each usage a `label` that says what it searches ("Search clients"), especially when the placeholder is missing or is an example ("Mario Rossi"). Remove app code and tests that relied on `#search-content`: use `bind:input`, an `id` (forwarded to the input) or `getByRole("searchbox", { name })`.'
		},
		{
			id: 'search-bar-onsearch',
			kind: 'review',
			summary:
				'`onsearch(text)` fires `debounce` ms (300) after the last keystroke, at once on Enter, on the search button and when the field is emptied. v4 apps and the v4 tables debounced `oninput` themselves (PaginatedTable `searchTimeoutDelay` 300; DynamicTable 800 ms plus Enter).',
			action:
				'Replace the app debounce (`clearTimeout` / `setTimeout` in `oninput`, `debounce` store, Enter handled in `onkeydown`) with `onsearch={(text) => ...}`. Keep the v4 delay with `debounce={800}` where the app used it; `searchOnType={false}` searches only on Enter and the button. Show `loading` while the results arrive. Leave `oninput` only for work that must run at every keystroke.',
			when: { events: ['oninput', 'onkeydown', 'onchange'] }
		},
		{
			id: 'search-bar-keyboard',
			kind: 'review',
			summary:
				'The input is `type="search"`: Enter calls `onsearch` and no longer submits the surrounding form, Escape with text empties the field (Escape on an empty field still reaches dialogs and menus).',
			action:
				'Check `onkeydown` handlers that handled Enter or Escape: delete them when they only started or reset the search (`onsearch` does it), or call `event.preventDefault()` in them to keep the app behaviour. A SearchBar inside a `<form>` that relied on Enter to submit needs a submit in `onsearch`.',
			when: { events: ['onkeydown'] }
		},
		{
			id: 'search-bar-input-snippet',
			kind: 'review',
			summary:
				'With `inputSnippet` the app input replaces the built-in one, so it gets none of its behaviour: debounce, `onsearch`, Enter / Escape, the accessible name.',
			action:
				'Bind the app input to the same `value` (`bind:value` on both) so the clear button and `data-filled` follow it, give it an accessible name, and call the search from its own events; or drop the snippet and use the built-in input with native attributes, which are now forwarded.',
			when: { snippets: ['inputSnippet'] }
		},
		{
			id: 'search-bar-look',
			kind: 'review',
			summary:
				'New look: 40px field on the theme input tokens (border, radius, font, hover and focus ring), an 18px MDI magnifier, a clear button while there is text; v4 was a 48px grey bar with a 1px ring.',
			action:
				'Usually accept it; for the v4 height set `--search-bar-height="3rem"`. The v4 input attributes `maxlength="512"`, `aria-autocomplete="both"` and `tabindex="0"` are gone: pass `maxlength` if the app relied on it. App CSS on `.search-bar-container`, `.search-icon`, `.input` → `.aurora-search-bar`, `.aurora-search-bar-icon`, `.aurora-search-bar input` (or the `class` parts).'
		}
	],
	added: [
		'`label` (accessible name of the field and of the `role="search"` landmark).',
		'`onsearch(text)` with `debounce` (300 ms) and `searchOnType`; Enter searches, Escape clears.',
		'`clearable` (default `true`) with `clearLabel`; `loading` (spinner).',
		'`locale` (BCP 47): language of the default texts, Italian with `it`, English otherwise; without it the one of `setDefaultLocale` (step `global-default-locale`), else `en`. Text props win over it.',
		'`buttonLabel` (a search button) and `buttonSnippet({ search })`.',
		'Native `<input>` attributes forwarded (`id`, `name`, `maxlength`, `aria-*`, ...).',
		'`data-filled` and `data-loading` on the root.',
		'`--search-bar-gap`, `-color`, `-placeholder-color`, `-icon-size`, `-icon-color`, `-hover-ring-color`, `-focus-ring-color`, `-focus-glow-color`.'
	]
} satisfies ComponentMigration;
