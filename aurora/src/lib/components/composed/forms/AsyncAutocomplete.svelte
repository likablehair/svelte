<!-- @component
Autocomplete whose options come from a server: while the user types, it calls `searcher` with the text and shows the items it returns. A search starts when the text reaches `searchThreshold` characters (2 by default), `debounceTimeout` ms after the last keystroke, and only while the list is open; a newer search aborts the older one through `signal`, so a slow response never replaces a newer one. While searching, the field shows a spinner and the list shows skeleton rows. Below the threshold the list shows `items`, for example recent choices, filtered locally, or a "Type at least N characters" row. A failed search shows an error row and calls `onerror`. With `searchThreshold={0}` the first search runs as soon as the list opens. The results of the last search are kept, so reopening the list with the same text does not search again; `search()`, called through `bind:this`, runs the search again for the current text. Everything else works as in `Autocomplete`, including its props, snippets, events and `--autocomplete-*` variables.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './AsyncAutocomplete.css';
	import { untrack, type ComponentProps, type Snippet } from 'svelte';
	import Autocomplete from '../../simple/forms/Autocomplete.svelte';
	import type { Item } from '../../simple/forms/item.js';

	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';
	const SKELETON_ROWS = [60, 45, 52];

	interface Props
		extends Omit<
			ComponentProps<typeof Autocomplete<Data>>,
			'items' | 'icon' | 'loading' | 'searchFunction'
		> {
		/** Fetches the options for a text. `signal` is aborted when a newer search starts or the component is destroyed: pass it to `fetch`. */
		searcher: (params: { searchText: string; signal: AbortSignal }) => Promise<Item<Data>[]>;
		/** Options shown while the text is shorter than `searchThreshold`, for example recent or suggested choices. They are filtered locally. */
		items?: Item<Data>[];
		/** Number of characters that starts a search. With `0` the first search runs as soon as the list opens. */
		searchThreshold?: number;
		/** Milliseconds to wait after the last keystroke before searching. */
		debounceTimeout?: number;
		/** Whether a search is waiting or running. Read it with `bind:searching`. */
		searching?: boolean;
		/** SVG path of the icon at the start of the field. An empty string removes it. */
		icon?: string;
		/** Text of the row shown below `searchThreshold` when no `items` match. Defaults to "Type at least N characters". */
		thresholdText?: string;
		/** Text of the row shown when a search fails. */
		errorText?: string;
		/** Called when `searcher` throws or rejects, except for searches aborted by a newer one. */
		onerror?: (error: unknown) => void;
		/** Replaces the content of the row shown when a search fails. `search` runs it again. */
		errorSnippet?: Snippet<[{ error: unknown; search: () => void }]>;
	}

	let {
		searcher,
		items = [],
		searchThreshold = 2,
		debounceTimeout = 500,
		searching = $bindable(),
		icon = SEARCH_ICON,
		thresholdText,
		errorText = "Couldn't load results",
		noResultsText = 'No results',
		loadingText = 'Loading…',
		values = $bindable(),
		searchText = $bindable(),
		open = $bindable(),
		input = $bindable(),
		onerror,
		errorSnippet,
		emptySnippet,
		loadingSnippet,
		...rest
	}: Props = $props();

	let text = $derived((searchText ?? '').trim());
	let results: Item<Data>[] = $state.raw([]);
	let resultsFor = $state<string>();
	let failed = $state(false);
	let error = $state.raw<unknown>();
	let showResults = $derived(text.length >= searchThreshold || resultsFor === text);
	let controller: AbortController | undefined;

	const everything = () => true;

	function stop() {
		controller?.abort();
		controller = undefined;
		searching = false;
	}

	function run(query: string) {
		controller?.abort();
		const current = new AbortController();
		controller = current;
		searching = true;
		Promise.resolve()
			.then(() => searcher({ searchText: query, signal: current.signal }))
			.then(
				(found) => {
					if (controller !== current) return;
					results = found;
					failed = false;
					resultsFor = query;
				},
				(reason: unknown) => {
					if (controller !== current) return;
					results = [];
					error = reason;
					failed = true;
					resultsFor = query;
					onerror?.(reason);
				}
			)
			.finally(() => {
				if (controller !== current) return;
				controller = undefined;
				searching = false;
			});
	}

	/** Runs the search again for the current text, also below `searchThreshold`. */
	export function search() {
		run(text);
	}

	let wasOpen = false;
	$effect(() => {
		const query = text;
		const isOpen = !!open;
		const opening = isOpen && !wasOpen;
		wasOpen = isOpen;
		if (!isOpen || query.length < searchThreshold) {
			untrack(stop);
			return;
		}
		if (untrack(() => resultsFor === query && !failed)) return;
		untrack(() => (searching = true));
		const timer = setTimeout(() => run(query), opening ? 0 : debounceTimeout);
		return () => clearTimeout(timer);
	});

	$effect(() => () => {
		controller?.abort();
		controller = undefined;
	});
