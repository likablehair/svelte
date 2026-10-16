<!-- @component Rows as links
`rowHref` turns every row into a link: a click opens it, Ctrl-click and middle click open it in a new tab, and a real link inside the row reaches it from the keyboard. Clicks on buttons, links and fields inside the row are left alone. `onrowclick` alone makes the rows clickable and focusable, for actions that are not a page. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Invoice = { id: number; number: string; client: string; total: number };

	const rows: Invoice[] = [
		{ id: 1, number: 'INV-2026-031', client: 'Luca Rossi', total: 42 },
		{ id: 2, number: 'INV-2026-032', client: 'Giulia Marini', total: 120 },
		{ id: 3, number: 'INV-2026-033', client: 'Sara Bianchi', total: 25 }
	];

	const columns: TableColumn<Invoice>[] = [
		{ key: 'number', label: 'Invoice' },
		{ key: 'client', label: 'Client' },
		{ key: 'total', label: 'Total', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];

	let clicked = $state('none');
</script>

<div class="stack">
	<Table {rows} {columns} rowHref={(row) => `#invoice-${row.id}`} />
	<Table {rows} {columns} onrowclick={(row) => (clicked = row.number)} />
	<p>Last clicked: {clicked}</p>
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 16px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
