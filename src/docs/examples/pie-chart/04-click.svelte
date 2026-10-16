<!-- @component Click on a slice
`onitemclick` receives the clicked slice, for example to open the list of customers in that status. -->
<script lang="ts">
	import { PieChart } from '#lib';

	let selected = $state('Click a slice');
	const data = {
		labels: ['New', 'Active', 'Dormant', 'Lost'],
		datasets: [{ label: 'Customers', data: [64, 412, 133, 58] }]
	};
</script>

<div class="stack">
	<PieChart {data} label="Customers by status" centerLabel="customers" onitemclick={({ label, value }) => (selected = `${label}: ${value}`)} />
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
