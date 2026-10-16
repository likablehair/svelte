<!-- @component Infinite scroll
`pagination="infinite"` loads the next batch of `pageSize` rows when the last rows come into view, inside the table when it scrolls on its own (`--table-max-height`) or in the page; the footer counts the loaded rows. Without `loader`, `onloadmore` receives the query of the next batch and the app appends its rows. -->
<script lang="ts">
	import { DataTable, type TableColumn } from '#lib';
	import { fetchBookings, queryBookings, searchColumns, type Booking } from './bookings.js';

	const first = queryBookings({ page: 1, pageSize: 25 });

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client' },
		{ key: 'service', label: 'Service' },
		{ key: 'start', label: 'Date', type: 'datetime' },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];
</script>

<DataTable
	--table-max-height="360px"
	caption="Bookings"
	{columns}
	rows={first.rows}
	total={first.total}
	loader={fetchBookings}
	pagination="infinite"
	pageSize={25}
	{searchColumns}
/>
