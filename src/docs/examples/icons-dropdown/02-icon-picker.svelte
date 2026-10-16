<!-- @component Icon picker
Choosing the icon of a service from a grid. With more than 5 options the grid wraps to new rows: `columns` changes how many tiles fit in a row, and the up and down arrows move between rows. `placeholder` is shown while nothing is chosen. With `mobileDrawer` the grid opens in a bottom drawer on phones. -->
<script lang="ts">
	import {
		mdiBottleTonicOutline,
		mdiContentCut,
		mdiFaceWomanShimmerOutline,
		mdiFlowerOutline,
		mdiHairDryerOutline,
		mdiHandBackRightOutline,
		mdiLipstick,
		mdiPaletteOutline,
		mdiSpaOutline,
		mdiWaterOutline
	} from '@mdi/js';
	import { IconsDropdown, type IconItem } from '#lib';

	const icons: IconItem[] = [
		{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
		{ value: 'color', label: 'Color', icon: mdiPaletteOutline },
		{ value: 'blow-dry', label: 'Blow-dry', icon: mdiHairDryerOutline },
		{ value: 'spa', label: 'Spa', icon: mdiSpaOutline },
		{ value: 'facial', label: 'Facial', icon: mdiFaceWomanShimmerOutline },
		{ value: 'make-up', label: 'Make-up', icon: mdiLipstick },
		{ value: 'manicure', label: 'Manicure', icon: mdiHandBackRightOutline },
		{ value: 'treatment', label: 'Treatment', icon: mdiBottleTonicOutline },
		{ value: 'wash', label: 'Wash', icon: mdiWaterOutline },
		{ value: 'relax', label: 'Relax', icon: mdiFlowerOutline }
	];

	let values: IconItem[] = $state([]);
</script>

<div class="demo">
	<IconsDropdown label="Service icon" placeholder="Choose an icon" items={icons} bind:values clearable mobileDrawer />
	<p>Icon: {values[0]?.label ?? 'none'}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
