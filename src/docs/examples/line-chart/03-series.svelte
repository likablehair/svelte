<!-- @component Several series
Every series takes the next color of the data palette. A click on a legend entry hides or shows the series; the value axis adapts to the visible ones. -->
<script lang="ts">
	import { LineChart } from '#lib';

	const data = {
		labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
		datasets: [
			{ label: 'Milan', data: [42, 48, 45, 52, 58, 61, 57, 66] },
			{ label: 'Rome', data: [35, 33, 39, 41, 40, 46, 50, 49] },
			{ label: 'Turin', data: [18, 22, 21, 25, 24, 28, 31, 33] }
		]
	};
</script>

<LineChart {data} label="New customers per week by store" />
