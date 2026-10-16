<!-- @component Pinned and resizable columns
`pinned` columns stay on the left while the table scrolls sideways, and are moved before the others. With `resizable` the edge of each header can be dragged, or moved with the arrow keys when it has the focus (Shift for bigger steps). `bind:columnState` holds order, visibility, widths and pins as plain data, ready to be saved; `columnsKey` saves it in the browser instead. `cardBreakpoint={false}` keeps the table on narrow screens. -->
<script lang="ts">
	import { Table, type TableColumn, type TableColumnState } from '#lib';

	type Shift = { id: number; name: string; [day: string]: number | string };

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const rows: Shift[] = ['Giulia', 'Luca', 'Sara', 'Marco'].map((name, index) => ({
		id: index + 1,
		name,
		...Object.fromEntries(days.map((day, position) => [day, ((index + 2) * (position + 3)) % 11]))
	}));

	const columns: TableColumn<Shift>[] = [
		{ key: 'name', label: 'Operator', pinned: true, minWidth: '120px' },
		...days.map((day): TableColumn<Shift> => ({ key: day, label: day, type: 'number', minWidth: '110px' }))
	];

	let columnState = $state<TableColumnState[]>();
</script>

<div class="stack">
	<Table {rows} {columns} resizable bind:columnState cardBreakpoint={false} />
	<code>{JSON.stringify(columnState?.filter((column) => column.width) ?? 'not changed yet')}</code>
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 12px;
		max-width: 560px;
	}

	code {
		color: var(--global-color-text-2);
		font-family: var(--global-font-family-mono);
		font-size: 12px;
		overflow-wrap: anywhere;
	}
</style>
