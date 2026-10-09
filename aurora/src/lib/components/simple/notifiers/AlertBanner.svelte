<!-- @component
Message banner inside the page, with a colored icon, a title, a description, an optional action on the right (`appendSnippet`) and an optional close button. Four variants: `info`, `success`, `warning`, `error`. It is announced by screen readers when it appears: `role="alert"` for warnings and errors, `role="status"` for the others (pass `role` to change it). The close button only calls `onclose`: the app removes the banner. Its variant is exposed as `data-variant` for app CSS.
-->
<script lang="ts" module>
	const ICONS = {
		info: 'M13.5,4A1.5,1.5 0 0,0 12,5.5A1.5,1.5 0 0,0 13.5,7A1.5,1.5 0 0,0 15,5.5A1.5,1.5 0 0,0 13.5,4M13.14,8.77C11.95,8.87 8.7,11.46 8.7,11.46C8.5,11.61 8.56,11.6 8.72,11.88C8.88,12.15 8.86,12.17 9.05,12.04C9.25,11.91 9.58,11.7 10.13,11.36C12.25,10 10.47,13.14 9.56,18.43C9.2,21.05 11.56,19.7 12.17,19.3C12.77,18.91 14.38,17.8 14.54,17.69C14.76,17.54 14.6,17.42 14.43,17.17C14.31,17 14.19,17.12 14.19,17.12C13.54,17.55 12.35,18.45 12.19,17.88C12,17.31 13.22,13.4 13.89,10.71C14,10.07 14.3,8.67 13.14,8.77Z',
		success: 'M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z',
		warning: 'M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z',
		error:
			'M8.27,3L3,8.27V15.73L8.27,21H15.73C17.5,19.24 21,15.73 21,15.73V8.27L15.73,3M9.1,5H14.9L19,9.1V14.9L14.9,19H9.1L5,14.9V9.1M9.12,7.71L7.71,9.12L10.59,12L7.71,14.88L9.12,16.29L12,13.41L14.88,16.29L16.29,14.88L13.41,12L16.29,9.12L14.88,7.71L12,10.59'
	};
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './AlertBanner.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title' | 'onclose'> {
		/** Color and default icon. */
		variant?: 'info' | 'success' | 'warning' | 'error';
		/** Bold first line. */
		title?: string;
		/** Text under the title. Line breaks are kept. */
		description?: string;
		/** SVG path of the icon. Defaults to an icon for each variant; an empty string removes it. */
		icon?: string;
		/** Shows a close button that calls `onclose`. */
		closable?: boolean;
		/** Accessible name of the close button. */
		closeLabel?: string;
		/** Called on a click on the close button. Remove the banner here. */
		onclose?: (event: MouseEvent) => void;
		/** Extra classes for each part: the root, the icon box, the text block, the title and the description. */
		class?: {
			container?: string;
			icon?: string;
			body?: string;
			title?: string;
			description?: string;
		};
		/** Replaces the title and the description. */
		children?: Snippet;
		/** Replaces the title. */
		titleSnippet?: Snippet<[{ title: string | undefined }]>;
		/** Replaces the description. */
		descriptionSnippet?: Snippet<[{ description: string | undefined }]>;
		/** Replaces the icon inside the colored box. */
		iconSnippet?: Snippet<[{ variant: 'info' | 'success' | 'warning' | 'error' }]>;
		/** Content on the right, for example an action button. */
		appendSnippet?: Snippet;
		/** Replaces the close button. `close` calls `onclose`. Shown even without `closable`. */
		closeSnippet?: Snippet<[{ close: (event: MouseEvent) => void; closeLabel: string }]>;
	}

	let {
		variant = 'info',
		title,
		description,
		icon,
		closable = false,
		closeLabel = 'Dismiss',
		onclose,
		class: clazz = {},
		children,
		titleSnippet,
		descriptionSnippet,
		iconSnippet,
		appendSnippet,
		closeSnippet,
		...rest
	}: Props = $props();

	let iconPath = $derived(icon ?? ICONS[variant]);

	function close(event: MouseEvent) {
		onclose?.(event);
	}
</script>

<div
	{...rest}
	class={['aurora-alert-banner', clazz.container]}
	role={rest.role ?? (variant === 'warning' || variant === 'error' ? 'alert' : 'status')}
	data-variant={variant}
