<!-- @component Basic
The chosen files are listed below the zone with an icon in the color of their type, the size and a button that removes them; images show a thumbnail. While files are listed the zone shrinks to one line. `bind:files` holds the list, so the app sends it when the form is saved. -->
<script lang="ts">
	import { FileInputList } from '#lib';

	let files: File[] = $state([
		new File([new Uint8Array(284_000)], 'invoice_2026_09.pdf', { type: 'application/pdf', lastModified: 0 }),
		new File([new Uint8Array(1_200_000)], 'service_price_list.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			lastModified: 0
		}),
		new File([new Uint8Array(48_500)], 'opening_hours.docx', {
			type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			lastModified: 0
		})
	]);
</script>

<div class="demo">
	<FileInputList label="Attachments" description="PDF, Office files up to 10 MB" maxSize={10_000_000} bind:files />
	<p>{files.length} files ready to be saved</p>
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
