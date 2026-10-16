<!-- @component Pie
`donut={false}` draws a full pie, without the total in the middle. `legend="bottom"` moves the legend below the chart. -->
<script lang="ts">
	import { PieChart } from '#lib';

	const data = {
		labels: ['Paid', 'Pending', 'Overdue'],
		datasets: [{ label: 'Invoices', data: [182, 41, 12], color: ['var(--global-color-success)', 'var(--global-color-warning)', 'var(--global-color-error)'] }]
	};
</script>

<PieChart {data} donut={false} legend="bottom" label="Invoices by status" />
