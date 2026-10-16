<!-- @component Horizontal
`horizontal` puts the categories on the vertical axis, one row of `--bar-chart-row-height` each: the chart grows with the rows. With a fixed `--bar-chart-height`, as here, the rows scroll inside the chart. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const countries = ['Germany', 'France', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Poland', 'Sweden', 'Portugal', 'Greece', 'Ireland', 'Denmark'];
	const values = [9.8, 7.4, 5.2, 4.9, 3.1, 2.7, 2.2, 1.9, 1.4, 1.1, 0.8, 0.6];
	const data = { labels: countries, datasets: [{ label: 'Imports', data: values.map((v) => v * 1_000_000) }] };
</script>

<BarChart
	{data}
	horizontal
	label="Imports by country"
	format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
	--bar-chart-height="18rem"
/>
