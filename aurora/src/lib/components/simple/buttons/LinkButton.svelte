<!-- @component
Text link with an animated underline: a short gradient stroke that grows to the full width on hover and focus, while the icon after the text slides forward. It renders a native `<a>`: `href`, `target`, `download` and events (`onclick`, ...) work as in HTML, and with `target="_blank"` `rel` defaults to `noopener noreferrer`. A disabled link loses its `href` and gets `aria-disabled`, so it cannot be followed or focused and does not call `onclick`. For a link that looks like a button use `Button` with `href`. Its state is exposed as `data-disabled` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './LinkButton.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLAnchorAttributes, 'href' | 'children'> {
		/** URL of the link. */
		href: string;
		/** Native `target`. With `_blank`, `rel` defaults to `noopener noreferrer`. */
		target?: '_self' | '_blank' | '_parent' | '_top' | (string & {});
		/** Native `rel`. */
		rel?: string;
		/** Removes the `href` and sets `aria-disabled`: the link cannot be followed, focused or clicked. */
		disabled?: boolean;
		/** SVG path of an icon before the text, for example from `@mdi/js`. */
		prependIcon?: string;
		/** SVG path of an icon after the text. It slides forward on hover. */
		appendIcon?: string;
		/** The native `<a>` element. */
		linkElement?: HTMLAnchorElement;
		/** Link text. */
		children?: Snippet;
		/** Replaces the icon before the text. */
		prependSnippet?: Snippet<[{ prependIcon: string | undefined }]>;
		/** Replaces the icon after the text. It still slides forward on hover. */
		appendSnippet?: Snippet<[{ appendIcon: string | undefined }]>;
	}

	let {
		href,
		target,
		rel,
		disabled = false,
		prependIcon,
		appendIcon,
		linkElement = $bindable(),
		class: clazz,
		children,
		prependSnippet,
		appendSnippet,
		onclick,
		...rest
	}: Props = $props();
</script>

<a
	{...rest}
	bind:this={linkElement}
	href={disabled ? undefined : href}
	onclick={disabled ? undefined : onclick}
	{target}
	rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
	role={disabled ? 'link' : undefined}
	aria-disabled={disabled || undefined}
	data-disabled={disabled || undefined}
	class={['aurora-link-button', clazz]}
>
	{#if prependSnippet}
		{@render prependSnippet({ prependIcon })}
	{:else if prependIcon}
		<Icon path={prependIcon} />
	{/if}
	{@render children?.()}
	{#if appendSnippet || appendIcon}
		<span class="aurora-link-button-append">
			{#if appendSnippet}
				{@render appendSnippet({ appendIcon })}
			{:else if appendIcon}
				<Icon path={appendIcon} />
			{/if}
		</span>
	{/if}
</a>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-link-button {
			--_duration: var(--link-button-duration, var(--link-button-default-duration));
			--icon-size: var(--link-button-icon-size, var(--link-button-default-icon-size));

			position: relative;
			display: inline-flex;
			align-items: center;
			gap: var(--link-button-gap, var(--link-button-default-gap));
			padding: var(--link-button-padding, var(--link-button-default-padding));
			border-radius: var(--link-button-border-radius, var(--link-button-default-border-radius));
			background: var(--link-button-background, var(--link-button-default-background));
			color: var(--link-button-color, var(--link-button-default-color));
			font-size: var(--link-button-font-size, var(--link-button-default-font-size));
			font-weight: var(--link-button-font-weight, var(--link-button-default-font-weight));
			line-height: var(--link-button-line-height, var(--link-button-default-line-height));
			text-decoration: none;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition:
				color var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		.aurora-link-button::after {
			content: '';
			position: absolute;
			inset-inline: 0;
			bottom: calc(
				-1 * var(--link-button-underline-offset, var(--link-button-default-underline-offset))
			);
			height: var(--link-button-underline-height, var(--link-button-default-underline-height));
			border-radius: var(--link-button-underline-height, var(--link-button-default-underline-height));
			background: var(
				--link-button-underline-background,
				var(--link-button-default-underline-background)
			);
			opacity: var(--link-button-underline-opacity, var(--link-button-default-underline-opacity));
			transform: scaleX(var(--link-button-underline-scale, var(--link-button-default-underline-scale)));
			transform-origin: left;
			transition:
				transform var(--_duration) var(--global-ease),
				opacity var(--_duration) var(--global-ease);
		}

		.aurora-link-button:dir(rtl)::after {
			transform-origin: right;
		}

		.aurora-link-button-append {
			display: inline-flex;
			transition: transform var(--_duration) var(--global-ease);
		}

		.aurora-link-button:not([data-disabled]):is(:hover, :focus-visible) {
			color: var(--link-button-hover-color, var(--link-button-default-hover-color));
			background: var(--link-button-hover-background, var(--link-button-default-hover-background));
		}

		.aurora-link-button:not([data-disabled]):is(:hover, :focus-visible)::after {
			opacity: 1;
			transform: scaleX(1);
		}

		.aurora-link-button:not([data-disabled]):is(:hover, :focus-visible) .aurora-link-button-append {
			transform: translateX(var(--link-button-icon-shift, var(--link-button-default-icon-shift)));
		}

		.aurora-link-button:dir(rtl):not([data-disabled]):is(:hover, :focus-visible)
			.aurora-link-button-append {
			transform: translateX(
				calc(-1 * var(--link-button-icon-shift, var(--link-button-default-icon-shift)))
			);
		}

		.aurora-link-button:focus-visible {
			outline: var(--link-button-focus-ring-width, var(--link-button-default-focus-ring-width))
				solid var(--link-button-focus-ring-color, var(--link-button-default-focus-ring-color));
			outline-offset: var(
				--link-button-focus-ring-offset,
				var(--link-button-default-focus-ring-offset)
			);
		}

		.aurora-link-button[data-disabled] {
			opacity: var(--link-button-disabled-opacity, var(--link-button-default-disabled-opacity));
			cursor: not-allowed;
		}
	}
</style>
