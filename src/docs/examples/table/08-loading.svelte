<!-- @component Loading and no data
While `loading` the table shows a progress bar under the header and dims the rows, or placeholder rows when it has none yet (`loadingRows`). Without rows it shows `NoData`, with `noDataTitle` or `noDataSnippet`. -->
<script lang="ts">
	import { Switch, Table, type TableColumn } from '#lib';

	type Product = { id: number; name: string; price: number };

	const all: Product[] = [
		{ id: 1, name: 'Nourishing shampoo', price: 14.9 },
		{ id: 2, name: 'Keratin mask', price: 22.5 }
	];

	const columns: TableColumn<Product>[] = [
		{ key: 'name', label: 'Product' },
		{ key: 'price', label: 'Price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
	];

	let loading = $state(false);
	let empty = $state(false);
</script>

<div class="stack">
	<div class="controls">
		<Switch bind:checked={loading} label="Loading" />
		<Switch bind:checked={empty} label="No rows" />
	</div>
	<Table rows={empty ? [] : all} {columns} {loading} loadingRows={2} noDataTitle="No products yet" />
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 12px;
	}

	.controls {
		display: flex;
		gap: 24px;
	}
</style>
