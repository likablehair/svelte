<!-- @component Accepted files
`accept` limits the picker and is checked on dropped files too; `maxSize` (in bytes, 1 MB = 1,000,000) and `maxFiles` refuse what does not fit. Refused files are not added: a message under the zone says why and `onreject` receives them with the reason. With `maxFiles={1}` the picker chooses a single file. -->
<script lang="ts">
	import { FileInput, type FileRejection } from '#lib';

	let photos: File[] = $state([]);
	let refused: FileRejection[] = $state([]);
</script>

<div class="demo">
	<FileInput
		label="Salon photos"
		accept="image/*"
		maxSize={5_000_000}
		maxFiles={3}
		description="Images up to 5 MB, at most 3"
		bind:files={photos}
		onreject={({ rejected }) => (refused = rejected)}
	/>
	<FileInput label="Price list" accept=".xlsx,.csv" maxFiles={1} description="Excel or CSV" />
	<p>{photos.length} / 3 photos · last refused: {refused.map((item) => item.reason).join(', ') || 'none'}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 420px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
