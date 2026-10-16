<!-- @component Footer and totals
`footer` adds a row at the bottom of the table: a text, or a snippet that receives every row, for example to show a total formatted like the column. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Line = { id: number; service: string; quantity: number; amount: number };

	const rows: Line[] = [
		{ id: 1, service: 'Cut', quantity: 18, amount: 504 },
		{ id: 2, service: 'Colour', quantity: 9, amount: 765 },
		{ id: 3, service: 'Blow-dry', quantity: 23, amount: 575 }
	];

	const euro = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

	const columns: TableColumn<Line>[] = [
		{ key: 'service', label: 'Service', footer: 'Total' },
		{ key: 'quantity', label: 'Quantity', type: 'number', footer: quantity },
		{ key: 'amount', label: 'Amount', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' }, footer: amount }
	];
</script>

{#snippet quantity({ rows }: { rows: Line[] })}
	{rows.reduce((sum, row) => sum + row.quantity, 0)}
{/snippet}

{#snippet amount({ rows }: { rows: Line[] })}
	{euro.format(rows.reduce((sum, row) => sum + row.amount, 0))}
{/snippet}

<Table {rows} {columns} />
