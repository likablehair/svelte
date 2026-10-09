import type { ComponentMigration } from '../types.js';
import { forwarded } from './Autocomplete.js';

const base = forwarded('async-autocomplete', ['searchFunction']);

export default {
	from: 'AsyncAutocomplete',
	to: 'AsyncAutocomplete',
	props: {
		renamed: base.props.renamed,
		removed: [
			{
				name: 'search',
				note: 'The boolean command is now a method. Bind the instance (`bind:this={autocomplete}`) and call `autocomplete.search()` where the app set `search = true`: it searches the current text again, also below `searchThreshold`.'
			},
			{
				name: 'searchFunction',
				note: 'Not accepted: `searcher` filters the results and the suggestions below `searchThreshold` use the default search (case and accents ignored). Move custom filtering into `searcher`.'
			},
			...base.props.removed
		],
		defaults: [
			{
				name: 'closeOnSelect',
				v4: 'false',
				v5: '!multiple',
				keepV4: 'closeOnSelect={false}',
				note: 'A single selection now closes the list, as in Autocomplete.'
			},
			{
				name: 'icon',
				v4: 'undefined (no icon)',
				v5: 'a magnifier (mdiMagnify)',
				keepV4: 'icon=""'
			},
			...base.props.defaults
		],
		values: base.props.values,
		types: [
			{
				name: 'searcher',
				v4: '(params: { searchText: string }) => Promise<Item[]>',
				v5: '(params: { searchText: string; signal: AbortSignal }) => Promise<Item<Data>[]>',
				note: 'The text is trimmed. Pass `signal` to `fetch` (or abort the request with it): a newer search aborts the older one and late answers are ignored.'
			},
			...base.props.types
		]
	},
	events: base.events,
	snippets: base.snippets,
	cssVars: base.cssVars,
	manual: [
		{
			id: 'async-autocomplete-items',
			summary:
				'`items` are now suggestions shown while the text is shorter than `searchThreshold`, filtered locally; the results of `searcher` no longer overwrite them. v4 kept showing the last results, unfiltered, below the threshold.',
			action:
				'Where `items` held initial results, keep them as suggestions or use `searchThreshold={0}`, which runs `searcher` with an empty text as soon as the list opens. Without `items` the list asks to "Type at least N characters" (`thresholdText`).',
			when: { props: ['items'] }
		},
		{
			id: 'async-autocomplete-searcher',
			summary:
				'`searcher` receives an `AbortSignal` and runs only while the list is open: opening it with enough text searches at once, reopening with the same text reuses the last results, and `searching` is `true` while a search waits for the debounce or runs, that is once the trimmed text reaches `searchThreshold` with the list open (or after `search()`).',
			action:
				'Pass `signal` to `fetch` and remove app-side debounce, request counters or "ignore stale response" guards. Code that set `searchText` from outside and expected a search must open the list or call `search()`.',
			when: { props: ['searcher', 'searchText'] }
		},
		{
			id: 'async-autocomplete-errors',
			summary:
				'A rejected `searcher` shows an error row ("Couldn\'t load results") and calls `onerror(error)`; searches aborted by a newer one or by unmounting the component are not errors. v4 left an unhandled rejection.',
			action:
				'Move error toasts or logging from `try/catch` inside `searcher` to `onerror`, and let the error propagate (rethrow) so the row shows. Customize with `errorText` or `errorSnippet({ error, search })`.',
			when: { props: ['searcher'] }
		},
		{
			id: 'async-autocomplete-loading',
			summary:
				'While searching, the field shows a spinner and the list three skeleton rows (with a hidden "Loading…" text); Enter picks nothing until the results arrive.',
			action:
				'Remove app loading indicators placed next to the field; restyle the rows with `--async-autocomplete-skeleton-*` or replace them with `loadingSnippet`.'
		},
		...base.manual
	],
	added: [
		'Every Autocomplete prop, snippet and `--autocomplete-*` variable (label, state, name, loading texts, item snippets, ...).',
		'`bind:searching` (it now works), `search()` method, `searchThreshold={0}` to load on open.',
		'`thresholdText`, `errorText`, `onerror`, `errorSnippet({ error, search })`.',
		'`--async-autocomplete-skeleton-*` variables.'
	]
} satisfies ComponentMigration;
