<!-- @component Sorting on the server
With `sorting="manual"` the table does not reorder the rows: it updates `sort` and calls `onsortchange`, and the app loads the rows in the new order, here with a fake request. `DataTable` does this for you, with the pages, the search and the filters in one query. -->
<script lang="ts">
	import { Table, type TableColumn, type TableSort } from '#lib';

	type City = { id: number; name: string; population: number };

	const all: City[] = [
		{ id: 1, name: 'Milan', population: 1371000 },
		{ id: 2, name: 'Naples', population: 913000 },
		{ id: 3, name: 'Turin', population: 841000 },
		{ id: 4, name: 'Rome', population: 2749000 }
	];

	const columns: TableColumn<City>[] = [
		{ key: 'name', label: 'City', sortable: true },
		{ key: 'population', label: 'Population', type: 'number', sortable: true }
	];

	let rows = $state(all);
	let sort = $state<TableSort>();
	let loading = $state(false);

	async function load(next: TableSort | undefined) {
		loading = true;
		await new Promise((resolve) => setTimeout(resolve, 600));
		const sign = next?.direction === 'desc' ? -1 : 1;
		rows = next
			? [...all].sort((a, b) =>
					next.key === 'name' ? sign * a.name.localeCompare(b.name) : sign * (a.population - b.population)
				)
			: all;
		loading = false;
	}
</script>

<Table {rows} {columns} sorting="manual" bind:sort {loading} onsortchange={(event) => load(event.sort)} />
