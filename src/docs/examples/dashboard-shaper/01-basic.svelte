<!-- @component Basic
A read-only dashboard: each widget is placed by `left`, `top`, `width` and `height` (columns and rows from 1) and drawn by `widgetSnippet`, which picks the content by `name`. Only the rows in use are shown. -->
<script lang="ts">
	import { BarChart, DashboardShaper, type DashboardWidget } from '#lib';

	type Name = 'revenue' | 'clients' | 'noShow' | 'rating' | 'monthly';

	const widgets: DashboardWidget<unknown, Name>[] = [
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 2 },
		{ id: 2, name: 'clients', left: 3, top: 1, width: 2, height: 1 },
		{ id: 3, name: 'noShow', left: 3, top: 2, width: 1, height: 1 },
		{ id: 4, name: 'rating', left: 4, top: 2, width: 1, height: 1 },
		{ id: 5, name: 'monthly', left: 1, top: 3, width: 4, height: 2 }
	];

	const monthly = {
		labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
		datasets: [{ label: 'Revenue', data: [24600, 28900, 31200, 26400, 17800, 29600] }]
	};
</script>

<DashboardShaper {widgets} columns={4} --dashboard-shaper-row-height="110px">
	{#snippet widgetSnippet({ widget })}
		{#if widget.name === 'revenue'}
			<div class="card hero"><small>Revenue today</small><b class="big">€ 1,842</b></div>
		{:else if widget.name === 'clients'}
			<div class="card"><small>Clients today</small><b>18</b></div>
		{:else if widget.name === 'noShow'}
			<div class="card"><small>No-show</small><b class="error">2</b></div>
		{:else if widget.name === 'rating'}
			<div class="card"><small>Rating</small><b>4.9 ★</b></div>
		{:else}
			<div class="card">
				<small>Revenue per month</small>
				<div class="chart">
					<BarChart data={monthly} label="Revenue per month" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} --bar-chart-height="100%" />
				</div>
			</div>
		{/if}
	{/snippet}
</DashboardShaper>

<style>
	.card {
		display: flex;
		height: 100%;
		box-sizing: border-box;
		flex-direction: column;
		justify-content: space-between;
		gap: 8px;
		padding: 14px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	.hero {
		border: 0;
		background: var(--global-gradient);
		color: var(--global-color-on-primary);
	}

	small {
		color: var(--global-color-text-3);
		font-size: 12px;
	}

	.hero small {
		color: inherit;
		opacity: 0.8;
	}

	b {
		font-family: var(--global-font-family-display);
		font-size: 26px;
		letter-spacing: -0.03em;
	}

	.big {
		font-size: 38px;
	}

	.error {
		color: var(--global-color-error);
	}

	.chart {
		min-height: 0;
		flex: 1;
	}
</style>
