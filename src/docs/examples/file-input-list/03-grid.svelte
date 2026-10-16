<!-- @component Grid
`view="grid"` shows a card for each file, with a large thumbnail for images: handy for photos and media. `accept="image/*"` keeps other files out. -->
<script lang="ts">
	import { FileInputList } from '#lib';

	function swatch(name: string, from: string, to: string) {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="120" fill="url(#g)"/><circle cx="118" cy="38" r="18" fill="#fff" fill-opacity=".55"/></svg>`;
		return new File([svg], name, { type: 'image/svg+xml', lastModified: 0 });
	}

	let photos: File[] = $state([
		swatch('copper_balayage.svg', '#b4532a', '#f2c48d'),
		swatch('ash_blonde.svg', '#8d8f9c', '#e9e4d8'),
		swatch('midnight_blue.svg', '#16234d', '#4d8dff'),
		new File([new Uint8Array(820_000)], 'treatment_card.pdf', { type: 'application/pdf', lastModified: 0 })
	]);
</script>

<div class="demo">
	<FileInputList label="Portfolio" view="grid" bind:files={photos} description="Photos and cards" />
</div>

<style>
	.demo {
		width: 100%;
		max-width: 520px;
	}
</style>
