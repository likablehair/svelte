<!-- @component Expandable rows
`expandedSnippet` adds a button that opens a detail row under the row; `expandable` chooses which rows have one. `bind:expanded` holds the keys of the open rows. A nested `Table` inside the snippet shows sub-rows. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Client = { id: number; name: string; visits: number; notes?: string };

	const rows: Client[] = [
		{ id: 1, name: 'Luca Rossi', visits: 12, notes: 'Allergic to PPD: use the ammonia-free line. Last colour 6.3.' },
		{ id: 2, name: 'Giulia Marini', visits: 4 },
		{ id: 3, name: 'Sara Bianchi', visits: 7, notes: 'Likes short appointments, books online.' }
	];

	const columns: TableColumn<Client>[] = [
		{ key: 'name', label: 'Client' },
		{ key: 'visits', label: 'Visits', type: 'number' }
	];

	let expanded = $state<(string | number)[]>([1]);
</script>

{#snippet detail({ row }: { row: Client })}
	{row.notes}
{/snippet}

<Table {rows} {columns} expandedSnippet={detail} expandable={(row) => !!row.notes} bind:expanded />
