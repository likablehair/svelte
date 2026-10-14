<!-- @component Colors
`color` takes any CSS color, also the tokens of the theme with `var(--…)`: they follow light and dark mode by themselves. An array gives one color per bar, here to mark the days under target. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const values = [28, 34, 26, 41, 52, 48, 19];
	const data = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [
			{
				label: 'Appointments',
				data: values,
				color: values.map((v) => (v < 30 ? 'var(--global-color-warning)' : 'var(--global-color-success)'))
			}
		]
	};
</script>

<BarChart {data} label="Appointments per day" />
