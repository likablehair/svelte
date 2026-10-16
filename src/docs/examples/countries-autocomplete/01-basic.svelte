<!-- @component Country
Every country with its flag, sorted by name. The search ignores accents and also matches the ISO code: try “sviz”, “cura” or “us”. `values` holds items whose `value` is the ISO code, and can be set with the code alone. -->
<script lang="ts">
	import { CountriesAutocomplete, type CountryData, type Item } from '#lib';

	let values: Item<CountryData>[] = $state([{ value: 'IT' }]);
</script>

<div class="demo">
	<CountriesAutocomplete label="Country" placeholder="Search a country…" bind:values />
	<p>Code: {values[0]?.value ?? 'none'}</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 10px 0 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
