<!-- @component Language and dialing codes
`locale` sets the language of the names, which come from the browser, and the order of the list. `dialCode` shows the dialing code of each country, also available as `item.data.dialCode`. -->
<script lang="ts">
	import { CountriesAutocomplete, Select, type CountryData, type Item } from '#lib';

	const LANGUAGES: Item[] = [
		{ value: 'en', label: 'English' },
		{ value: 'it', label: 'Italiano' },
		{ value: 'fr', label: 'Français' },
		{ value: 'de', label: 'Deutsch' },
		{ value: 'ja', label: '日本語' }
	];

	let locale = $state('it');
	let values: Item<CountryData>[] = $state([]);
</script>

<div class="demo">
	<Select label="Language" items={LANGUAGES} bind:value={locale} />
	<CountriesAutocomplete
		label="Phone prefix"
		placeholder="Search…"
		{locale}
		dialCode
		bind:values
	/>
	<p>Prefix: {values[0]?.data?.dialCode ?? 'none'}</p>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
