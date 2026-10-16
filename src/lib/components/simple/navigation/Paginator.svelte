<!-- @component
Navigation between the pages of a paged list or table: first, previous, the page numbers, next and last. `page` starts from 1 and is bindable; `onchange({ page })` is called when the user picks another page. With `pageCount` it shows the first and the last page, the current one with `siblingCount` pages on each side and "…" for the hidden ones, always the same number of items so the buttons do not move while paging; the arrows at the ends are disabled (`aria-disabled`, so they keep the focus). Without `pageCount` the total is unknown: it shows the previous, the current and the next page, and "next" is always enabled. The paginator never changes `page` on its own: when `page` is past `pageCount` no number is marked and "previous" goes to the last page. With `pageHref` the controls are links, so a page can live in the URL and open in a new tab. `compact` shows "7 / 24" between the arrows instead of the numbers. It is a `<nav>` named "Pagination" in the language of `locale`, the current page has `aria-current="page"`. Its state is exposed as `data-compact` on the root and `data-current` on the current page for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Paginator.css';
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { pageItems } from '../../../utils/pagination.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const FIRST_ICON =
		'M18.41,7.41L17,6L11,12L17,18L18.41,16.59L13.83,12L18.41,7.41M12.41,7.41L11,6L5,12L11,18L12.41,16.59L7.83,12L12.41,7.41Z';
	const PREVIOUS_ICON = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
	const NEXT_ICON = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';
	const LAST_ICON =
		'M5.59,7.41L7,6L13,12L7,18L5.59,16.59L10.17,12L5.59,7.41M11.59,7.41L13,6L19,12L13,18L11.59,16.59L16.17,12L11.59,7.41Z';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'onchange'> {
		/** Current page, from 1. Empty means 1. */
		page?: number;
		/** Number of pages. Without it the total is unknown: the previous, the current and the next page are shown, "next" is always enabled and there is no "last". Less than 1 counts as 1. */
		pageCount?: number;
		/** Pages shown on each side of the current one, between the first and the last page. */
		siblingCount?: number;
		/** Shows the buttons to the first and to the last page. */
		showFirstLast?: boolean;
		/** Shows "7 / 24" between the arrows instead of the page numbers, for narrow spaces. */
		compact?: boolean;
		/** URL of a page. With it every control is a link, so the page can live in the URL and open in a new tab; a plain click still updates `page` and calls `onchange`. */
		pageHref?: (page: number) => string;
		/** Called when the user picks another page, after `page` has changed. Not called for the current page. */
		onchange?: (event: { page: number }) => void;
		/** BCP 47 locale of the accessible names: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Accessible name of the `<nav>`. Defaults to "Pagination", in the language of `locale`. */
		'aria-label'?: string | null;
		/** Accessible name of the first page button. Defaults to "First page", in the language of `locale`. */
		firstLabel?: string;
		/** Accessible name of the previous page button. Defaults to "Previous page", in the language of `locale`. */
		previousLabel?: string;
		/** Accessible name of the next page button. Defaults to "Next page", in the language of `locale`. */
		nextLabel?: string;
		/** Accessible name of the last page button. Defaults to "Last page", in the language of `locale`. */
		lastLabel?: string;
		/** Accessible name of every page number, where `{page}` is replaced by the number. Defaults to "Page {page}", in the language of `locale`. */
		pageLabel?: string;
		/** Text read by screen readers in the `compact` look, where `{page}` and `{count}` are replaced by the current page and the number of pages. Defaults to "Page {page} of {count}", in the language of `locale`. */
		statusLabel?: string;
		/** SVG path of the first page icon. */
		firstIcon?: string;
		/** SVG path of the previous page icon. */
		previousIcon?: string;
		/** SVG path of the next page icon. */
		nextIcon?: string;
		/** SVG path of the last page icon. */
		lastIcon?: string;
		/** Classes of the parts: `container` the root, `button` every arrow and page number, `current` the current page. */
		class?: {
			container?: ClassValue;
			button?: ClassValue;
			current?: ClassValue;
		};
		/** The root element. */
		paginatorElement?: HTMLElement;
		/** Replaces the number inside every page button. */
		pageSnippet?: Snippet<[{ page: number; current: boolean }]>;
	}

	let {
		page = $bindable(),
		pageCount,
		siblingCount = 1,
		showFirstLast = true,
		compact = false,
		pageHref,
		onchange,
		locale: localeProp,
		'aria-label': ariaLabel,
		firstLabel,
		previousLabel,
		nextLabel,
		lastLabel,
		pageLabel,
		statusLabel,
		firstIcon = FIRST_ICON,
		previousIcon = PREVIOUS_ICON,
		nextIcon = NEXT_ICON,
		lastIcon = LAST_ICON,
		class: clazz = {},
		paginatorElement = $bindable(),
		pageSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).paginator);

	const current = $derived(page ?? 1);
	const count = $derived(pageCount === undefined ? undefined : Math.max(1, Math.floor(pageCount)));
	const items = $derived(compact ? [] : pageItems(current, count, siblingCount));
	const atStart = $derived(current <= 1);
	const atEnd = $derived(count !== undefined && current >= count);

	function pageName(target: number) {
		return (pageLabel ?? texts.page).replace('{page}', String(target));
	}

	const status = $derived(
		count === undefined
			? pageName(current)
			: (statusLabel ?? texts.status)
					.replace('{page}', String(current))
					.replace('{count}', String(count))
	);

	function pick(target: number, disabled: boolean, event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			return;
		}
		if (pageHref && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
		if (target === current) return;
		page = target;
		onchange?.({ page: target });
	}
