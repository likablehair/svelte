<script lang="ts">
	import { untrack, type ComponentProps } from 'svelte';
	import CountriesAutocomplete from '#lib/components/composed/forms/CountriesAutocomplete.svelte';
	import type { Item } from '#lib/components/simple/forms/item.js';
	import type { CountryData } from '#lib/utils/countries.js';

	interface Props extends Omit<ComponentProps<typeof CountriesAutocomplete>, 'values'> {
		initial: Item<CountryData>[];
	}

	let { initial, ...rest }: Props = $props();
	let values = $state(untrack(() => initial));
</script>

<CountriesAutocomplete {...rest} bind:values />
<output>{JSON.stringify(values)}</output>
