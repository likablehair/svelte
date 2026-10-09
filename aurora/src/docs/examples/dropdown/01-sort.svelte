<!-- @component Sorting
A single choice in a toolbar. `label` sits inside the button before the selection and names the control for screen readers. `mandatory` (the default) keeps the current option when it is clicked again, and `clearable={false}` hides the clear button, so there is always a sort order. -->
<script lang="ts">
	import {
		mdiClockOutline,
		mdiCurrencyEur,
		mdiSort,
		mdiSortAlphabeticalAscending
	} from '@mdi/js';
	import { Dropdown, type Item } from '#lib';

	const orders: Item[] = [
		{ value: 'recent', label: 'Newest', icon: mdiClockOutline },
		{ value: 'name', label: 'Name A–Z', icon: mdiSortAlphabeticalAscending },
		{ value: 'spent', label: 'Total spent', icon: mdiCurrencyEur }
	];

	let values: Item[] = $state([orders[0]]);
</script>

<div class="demo">
	<Dropdown label="Sort by" icon={mdiSort} items={orders} bind:values clearable={false} />
	<p>Sorted by: {values[0]?.value}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
