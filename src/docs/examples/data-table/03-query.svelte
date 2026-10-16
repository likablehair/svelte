<!-- @component The query for the backend
Without `loader` the app loads the rows: `onquerychange` receives `{ page, pageSize, sort, search, filterValue, builder }` at every change (not on mount), and the app passes back `rows`, `total` and `loading`. `builder.toJson()` is what the backend replays: the filters, the search as an OR group of `ilike` and the sorting (here the `sort` of the Client column orders by last and first name). -->
<script lang="ts">
	import { DataTable, type DataTableQuery, type TableColumn } from '#lib';
	import { bookingFields, fetchBookings, queryBookings, searchColumns, type Booking } from './bookings.js';

	const columns: TableColumn<Booking>[] = [
		{
			key: 'client',
			label: 'Client',
			sortable: true,
			sort: ({ builder, direction }) =>
				builder.orderBy('clients.lastName', direction).orderBy('clients.firstName', direction)
		},
		{ key: 'service', label: 'Service' },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];

	const first = queryBookings({ page: 1, pageSize: 5 });
	let rows = $state(first.rows);
	let total = $state(first.total);
	let loading = $state(false);
	let sent = $state('{ "modifiers": [] }');
	let request = 0;

	async function load(query: DataTableQuery) {
		sent = JSON.stringify(query.builder.toJson());
		const own = ++request;
		loading = true;
		const result = await fetchBookings(query);
		if (own !== request) return;
		rows = result.rows;
		total = result.total;
		loading = false;
	}
</script>

<div class="stack">
	<DataTable
		caption="Bookings"
		{columns}
		{rows}
		{total}
		{loading}
		pageSize={5}
		pageSizes={[5, 10, 20]}
		{searchColumns}
		filterFields={bookingFields}
		onquerychange={load}
	/>
	<code>{sent}</code>
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 12px;
	}

	code {
		color: var(--global-color-text-2);
		font-family: var(--global-font-family-mono);
		font-size: 12px;
		overflow-wrap: anywhere;
	}
</style>
