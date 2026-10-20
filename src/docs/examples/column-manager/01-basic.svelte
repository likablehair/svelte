<!-- @component Choose the columns
A "Columns" button opens the manager on the same `columnState` bound to the table: the table changes while the user edits, "Save view" calls `onsave` (here the app would store the view in the user's settings) and closing in any other way puts the table back as it was. -->
<script lang="ts">
	import { mdiViewColumnOutline } from '@mdi/js';
	import { Button, ColumnManager, Table, type TableColumn, type TableColumnState } from '#lib';

	type Appointment = {
		id: number;
		client: string;
		service: string;
		date: Date;
		amount: number;
		staff: string;
		duration: number;
	};

	const rows: Appointment[] = [
		{ id: 1, client: 'Luca Rossi', service: 'Cut', date: new Date(2026, 8, 24, 9, 30), amount: 28, staff: 'Giulia', duration: 30 },
		{ id: 2, client: 'Sara Conti', service: 'Colour', date: new Date(2026, 8, 24, 11), amount: 64, staff: 'Marco', duration: 90 },
		{ id: 3, client: 'Anna Galli', service: 'Blow-dry', date: new Date(2026, 8, 25, 15), amount: 22, staff: 'Giulia', duration: 45 }
	];

	const columns: TableColumn<Appointment>[] = [
		{ key: 'client', label: 'Client', pinned: true },
		{ key: 'service', label: 'Service' },
		{ key: 'date', label: 'Date', type: 'datetime' },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } },
		{ key: 'staff', label: 'Staff', hidden: true },
		{ key: 'duration', label: 'Minutes', type: 'number', hidden: true }
	];

	let columnState = $state<TableColumnState[]>();
	let open = $state(false);
	let saved = $state<string>();
</script>

<div class="stack">
	<div class="toolbar">
		<Button variant="secondary" size="sm" icon={mdiViewColumnOutline} onclick={() => (open = true)}>
			Columns
		</Button>
	</div>
	<Table {rows} {columns} bind:columnState cardBreakpoint={false} />
	<code>{saved ?? 'No view saved yet'}</code>
</div>

<ColumnManager
	bind:open
	{columns}
	bind:columnState
	onsave={({ columnState }) => (saved = JSON.stringify(columnState.map(({ key, visible }) => (visible ? key : `-${key}`))))}
/>

<style>
	.stack {
		display: flex;
		width: 100%;
		max-width: 620px;
		flex-direction: column;
		gap: 12px;
	}

	.toolbar {
		display: flex;
		justify-content: flex-end;
	}

	code {
		color: var(--global-color-text-2);
		font-family: var(--global-font-family-mono);
		font-size: 12px;
		overflow-wrap: anywhere;
	}
</style>
