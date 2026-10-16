<!-- @component Multiple choice
Each button turns on and off by itself; `values` holds the selected options and `onchange` reports what changed. -->
<script lang="ts">
	import { ToggleList, type Item } from '#lib';
	import { mdiContentCut, mdiHairDryerOutline, mdiPaletteOutline, mdiSpaOutline } from '@mdi/js';

	const services: Item[] = [
		{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
		{ value: 'color', label: 'Color', icon: mdiPaletteOutline },
		{ value: 'blow-dry', label: 'Blow-dry', icon: mdiHairDryerOutline },
		{ value: 'treatment', label: 'Treatment', icon: mdiSpaOutline }
	];

	let values = $state<Item[]>([services[0], services[1]]);
</script>

<div class="demo">
	<ToggleList items={services} bind:values aria-label="Services" />
	<p>Selected: {values.map((item) => item.label).join(', ') || 'none'}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
	}

	p {
		margin: 0;
	}
</style>
