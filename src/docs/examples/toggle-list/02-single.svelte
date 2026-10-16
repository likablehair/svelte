<!-- @component Single choice
With `multiple={false}` a click replaces the selection and the pressed button stays on, like a group of radio buttons; `mandatory={false}` lets a second click turn it off. Text-only buttons show the state dot of `ActivableButton`. -->
<script lang="ts">
	import { ToggleList, type Item } from '#lib';

	const periods: Item[] = [
		{ value: 'day', label: 'Day' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' }
	];
	const statuses: Item[] = [
		{ value: 'confirmed', label: 'Confirmed' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	let period = $state<Item[]>([periods[1]]);
	let status = $state<Item[]>([]);
</script>

<div class="demo">
	<ToggleList items={periods} bind:values={period} multiple={false} aria-label="Period" />
	<ToggleList items={statuses} bind:values={status} multiple={false} mandatory={false} aria-label="Status" />
	<p>Period: {period[0]?.label ?? 'none'} · Status: {status[0]?.label ?? 'any'}</p>
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
