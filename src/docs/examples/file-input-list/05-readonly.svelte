<!-- @component Read-only
`readonly` shows only the list, without the zone and the remove buttons, for a record that cannot be edited. With no files it says so (`emptyLabel`). -->
<script lang="ts">
	import { FileInputList } from '#lib';

	const contract = [
		new File([new Uint8Array(512_000)], 'master_agreement_signed.pdf', { type: 'application/pdf', lastModified: 0 })
	];
</script>

<div class="demo">
	<FileInputList label="Master agreement" readonly files={contract} />
	<FileInputList label="Purchase order" readonly files={[]} emptyLabel="No purchase order yet" />
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 420px;
	}
</style>
