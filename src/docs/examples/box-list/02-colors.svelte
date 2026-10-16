<!-- @component Icon tones
`color` gives each box its own icon tone: `primary` (the default) or one of the six data colors of the theme. -->
<script lang="ts">
	import { BoxList, type BoxListItem } from '#lib';
	import { mdiChartBar, mdiContentCut, mdiPaletteOutline, mdiSpaOutline, mdiStorefrontOutline, mdiTagOutline } from '@mdi/js';

	const boxes: BoxListItem[] = [
		{ name: 'cut', label: 'Haircut', description: '45 min · € 38', icon: mdiContentCut, href: '#cut' },
		{ name: 'color', label: 'Full color', description: '90 min · € 65', icon: mdiPaletteOutline, color: 2, href: '#color' },
		{ name: 'treatment', label: 'Repair treatment', description: '30 min · € 25', icon: mdiSpaOutline, color: 3, href: '#treatment' },
		{ name: 'shop', label: 'Products', description: '128 items in stock', icon: mdiStorefrontOutline, color: 4, href: '#shop' },
		{ name: 'offers', label: 'Offers', description: '3 active promotions', icon: mdiTagOutline, color: 5, href: '#offers' },
		{ name: 'reports', label: 'Reports', description: 'Revenue and visits', icon: mdiChartBar, color: 6, href: '#reports' }
	];
</script>

<div class="demo">
	<BoxList {boxes} aria-label="Salon" />
</div>

<style>
	.demo {
		width: min(100%, 760px);
	}
</style>
