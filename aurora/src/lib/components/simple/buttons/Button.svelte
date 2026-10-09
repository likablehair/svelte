<!-- @component
Button with three shapes (`buttonType`), four color variants (`variant`) and three sizes (`size`). It renders a native `<button>`: `disabled`, `type` and events (`onclick`, ...) work as in HTML. With `href` it renders an `<a>` link with the same look, for navigation that should look like a button; a disabled link loses its `href`, gets `aria-disabled` and does not call `onclick`. With `loading` it shows a spinner and becomes disabled. An icon-only button needs an `aria-label`. Its state is exposed as `data-variant`, `data-size`, `data-shape` and `data-loading` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Button.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLButtonAttributes, 'type' | 'children'> {
		/** Shape: `default` filled, `text` without background, `icon` square for a single icon. */
		buttonType?: 'default' | 'text' | 'icon';
		/** Color. `gradient` is meant for the main call to action of the page. */
		variant?: 'primary' | 'secondary' | 'danger' | 'gradient';
		/** Height, padding and text size: `sm` 28px, `md` 34px, `lg` 40px. */
		size?: 'sm' | 'md' | 'lg';
		/** Native `type`. Defaults to `button`, so it never submits a form by accident. Ignored with `href`. */
		type?: 'button' | 'submit' | 'reset';
		/** Renders an `<a>` link to this URL instead of a `<button>`, with the same look. */
		href?: string;
		/** Native `target` of the link (with `href`). With `_blank`, `rel` defaults to `noopener noreferrer`. */
		target?: '_self' | '_blank' | '_parent' | '_top' | (string & {});
		/** Native `rel` of the link (with `href`). */
		rel?: string;
		/** Native `download` of the link (with `href`). */
		download?: string | boolean;
		/** Shows a spinner in place of the icon (or before the text) and disables the button. */
		loading?: boolean;
		/** SVG path of the icon, for example from `@mdi/js`. With text it sits on the left; alone it makes the button square. */
		icon?: string;
		/** Native `disabled`: the button gets neither focus nor events. A link (`href`) loses its `href` and gets `aria-disabled`. */
		disabled?: boolean;
		/** The native element: `<button>`, or `<a>` with `href`. */
		buttonElement?: HTMLButtonElement | HTMLAnchorElement;
		/** Button label. */
		children?: Snippet;
		/** Replaces the icon with any content (an image, an avatar, a custom SVG). Without `children` it makes the button square, like `icon`. */
		iconSnippet?: Snippet;
		/** Replaces the loading spinner. */
		loadingSnippet?: Snippet;
		/** SVG path of an icon after the text. When the button is wider than its content, it sits at the right edge. */
		appendIcon?: string;
		/** Replaces `appendIcon` with any content after the text (a chevron, a counter, a shortcut). */
		appendSnippet?: Snippet;
	}

	let {
		buttonType = 'default',
		variant = 'primary',
		size = 'md',
		type = 'button',
		href,
		target,
		rel,
		download,
		loading = false,
		icon,
		disabled = false,
		buttonElement = $bindable(),
		class: clazz,
		children,
		iconSnippet,
		loadingSnippet,
		appendIcon,
		appendSnippet,
		onclick,
		...rest
	}: Props = $props();

	let inactive = $derived(disabled || loading);
	let iconOnly = $derived(
		buttonType === 'icon' ||
			((!!icon || !!iconSnippet || !!appendIcon || !!appendSnippet) && !children)
	);
</script>

