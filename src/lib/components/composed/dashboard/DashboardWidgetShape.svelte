<!-- @component
Small outline of a widget size, `width` columns by `height` rows, as the size buttons of the `DashboardShaper` catalog draw it: each cell is `--dashboard-widget-shape-cell-size` wide, shrunk so that the shape fits in `--dashboard-widget-shape-max-width` by `--dashboard-widget-shape-max-height`. Use it in `catalogItemSnippet` or `catalogBodySnippet` to keep the thumbnails of the default catalog. Without `title` it is decorative and hidden from screen readers. It takes the color of the text around it.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './DashboardWidgetShape.css';

	interface Props {
		/** Width in columns. */
		width: number;
		/** Height in rows. */
		height: number;
		/** Accessible name. Without it the shape is decorative and hidden from screen readers. */
		title?: string;
		/** Extra classes on the root element. */
		class?: string;
	}

	let { width, height, title, class: clazz = '' }: Props = $props();
</script>

<span
	class={['aurora-dashboard-widget-shape', clazz]}
	style:--_width={Math.max(1, width)}
	style:--_height={Math.max(1, height)}
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
></span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-dashboard-widget-shape {
			--_unit: min(
				var(--dashboard-widget-shape-cell-size, var(--dashboard-widget-shape-default-cell-size)),
				calc(var(--dashboard-widget-shape-max-width, var(--dashboard-widget-shape-default-max-width)) / var(--_width)),
				calc(var(--dashboard-widget-shape-max-height, var(--dashboard-widget-shape-default-max-height)) / var(--_height))
			);

			display: inline-block;
			box-sizing: border-box;
			flex: none;
			width: calc(var(--_unit) * var(--_width));
			height: calc(var(--_unit) * var(--_height));
			border: var(--dashboard-widget-shape-border-width, var(--dashboard-widget-shape-default-border-width)) solid
				var(--dashboard-widget-shape-color, var(--dashboard-widget-shape-default-color));
			border-radius: var(--dashboard-widget-shape-border-radius, var(--dashboard-widget-shape-default-border-radius));
			opacity: var(--dashboard-widget-shape-opacity, var(--dashboard-widget-shape-default-opacity));
			vertical-align: middle;
		}
	}
</style>
