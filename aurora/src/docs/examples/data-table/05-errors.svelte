<!-- @component Loading errors
When the `loader` fails the table shows the error with "Retry" (in place of the rows, or under them when the rows of another page are on screen) and calls `onerror`; `errorSnippet` replaces it. Here the server is down until the switch is turned on. -->
<script lang="ts">
	import { DataTable, Switch, type DataTableQuery, type TableColumn } from '#lib';
	import { fetchBookings, type Booking } from './bookings.js';

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client' },
		{ key: 'service', label: 'Service' },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];

	let online = $state(false);

	function loader(query: DataTableQuery & { signal: AbortSignal }) {
		if (!online) return Promise.reject(new Error('Service unavailable'));
		return fetchBookings(query);
	}
</script>

<div class="stack">
	<Switch bind:checked={online} label="Server online" />
	<DataTable caption="Bookings" {columns} {loader} pageSize={5} pageSizes={[5]} />
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
</style>
