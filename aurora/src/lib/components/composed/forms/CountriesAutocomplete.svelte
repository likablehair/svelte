<!-- @component
Autocomplete of countries, with their flags. The names come from the browser in the language of `locale` (English by default), so every language works, and the list is sorted by name in that language. The search ignores case and accents and also matches the ISO code (`us` finds the United States): names that start with the text come first, then the country with that code, then names with a word that starts with it, then the rest. `values` holds `Item`s whose `value` is the uppercase ISO 3166-1 alpha-2 code (`IT`); they can be set with the code alone, `[{ value: 'IT' }]`: the component fills in the name in `locale` and the dialing code. With `dialCode` every option also shows its dialing code (`+39`), which is in `item.data.dialCode` anyway. For a subset of the countries, or other labels, pass `items`, for example `countryItems('it', ['IT', 'SM', 'VA'])`. Everything else works as in `Autocomplete`, including its props, snippets, events and `--autocomplete-*` variables; the flags take the `--flag-icon-*` ones.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './CountriesAutocomplete.css';
	import type { ComponentProps } from 'svelte';
	import Autocomplete from '../../simple/forms/Autocomplete.svelte';
	import type { Item } from '../../simple/forms/item.js';
	import FlagIcon from '../../simple/media/FlagIcon.svelte';
	import { countryItems, countryName, type CountryData } from '../../../utils/countries.js';

	type AutocompleteProps = ComponentProps<typeof Autocomplete<CountryData>>;

	interface Props extends Omit<AutocompleteProps, 'items' | 'searchFunction' | 'class'> {
		/** Language of the country names, as a BCP 47 tag such as `en`, `it` or `fr-CH`. */
		locale?: string;
		/** Countries to choose from. Defaults to all of them, named in `locale`, that is `countryItems(locale)`. */
		items?: Item<CountryData>[];
		/** Shows the dialing code of every country (`+39`) at the end of its option. */
		dialCode?: boolean;
		/** Classes of the parts: those of `Autocomplete`, plus `flag` on every flag and `dialCode` on every dialing code. */
		class?: AutocompleteProps['class'] & { flag?: string; dialCode?: string };
	}

	let {
		locale = 'en',
		items,
		dialCode = false,
		values = $bindable(),
		searchText = $bindable(),
		open = $bindable(),
		input = $bindable(),
		class: clazz = {},
		chipIconSnippet,
		itemIconSnippet,
		itemAppendSnippet,
		...rest
	}: Props = $props();

	const DIACRITICS = /\p{Diacritic}/gu;
	const fold = (value: string) => value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();

	let countries = $derived(items ?? countryItems(locale));
	let byCode = $derived(new Map(countries.map((item) => [String(item.value).toUpperCase(), item])));
	let query = $derived(fold((searchText ?? '').trim()));
	let options = $derived.by(() => {
		if (!query) return countries;
		const code = query.toUpperCase();
		const ranks: Item<CountryData>[][] = [[], [], [], []];
		for (const item of countries) {
			const name = fold(String(item.label ?? item.value));
			const rank = name.startsWith(query)
				? 0
				: String(item.value).toUpperCase() === code
					? 1
					: name.split(/[\s\-‐'’(]+/).some((word) => word.startsWith(query))
						? 2
						: name.includes(query)
							? 3
							: -1;
			if (rank >= 0) ranks[rank].push(item);
		}
		return ranks.flat();
	});

	const everything = () => true;
	const named = (item: Item<CountryData>) => {
		const country = byCode.get(String(item.value).toUpperCase());
		return {
			...country,
			...item,
			label: country?.label ?? item.label ?? countryName(String(item.value), locale)
		};
	};
	let selection = $derived(values?.map(named));
</script>

{#snippet flag(item: Item<CountryData>)}
	<FlagIcon alpha2={String(item.value)} class={clazz.flag} />
{/snippet}

{#snippet chipIcon({ selection }: { selection: Item<CountryData> })}
	{@render flag(selection)}
{/snippet}

{#snippet itemIcon({ item }: { item: Item<CountryData> })}
	{@render flag(item)}
{/snippet}

{#snippet itemAppend({ item }: { item: Item<CountryData>; selected: boolean })}
	{#if item.data?.dialCode}
		<span class={['aurora-countries-autocomplete-dial-code', clazz.dialCode]}>
			{item.data.dialCode}
		</span>
	{/if}
{/snippet}

<Autocomplete
	{...rest}
	bind:values={() => selection, (selected) => (values = selected)}
	bind:searchText
	bind:open
	bind:input
	items={options}
	searchFunction={everything}
	class={clazz}
	chipIconSnippet={chipIconSnippet ?? chipIcon}
	itemIconSnippet={itemIconSnippet ?? itemIcon}
	itemAppendSnippet={itemAppendSnippet ?? (dialCode ? itemAppend : undefined)}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-countries-autocomplete-dial-code {
			flex-shrink: 0;
			color: var(
				--countries-autocomplete-dial-code-color,
				var(--countries-autocomplete-default-dial-code-color)
			);
			font-family: var(
				--countries-autocomplete-dial-code-font-family,
				var(--countries-autocomplete-default-dial-code-font-family)
			);
			font-size: var(
				--countries-autocomplete-dial-code-font-size,
				var(--countries-autocomplete-default-dial-code-font-size)
			);
			font-variant-numeric: tabular-nums;
		}
	}
</style>
