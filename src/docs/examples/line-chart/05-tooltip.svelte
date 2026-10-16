<!-- @component Custom tooltip
`tooltipSnippet` replaces the content of the tooltip; it receives the `title` and one item per series with the formatted `value`, the `raw` number and the `color`. The card around it stays the one of the library. -->
<script lang="ts">
	import { LineChart } from '#lib';

	const target = 50;
	const data = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [{ label: 'Bookings', data: [38, 44, 41, 56, 63, 71, 29] }]
	};
</script>

<LineChart {data} label="Bookings per day">
	{#snippet tooltipSnippet({ title, items })}
		<strong>{title}</strong>
		{#each items as item (item.datasetIndex)}
			<span>{item.value} bookings · {(item.raw ?? 0) >= target ? 'above' : 'below'} target</span>
		{/each}
	{/snippet}
</LineChart>
