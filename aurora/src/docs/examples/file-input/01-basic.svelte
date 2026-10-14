<!-- @component Basic
Drop files on the zone or click it (or Tab to it and press Enter) to pick them. `bind:files` holds every chosen file and `onchange` also says which ones were just `added`. `description` tells the user what is accepted. -->
<script lang="ts">
	import { FileInput } from '#lib';

	let files: File[] = $state([]);
	let last = $state('');
</script>

<div class="demo">
	<FileInput
		label="Attachments"
		description="PDF, JPG up to 10 MB"
		bind:files
		onchange={({ added }) => (last = added.map((file) => file.name).join(', '))}
	/>
	<p>{files.length} files{last ? ` · last added: ${last}` : ''}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
		width: 100%;
		max-width: 420px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
