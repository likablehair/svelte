<!-- @component Texts, pins and style
`pinnable={false}` removes the pin buttons (columns pinned by `columns` stay pinned), `labels` changes any text on top of those of `locale`, and the `--column-manager-*` variables change the look of this instance only. -->
<script lang="ts">
	import { mdiTableCog } from '@mdi/js';
	import { Button, ColumnManager, Table, type TableColumn, type TableColumnState } from '#lib';

	type Product = { id: number; sku: string; name: string; price: number; stock: number; active: boolean };

	const rows: Product[] = [
		{ id: 1, sku: 'SH-001', name: 'Shampoo', price: 12.5, stock: 40, active: true },
		{ id: 2, sku: 'CO-014', name: 'Conditioner', price: 14, stock: 0, active: false }
	];

	const columns: TableColumn<Product>[] = [
		{ key: 'sku', label: 'Code', pinned: true },
		{ key: 'name', label: 'Product' },
		{ key: 'price', label: 'Price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } },
		{ key: 'stock', label: 'Stock', type: 'number' },
		{ key: 'active', label: 'On sale', type: 'boolean' }
	];

	let columnState = $state<TableColumnState[]>();
	let open = $state(false);
</script>

<div class="stack">
	<div class="toolbar">
		<Button variant="secondary" size="sm" icon={mdiTableCog} onclick={() => (open = true)}>Layout</Button>
	</div>
	<Table {rows} {columns} bind:columnState cardBreakpoint={false} />
</div>

<ColumnManager
	bind:open
	{columns}
	bind:columnState
	pinnable={false}
	labels={{ title: 'Product list layout', save: 'Apply' }}
	--column-manager-width="320px"
	--column-manager-type-icon-background="var(--global-color-surface-2)"
	--column-manager-type-icon-color="var(--global-color-text-2)"
	--column-manager-item-border-radius="var(--global-radius-sm)"
/>

<style>
	.stack {
		display: flex;
		width: 100%;
		max-width: 520px;
		flex-direction: column;
		gap: 12px;
	}

	.toolbar {
		display: flex;
		justify-content: flex-end;
	}
</style>
