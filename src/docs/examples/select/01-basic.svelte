<!-- @component Basic
`bind:value` holds the `value` of the selected item, with its type (here a number). With `placeholder` the field starts empty and `value` stays `undefined` until a choice is made; without it the first item is selected, as in a native select. -->
<script lang="ts">
	import { Select, type Item } from '#lib';

	const durations: Item[] = [
		{ value: 15, label: '15 minutes' },
		{ value: 30, label: '30 minutes' },
		{ value: 45, label: '45 minutes' },
		{ value: 60, label: '1 hour' },
		{ value: 90, label: '1 hour 30 minutes' }
	];

	let duration: number | string | undefined = $state();
	let room: number | string | undefined = $state();
</script>

<div class="demo">
	<Select
		label="Duration"
		placeholder="Choose a duration"
		items={durations}
		bind:value={duration}
		hint="Length of the appointment"
	/>
	<Select
		label="Room"
		items={[
			{ value: 'a', label: 'Room A' },
			{ value: 'b', label: 'Room B' },
			{ value: 'c', label: 'Room C' }
		]}
		bind:value={room}
	/>
	<p>Duration: {duration ?? 'undefined'} · Room: {room}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
