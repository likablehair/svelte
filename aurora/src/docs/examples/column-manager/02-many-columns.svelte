<!-- @component Many columns
With more than 7 columns a search field filters both lists by name, type and description. Each column shows the icon and the name of its `type` (a currency `numberFormat` reads "Currency"), or its own `icon`, and its `description` (or its `info`, the tooltip in the header). `required` columns have no button to hide them, and the last visible column cannot be hidden either. -->
<script lang="ts">
	import { mdiAccountOutline, mdiListStatus, mdiPhoneOutline, mdiViewColumnOutline } from '@mdi/js';
	import { Button, ColumnManager, Table, type TableColumn, type TableColumnState } from '#lib';

	type Appointment = {
		id: number;
		client: string;
		service: string;
		date: Date;
		amount: number;
		status: string;
		staff: string;
		duration: number;
		phone: string;
		lastVisit: Date;
		payment: string;
		location: string;
		notes: string;
	};

	const rows: Appointment[] = [
		{
			id: 1,
			client: 'Luca Rossi',
			service: 'Cut',
			date: new Date(2026, 8, 24, 9, 30),
			amount: 28,
			status: 'Confirmed',
			staff: 'Giulia',
			duration: 30,
			phone: '+39 333 123 4567',
			lastVisit: new Date(2026, 7, 20),
			payment: 'Card',
			location: 'Milan Brera',
			notes: 'Prefers mornings'
		},
		{
			id: 2,
			client: 'Sara Conti',
			service: 'Colour',
			date: new Date(2026, 8, 24, 11),
			amount: 64,
			status: 'Pending',
			staff: 'Marco',
			duration: 90,
			phone: '+39 347 765 4321',
			lastVisit: new Date(2026, 6, 2),
			payment: 'Cash',
			location: 'Turin Centre',
			notes: ''
		}
	];

	const columns: TableColumn<Appointment>[] = [
		{ key: 'client', label: 'Client', icon: mdiAccountOutline, description: 'Name of the client', required: true, pinned: true },
		{ key: 'service', label: 'Service', description: 'For example cut, colour, blow-dry' },
		{ key: 'date', label: 'Date', type: 'datetime', description: 'Day and time of the appointment' },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, description: 'Total with VAT' },
		{ key: 'status', label: 'Status', icon: mdiListStatus, description: 'Confirmed, pending or cancelled' },
		{ key: 'staff', label: 'Staff', icon: mdiAccountOutline, description: 'Who does the service', hidden: true },
		{ key: 'duration', label: 'Duration', type: 'number', description: 'Expected minutes', hidden: true },
		{ key: 'phone', label: 'Phone', icon: mdiPhoneOutline, description: 'Main contact of the client', hidden: true },
		{ key: 'lastVisit', label: 'Last visit', type: 'date', description: 'Last completed appointment', hidden: true },
		{ key: 'payment', label: 'Payment method', description: 'Cash, card or transfer', hidden: true },
		{ key: 'location', label: 'Location', description: 'Shop of the appointment', hidden: true },
		{ key: 'notes', label: 'Internal notes', description: 'Visible to the staff only', hidden: true }
	];

	let columnState = $state<TableColumnState[]>();
	let open = $state(false);
</script>

<div class="stack">
	<div class="toolbar">
		<Button variant="secondary" size="sm" icon={mdiViewColumnOutline} onclick={() => (open = true)}>
			Columns
		</Button>
	</div>
	<Table {rows} {columns} bind:columnState cardBreakpoint={false} />
</div>

<ColumnManager bind:open {columns} bind:columnState />

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
</style>
