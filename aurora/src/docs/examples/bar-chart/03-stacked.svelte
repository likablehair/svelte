<!-- @component Stacked
`stacked` puts the series on top of each other; the tooltip lists every part of the bar. `legend="top"` moves the legend above the chart. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const data = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		datasets: [
			{ label: 'Cut', data: [12, 15, 11, 18, 22, 30] },
			{ label: 'Color', data: [8, 9, 7, 12, 16, 21] },
			{ label: 'Treatments', data: [4, 3, 5, 6, 9, 12] }
		]
	};
</script>

<BarChart {data} stacked legend="top" label="Services per day" />
