<!-- @component Rows from a loader
`loader` receives the query (page, page size, sorting, search, filters and the `builder` for the backend) and returns `{ rows, total }`; the table shows the loading and keeps only the newest answer. The first page comes from the `load` of the page (`rows` and `total`), so it is not loaded twice. `searchColumns` adds the search field: the text reaches the query as an `ilike` on those columns. -->
<script lang="ts">
	import { DataTable, type TableColumn } from '#lib';
	import { fetchBookings, queryBookings, searchColumns, type Booking } from './bookings.js';

	const first = queryBookings({ page: 1, pageSize: 20 });

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client', sortable: true },
		{ key: 'service', label: 'Service', sortable: true },
		{ key: 'start', label: 'Date', type: 'datetime', sortable: true },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];
</script>

<DataTable
	caption="Bookings"
	{columns}
	rows={first.rows}
	total={first.total}
	loader={fetchBookings}
	{searchColumns}
/>
