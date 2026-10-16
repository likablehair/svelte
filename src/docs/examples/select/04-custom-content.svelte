<!-- @component Icons and custom content
Each item can have an `icon`. `itemSnippet` replaces the content of the options, here with an avatar from `data`; the field shows the content of the selected option. This needs `appearance: base-select` (Chrome and Edge 135+, Safari 27+): other browsers show the labels in their native list. -->
<script lang="ts">
	import { mdiContentCut, mdiHairDryerOutline, mdiPalette } from '@mdi/js';
	import { Select, type Item } from '#lib';

	const services: Item[] = [
		{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
		{ value: 'blow-dry', label: 'Blow-dry', icon: mdiHairDryerOutline },
		{ value: 'color', label: 'Color', icon: mdiPalette }
	];

	const operators: Item<{ initials: string; hue: number }>[] = [
		{ value: 'luca', label: 'Luca Rossi', data: { initials: 'LR', hue: 220 } },
		{ value: 'giulia', label: 'Giulia Marini', data: { initials: 'GM', hue: 330 } },
		{ value: 'sara', label: 'Sara Bianchi', data: { initials: 'SB', hue: 150 } }
	];
</script>

<div class="demo">
	<Select label="Service" items={services} value="color" />
	<Select label="Operator" items={operators} value="giulia">
		{#snippet itemSnippet({ item })}
			<span class="avatar" style:--hue={item.data?.hue}>{item.data?.initials}</span>
			{item.label}
		{/snippet}
	</Select>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}

	.avatar {
		display: inline-grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: oklch(0.62 0.15 var(--hue));
		color: white;
		font-size: 10px;
		font-weight: 600;
	}
</style>
