<!-- @component
Empty state: an icon, a title, an optional description and optional actions (`children`), centered in the available space. `size="md"` is the full illustration with the icon in a framed box, for pages and panels; `size="sm"` keeps only the icon and the text, for tables, lists and cards. Its size is exposed as `data-size` for app CSS.
-->
<script lang="ts" module>
	const DATABASE_OFF_ICON =
		'M2.39 1.73L1.11 3L4.21 6.1C4.08 6.39 4 6.69 4 7V17C4 19.21 7.59 21 12 21C14.3 21 16.38 20.5 17.84 19.73L20.84 22.73L22.11 21.46L2.39 1.73M6 9.64C6.76 10.07 7.7 10.42 8.76 10.65L12.11 14C12.07 14 12.04 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64M12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C12.68 16 13.34 15.95 14 15.87L16.34 18.23C15.33 18.65 13.87 19 12 19M8.64 5.44L7.06 3.86C8.42 3.33 10.13 3 12 3C16.42 3 20 4.79 20 7V16.8L18 14.8V14.77L18 14.78L16.45 13.25C17.05 13.03 17.58 12.76 18 12.45V9.64C16.97 10.22 15.61 10.65 14.06 10.86L12.19 9C15.94 8.94 18 7.5 18 7C18 6.5 15.87 5 12 5C10.66 5 9.54 5.18 8.64 5.44Z';
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './NoData.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title'> {
		/** Main text. */
		title?: string;
		/** Secondary text under the title. */
		description?: string;
		/** SVG path of the icon. An empty string removes it. */
		icon?: string;
		/** `md` the full illustration, `sm` only the icon and the text. */
		size?: 'sm' | 'md';
		/** Extra classes on the root element. */
		class?: string;
		/** Actions under the text, for example a button that creates the first item. */
		children?: Snippet;
		/** Replaces the title. */
		titleSnippet?: Snippet<[{ title: string }]>;
		/** Replaces the description. */
		descriptionSnippet?: Snippet<[{ description: string | undefined }]>;
		/** Replaces the icon (inside the framed box with `size="md"`). */
		iconSnippet?: Snippet;
	}

	let {
		title = 'No data available',
		description,
		icon = DATABASE_OFF_ICON,
		size = 'md',
		class: clazz = '',
		children,
		titleSnippet,
		descriptionSnippet,
		iconSnippet,
		...rest
	}: Props = $props();
</script>

<div {...rest} class={['aurora-no-data', clazz]} data-size={size}>
	{#if iconSnippet || icon}
		<span class="aurora-no-data-icon" aria-hidden="true">
			{#if iconSnippet}{@render iconSnippet()}{:else}<Icon path={icon} />{/if}
		</span>
	{/if}
	<div class="aurora-no-data-text">
		<p class="aurora-no-data-title">
			{#if titleSnippet}{@render titleSnippet({ title })}{:else}{title}{/if}
		</p>
		{#if descriptionSnippet}
			<p class="aurora-no-data-description">{@render descriptionSnippet({ description })}</p>
		{:else if description}
			<p class="aurora-no-data-description">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="aurora-no-data-actions">{@render children()}</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-no-data {
			--_min-height: var(--no-data-default-min-height);
			--_gap: var(--no-data-default-gap);
			--_icon-size: var(--no-data-default-icon-size);
			--_icon-color: var(--no-data-default-icon-color);
			--_title-color: var(--no-data-default-title-color);
			--_title-font-family: var(--no-data-default-title-font-family);
			--_title-font-size: var(--no-data-default-title-font-size);
			--_title-font-weight: var(--no-data-default-title-font-weight);
			--_description-font-size: var(--no-data-default-description-font-size);
			--_actions-gap: var(--no-data-default-actions-gap);

			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: var(--no-data-gap, var(--_gap));
			height: var(--no-data-height, var(--no-data-default-height));
			min-height: var(--no-data-min-height, var(--_min-height));
			padding: var(--no-data-padding, var(--no-data-default-padding));
			text-align: center;
		}

		.aurora-no-data[data-size='sm'] {
			--_min-height: var(--no-data-default-sm-min-height);
			--_gap: var(--no-data-default-sm-gap);
			--_icon-size: var(--no-data-default-sm-icon-size);
			--_icon-color: var(--no-data-default-sm-icon-color);
			--_title-color: var(--no-data-default-sm-title-color);
			--_title-font-family: var(--no-data-default-sm-title-font-family);
			--_title-font-size: var(--no-data-default-sm-title-font-size);
			--_title-font-weight: var(--no-data-default-sm-title-font-weight);
			--_description-font-size: var(--no-data-default-sm-description-font-size);
			--_actions-gap: var(--no-data-default-sm-actions-gap);
		}

		.aurora-no-data-icon {
			--icon-size: var(--no-data-icon-size, var(--_icon-size));

			position: relative;
			display: grid;
			flex-shrink: 0;
			place-items: center;
			color: var(--no-data-icon-color, var(--_icon-color));
		}

		.aurora-no-data[data-size='md'] .aurora-no-data-icon {
			--_box: var(--no-data-icon-box-size, var(--no-data-default-icon-box-size));
			--_radius: var(--no-data-icon-border-radius, var(--no-data-default-icon-border-radius));

			box-sizing: border-box;
			width: var(--_box);
			height: var(--_box);
			margin-block: 16px 8px;
			border: var(--global-border-width) solid
				var(--no-data-icon-border-color, var(--no-data-default-icon-border-color));
			border-radius: var(--_radius);
			background: var(--no-data-icon-background, var(--no-data-default-icon-background));
		}

		.aurora-no-data[data-size='md'] .aurora-no-data-icon::before,
		.aurora-no-data[data-size='md'] .aurora-no-data-icon::after {
			content: '';
			position: absolute;
			inset: -12px;
			border: var(--global-border-width) dashed
				var(--no-data-ring-color, var(--no-data-default-ring-color));
			border-radius: calc(var(--_radius) + 12px);
			pointer-events: none;
		}

		.aurora-no-data[data-size='md'] .aurora-no-data-icon::after {
			inset: -26px;
			border-radius: calc(var(--_radius) + 26px);
			opacity: 0.5;
		}

		.aurora-no-data-text {
			max-width: var(--no-data-max-width, var(--no-data-default-max-width));
		}

		.aurora-no-data-title,
		.aurora-no-data-description {
			margin: 0;
		}

		.aurora-no-data-title {
			color: var(--no-data-title-color, var(--_title-color));
			font-family: var(--no-data-title-font-family, var(--_title-font-family));
			font-size: var(--no-data-title-font-size, var(--_title-font-size));
			font-weight: var(--no-data-title-font-weight, var(--_title-font-weight));
			letter-spacing: -0.01em;
		}

		.aurora-no-data-description {
			margin-top: 6px;
			color: var(--no-data-description-color, var(--no-data-default-description-color));
			font-size: var(--no-data-description-font-size, var(--_description-font-size));
		}

		.aurora-no-data-actions {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 8px;
			margin-top: calc(var(--no-data-actions-gap, var(--_actions-gap)) - var(--no-data-gap, var(--_gap)));
		}
	}
</style>
