<!-- @component Sizes and states
`size` changes the height of the buttons, `disabled` turns the whole group off, `dot={false}` hides the state dot of the text-only buttons. -->
<script lang="ts">
	import { ToggleList, type Item } from '#lib';

	const days: Item[] = [
		{ value: 1, label: 'Mon' },
		{ value: 2, label: 'Tue' },
		{ value: 3, label: 'Wed' },
		{ value: 4, label: 'Thu' },
		{ value: 5, label: 'Fri' }
	];

	let small = $state<Item[]>([days[0], days[2]]);
	let large = $state<Item[]>([days[1]]);
	let off = $state<Item[]>([days[4]]);
</script>

<div class="demo">
	<ToggleList items={days} bind:values={small} size="sm" dot={false} aria-label="Opening days, small" />
	<ToggleList items={days} bind:values={large} size="lg" aria-label="Opening days, large" />
	<ToggleList items={days} bind:values={off} disabled aria-label="Opening days, disabled" />
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}
</style>
