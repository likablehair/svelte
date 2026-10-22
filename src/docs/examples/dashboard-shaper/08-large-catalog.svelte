<!-- @component Large catalog
18 widgets in 4 categories: the catalog gets a search field, which matches title and description and takes the focus when the catalog opens from the keyboard or the mouse, and filter chips that can be combined. The dialog keeps the height it opens with, so the list scrolls under the search and the chips, and the widgets fade and slide as the filters change. -->
<script lang="ts">
	import {
		mdiAccountClockOutline,
		mdiAccountGroupOutline,
		mdiAccountPlusOutline,
		mdiAccountStarOutline,
		mdiCalendarCheckOutline,
		mdiCalendarClockOutline,
		mdiCalendarRemoveOutline,
		mdiCashMultiple,
		mdiChartBar,
		mdiChartDonut,
		mdiChartLine,
		mdiFormatListBulleted,
		mdiPackageVariantClosed,
		mdiReceiptTextOutline,
		mdiStarOutline,
		mdiTagOutline,
		mdiTruckDeliveryOutline,
		mdiWarehouse
	} from '@mdi/js';
	import { DashboardShaper, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const small = [{ width: 1, height: 1 }, { width: 2, height: 1 }];
	const chart = [{ width: 2, height: 2 }, { width: 3, height: 2 }];

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', description: 'Total of the invoices in the period', icon: mdiCashMultiple, category: 'Sales', sizes: small },
		{ name: 'invoices', title: 'Invoices', description: 'Issued, paid and overdue', icon: mdiReceiptTextOutline, category: 'Sales', sizes: small },
		{ name: 'monthly', title: 'Revenue per month', description: 'Bars of the last twelve months', icon: mdiChartBar, category: 'Sales', sizes: chart },
		{ name: 'trend', title: 'Revenue trend', description: 'Line against the previous year', icon: mdiChartLine, category: 'Sales', sizes: chart },
		{ name: 'discounts', title: 'Discounts', description: 'Coupons and promotions used', icon: mdiTagOutline, category: 'Sales', sizes: small },
		{ name: 'clients', title: 'Clients', description: 'Active clients in the period', icon: mdiAccountGroupOutline, category: 'Clients', sizes: small },
		{ name: 'new-clients', title: 'New clients', description: 'First booking in the period', icon: mdiAccountPlusOutline, category: 'Clients', sizes: small },
		{ name: 'loyal', title: 'Loyal clients', description: 'Five visits or more', icon: mdiAccountStarOutline, category: 'Clients', sizes: small },
		{ name: 'rating', title: 'Rating', description: 'Average of the reviews', icon: mdiStarOutline, category: 'Clients', sizes: small },
		{ name: 'waiting', title: 'Waiting time', description: 'Minutes between arrival and service', icon: mdiAccountClockOutline, category: 'Clients', sizes: small },
		{ name: 'bookings', title: 'Bookings', description: 'Appointments of today', icon: mdiCalendarCheckOutline, category: 'Agenda', sizes: small },
		{ name: 'upcoming', title: 'Upcoming bookings', description: 'List of the next appointments', icon: mdiFormatListBulleted, category: 'Agenda', sizes: chart },
		{ name: 'cancelled', title: 'Cancellations', description: 'Cancelled and missed appointments', icon: mdiCalendarRemoveOutline, category: 'Agenda', sizes: small },
		{ name: 'occupancy', title: 'Occupancy', description: 'Share of the booked hours', icon: mdiCalendarClockOutline, category: 'Agenda', sizes: small },
		{ name: 'services', title: 'Services', description: 'Share of each service', icon: mdiChartDonut, category: 'Agenda', sizes: chart },
		{ name: 'stock', title: 'Stock', description: 'Pieces in the warehouse', icon: mdiWarehouse, category: 'Warehouse', sizes: small },
		{ name: 'low-stock', title: 'Low stock', description: 'Products under the minimum', icon: mdiPackageVariantClosed, category: 'Warehouse', sizes: chart },
		{ name: 'deliveries', title: 'Deliveries', description: 'Orders to the suppliers on the way', icon: mdiTruckDeliveryOutline, category: 'Warehouse', sizes: small }
	];

	let widgets = $state<DashboardWidget[]>([
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 },
		{ id: 2, name: 'clients', left: 3, top: 1, width: 1, height: 1 }
	]);
</script>

<DashboardShaper bind:widgets {catalog} columns={4} editing --dashboard-shaper-row-height="88px" />
