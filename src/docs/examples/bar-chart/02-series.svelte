<!-- @component Several series
Series stand side by side and take the colors of the data palette in order. With two or more series the legend appears below the chart: a click on an entry hides or shows that series. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const data = {
		labels: ['Q1', 'Q2', 'Q3', 'Q4'],
		datasets: [
			{ label: '2024', data: [412, 468, 390, 521] },
			{ label: '2025', data: [455, 502, 448, 590] },
			{ label: '2026', data: [498, 561, 512, 640] }
		]
	};
</script>

<BarChart {data} label="Appointments per quarter" />
