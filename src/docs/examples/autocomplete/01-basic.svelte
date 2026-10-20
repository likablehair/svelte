<!-- @component Single selection
Type to filter: the first match is highlighted and Enter picks it, the arrows move through the list. The search ignores case and accents ("pedi" finds "Pédicure"). `bind:values` holds the selection, always an array; picking another option replaces it. -->
<script lang="ts">
	import { Autocomplete, type Item } from '#lib';

	const services: Item[] = [
		{ value: 'cut', label: 'Haircut' },
		{ value: 'blow-dry', label: 'Blow-dry' },
		{ value: 'color', label: 'Color' },
		{ value: 'balayage', label: 'Balayage' },
		{ value: 'highlights', label: 'Highlights' },
		{ value: 'keratin', label: 'Keratin treatment' },
		{ value: 'manicure', label: 'Manicure' },
		{ value: 'pedicure', label: 'Pédicure' }
	];

	let values: Item[] = $state([]);
</script>

<div class="demo">
	<Autocomplete
		label="Service"
		placeholder="Search a service…"
		items={services}
		bind:values
		hint="The main service of the appointment"
	/>
	<p>Selected: {values[0]?.label ?? 'none'}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