>
	{#if iconSnippet || iconPath}
		<span class={['aurora-alert-banner-icon', clazz.icon]} aria-hidden="true">
			{#if iconSnippet}{@render iconSnippet({ variant })}{:else}<Icon path={iconPath} />{/if}
		</span>
	{/if}
	<div class={['aurora-alert-banner-body', clazz.body]}>
		{#if children}
			{@render children()}
		{:else}
			{#if titleSnippet}
				<div class={['aurora-alert-banner-title', clazz.title]}>{@render titleSnippet({ title })}</div>
			{:else if title}
				<div class={['aurora-alert-banner-title', clazz.title]}>{title}</div>
			{/if}
			{#if descriptionSnippet}
				<div class={['aurora-alert-banner-description', clazz.description]}>
					{@render descriptionSnippet({ description })}
				</div>
			{:else if description}
				<div class={['aurora-alert-banner-description', clazz.description]}>{description}</div>
			{/if}
		{/if}
	</div>
	{#if appendSnippet}
		<div class="aurora-alert-banner-append">{@render appendSnippet()}</div>
	{/if}
	{#if closeSnippet}
		{@render closeSnippet({ close, closeLabel })}
	{:else if closable}
		<button type="button" class="aurora-alert-banner-close" aria-label={closeLabel} onclick={close}>
			<Icon path={CLOSE_ICON} />
		</button>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-alert-banner {
			--_background: var(--alert-banner-default-info-background);
			--_border-color: var(--alert-banner-default-info-border-color);
			--_icon-background: var(--alert-banner-default-info-icon-background);
			--_icon-color: var(--alert-banner-default-info-icon-color);

			box-sizing: border-box;
			display: flex;
			align-items: flex-start;
			gap: var(--alert-banner-gap, var(--alert-banner-default-gap));
			width: var(--alert-banner-width, var(--alert-banner-default-width));
			padding: var(--alert-banner-padding, var(--alert-banner-default-padding));
			border: var(--alert-banner-border-width, var(--alert-banner-default-border-width)) solid
				var(--alert-banner-border-color, var(--_border-color));
			border-radius: var(--alert-banner-border-radius, var(--alert-banner-default-border-radius));
			background: var(--alert-banner-background, var(--_background));
			box-shadow: var(--alert-banner-box-shadow, var(--alert-banner-default-box-shadow));
			line-height: var(--alert-banner-line-height, var(--alert-banner-default-line-height));
		}

		.aurora-alert-banner[data-variant='success'] {
			--_background: var(--alert-banner-default-success-background);
			--_border-color: var(--alert-banner-default-success-border-color);
			--_icon-background: var(--alert-banner-default-success-icon-background);
			--_icon-color: var(--alert-banner-default-success-icon-color);
		}

		.aurora-alert-banner[data-variant='warning'] {
			--_background: var(--alert-banner-default-warning-background);
			--_border-color: var(--alert-banner-default-warning-border-color);
			--_icon-background: var(--alert-banner-default-warning-icon-background);
			--_icon-color: var(--alert-banner-default-warning-icon-color);
		}

		.aurora-alert-banner[data-variant='error'] {
			--_background: var(--alert-banner-default-error-background);
			--_border-color: var(--alert-banner-default-error-border-color);
			--_icon-background: var(--alert-banner-default-error-icon-background);
			--_icon-color: var(--alert-banner-default-error-icon-color);
		}

		.aurora-alert-banner-icon {
			--icon-size: var(--alert-banner-icon-size, var(--alert-banner-default-icon-size));

			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--alert-banner-icon-box-size, var(--alert-banner-default-icon-box-size));
			height: var(--alert-banner-icon-box-size, var(--alert-banner-default-icon-box-size));
			border-radius: var(
				--alert-banner-icon-border-radius,
				var(--alert-banner-default-icon-border-radius)
			);
			background: var(--alert-banner-icon-background, var(--_icon-background));
			color: var(--alert-banner-icon-color, var(--_icon-color));
		}

		.aurora-alert-banner-body {
			flex: 1;
			min-width: 0;
			align-self: center;
		}

		.aurora-alert-banner-title {
			color: var(--alert-banner-title-color, var(--alert-banner-default-title-color));
			font-size: var(--alert-banner-title-font-size, var(--alert-banner-default-title-font-size));
			font-weight: var(
				--alert-banner-title-font-weight,
				var(--alert-banner-default-title-font-weight)
			);
		}

		.aurora-alert-banner-title + .aurora-alert-banner-description {
			margin-top: 2px;
		}

		.aurora-alert-banner-description {
			color: var(--alert-banner-description-color, var(--alert-banner-default-description-color));
			font-size: var(
				--alert-banner-description-font-size,
				var(--alert-banner-default-description-font-size)
			);
			white-space: pre-wrap;
		}

		.aurora-alert-banner-append {
			display: flex;
			flex-shrink: 0;
			align-self: center;
			align-items: center;
			gap: 8px;
		}

		.aurora-alert-banner-close {
			--icon-size: var(--alert-banner-close-icon-size, var(--alert-banner-default-close-icon-size));

			box-sizing: border-box;
			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--alert-banner-close-size, var(--alert-banner-default-close-size));
			height: var(--alert-banner-close-size, var(--alert-banner-default-close-size));
			margin: -2px -4px -2px 0;
			padding: 0;
			border: 0;
			border-radius: var(
				--alert-banner-close-border-radius,
				var(--alert-banner-default-close-border-radius)
			);
			background: transparent;
			color: var(--alert-banner-close-color, var(--alert-banner-default-close-color));
			cursor: pointer;
			transition:
				background var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-alert-banner-close:hover {
				background: var(
					--alert-banner-close-hover-background,
					var(--alert-banner-default-close-hover-background)
				);
				color: var(--alert-banner-close-hover-color, var(--alert-banner-default-close-hover-color));
			}
		}

		.aurora-alert-banner-close:focus-visible {
			outline: var(--alert-banner-focus-ring-width, var(--alert-banner-default-focus-ring-width))
				solid var(--alert-banner-focus-ring-color, var(--alert-banner-default-focus-ring-color));
			outline-offset: var(
				--alert-banner-focus-ring-offset,
				var(--alert-banner-default-focus-ring-offset)
			);
		}
	}
</style>
