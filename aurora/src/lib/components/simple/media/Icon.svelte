<!-- @component
SVG icon from a path on a 24×24 viewBox, for example from `@mdi/js`. It inherits color and size from the surrounding text (`--icon-size` and `--icon-color` change them). Without `title` it is decorative and hidden from screen readers. It is not clickable: for a clickable icon use `Button` with `buttonType="text"`, `icon` and `aria-label`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Icon.css';

	interface Props {
		/** SVG path on a 24×24 viewBox, for example from `@mdi/js` (`import { mdiPlus } from '@mdi/js'`). */
		path: string;
		/** Accessible name. Without it the icon is decorative and hidden from screen readers. */
		title?: string;
		/** Extra classes on the `<svg>` element. */
		class?: string;
	}

	let { path, title, class: clazz = '' }: Props = $props();
</script>

<svg
	class="aurora-icon {clazz}"
	viewBox="0 0 24 24"
	role={title ? 'img' : undefined}
	aria-hidden={title ? undefined : 'true'}
	focusable="false"
>
	{#if title}<title>{title}</title>{/if}
	<path d={path} />
</svg>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-icon {
			display: inline-block;
			flex-shrink: 0;
			width: var(--icon-size, var(--icon-default-size));
			height: var(--icon-size, var(--icon-default-size));
			fill: var(--icon-color, var(--icon-default-color));
			vertical-align: middle;
		}
	}
</style>
