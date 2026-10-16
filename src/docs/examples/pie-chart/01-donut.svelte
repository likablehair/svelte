<!-- @component Donut
The default: a donut with the total in the middle and `centerLabel` below it, the legend on the right with the share of every slice. A click on a legend entry hides the slice; total and shares count only the visible ones. -->
<script lang="ts">
	import { PieChart } from '#lib';

	const data = {
		labels: ['Color', 'Cut', 'Treatments', 'Retail'],
		datasets: [{ label: 'Services', data: [539, 334, 231, 180] }]
	};
</script>

<PieChart {data} label="Services by type" centerLabel="services" />
