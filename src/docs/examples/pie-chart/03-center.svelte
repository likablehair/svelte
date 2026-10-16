<!-- @component Format and center
`format` writes the values as euros in the tooltip and in the total. `centerSnippet` replaces the middle of the donut and receives the `total` of the visible slices, as a number and already `formatted`. -->
<script lang="ts">
	import { PieChart } from '#lib';

	const data = {
		labels: ['Rent', 'Salaries', 'Products', 'Marketing', 'Utilities', 'Other'],
		datasets: [{ label: 'Costs', data: [2400, 9800, 3100, 1200, 640, 420] }]
	};
</script>

<PieChart {data} label="Costs of the month" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}>
	{#snippet centerSnippet({ formatted })}
		<div class="center">
			<small>This month</small>
			<strong>{formatted}</strong>
		</div>
	{/snippet}
</PieChart>

<style>
	.center {
		display: grid;
		gap: 4px;
	}

	small {
		color: var(--global-color-text-3);
	}

	strong {
		font-size: 20px;
	}
</style>
