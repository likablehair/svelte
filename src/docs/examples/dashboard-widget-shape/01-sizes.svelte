<!-- @component Sizes
The outline of a widget size, as in the size buttons of the `DashboardShaper` catalog: each cell is 7px wide, shrunk so that wide or tall sizes fit in 28 × 14px. It takes the color of the text; `title` makes it an image with an accessible name. -->
<script lang="ts">
	import { DashboardWidgetShape } from '#lib';

	const sizes = [
		{ width: 1, height: 1 },
		{ width: 2, height: 1 },
		{ width: 2, height: 2 },
		{ width: 4, height: 2 },
		{ width: 6, height: 1 },
		{ width: 1, height: 3 }
	];
</script>

<div class="row">
	{#each sizes as size (`${size.width}x${size.height}`)}
		<span class="size">
			<DashboardWidgetShape width={size.width} height={size.height} title="{size.width} × {size.height}" />
			{size.width} × {size.height}
		</span>
	{/each}
	<span class="size accent">
		<DashboardWidgetShape width={3} height={2} --dashboard-widget-shape-cell-size="12px" --dashboard-widget-shape-max-width="48px" --dashboard-widget-shape-max-height="32px" --dashboard-widget-shape-opacity="1" />
		larger
	</span>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}

	.size {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--global-color-text-2);
		font-family: var(--global-font-family-mono);
		font-size: 12px;
	}

	.accent {
		color: var(--global-color-primary);
	}
</style>
