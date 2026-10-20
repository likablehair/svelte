<!-- @component Texts and style
`locale` sets the language of every text and of the numbers (here Italian); `labels` changes single texts and `rangeSnippet` the range in the footer. The `--data-table-*` variables restyle the frame, the toolbar, the footer and the selection bar, and the `--table-*` ones the table inside. -->
<script lang="ts">
	import { DataTable, type TableColumn } from '#lib';
	import { fetchBookings, queryBookings, searchColumns, type Booking } from './bookings.js';

	const first = queryBookings({ page: 1, pageSize: 5 });

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Cliente', sortable: true },
		{ key: 'service', label: 'Servizio' },
		{ key: 'amount', label: 'Importo', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];
</script>

<DataTable
	--data-table-border-radius="4px"
	--data-table-toolbar-background="var(--global-color-surface-2)"
	--data-table-footer-color="var(--global-color-text-2)"
	--table-header-background="transparent"
	locale="it"
	caption="Prenotazioni"
	{columns}
	rows={first.rows}
	total={first.total}
	loader={fetchBookings}
	pageSize={5}
	pageSizes={[5, 10]}
	{searchColumns}
	labels={{ search: 'Cerca un cliente…' }}
>
	{#snippet rangeSnippet({ page, pageCount, total })}
		Pagina <strong>{page}</strong> di {pageCount} · {total} prenotazioni
	{/snippet}
</DataTable>
