<!-- @component Comparison with last year
The current year with `area`, the previous one `dashed` in a quiet color from the theme: only the series without `color` takes the gradient. The legend appears because there are two series. -->
<script lang="ts">
	import { LineChart } from '#lib';

	const data = {
		labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
		datasets: [
			{ label: '2026', data: [3120, 3480, 3390, 4210, 3650, 3820, 3540, 4380, 4870, 5020, 4760, 5240], area: true },
			{
				label: '2025',
				data: [2810, 2950, 3100, 3600, 3240, 3300, 3180, 3560, 3820, 3990, 3870, 4100],
				dashed: true,
				color: 'var(--global-color-text-3)'
			}
		]
	};
</script>

<LineChart {data} label="Revenue, this year and last year" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
