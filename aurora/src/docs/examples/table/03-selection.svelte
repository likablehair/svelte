<!-- @component Selection and row actions
`selectable="multiple"` adds a checkbox to each row and "select all" in the header; shift-click selects a range. `bind:selected` holds the selected rows. `actionsSnippet` puts buttons in a column that stays on the right while the table scrolls; `actionsVisibility="hover"` shows them only on the row under the pointer or with the focus, for dense tables. -->
<script lang="ts">
	import { mdiDotsVertical, mdiPencilOutline } from '@mdi/js';
	import { Button, Chip, Table, type TableColumn } from '#lib';

	type Booking = {
		id: number;
		client: string;
		initials: string;
		service: string;
		start: Date;
		status: 'confirmed' | 'pending' | 'cancelled';
		amount: number;
	};

	const rows: Booking[] = [
		{ id: 1, client: 'Luca Rossi', initials: 'LR', service: 'Cut and beard', start: new Date(2026, 8, 24, 9, 30), status: 'confirmed', amount: 42 },
		{ id: 2, client: 'Giulia Marini', initials: 'GM', service: 'Balayage', start: new Date(2026, 8, 24, 11), status: 'pending', amount: 120 },
		{ id: 3, client: 'Sara Bianchi', initials: 'SB', service: 'Blow-dry', start: new Date(2026, 8, 24, 15, 15), status: 'cancelled', amount: 25 },
		{ id: 4, client: 'Marco Neri', initials: 'MN', service: 'Cut', start: new Date(2026, 8, 24, 17), status: 'confirmed', amount: 28 }
	];

	const statuses = {
		confirmed: { label: 'Confirmed', variant: 'success' },
		pending: { label: 'Pending', variant: 'warning' },
		cancelled: { label: 'Cancelled', variant: 'error' }
	} as const;

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client', sortable: true, cell: client },
		{ key: 'service', label: 'Service' },
		{ key: 'start', label: 'Date', type: 'datetime', sortable: true },
		{ key: 'status', label: 'Status', cell: status },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];

	let selected = $state<Booking[]>([rows[0]]);
</script>

{#snippet client({ row }: { row: Booking })}
	<span class="who"><span class="avatar">{row.initials}</span>{row.client}</span>
{/snippet}

{#snippet status({ row }: { row: Booking })}
	<Chip size="sm" variant={statuses[row.status].variant}>{statuses[row.status].label}</Chip>
{/snippet}

{#snippet actions({ row }: { row: Booking })}
	<Button buttonType="icon" variant="secondary" size="sm" icon={mdiPencilOutline} aria-label="Edit {row.client}" />
	<Button buttonType="icon" variant="secondary" size="sm" icon={mdiDotsVertical} aria-label="More for {row.client}" />
{/snippet}

<div class="stack">
	<Table {rows} {columns} selectable="multiple" bind:selected actionsSnippet={actions} />
	<p>{selected.length} selected: {selected.map((row) => row.client).join(', ') || 'none'}</p>
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 12px;
	}

	.who {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.avatar {
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-size: 11px;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
