<!-- @component A single file
With `maxFiles={1}` the picker chooses one file and the zone is disabled once it is in the list: remove it to choose another. With `replace` instead, a new file takes the place of the old one and the zone stays active. -->
<script lang="ts">
	import { FileInputList } from '#lib';

	let priceList: File[] = $state([
		new File([new Uint8Array(96_000)], 'price_list_2026.csv', { type: 'text/csv', lastModified: 0 })
	]);
	let logo: File[] = $state([]);
</script>

<div class="demo">
	<FileInputList label="Price list" accept=".xlsx,.csv" maxFiles={1} bind:files={priceList} />
	<FileInputList label="Salon logo" accept="image/png,image/svg+xml" maxFiles={1} replace bind:files={logo} />
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 420px;
	}
</style>
