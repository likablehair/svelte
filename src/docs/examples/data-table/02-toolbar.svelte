<!-- @component Filters, columns and selection
`filterFields` adds the `Filters` to the toolbar and `filterValue` holds their tree; `toolbarSnippet` puts the buttons of the page at the end (icon-only when the table is `narrow`) and `columnManager` adds "Columns". With `selectable="multiple"` the selected rows show a floating bar with the `selectionActions`, drawn by the table (a promise returned by `onclick` shows a spinner, `info` and `disabledInfo` a tooltip, the actions that do not fit go in a menu): once every row of the page is checked it offers to select the whole result. "New" adds a booking and calls `reload()`. -->
<script lang="ts">
	import {
		mdiDeleteOutline,
		mdiDotsVertical,
		mdiDownload,
		mdiEmailOutline,
		mdiPencilOutline,
		mdiPlus,
		mdiTagOutline
	} from '@mdi/js';
	import {
		Button,
		Chip,
		DataTable,
		createFilters,
		filterCondition,
		type DataTableAction,
		type FilterGroup,
		type TableColumn
	} from '#lib';
	import {
		bookingFields,
		bookings,
		fetchBookings,
		queryBookings,
		searchColumns,
		statuses,
		type Booking
	} from './bookings.js';

	const confirmed = createFilters([filterCondition('status', 'in', [{ value: 'confirmed', label: 'Confirmed' }])]);
	const first = queryBookings({ page: 1, pageSize: 20, filterValue: confirmed });
	let filterValue = $state<FilterGroup>(confirmed);

	const columns: TableColumn<Booking>[] = [
		{ key: 'client', label: 'Client', sortable: true, pinned: true, cell: client },
		{ key: 'service', label: 'Service' },
		{ key: 'start', label: 'Date', type: 'datetime', sortable: true },
		{ key: 'status', label: 'Status', cell: status },
		{ key: 'staff', label: 'Staff', hidden: true },
		{ key: 'paid', label: 'Paid', type: 'boolean', hidden: true },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, sortable: true }
	];

	const selectionActions: DataTableAction<Booking>[] = [
		{
			label: 'Send reminder',
			icon: mdiEmailOutline,
			info: 'Sends an email to every selected client',
			onclick: () => new Promise((resolve) => setTimeout(resolve, 1200))
		},
		{ label: 'Export', icon: mdiDownload, onclick: () => undefined },
		{ label: 'Add tag', icon: mdiTagOutline, onclick: () => undefined },
		{
			label: 'Cancel bookings',
			icon: mdiDeleteOutline,
			variant: 'danger',
			onclick: ({ clear }) => clear()
		},
		{
			label: 'Archive',
			disabled: true,
			disabledInfo: 'Only past bookings can be archived',
			onclick: () => undefined
		}
	];

	let table = $state<ReturnType<typeof DataTable>>();
	let selected = $state<Booking[]>([]);

	function add() {
		bookings.unshift({ ...bookings[0], id: bookings.length + 1, client: 'New client', initials: 'NC', status: 'confirmed' });
		table?.reload();
	}
</script>

{#snippet client({ row }: { row: Booking })}
	<span class="who"><span class="avatar">{row.initials}</span>{row.client}</span>
{/snippet}

{#snippet status({ row }: { row: Booking })}
	<Chip size="sm" variant={statuses[row.status].variant}>{statuses[row.status].label}</Chip>
{/snippet}

<DataTable
	bind:this={table}
	caption="Bookings"
	{columns}
	rows={first.rows}
	total={first.total}
	loader={fetchBookings}
	{searchColumns}
	filterFields={bookingFields}
	bind:filterValue
	columnManager
	selectable="multiple"
	bind:selected
	actionsVisibility="hover"
	{selectionActions}
>
	{#snippet toolbarSnippet({ narrow })}
		<Button size="sm" icon={mdiPlus} aria-label={narrow ? 'New' : undefined} onclick={add}>
			{#if !narrow}New{/if}
		</Button>
	{/snippet}
	{#snippet actionsSnippet({ row })}
		<Button buttonType="icon" variant="secondary" size="sm" icon={mdiPencilOutline} aria-label="Edit {row.client}" />
		<Button buttonType="icon" variant="secondary" size="sm" icon={mdiDotsVertical} aria-label="More for {row.client}" />
	{/snippet}
</DataTable>

<style>
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
</style>
