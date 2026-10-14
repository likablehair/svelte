<!-- @component Add and remove only
`movable={false}` and `resizable={false}` keep the v4 behaviour: while editing, widgets are only added (with the size chosen in the catalog) and removed. Here the layout has at most `rows={2}`, so the free band below the widgets stops there. -->
<script lang="ts">
	import { mdiAccountGroupOutline, mdiCashMultiple, mdiStarOutline } from '@mdi/js';
	import { DashboardShaper, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', icon: mdiCashMultiple, sizes: [{ width: 2, height: 1 }] },
		{ name: 'clients', title: 'Clients', icon: mdiAccountGroupOutline, sizes: [{ width: 1, height: 1 }] },
		{ name: 'rating', title: 'Rating', icon: mdiStarOutline, sizes: [{ width: 1, height: 1 }] }
	];

	let widgets = $state<DashboardWidget[]>([
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 },
		{ id: 2, name: 'clients', left: 3, top: 1, width: 1, height: 1 }
	]);
</script>

<DashboardShaper
	bind:widgets
	{catalog}
	columns={4}
	rows={2}
	editing
	movable={false}
	resizable={false}
	--dashboard-shaper-row-height="88px"
/>
