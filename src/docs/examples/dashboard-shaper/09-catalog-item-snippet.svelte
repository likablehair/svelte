<!-- @component Custom catalog entries
`catalogItemSnippet` redraws each entry of the catalog and gets `sizeButtons`, the default size buttons with their shapes, so the app changes the layout without losing them. `DashboardWidgetShape` draws a single shape where the app needs one. -->
<script lang="ts">
	import { mdiCashMultiple, mdiChartBar, mdiStarOutline } from '@mdi/js';
	import { DashboardShaper, DashboardWidgetShape, Icon, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', description: 'Total of the invoices', icon: mdiCashMultiple, sizes: [{ width: 1, height: 1 }, { width: 2, height: 1 }] },
		{ name: 'rating', title: 'Rating', description: 'Average of the reviews', icon: mdiStarOutline, sizes: [{ width: 1, height: 1 }] },
		{ name: 'monthly', title: 'Revenue per month', description: 'Bars of the last twelve months', icon: mdiChartBar, sizes: [{ width: 2, height: 2 }] }
	];

	let widgets = $state<DashboardWidget[]>([{ id: 1, name: 'rating', left: 1, top: 1, width: 1, height: 1 }]);
</script>

<DashboardShaper bind:widgets {catalog} columns={3} editing --dashboard-shaper-row-height="88px">
	{#snippet catalogItemSnippet({ item, sizes, sizeButtons })}
		<div class="entry">
			{#if item.icon}<Icon path={item.icon} />{/if}
			<strong>{item.title}</strong>
			<span class="largest">
				<DashboardWidgetShape width={sizes.at(-1)!.width} height={sizes.at(-1)!.height} />
				up to {sizes.at(-1)!.width} × {sizes.at(-1)!.height}
			</span>
		</div>
		{@render sizeButtons()}
	{/snippet}
</DashboardShaper>

<style>
	.entry {
		display: flex;
		grid-column: 1 / -1;
		align-items: center;
		gap: 8px;
		color: var(--global-color-text);
	}

	.largest {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-inline-start: auto;
		color: var(--global-color-text-3);
		font-size: 12px;
	}
</style>
