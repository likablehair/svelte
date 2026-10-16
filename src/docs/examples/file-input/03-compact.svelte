<!-- @component Compact
`compact` puts the icon beside the texts on a single line, for toolbars and dense forms. `title`, `browseLabel`, `description` and `icon` replace the texts and the icon. -->
<script lang="ts">
	import { FileInput } from '#lib';
	import { mdiTrayArrowUp } from '@mdi/js';
</script>

<div class="demo">
	<FileInput compact description="CSV, at most 2 MB" accept=".csv" maxSize={2_000_000} />
	<FileInput
		compact
		icon={mdiTrayArrowUp}
		title="Import the customers"
		browseLabel="choose a file"
		maxFiles={1}
	/>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 420px;
	}
</style>