</script>

{#snippet skeleton()}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<span class="aurora-async-autocomplete-skeleton">
			<span class="aurora-async-autocomplete-loading-text">{loadingText}</span>
			{#each SKELETON_ROWS as width (width)}
				<span class="aurora-async-autocomplete-skeleton-row" aria-hidden="true">
					<span class="aurora-async-autocomplete-skeleton-avatar"></span>
					<span class="aurora-async-autocomplete-skeleton-line" style:width="{width}%"></span>
				</span>
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet empty(params: { searchText: string | undefined })}
	{#if showResults && failed}
		{#if errorSnippet}
			{@render errorSnippet({ error, search })}
		{:else}
			{errorText}
		{/if}
	{:else if !showResults}
		{thresholdText ??
			`Type at least ${searchThreshold} ${searchThreshold === 1 ? 'character' : 'characters'}`}
	{:else if emptySnippet}
		{@render emptySnippet(params)}
	{:else}
		{noResultsText}
	{/if}
{/snippet}

<Autocomplete
	{...rest}
	bind:values
	bind:searchText
	bind:open
	bind:input
	items={showResults ? results : items}
	{icon}
	loading={!!searching}
	searchFunction={showResults ? everything : undefined}
	loadingSnippet={skeleton}
	emptySnippet={empty}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-async-autocomplete-skeleton {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(
				--async-autocomplete-skeleton-gap,
				var(--async-autocomplete-default-skeleton-gap)
			);
		}

		.aurora-async-autocomplete-loading-text {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.aurora-async-autocomplete-skeleton-row {
			display: flex;
			align-items: center;
			gap: var(
				--async-autocomplete-skeleton-row-gap,
				var(--async-autocomplete-default-skeleton-row-gap)
			);
		}

		.aurora-async-autocomplete-skeleton-avatar,
		.aurora-async-autocomplete-skeleton-line {
			--_color: var(
				--async-autocomplete-skeleton-color,
				var(--async-autocomplete-default-skeleton-color)
			);
			--_highlight: var(
				--async-autocomplete-skeleton-highlight-color,
				var(--async-autocomplete-default-skeleton-highlight-color)
			);

			flex-shrink: 0;
			background: linear-gradient(90deg, var(--_color) 0%, var(--_highlight) 50%, var(--_color) 100%);
			background-size: 200% 100%;
			animation: async-autocomplete-skeleton
				var(
					--async-autocomplete-skeleton-duration,
					var(--async-autocomplete-default-skeleton-duration)
				)
				ease-in-out infinite;
		}

		.aurora-async-autocomplete-skeleton-avatar {
			width: var(
				--async-autocomplete-skeleton-avatar-size,
				var(--async-autocomplete-default-skeleton-avatar-size)
			);
			height: var(
				--async-autocomplete-skeleton-avatar-size,
				var(--async-autocomplete-default-skeleton-avatar-size)
			);
			border-radius: var(
				--async-autocomplete-skeleton-avatar-border-radius,
				var(--async-autocomplete-default-skeleton-avatar-border-radius)
			);
		}

		.aurora-async-autocomplete-skeleton-line {
			height: var(
				--async-autocomplete-skeleton-line-height,
				var(--async-autocomplete-default-skeleton-line-height)
			);
			border-radius: var(
				--async-autocomplete-skeleton-line-border-radius,
				var(--async-autocomplete-default-skeleton-line-border-radius)
			);
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-async-autocomplete-skeleton-avatar,
			.aurora-async-autocomplete-skeleton-line {
				animation: none;
			}
		}
	}

	@keyframes async-autocomplete-skeleton {
		from {
			background-position: 150% 0;
		}
		to {
			background-position: -50% 0;
		}
	}
</style>
