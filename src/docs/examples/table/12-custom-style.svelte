<!-- @component Custom style
Every part has a CSS variable: here a compact table with a tinted header, normal-case labels and taller rows on hover. The variables also apply to the cards. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Product = { id: number; name: string; stock: number; price: number };

	const rows: Product[] = [
		{ id: 1, name: 'Nourishing shampoo', stock: 42, price: 14.9 },
		{ id: 2, name: 'Keratin mask', stock: 4, price: 22.5 },
		{ id: 3, name: 'Argan oil', stock: 0, price: 18 }
	];

	const columns: TableColumn<Product>[] = [
		{ key: 'name', label: 'Product' },
		{ key: 'stock', label: 'Stock', type: 'number' },
		{ key: 'price', label: 'Price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];
</script>

<Table
	{rows}
	{columns}
	--table-header-background="var(--global-color-primary-soft)"
	--table-header-color="var(--global-color-primary)"
	--table-header-text-transform="none"
	--table-header-font-size="13px"
	--table-header-letter-spacing="0"
	--table-cell-padding="6px 12px"
	--table-border-radius="var(--global-radius-sm)"
	--table-row-hover-background="var(--global-color-accent-soft)"
/>
