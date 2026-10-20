<!-- @component Some countries in a form
`countryItems(locale, codes)` builds the items of a subset of the countries. With `multiple` and `name`, every selected code is submitted with the form. -->
<script lang="ts">
	import { Button, CountriesAutocomplete, countryItems } from '#lib';

	const EUROZONE = [
		'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE',
		'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'
	];

	const items = countryItems('en', EUROZONE);
	let submitted = $state('');
</script>

<form
	class="demo"
	onsubmit={(event) => {
		event.preventDefault();
		submitted = new FormData(event.currentTarget).getAll('markets').join(', ');
	}}
>
	<CountriesAutocomplete
		label="Markets"
		placeholder="Eurozone countries…"
		{items}
		multiple
		name="markets"
		maxVisibleChips={3}
	/>
	<Button type="submit">Save</Button>
	{#if submitted}<p>Submitted: {submitted}</p>{/if}
</form>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
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
