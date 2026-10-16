<!-- @component Custom content
`icon` puts an icon at the start of the field. `itemAppendSnippet` adds content at the end of each option, here the price from `data`, and the label keeps the highlighted match; `itemIconSnippet` and `chipIconSnippet` replace the icons of options and chips, for example with avatars or flags. `chipLabelSnippet` changes the chip text and `emptySnippet` the row shown without matches. `itemLabelSnippet` replaces the label alone and `itemSnippet` the whole content of an option. -->
<script lang="ts">
	import { mdiBrush, mdiContentCut, mdiHairDryerOutline, mdiMagnify, mdiPalette } from '@mdi/js';
	import { Autocomplete, type Item } from '#lib';

	const services: Item<{ price: number }>[] = [
		{ value: 'cut', label: 'Haircut', icon: mdiContentCut, data: { price: 30 } },
		{ value: 'long', label: 'Long blow-dry', icon: mdiHairDryerOutline, data: { price: 25 } },
		{ value: 'short', label: 'Short blow-dry', icon: mdiHairDryerOutline, data: { price: 18 } },
		{ value: 'color', label: 'Color', icon: mdiPalette, data: { price: 45 } },
		{ value: 'balayage', label: 'Balayage', icon: mdiBrush, data: { price: 90 } }
	];
</script>

<div class="demo">
	<Autocomplete
		label="Services"
		placeholder="Search…"
		icon={mdiMagnify}
		items={services}
		multiple
	>
		{#snippet itemAppendSnippet({ item })}
			<span class="price">€ {item.data?.price}</span>
		{/snippet}
		{#snippet chipLabelSnippet({ selection })}
			{selection.label} · €{selection.data?.price}
		{/snippet}
		{#snippet emptySnippet({ searchText })}
			No service matches “{searchText}”
		{/snippet}
	</Autocomplete>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}

	.price {
		font-family: var(--global-font-family-mono);
		font-size: 11px;
		opacity: 0.7;
	}
</style>
