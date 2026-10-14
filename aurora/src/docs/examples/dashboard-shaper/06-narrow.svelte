<!-- @component Narrow
Narrower than `stackBelow` (640px of the component by default) the widgets go in one column to be read, in reading order and each as tall as its rows (left). While editing (right) the dashboard shows the real grid in small: each widget is a block with its icon, title and size, the empty spaces add widgets there; a tapped block is selected and then drags at once, resizes from its corner or is removed with its X, and any block drags after a hold. -->
<script lang="ts">
	import { mdiAccountGroupOutline, mdiCashMultiple, mdiChartBar, mdiStarOutline } from '@mdi/js';
	import { DashboardShaper, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', icon: mdiCashMultiple, sizes: [{ width: 2, height: 1 }, { width: 2, height: 2 }] },
		{ name: 'clients', title: 'Clients', icon: mdiAccountGroupOutline, sizes: [{ width: 1, height: 1 }, { width: 2, height: 1 }] },
		{ name: 'rating', title: 'Rating', icon: mdiStarOutline, sizes: [{ width: 1, height: 1 }] },
		{ name: 'monthly', title: 'Revenue per month', icon: mdiChartBar, sizes: [{ width: 4, height: 2 }] }
	];

	let widgets = $state<DashboardWidget[]>([
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 2 },
		{ id: 2, name: 'clients', left: 3, top: 1, width: 2, height: 1 },
		{ id: 3, name: 'rating', left: 3, top: 2, width: 1, height: 1 },
		{ id: 4, name: 'monthly', left: 1, top: 3, width: 4, height: 2 }
	]);
</script>

<div class="phones">
	<div class="phone">
		<DashboardShaper {widgets} {catalog} columns={4} --dashboard-shaper-row-height="64px" />
	</div>
	<div class="phone">
		<DashboardShaper bind:widgets {catalog} columns={4} editing />
	</div>
</div>

<style>
	.phones {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 24px;
	}

	.phone {
		width: 340px;
		max-width: 100%;
	}
</style>
