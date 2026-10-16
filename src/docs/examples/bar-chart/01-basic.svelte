<!-- @component Basic
One series: the bars take the brand gradient of the theme. `format` writes the values as euros, in short form on the axis and in full in the tooltip; `label` names the chart for screen readers. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const data = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		datasets: [
			{ label: 'Revenue', data: [18200, 21400, 19800, 24600, 28900, 31200, 26400, 17800, 29600, 33100, 35800, 41200] }
		]
	};
</script>

<BarChart {data} label="Revenue per month" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
