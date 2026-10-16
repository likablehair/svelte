<!-- @component Click on a bar
`onitemclick` receives the clicked bar: its `label`, `value` and position. Use it to open the details of a category. The pointer becomes a hand over the bars. -->
<script lang="ts">
	import { BarChart } from '#lib';

	let selected = $state('Click a bar');
	const data = {
		labels: ['Active', 'Suspended', 'Expired', 'Draft'],
		datasets: [{ label: 'Contracts', data: [128, 14, 37, 9] }]
	};
</script>

<div class="stack">
	<BarChart {data} label="Contracts by status" onitemclick={({ label, value }) => (selected = `${label}: ${value}`)} />
	<p>{selected}</p>
</div>

<style>
	.stack {
		display: grid;
		inline-size: 100%;
		gap: 8px;
	}

	p {
		margin: 0;
	}
</style>
