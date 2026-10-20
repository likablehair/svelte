<!-- @component Basic
One series takes the brand gradient of the theme with a soft glow; `area` fills the space below the line. While hovering, a vertical line marks the month and the tooltip shows the value written with `format`. -->
<script lang="ts">
	import { LineChart } from '#lib';

	const data = {
		labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
		datasets: [
			{
				label: 'Revenue',
				data: [3120, 3480, 3390, 4210, 3650, 3820, 3540, 4380, 4870, 5020, 4760, 5240],
				area: true
			}
		]
	};
</script>

<LineChart {data} label="Revenue, last 12 months" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
