<script lang="ts">
	import { untrack } from 'svelte';
	import ColumnManager from '#lib/components/composed/tables/ColumnManager.svelte';
	import Table from '#lib/components/simple/tables/Table.svelte';
	import type { TableColumn, TableColumnState } from '#lib/utils/table/types.js';

	interface Props {
		columns: TableColumn[];
		rows?: Record<string, unknown>[];
		initial?: TableColumnState[];
		onsave?: (event: { columnState: TableColumnState[] }) => void;
	}

	let { columns, rows = [{ id: 1 }], initial, onsave }: Props = $props();

	let columnState = $state<TableColumnState[] | undefined>(untrack(() => initial));
	let open = $state(false);
</script>

<button type="button" onclick={() => (open = true)}>Columns</button>
<output data-testid="state">{JSON.stringify(columnState ?? null)}</output>
<Table {rows} {columns} bind:columnState cardBreakpoint={false} />
<ColumnManager bind:open {columns} bind:columnState {onsave} />
