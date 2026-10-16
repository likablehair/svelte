<!-- @component Multiple selection
With `multiple` the list stays open while options are toggled. The button shows the only selected label or "N selected"; `selectionText` changes that text. The clear button empties the selection and `onchange` reports every change. -->
<script lang="ts">
	import { mdiFilterVariant } from '@mdi/js';
	import { Dropdown, type Item } from '#lib';

	const statuses: Item[] = [
		{ value: 'booked', label: 'Booked' },
		{ value: 'confirmed', label: 'Confirmed' },
		{ value: 'arrived', label: 'Arrived' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' },
		{ value: 'no-show', label: 'No-show' }
	];

	let values: Item[] = $state([]);
	let last = $state('');
</script>

<div class="demo">
	<div class="row">
		<Dropdown
			label="Status"
			placeholder="All"
			icon={mdiFilterVariant}
			items={statuses}
			multiple
			bind:values
			onchange={({ select, unselect, selection }) =>
				(last = `${select ? `+${select.label}` : `-${unselect?.label}`} → ${selection.length} selected`)}
		/>
		<Dropdown
			label="Status"
			placeholder="All"
			items={statuses}
			multiple
			bind:values
			selectionText={(selected) => selected.map((item) => item.label).join(', ')}
			--dropdown-max-width="260px"
		/>
	</div>
	<p>{last || 'No changes yet'}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
