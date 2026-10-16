<!-- @component Toggle chips
With `onclick` the chip is a `<button>`; adding `selected` makes it a toggle with `aria-pressed`, and the selected one takes the `filled` look. The parent keeps the selection. -->
<script lang="ts">
	import { mdiContentCut, mdiHairDryerOutline, mdiPalette, mdiSpa } from '@mdi/js';
	import { Chip } from '#lib';

	const services = [
		{ value: 'cut', label: 'Cut', icon: mdiContentCut },
		{ value: 'color', label: 'Color', icon: mdiPalette },
		{ value: 'blow-dry', label: 'Blow-dry', icon: mdiHairDryerOutline },
		{ value: 'treatment', label: 'Treatment', icon: mdiSpa }
	];

	let selected = $state<string[]>(['color']);

	function toggle(value: string) {
		selected = selected.includes(value)
			? selected.filter((v) => v !== value)
			: [...selected, value];
	}
</script>

<div class="toggle">
	<div class="row" role="group" aria-label="Services">
		{#each services as service (service.value)}
			<Chip
				prependIcon={service.icon}
				selected={selected.includes(service.value)}
				onclick={() => toggle(service.value)}
			>
				{service.label}
			</Chip>
		{/each}
	</div>
	<p>Selected: {selected.join(', ') || 'none'}</p>
</div>

<style>
	.toggle {
		display: grid;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
