<!-- @component List page
The page of a list of records: a header with the title, a short description and the main action, then a `DataTable` that loads from the server with search, `Filters`, column manager, row actions and selection actions. "New booking" opens a `Dialog` with a form whose submit button sits in the footer (`form` attribute); the draft lives in the page state because the dialog is unmounted when closed. Spacing between blocks is the app's choice (rem); colors, radii and fonts come from the tokens. -->
<script lang="ts">
	import { mdiDeleteOutline, mdiDownload, mdiEmailOutline, mdiPencilOutline, mdiPlus } from '@mdi/js';
	import {
		Avatar,
		Button,
		Chip,
		DataTable,
		DatePickerTextField,
		Dialog,
		Select,
		SimpleTextField,
		type DataTableAction,
		type FilterGroup,
		type TableColumn
	} from '#lib';
	import { bookingFields, fetchBookings, queryBookings, searchColumns, statuses, type Booking } from './data.js';

	const first = queryBookings({ page: 1, pageSize: 10 });
	let filterValue = $state<FilterGroup>();
	let table = $state<ReturnType<typeof DataTable>>();

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client', sortable: true, pinned: true, cell: client },
		{ key: 'service', label: 'Service' },
		{ key: 'start', label: 'Date', type: 'datetime', sortable: true },
		{ key: 'status', label: 'Status', cell: status },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];

	const selectionActions: DataTableAction<Booking>[] = [
		{ label: 'Send reminder', icon: mdiEmailOutline, onclick: () => new Promise((resolve) => setTimeout(resolve, 800)) },
		{ label: 'Export', icon: mdiDownload, onclick: () => undefined },
		{ label: 'Cancel bookings', icon: mdiDeleteOutline, variant: 'danger', onclick: ({ clear }) => clear() }
	];

	const services = ['Cut', 'Cut and beard', 'Colour', 'Balayage', 'Blow-dry'].map((label) => ({ value: label, label }));

	let open = $state(false);
	let saving = $state(false);
	let draft = $state({ client: '', service: '', date: undefined as Date | undefined });

	function create() {
		draft = { client: '', service: '', date: undefined };
		open = true;
	}

	async function save() {
		saving = true;
		await new Promise((resolve) => setTimeout(resolve, 600));
		saving = false;
		open = false;
		table?.reload();
	}
</script>

{#snippet client({ row }: { row: Booking })}
	<span class="who"><Avatar name={row.client} size="sm" />{row.client}</span>
{/snippet}

{#snippet status({ row }: { row: Booking })}
	<Chip size="sm" variant={statuses[row.status].variant}>{statuses[row.status].label}</Chip>
{/snippet}

<main class="page">
	<header class="page-header">
		<div>
			<h1>Bookings</h1>
			<p>Every appointment of the salon, past and upcoming.</p>
		</div>
		<Button icon={mdiPlus} onclick={create}>New booking</Button>
	</header>

	<DataTable
		bind:this={table}
		caption="Bookings"
		{columns}
		rows={first.rows}
		total={first.total}
		pageSize={10}
		loader={fetchBookings}
		{searchColumns}
		filterFields={bookingFields}
		bind:filterValue
		columnManager
		selectable="multiple"
		{selectionActions}
		actionsVisibility="hover"
	>
		{#snippet actionsSnippet({ row })}
			<Button buttonType="icon" variant="secondary" size="sm" icon={mdiPencilOutline} aria-label="Edit {row.client}" />
		{/snippet}
	</DataTable>
</main>

<Dialog bind:open title="New booking" closable --dialog-max-width="440px">
	<form
		id="new-booking"
		class="form"
		onsubmit={(event) => {
			event.preventDefault();
			save();
		}}
	>
		<SimpleTextField label="Client" bind:value={draft.client} required />
		<Select label="Service" placeholder="Choose a service" items={services} bind:value={draft.service} />
		<DatePickerTextField label="Date" bind:selectedDate={draft.date} />
	</form>
	{#snippet actionsSnippet({ close })}
		<Button buttonType="text" variant="secondary" onclick={close}>Cancel</Button>
		<Button type="submit" form="new-booking" loading={saving}>Create</Button>
	{/snippet}
</Dialog>

<style>
	.page {
		display: grid;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	.page-header {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		font-family: var(--global-font-family-display);
		font-size: 1.6rem;
		color: var(--global-color-text);
	}

	.page-header p {
		margin: 0.25rem 0 0;
		color: var(--global-color-text-2);
	}

	.who {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}

	.form {
		display: grid;
		gap: 1rem;
	}
</style>
