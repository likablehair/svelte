<!-- @component Catalog with groups
With two or more `category` values the catalog shows a filter chip for each, with the number of widgets in it: no chip selected shows them all, several show their union. A `unique` widget disappears from the catalog while it is on the dashboard (here "Revenue"), for backends that keep one widget per type. The default content of a widget is its title. -->
<script lang="ts">
	import {
		mdiAccountGroupOutline,
		mdiCashMultiple,
		mdiChartBar,
		mdiChartDonut,
		mdiFormatListBulleted,
		mdiStarOutline
	} from '@mdi/js';
	import { DashboardShaper, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', icon: mdiCashMultiple, category: 'Numbers', unique: true, sizes: [{ width: 2, height: 1 }] },
		{ name: 'clients', title: 'Clients', icon: mdiAccountGroupOutline, category: 'Numbers', sizes: [{ width: 1, height: 1 }] },
		{ name: 'rating', title: 'Rating', icon: mdiStarOutline, category: 'Numbers', sizes: [{ width: 1, height: 1 }] },
		{ name: 'monthly', title: 'Revenue per month', icon: mdiChartBar, category: 'Charts', sizes: [{ width: 2, height: 2 }] },
		{ name: 'services', title: 'Services', icon: mdiChartDonut, category: 'Charts', sizes: [{ width: 2, height: 2 }] },
		{ name: 'latest', title: 'Latest bookings', icon: mdiFormatListBulleted, category: 'Lists', sizes: [{ width: 2, height: 2 }] }
	];

	let widgets = $state<DashboardWidget[]>([{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 }]);
</script>

<DashboardShaper bind:widgets {catalog} columns={4} editing --dashboard-shaper-row-height="88px" />
