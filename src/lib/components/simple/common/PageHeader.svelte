<!-- @component
Header of a page: an optional link back, the title as a heading (`h1` by default, `headingLevel` to change it), a subtitle, a description and the page actions on the right, which wrap under the text when there is no room. With `backHref` the back control is a native link (it can be opened in a new tab and SvelteKit preloads it); with only `back` it is a button that goes back in the browser history. `onback` runs before either and can stop it with `event.preventDefault()`, for example to save first. `size="sm"` is for headers inside a section or a panel. Once the root layout calls `setTitleTemplate`, a header with `headingLevel` 1 also writes the title of the browser tab in the format of the app (`documentTitle` changes or turns it off). Its size is exposed as `data-size` for app CSS.
-->
<script lang="ts" module>
	const ARROW_LEFT_ICON = 'M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z';
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './PageHeader.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import { titleContext } from '../../../utils/title.js';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
		/** Title of the page, rendered as a heading. Without it (and without `titleSnippet`) no heading is rendered. */
		title?: string;
		/** Line under the title. */
		subtitle?: string;
		/** Smaller text under the subtitle. */
		description?: string;
		/** Level of the title heading: `1` for the page, a deeper level inside a section, a panel or a dialog. */
		headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
		/** `md` for a page, `sm` for a section or a panel. */
		size?: 'sm' | 'md';
		/** Shows the back control. Without `backHref` it goes back in the browser history. */
		back?: boolean;
		/** URL the back control links to. It also shows the control, without `back`. */
		backHref?: string;
		/** Text of the back control. Defaults to "Back", in the language of `locale`. */
		backLabel?: string;
		/** SVG path of the back icon. */
		backIcon?: string;
		/** Called when the back control is clicked, before it navigates. `event.preventDefault()` stops the navigation. */
		onback?: (event: MouseEvent) => void;
		/** Title of the browser tab for this page, in the format given to `setTitleTemplate`: another text than `title`, or `false` to leave the tab title alone. Without `setTitleTemplate` in a layout, or with a `headingLevel` other than 1, the tab title is never written. Defaults to `title`. */
		documentTitle?: string | false;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			back?: string;
			title?: string;
			subtitle?: string;
			description?: string;
			actions?: string;
		};
		/** Replaces the content of the title heading, for example with an editable name. */
		titleSnippet?: Snippet<[{ title: string | undefined }]>;
		/** Replaces the subtitle. */
		subtitleSnippet?: Snippet<[{ subtitle: string | undefined }]>;
		/** Replaces the description. */
		descriptionSnippet?: Snippet<[{ description: string | undefined }]>;
		/** Replaces the icon and the text inside the back control. */
		backSnippet?: Snippet<[{ backLabel: string; backIcon: string }]>;
		/** Before the title, for example an `Avatar`. */
		prependSnippet?: Snippet;
		/** Page actions, on the right of the title: the primary action last. */
		actionsSnippet?: Snippet;
	}

	let {
		title,
		subtitle,
		description,
		headingLevel = 1,
		size = 'md',
		back = false,
		backHref,
		backLabel: backLabelProp,
		backIcon = ARROW_LEFT_ICON,
		onback,
		documentTitle,
		locale: localeProp,
		class: clazz = {},
		titleSnippet,
		subtitleSnippet,
		descriptionSnippet,
		backSnippet,
		prependSnippet,
		actionsSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let backLabel = $derived(backLabelProp ?? libraryTexts(locale).pageHeader.back);

	let hasTitle = $derived(!!(titleSnippet || title));
	let hasSubtitle = $derived(!!(subtitleSnippet || subtitle));
	let hasDescription = $derived(!!(descriptionSnippet || description));
	let hasText = $derived(hasTitle || hasSubtitle || hasDescription);
	let hasMain = $derived(hasText || !!prependSnippet || !!actionsSnippet);

	const titles = titleContext();
	let tabTitle = $derived.by(() => {
		if (!titles || headingLevel !== 1 || documentTitle === false) return undefined;
		const text = documentTitle ?? title;
		return text ? titles.format(text) : undefined;
	});

	const titleToken = {};

	function claimTitle(text: string) {
		if (titles && typeof document !== 'undefined') {
			if (!titles.owner) titles.base = document.title;
			titles.owner = titleToken;
		}
		return text;
	}

	function releaseTitle() {
		if (!titles || titles.owner !== titleToken) return;
		titles.owner = null;
		if (titles.base !== undefined) document.title = titles.base;
	}

	$effect(() => {
		if (tabTitle === undefined) releaseTitle();
	});

	$effect(() => releaseTitle);

	function goBack(event: MouseEvent) {
		onback?.(event);
		if (!event.defaultPrevented) history.back();
	}
</script>

<svelte:head>
	{#if tabTitle !== undefined}<title>{claimTitle(tabTitle)}</title>{/if}
</svelte:head>

{#snippet backContent()}
	{#if backSnippet}
		{@render backSnippet({ backLabel, backIcon })}
	{:else}
		<span class="aurora-page-header-back-icon"><Icon path={backIcon} /></span>
		<span>{backLabel}</span>
	{/if}
{/snippet}

<header {...rest} class={['aurora-page-header', clazz.container]} data-size={size}>
	{#if backHref !== undefined}
		<a class={['aurora-page-header-back', clazz.back]} href={backHref} onclick={(event) => onback?.(event)}>
			{@render backContent()}
		</a>
	{:else if back}
		<button type="button" class={['aurora-page-header-back', clazz.back]} onclick={goBack}>
			{@render backContent()}
		</button>
	{/if}
	{#if hasMain}
		<div class="aurora-page-header-main">
			{#if prependSnippet}
				<div class="aurora-page-header-prepend">{@render prependSnippet()}</div>
			{/if}
			{#if hasText}
				<div class="aurora-page-header-text">
					{#if hasTitle}
						<svelte:element this={`h${headingLevel}`} class={['aurora-page-header-title', clazz.title]}>
							{#if titleSnippet}{@render titleSnippet({ title })}{:else}{title}{/if}
						</svelte:element>
					{/if}
					{#if hasSubtitle}
						<p class={['aurora-page-header-subtitle', clazz.subtitle]}>
							{#if subtitleSnippet}{@render subtitleSnippet({ subtitle })}{:else}{subtitle}{/if}
						</p>
					{/if}
					{#if hasDescription}
						<p class={['aurora-page-header-description', clazz.description]}>
							{#if descriptionSnippet}{@render descriptionSnippet({ description })}{:else}{description}{/if}
						</p>
					{/if}
				</div>
			{/if}
			{#if actionsSnippet}
				<div class={['aurora-page-header-actions', clazz.actions]}>{@render actionsSnippet()}</div>
			{/if}
		</div>
	{/if}
</header>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-page-header {
			--_title-font-size: var(--page-header-default-title-font-size);
			--_subtitle-font-size: var(--page-header-default-subtitle-font-size);
			--_description-font-size: var(--page-header-default-description-font-size);

			display: grid;
			justify-items: start;
			gap: var(--page-header-gap, var(--page-header-default-gap));
			min-width: 0;
		}

		.aurora-page-header[data-size='sm'] {
			--_title-font-size: var(--page-header-default-sm-title-font-size);
			--_subtitle-font-size: var(--page-header-default-sm-subtitle-font-size);
			--_description-font-size: var(--page-header-default-sm-description-font-size);
		}

		.aurora-page-header-back {
			--icon-size: var(--page-header-back-icon-size, var(--page-header-default-back-icon-size));

			display: inline-flex;
			align-items: center;
			gap: var(--page-header-back-gap, var(--page-header-default-back-gap));
			padding: 0;
			border: 0;
			border-radius: var(--page-header-back-border-radius, var(--page-header-default-back-border-radius));
			background: none;
			color: var(--page-header-back-color, var(--page-header-default-back-color));
			font: inherit;
			font-size: var(--page-header-back-font-size, var(--page-header-default-back-font-size));
			font-weight: var(--page-header-back-font-weight, var(--page-header-default-back-font-weight));
			line-height: 1.4;
			text-decoration: none;
			cursor: pointer;
			transition: color var(--global-duration) var(--global-ease);
		}

		.aurora-page-header-back-icon {
			display: inline-flex;
			transition: transform var(--global-duration) var(--global-ease);
		}

		.aurora-page-header-back:focus-visible {
			color: var(--page-header-back-hover-color, var(--page-header-default-back-hover-color));
			outline: var(--page-header-focus-ring-width, var(--page-header-default-focus-ring-width)) solid
				var(--page-header-focus-ring-color, var(--page-header-default-focus-ring-color));
			outline-offset: var(--page-header-focus-ring-offset, var(--page-header-default-focus-ring-offset));
		}

		@media (hover: hover) {
			.aurora-page-header-back:hover {
				color: var(--page-header-back-hover-color, var(--page-header-default-back-hover-color));
			}

			.aurora-page-header-back:hover .aurora-page-header-back-icon {
				transform: translateX(var(--page-header-back-icon-shift, var(--page-header-default-back-icon-shift)));
			}

			.aurora-page-header-back:dir(rtl):hover .aurora-page-header-back-icon {
				transform: scaleX(-1)
					translateX(var(--page-header-back-icon-shift, var(--page-header-default-back-icon-shift)));
			}
		}

		.aurora-page-header-back:dir(rtl) .aurora-page-header-back-icon {
			transform: scaleX(-1);
		}

		.aurora-page-header-main {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-self: stretch;
			gap: var(--page-header-main-gap, var(--page-header-default-main-gap));
			min-width: 0;
		}

		.aurora-page-header-prepend {
			display: flex;
			flex: none;
		}

		.aurora-page-header-text {
			display: grid;
			flex: 1 1 var(--page-header-text-min-width, var(--page-header-default-text-min-width));
			gap: var(--page-header-text-gap, var(--page-header-default-text-gap));
			min-width: 0;
		}

		.aurora-page-header-title,
		.aurora-page-header-subtitle,
		.aurora-page-header-description {
			margin: 0;
			overflow-wrap: anywhere;
		}

		.aurora-page-header-title {
			color: var(--page-header-title-color, var(--page-header-default-title-color));
			font-family: var(--page-header-title-font-family, var(--page-header-default-title-font-family));
			font-size: var(--page-header-title-font-size, var(--_title-font-size));
			font-weight: var(--page-header-title-font-weight, var(--page-header-default-title-font-weight));
			line-height: var(--page-header-title-line-height, var(--page-header-default-title-line-height));
			letter-spacing: -0.01em;
		}

		.aurora-page-header-subtitle {
			color: var(--page-header-subtitle-color, var(--page-header-default-subtitle-color));
			font-size: var(--page-header-subtitle-font-size, var(--_subtitle-font-size));
		}

		.aurora-page-header-description {
			color: var(--page-header-description-color, var(--page-header-default-description-color));
			font-size: var(--page-header-description-font-size, var(--_description-font-size));
		}

		.aurora-page-header-actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--page-header-actions-gap, var(--page-header-default-actions-gap));
			margin-inline-start: auto;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-page-header-back-icon {
				transition: none;
			}
		}
	}
</style>
