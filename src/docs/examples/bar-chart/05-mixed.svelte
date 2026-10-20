<!-- @component Bars and a line
A series with `type: 'line'` is drawn as a line over the bars; `axis: 'right'` gives it a second value axis, written with its own `format`. -->
<script lang="ts">
	import { BarChart } from '#lib';

	const totals = [182000, 214000, 198000, 246000];
	const goods = [41000, 52000, 61000, 70000];
	const data = {
		labels: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'],
		datasets: [
			{ label: 'Total invoiced', data: totals, color: 'var(--global-color-text-3)' },
			{ label: 'Goods value', data: goods },
			{
				label: 'Goods share',
				data: goods.map((g, i) => (g / totals[i]) * 100),
				type: 'line' as const,
				axis: 'right' as const,
				format: (v: number) => `${v.toFixed(1)}%`
			}
		]
	};
</script>

<BarChart {data} label="Goods value by quarter" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
