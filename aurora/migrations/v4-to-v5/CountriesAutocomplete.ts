import type { ComponentMigration } from '../types.js';
import { forwarded } from './Autocomplete.js';

const base = forwarded('countries-autocomplete', [
	'searchFunction',
	'items',
	'values',
	'class',
	'autocomplete-item-icon'
]);

export default {
	from: 'CountriesAutocomplete',
	to: 'CountriesAutocomplete',
	props: {
		renamed: [
			{
				from: 'selected',
				to: 'values',
				note: '`bind:selected` → `bind:values`. Same `Item[]` with the uppercase ISO code as `value`.'
			},
			...base.props.renamed
		],
		removed: [
			{
				name: 'autocompleteProps',
				note: 'Spread its keys as direct props on CountriesAutocomplete (`autocompleteProps={{ multiple: true, placeholder }}` → `multiple {placeholder}`), then apply the rest of this rule to them (they follow the Autocomplete rules). Callbacks inside it were silently lost in v4: check that they should really run.'
			},
			{
				name: 'searchFunction',
				note: 'Not accepted (v4 took it inside `autocompleteProps`): the built-in search ignores case and accents and also matches the ISO code. For other labels or a subset pass `items`.'
			},
			...base.props.removed
		],
		defaults: base.props.defaults,
		values: base.props.values,
		types: [
			{
				name: 'items',
				v4: 'Item[] (default countriesOptions: English ISO names, sorted by code)',
				v5: 'Item<CountryData>[] (default countryItems(locale): names in locale, sorted by name)',
				note: '`countriesOptions` → `countryItems(locale, codes?)`, which also fills `data.dialCode`.'
			},
			{
				name: 'values',
				v4: 'Item[] (prop `selected`)',
				v5: 'Item<CountryData>[]',
				note: 'Can be set with the code alone (`[{ value: "IT" }]`): the name in `locale` and the dialing code are filled in. Codes must be uppercase: a lowercase value gets its name but does not match its option.'
			},
			{
				name: 'class',
				v4: '{ flagIcon?: string }',
				v5: '{ container?, label?, field?, input?, chip?, menu?, option?, hint?, flag?, dialCode?: string }',
				note: '`class.flagIcon` → `class.flag`. The other keys are the Autocomplete ones (`class` inside `autocompleteProps` used `activator` → `container` or `field`).'
			},
			...base.props.types
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: '' },
				type: '{ select?: Item<CountryData>; unselect?: Item<CountryData>; selection: Item<CountryData>[] }',
				note: 'The items carry the name in `locale` and `data.dialCode`. With single selection, picking another country reports the replaced one in `unselect`.'
			},
			{
				name: 'onkeydown',
				type: 'KeyboardEvent',
				note: 'v4 typed it as a blur callback. Calling `preventDefault()` in it now skips the built-in key handling.'
			},
			{
				name: 'onfocus',
				type: 'FocusEvent',
				note: 'Native event of the input; v4 passed no argument.'
			},
			{
				name: 'onblur',
				type: 'FocusEvent',
				note: 'Native event of the input; v4 passed no argument.'
			},
			{
				name: 'onclose',
				type: '() => void',
				note: 'Fires on every close of the list; v4 fired it only when the mobile drawer closed.'
			}
		]
	},
	snippets: base.snippets,
	cssVars: {
		removed: [
			{
				name: '--countries-autocomplete-flag-icon-size',
				note: 'It never existed (used only in the v4 docs). Set the FlagIcon variable on the component.',
				replacement: '--flag-icon-size'
			},
			...base.cssVars.removed
		]
	},
	manual: [
		{
			id: 'countries-autocomplete-names',
			summary:
				'Country names come from the browser (`Intl.DisplayNames`) in `locale` (default `en`) and the list is sorted by name in that language; v4 had fixed English ISO names sorted by code. In English 48 of the 249 names differ (for example "Czech Republic" → "Czechia").',
			action:
				'Pass `locale` (for example `"it"`) where the app shows Italian. Store and compare the ISO code (`value`), never the label: code that matched hard-coded v4 names breaks.'
		},
		{
			id: 'countries-autocomplete-value-labels',
			summary:
				'The labels of `values` are always replaced by the name in `locale`, also in `onchange` and in the bound `values`.',
			action:
				'Remove code that built labels for the selected countries (`getCountryInfoByAlpha2(code).name`): `[{ value: code }]` is enough. A custom label on a value is not kept: use `chipLabelSnippet` to show other text.',
			when: { props: ['selected'] }
		},
		{
			id: 'countries-autocomplete-flags',
			summary:
				'Flags are 4:3 (v4: square) and are the icons of options and chips (`itemIconSnippet`, `chipIconSnippet`) instead of being drawn inside the label snippets.',
			action:
				'Size them with `--flag-icon-size` on the component. For square flags pass `itemIconSnippet` and `chipIconSnippet` that render `<FlagIcon alpha2={String(item.value)} square />`. A `chipLabelSnippet` or `itemLabelSnippet` passed through `autocompleteProps` was ignored in v4; passed directly it now replaces only the text, next to the flag.'
		},
		{
			id: 'countries-autocomplete-search',
			summary:
				'The search ignores accents, also matches the ISO code ("us" → United States) and ranks the results: names that start with the text, then the code, then names with a word that starts with it, then the rest.',
			action: 'Remove app workarounds that searched codes or stripped accents.'
		},
		...base.manual
	],
	added: [
		'Every Autocomplete prop, snippet and callback directly on the component, and the `--autocomplete-*` variables.',
		'`locale`, `dialCode` (dialing code at the end of each option), `class.dialCode`.',
		'Utilities `countryCodes`, `countryName(code, locale)`, `dialCode(code)`, `countryItems(locale, codes?)` and the `CountryData` type.',
		'`--countries-autocomplete-dial-code-color`, `-font-family`, `-font-size`.'
	]
} satisfies ComponentMigration;
