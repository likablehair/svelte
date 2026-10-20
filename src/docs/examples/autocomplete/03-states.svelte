<!-- @component States
`state` colors the border and the hint and shows an icon; `error` also sets `aria-invalid`. `disabled` keeps the list closed and the chips fixed. `mandatory` keeps at least one value: the last chip has no remove button. -->
<script lang="ts">
	import { Autocomplete, type Item } from '#lib';

	const stylists: Item[] = [
		{ value: 1, label: 'Giulia Marini' },
		{ value: 2, label: 'Marco Rossi' },
		{ value: 3, label: 'Sara Bianchi' },
		{ value: 4, label: 'Luca Conti' }
	];
</script>

<div class="demo">
	<Autocomplete
		label="Stylist"
		placeholder="Search…"
		items={stylists}
		state="error"
		hint="Choose a stylist"
	/>
	<Autocomplete
		label="Stylist"
		items={stylists}
		values={[stylists[0]]}
		state="success"
		hint="Available at 10:30"
	/>
	<Autocomplete label="Stylists" items={stylists} multiple values={stylists.slice(0, 2)} disabled />
	<Autocomplete
		label="Stylists, at least one"
		items={stylists}
		multiple
		mandatory
		values={[stylists[2]]}
	/>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}
</style>
