<!-- @component Dashboard page
Numbers first, then trends: a `PageHeader` with the `PeriodPicker` that drives the page, a row of indicator cards (value, change as a `Chip`), a `BarChart` and a `LineChart` side by side, and a `Table` of the best services. Charts take the data colors of the theme, so the page follows themes and dark mode without extra code. -->
<script lang="ts">
	import { mdiTrendingDown, mdiTrendingUp } from '@mdi/js';
	import {
		BarChart,
		Chip,
		LineChart,
		PageHeader,
		PeriodPicker,
		Table,
		type TableColumn,
		type TimespanSettings
	} from '#lib';

	let timespanSettings = $state<TimespanSettings>({ method: 'quick', values: 'this-month' });

	const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
	const indicators = [
		{ label: 'Revenue', value: money.format(35800), change: 8.2 },
		{ label: 'Bookings', value: '412', change: 4.1 },
		{ label: 'New clients', value: '38', change: -6.5 },
		{ label: 'No-shows', value: '2.1%', change: -0.4 }
	];

	const weeks = ['W36', 'W37', 'W38', 'W39', 'W40'];
	const revenue = {
		labels: weeks,
		datasets: [
			{ label: 'Services', data: [6200, 7100, 6800, 7900, 7800] },
			{ label: 'Products', data: [900, 1100, 1250, 1000, 1300] }
		]
	};
	const bookings = {
		labels: weeks,
		datasets: [
			{ label: 'Online', data: [48, 55, 61, 66, 72] },
			{ label: 'At the desk', data: [40, 38, 35, 37, 33] }
		]
	};

	type Service = { name: string; bookings: number; revenue: number };
	const services: Service[] = [
		{ name: 'Balayage', bookings: 64, revenue: 7680 },
		{ name: 'Colour', bookings: 92, revenue: 5888 },
		{ name: 'Cut and beard', bookings: 120, revenue: 5040 },
		{ name: 'Cut', bookings: 136, revenue: 3808 }
	];
	const columns: TableColumn<Service>[] = [
		{ key: 'name', label: 'Service' },
		{ key: 'bookings', label: 'Bookings', type: 'number', sortable: true },
		{ key: 'revenue', label: 'Revenue', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];
</script>

<main class="page">
	<PageHeader title="Overview">
		{#snippet actionsSnippet()}
			<PeriodPicker bind:timespanSettings locale="en" />
		{/snippet}
	</PageHeader>

	<div class="indicators">
		{#each indicators as indicator (indicator.label)}
			<section class="card">
				<h2>{indicator.label}</h2>
				<p class="value">{indicator.value}</p>
				<Chip
					size="sm"
					variant={indicator.change >= 0 === (indicator.label !== 'No-shows') ? 'success' : 'error'}
					prependIcon={indicator.change >= 0 ? mdiTrendingUp : mdiTrendingDown}
				>
					{indicator.change > 0 ? '+' : ''}{indicator.change}%
				</Chip>
			</section>
		{/each}
	</div>

	<div class="charts">
		<section class="card">
			<h2>Revenue per week</h2>
			<BarChart data={revenue} stacked label="Revenue per week" format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
		</section>
		<section class="card">
			<h2>Bookings per channel</h2>
			<LineChart data={bookings} label="Bookings per channel" />
		</section>
	</div>

	<section class="card">
		<h2>Best services</h2>
		<Table caption="Best services" rows={services} {columns} rowKey="name" />
	</section>
</main>

<style>
	.page {
		display: grid;
		gap: 1.25rem;
		padding: 1.5rem;
	}

	.indicators {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
		gap: 1rem;
	}

	.charts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1rem;
	}

	.card {
		display: grid;
		align-content: start;
		justify-items: start;
		gap: 0.5rem;
		min-width: 0;
		padding: 1.25rem;
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
		box-shadow: var(--global-shadow-sm);
	}

	.card > :global(*) {
		justify-self: stretch;
	}

	.card > :global(.aurora-chip) {
		justify-self: start;
	}

	h2 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--global-color-text-2);
	}

	.value {
		margin: 0;
		font-family: var(--global-font-family-display);
		font-size: 1.8rem;
		font-weight: 600;
		color: var(--global-color-text);
	}
</style>
