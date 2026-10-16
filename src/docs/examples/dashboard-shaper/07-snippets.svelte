<!-- @component Custom parts
`widgetSnippet` draws each widget and gets its catalog entry and `editing` (while editing, the content is inert: the dashboard handles the pointer and the keyboard); `slotSnippet` replaces the "Add widget" buttons of the empty spaces and gets their size and `add`, which opens the catalog for that space. -->
<script lang="ts">
	import { mdiCashMultiple, mdiPlusCircleOutline, mdiStarOutline } from '@mdi/js';
	import { DashboardShaper, Icon, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	const catalog: DashboardCatalogItem[] = [
		{ name: 'revenue', title: 'Revenue', icon: mdiCashMultiple, sizes: [{ width: 1, height: 1 }, { width: 2, height: 1 }] },
		{ name: 'rating', title: 'Rating', icon: mdiStarOutline, sizes: [{ width: 1, height: 1 }] }
	];

	let widgets = $state<DashboardWidget[]>([
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 },
		{ id: 2, name: 'rating', left: 1, top: 2, width: 1, height: 1 }
	]);
</script>

<DashboardShaper bind:widgets {catalog} columns={3} rows={2} editing movable={false} --dashboard-shaper-row-height="96px">
	{#snippet widgetSnippet({ item, widget, editing })}
		<div class="card">
			<span class="title">{item?.title}</span>
			<span class="size">{editing ? `${widget.width} × ${widget.height}` : '€ 1,842'}</span>
		</div>
	{/snippet}
	{#snippet slotSnippet({ width, height, add })}
		<button type="button" class="slot" onclick={add}>
			<Icon path={mdiPlusCircleOutline} />
			{width} × {height} free
		</button>
	{/snippet}
</DashboardShaper>

<style>
	.card {
		display: flex;
		height: 100%;
		box-sizing: border-box;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: 12px;
		border: 1px solid var(--global-color-border);
		border-left: 4px solid var(--global-color-accent);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	.title {
		font-weight: 600;
	}

	.size {
		color: var(--global-color-text-3);
		font-size: 12px;
	}

	.slot {
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 0;
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-2);
		color: var(--global-color-text-2);
		font: inherit;
		cursor: pointer;
	}
</style>