{#snippet content()}
	{#if loading}
		{#if loadingSnippet}
			{@render loadingSnippet()}
		{:else}
			<span class="aurora-button-spinner" aria-hidden="true"></span>
		{/if}
	{:else if iconSnippet}
		{@render iconSnippet()}
	{:else if icon}
		<Icon path={icon} />
	{/if}
	{@render children?.()}
	{#if appendSnippet || appendIcon}
		<span class="aurora-button-append">
			{#if appendSnippet}
				{@render appendSnippet()}
			{:else if appendIcon}
				<Icon path={appendIcon} />
			{/if}
		</span>
	{/if}
{/snippet}

{#if href !== undefined}
	<a
		{...rest as HTMLAnchorAttributes}
		bind:this={buttonElement}
		href={inactive ? undefined : href}
		onclick={inactive ? undefined : (onclick as HTMLAnchorAttributes['onclick'])}
		{target}
		rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
		{download}
		role={inactive ? 'link' : undefined}
		aria-disabled={inactive || undefined}
		aria-busy={loading || undefined}
		data-variant={variant}
		data-size={size}
		data-shape={buttonType}
		data-loading={loading || undefined}
		class={['aurora-button', iconOnly && 'aurora-button-icon-only', clazz]}
	>
		{@render content()}
	</a>
{:else}
	<button
		{...rest}
		bind:this={buttonElement}
		{type}
		{onclick}
		disabled={inactive}
		aria-busy={loading || undefined}
		data-variant={variant}
		data-size={size}
		data-shape={buttonType}
		data-loading={loading || undefined}
		class={['aurora-button', iconOnly && 'aurora-button-icon-only', clazz]}
	>
		{@render content()}
	</button>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-button {
			--_height: var(--button-default-height);
			--_padding: var(--button-default-padding);
			--_font-size: var(--button-default-font-size);
			--_radius: var(--button-default-border-radius);
			--_bg: var(--button-default-primary-background);
			--_color: var(--button-default-primary-color);
			--_border-color: var(--button-default-primary-border-color);
			--_shadow: var(--button-default-primary-box-shadow);
			--_hover-bg: var(--button-default-primary-hover-background);
			--_hover-shadow: var(--button-default-primary-hover-box-shadow);
			--_hover-filter: var(--button-default-primary-hover-filter);
			--_text-color: var(--button-default-primary-text-color);
			--_text-hover-bg: var(--button-default-primary-text-hover-background);
			--_bg-size: auto;

			--icon-size: var(--button-icon-size, var(--button-default-icon-size));

			box-sizing: border-box;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: var(--button-gap, var(--button-default-gap));
			width: var(--button-width, var(--button-default-width));
			min-width: var(--button-min-width, auto);
			max-width: var(--button-max-width, none);
			height: var(--button-height, var(--_height));
			padding: var(--button-padding, var(--_padding));
			margin: 0;
			border: var(--button-border-width, var(--button-default-border-width)) solid
				var(--button-border-color, var(--_border-color));
			border-radius: var(--button-border-radius, var(--_radius));
			background: var(--button-background, var(--_bg));
			background-size: var(--_bg-size);
			color: var(--button-color, var(--_color));
			box-shadow: var(--button-box-shadow, var(--_shadow));
			font-family: var(--button-font-family, var(--button-default-font-family));
			font-size: var(--button-font-size, var(--_font-size));
			font-weight: var(--button-font-weight, var(--button-default-font-weight));
			letter-spacing: var(--button-letter-spacing, var(--button-default-letter-spacing));
			line-height: 1.2;
			text-decoration: none;
			white-space: nowrap;
			cursor: pointer;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
			transition:
				transform var(--global-duration-fast) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease),
				border-color var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease),
				filter var(--global-duration) var(--global-ease);
		}

		.aurora-button[data-size='sm'] {
			--_height: var(--button-default-sm-height);
			--_padding: var(--button-default-sm-padding);
			--_font-size: var(--button-default-sm-font-size);
			--_radius: var(--button-default-sm-border-radius);
		}

		.aurora-button[data-size='lg'] {
			--_height: var(--button-default-lg-height);
			--_padding: var(--button-default-lg-padding);
			--_font-size: var(--button-default-lg-font-size);
			--_radius: var(--button-default-lg-border-radius);
		}

		.aurora-button[data-variant='secondary'] {
			--_bg: var(--button-default-secondary-background);
			--_color: var(--button-default-secondary-color);
			--_border-color: var(--button-default-secondary-border-color);
			--_shadow: var(--button-default-secondary-box-shadow);
			--_hover-bg: var(--button-default-secondary-hover-background);
			--_hover-shadow: var(--button-default-secondary-hover-box-shadow);
			--_hover-filter: var(--button-default-secondary-hover-filter);
			--_text-color: var(--button-default-secondary-text-color);
			--_text-hover-bg: var(--button-default-secondary-text-hover-background);
		}

		.aurora-button[data-variant='danger'] {
			--_bg: var(--button-default-danger-background);
			--_color: var(--button-default-danger-color);
			--_border-color: var(--button-default-danger-border-color);
			--_shadow: var(--button-default-danger-box-shadow);
			--_hover-bg: var(--button-default-danger-hover-background);
			--_hover-shadow: var(--button-default-danger-hover-box-shadow);
			--_hover-filter: var(--button-default-danger-hover-filter);
			--_text-color: var(--button-default-danger-text-color);
			--_text-hover-bg: var(--button-default-danger-text-hover-background);
		}

		.aurora-button[data-variant='gradient'] {
			--_bg: var(--button-default-gradient-background);
			--_color: var(--button-default-gradient-color);
			--_border-color: var(--button-default-gradient-border-color);
			--_shadow: var(--button-default-gradient-box-shadow);
			--_hover-bg: var(--button-default-gradient-hover-background);
			--_hover-shadow: var(--button-default-gradient-hover-box-shadow);
			--_hover-filter: var(--button-default-gradient-hover-filter);
			--_text-color: var(--button-default-gradient-text-color);
			--_text-hover-bg: var(--button-default-gradient-text-hover-background);
		}

		.aurora-button[data-variant='gradient']:not([data-shape='text']) {
			--_bg-size: 200% 200%;
			animation: button-gradient-shift var(--button-default-gradient-animation-duration) ease
				infinite;
		}

		.aurora-button[data-shape='text'] {
			--_bg: transparent;
			--_color: var(--_text-color);
			--_border-color: transparent;
			--_shadow: 0 0 #0000;
			--_hover-bg: var(--_text-hover-bg);
			--_hover-shadow: 0 0 #0000;
			--_hover-filter: none;
		}

		.aurora-button-append {
			display: inline-flex;
			align-items: center;
			margin-inline-start: auto;
		}

		.aurora-button-icon-only {
			width: var(--button-width, var(--button-height, var(--_height)));
			padding: 0;
		}

		@media (hover: hover) {
			.aurora-button:not(:disabled, [aria-disabled='true']):hover {
				background: var(--button-hover-background, var(--_hover-bg));
				background-size: var(--_bg-size);
				color: var(--button-hover-color, var(--button-color, var(--_color)));
				border-color: var(
					--button-hover-border-color,
					var(--button-border-color, var(--_border-color))
				);
				box-shadow: var(--button-hover-box-shadow, var(--_hover-shadow));
				filter: var(--button-hover-filter, var(--_hover-filter));
			}
		}

		.aurora-button:not(:disabled, [aria-disabled='true']):active {
			transform: var(--button-active-transform, var(--button-default-active-transform));
		}

		.aurora-button:focus-visible {
			outline: var(--button-focus-ring-width, var(--button-default-focus-ring-width)) solid
				var(--button-focus-ring-color, var(--button-default-focus-ring-color));
			outline-offset: var(--button-focus-ring-offset, var(--button-default-focus-ring-offset));
		}

		.aurora-button:is(:disabled, [aria-disabled='true']):not([data-loading]) {
			cursor: not-allowed;
			opacity: var(--button-disabled-opacity, var(--button-default-disabled-opacity));
			filter: var(--button-disabled-filter, var(--button-default-disabled-filter));
		}

		.aurora-button[data-loading] {
			cursor: progress;
		}

		.aurora-button-spinner {
			box-sizing: border-box;
			flex-shrink: 0;
			width: var(--icon-size);
			height: var(--icon-size);
			border-radius: 50%;
			border: var(--button-spinner-border-width, var(--button-default-spinner-border-width)) solid
				color-mix(in oklab, currentColor 30%, transparent);
			border-top-color: currentColor;
			animation: button-spin 0.7s linear infinite;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-button[data-variant='gradient']:not([data-shape='text']) {
				animation: none;
			}
		}
	}

	@keyframes button-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes button-gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}
</style>
