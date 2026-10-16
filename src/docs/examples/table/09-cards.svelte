<!-- @component Cards on narrow screens
When the table is narrower than `cardBreakpoint` (640px by default, measured on the table, not on the screen) every row becomes a card: the `cardTitle` column on top with the checkbox and the actions, the other columns as label and value, and the sorting in a select above. `cardBreakpoint={false}` keeps the table, which then scrolls sideways. -->
<script lang="ts">
	import { mdiPencilOutline } from '@mdi/js';
	import { Button, Chip, Table, type TableColumn } from '#lib';

	type Booking = { id: number; client: string; service: string; start: Date; status: string; amount: number };

	const rows: Booking[] = [
		{ id: 1, client: 'Luca Rossi', service: 'Cut and beard', start: new Date(2026, 8, 24, 9, 30), status: 'Confirmed', amount: 42 },
		{ id: 2, client: 'Giulia Marini', service: 'Balayage', start: new Date(2026, 8, 24, 11), status: 'Pending', amount: 120 }
	];

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client', sortable: true },
		{ key: 'service', label: 'Service' },
		{ key: 'start', label: 'Date', type: 'datetime', sortable: true },
		{ key: 'status', label: 'Status', cell: status },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];

	let selected = $state<Booking[]>([]);
</script>

{#snippet status({ value }: { value: string })}
	<Chip size="sm" variant={value === 'Confirmed' ? 'success' : 'warning'}>{value}</Chip>
{/snippet}

{#snippet actions({ row }: { row: Booking })}
	<Button buttonType="icon" variant="secondary" size="sm" icon={mdiPencilOutline} aria-label="Edit {row.client}" />
{/snippet}

<div class="phone">
	<Table {rows} {columns} selectable="multiple" bind:selected actionsSnippet={actions} />
</div>

<style>
	.phone {
		width: 100%;
		max-width: 360px;
	}
</style>
