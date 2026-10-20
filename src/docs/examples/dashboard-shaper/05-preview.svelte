<!-- @component Thumbnails
`preview` draws a plain block for each widget: with a small row height it becomes a thumbnail of a saved layout, for example in the list of the dashboards of a user. -->
<script lang="ts">
	import { DashboardShaper, type DashboardWidget } from '#lib';

	const layouts: { name: string; widgets: DashboardWidget[] }[] = [
		{
			name: 'Front desk',
			widgets: [
				{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 2 },
				{ id: 2, name: 'clients', left: 3, top: 1, width: 2, height: 1 },
				{ id: 3, name: 'rating', left: 3, top: 2, width: 1, height: 1 },
				{ id: 4, name: 'noShow', left: 4, top: 2, width: 1, height: 1 },
				{ id: 5, name: 'monthly', left: 1, top: 3, width: 4, height: 2 }
			]
		},
		{
			name: 'Owner',
			widgets: [
				{ id: 1, name: 'monthly', left: 1, top: 1, width: 4, height: 2 },
				{ id: 2, name: 'services', left: 1, top: 3, width: 2, height: 2 },
				{ id: 3, name: 'latest', left: 3, top: 3, width: 2, height: 2 }
			]
		}
	];
</script>

<div class="list">
	{#each layouts as layout (layout.name)}
		<figure>
			<DashboardShaper widgets={layout.widgets} columns={4} preview --dashboard-shaper-row-height="22px" --dashboard-shaper-gap="4px" />
			<figcaption>{layout.name}</figcaption>
		</figure>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	figure {
		width: 180px;
		margin: 0;
		padding: 10px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	figcaption {
		margin-top: 8px;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
