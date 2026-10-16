<!-- @component Multiple selection
With `multiple` each pick becomes a chip and the list stays open. Backspace on an empty field removes the last chip, and `maxVisibleChips` collapses the others into a "+N" counter. An option's `icon` shows in the list and in its chip. With `name` every value is submitted with the form. -->
<script lang="ts">
	import { mdiBrush, mdiContentCut, mdiHairDryerOutline, mdiPalette, mdiSpa } from '@mdi/js';
	import { Autocomplete, Button, type Item } from '#lib';

	const services: Item[] = [
		{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
		{ value: 'blow-dry', label: 'Blow-dry', icon: mdiHairDryerOutline },
		{ value: 'color', label: 'Color', icon: mdiPalette },
		{ value: 'balayage', label: 'Balayage', icon: mdiBrush },
		{ value: 'treatment', label: 'Scalp treatment', icon: mdiSpa }
	];

	let values: Item[] = $state([services[0], services[3]]);
	let submitted = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		submitted = new FormData(event.currentTarget).getAll('services').join(', ');
	}
</script>

<form class="demo" onsubmit={submit}>
	<Autocomplete
		label="Services"
		placeholder="Add a service…"
		items={services}
		multiple
		bind:values
		name="services"
	/>
	<Autocomplete
		label="Services, at most 2 chips"
		placeholder="Add…"
		items={services}
		multiple
		maxVisibleChips={2}
		values={services.slice(0, 4)}
	/>
	<Button type="submit" variant="secondary">Submit</Button>
	{#if submitted}<p>Submitted services: {submitted}</p>{/if}
</form>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