</script>

{#snippet arrow(target: number, disabled: boolean, label: string, icon: string, part: string)}
	{#if pageHref}
		<a
			href={disabled ? undefined : pageHref(target)}
			role={disabled ? 'link' : undefined}
			aria-disabled={disabled ? 'true' : undefined}
			aria-label={label}
			class={['aurora-paginator-button', 'aurora-paginator-arrow', `aurora-paginator-${part}`, clazz.button]}
			onclick={(event) => pick(target, disabled, event)}
		>
			<Icon path={icon} />
		</a>
	{:else}
		<button
			type="button"
			aria-disabled={disabled ? 'true' : undefined}
			aria-label={label}
			class={['aurora-paginator-button', 'aurora-paginator-arrow', `aurora-paginator-${part}`, clazz.button]}
			onclick={(event) => pick(target, disabled, event)}
		>
			<Icon path={icon} />
		</button>
	{/if}
{/snippet}

{#snippet pageButton(target: number)}
	{@const isCurrent = target === current}
	{#if pageHref}
		<a
			href={pageHref(target)}
			aria-label={pageName(target)}
			aria-current={isCurrent ? 'page' : undefined}
			data-current={isCurrent ? '' : undefined}
			class={['aurora-paginator-button', 'aurora-paginator-page', clazz.button, isCurrent && clazz.current]}
			onclick={(event) => pick(target, false, event)}
		>
			{#if pageSnippet}{@render pageSnippet({ page: target, current: isCurrent })}{:else}{target}{/if}
		</a>
	{:else}
		<button
			type="button"
			aria-label={pageName(target)}
			aria-current={isCurrent ? 'page' : undefined}
			data-current={isCurrent ? '' : undefined}
			class={['aurora-paginator-button', 'aurora-paginator-page', clazz.button, isCurrent && clazz.current]}
			onclick={(event) => pick(target, false, event)}
		>
			{#if pageSnippet}{@render pageSnippet({ page: target, current: isCurrent })}{:else}{target}{/if}
		</button>
	{/if}
{/snippet}

<nav
	{...rest}
	bind:this={paginatorElement}
	aria-label={rest['aria-labelledby'] ? ariaLabel : (ariaLabel ?? texts.label)}
	data-compact={compact ? '' : undefined}
	class={['aurora-paginator', clazz.container]}
>
	{#if showFirstLast}
		{@render arrow(1, atStart, firstLabel ?? texts.first, firstIcon, 'first')}
	{/if}
	{@render arrow(
		count === undefined ? current - 1 : Math.min(current - 1, count),
		atStart,
		previousLabel ?? texts.previous,
		previousIcon,
		'previous'
	)}
	{#if compact}
		<span class="aurora-paginator-status" aria-live="polite">
			<span aria-hidden="true">{count === undefined ? current : `${current} / ${count}`}</span>
			<span class="aurora-paginator-status-text">{status}</span>
		</span>
	{:else}
		{#each items as item (item)}
			{#if typeof item === 'number'}
				{@render pageButton(item)}
			{:else}
				<span class="aurora-paginator-ellipsis" aria-hidden="true">…</span>
			{/if}
		{/each}
	{/if}
	{@render arrow(current + 1, atEnd, nextLabel ?? texts.next, nextIcon, 'next')}
	{#if showFirstLast && count !== undefined}
		{@render arrow(count, current === count, lastLabel ?? texts.last, lastIcon, 'last')}
	{/if}
</nav>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-paginator {
			display: flex;
			flex-wrap: nowrap;
			align-items: center;
			gap: var(--paginator-gap, var(--paginator-default-gap));
			font-family: var(--paginator-font-family, var(--paginator-default-font-family));
			font-size: var(--paginator-font-size, var(--paginator-default-font-size));
		}

		.aurora-paginator-button {
			--icon-size: var(--paginator-icon-size, var(--paginator-default-icon-size));
			--_bg-now: var(--paginator-button-background, var(--paginator-default-button-background));

			box-sizing: border-box;
			display: inline-flex;
			flex: none;
			align-items: center;
			justify-content: center;
			min-width: var(--paginator-button-size, var(--paginator-default-button-size));
			height: var(--paginator-button-size, var(--paginator-default-button-size));
			margin: 0;
			padding: var(--paginator-button-padding, var(--paginator-default-button-padding));
			border: 0;
			border-radius: var(
				--paginator-button-border-radius,
				var(--paginator-default-button-border-radius)
			);
			background: var(--_bg-now);
			color: var(--paginator-button-color, var(--paginator-default-button-color));
			font: inherit;
			font-weight: var(--paginator-button-font-weight, var(--paginator-default-button-font-weight));
			font-variant-numeric: tabular-nums;
			line-height: 1;
			text-decoration: none;
			white-space: nowrap;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition-property: background-color, color, box-shadow, opacity;
			transition-duration: var(--paginator-duration, var(--paginator-default-duration));
			transition-timing-function: var(--paginator-easing, var(--paginator-default-easing));
		}

		@media (hover: hover) {
			.aurora-paginator-button:not([aria-current], [aria-disabled='true']):hover {
				--_bg-now: var(
					--paginator-button-hover-background,
					var(--paginator-default-button-hover-background)
				);

				color: var(--paginator-button-hover-color, var(--paginator-default-button-hover-color));
			}
		}

		.aurora-paginator-button[aria-current] {
			--_bg-now: var(--paginator-current-background, var(--paginator-default-current-background));

			box-shadow: var(--paginator-current-box-shadow, var(--paginator-default-current-box-shadow));
			color: var(--paginator-current-color, var(--paginator-default-current-color));
			font-weight: var(--paginator-current-font-weight, var(--paginator-default-current-font-weight));
			cursor: default;
		}

		.aurora-paginator-button:focus-visible {
			outline: var(--paginator-focus-ring-width, var(--paginator-default-focus-ring-width)) solid
				var(--paginator-focus-ring-color, var(--paginator-default-focus-ring-color));
			outline-offset: var(--paginator-focus-ring-offset, var(--paginator-default-focus-ring-offset));
		}

		.aurora-paginator-button[aria-disabled='true'] {
			opacity: var(--paginator-disabled-opacity, var(--paginator-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-paginator:dir(rtl) .aurora-paginator-arrow {
			scale: -1 1;
		}

		.aurora-paginator-ellipsis {
			padding: var(--paginator-ellipsis-padding, var(--paginator-default-ellipsis-padding));
			color: var(--paginator-ellipsis-color, var(--paginator-default-ellipsis-color));
			user-select: none;
		}

		.aurora-paginator-status {
			padding: var(--paginator-status-padding, var(--paginator-default-status-padding));
			color: var(--paginator-status-color, var(--paginator-default-status-color));
			font-variant-numeric: tabular-nums;
			white-space: nowrap;
		}

		.aurora-paginator-status-text {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
