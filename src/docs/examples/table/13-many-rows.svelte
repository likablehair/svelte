<!-- @component Thousands of rows
Above `virtualize` rows (200 by default) only the rows in view, plus a margin, are in the page: here 10,000 rows scroll inside the table (`--table-max-height`), and they would scroll with the page the same way. The columns keep the widths of the first rows. `virtualize={false}` puts every row in the page, for example to let the browser find text in all of them. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Movement = { id: number; code: string; warehouse: string; quantity: number; date: Date };

	const warehouses = ['Milan', 'Turin', 'Bologna', 'Naples'];

	const rows: Movement[] = Array.from({ length: 10000 }, (_, index) => ({
		id: index + 1,
		code: `MV-${String(index + 1).padStart(5, '0')}`,
		warehouse: warehouses[index % warehouses.length],
		quantity: ((index * 37) % 500) - 120,
		date: new Date(2026, 8, 1 + (index % 30), 8 + (index % 10))
	}));

	const columns: TableColumn<Movement>[] = [
		{ key: 'code', label: 'Code' },
		{ key: 'warehouse', label: 'Warehouse' },
		{ key: 'quantity', label: 'Quantity', type: 'number' },
		{ key: 'date', label: 'Date', type: 'datetime' }
	];
</script>

<Table --table-max-height="360px" caption="Stock movements" {rows} {columns} selectable="multiple" />
