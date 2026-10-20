<!-- @component Basic table
`columns` declares what each column shows and `rows` are plain objects with an `id`. A `number` column is right-aligned, with monospaced digits formatted by `Intl.NumberFormat`; a `cell` snippet draws anything else, here a chip. Sortable headers sort the rows: ascending, descending, then back to the original order. -->
<script lang="ts">
	import { Chip, Table, type TableColumn } from '#lib';

	type Product = { id: number; name: string; stock: number; price: number };

	const rows: Product[] = [
		{ id: 1, name: 'Nourishing shampoo', stock: 42, price: 14.9 },
		{ id: 2, name: 'Keratin mask', stock: 4, price: 22.5 },
		{ id: 3, name: 'Argan oil', stock: 0, price: 18 },
		{ id: 4, name: 'Volume mousse', stock: 17, price: 12.4 }
	];

	const columns: TableColumn<Product>[] = [
		{ key: 'name', label: 'Product', sortable: true },
		{ key: 'stock', label: 'Stock', sortable: true, cell: stock },
		{
			key: 'price',
			label: 'Price',
			type: 'number',
			numberFormat: { style: 'currency', currency: 'EUR' },
			sortable: true
		}
	];
</script>

{#snippet stock({ value }: { value: number })}
	<Chip size="sm" variant={value === 0 ? 'error' : value < 10 ? 'warning' : 'success'}>{value}</Chip>
{/snippet}

<Table {rows} {columns} caption="Products" />
