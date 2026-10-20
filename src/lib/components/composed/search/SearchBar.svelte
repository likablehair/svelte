<!-- @component
Search field: an `<input type="search">` in a `role="search"` landmark, with the magnifier, a button that empties it and an optional search button. `onsearch` receives the text `debounce` milliseconds after the user stops typing (unless `searchOnType` is `false`), at once on Enter, on the search button and when the field is emptied; `oninput` and the other native events reach the input as usual. `loading` shows a spinner while results arrive. Name it with `label` (or `aria-label`), since the placeholder is not a label. Its state is exposed as `data-filled` and `data-loading` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './SearchBar.css';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';
	const CLEAR_ICON =
		'M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'type' | 'class' | 'children'> {
		/** The text. */
		value?: string;
		/** Accessible name of the field (and of the search landmark). Defaults to the placeholder. */
		label?: string;
		/** Native `placeholder`. */
		placeholder?: string;
		/** Milliseconds between the last keystroke and `onsearch`. `0` calls it at every change. */
		debounce?: number;
		/** Calls `onsearch` while typing. With `false` only Enter, the search button and emptying the field do. */
		searchOnType?: boolean;
		/** Shows a button that empties the field while it has text. */
		clearable?: boolean;
		/** Accessible name of the clear button. Defaults to "Clear search", in the language of `locale`. */
		clearLabel?: string;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Shows a spinner at the end of the field, for example while results load. */
		loading?: boolean;
		/** Text of a search button at the end of the field. Without it there is no button. */
		buttonLabel?: string;
		/** The native `<input>`. */
		input?: HTMLInputElement;
		/** Extra classes for each part. */
		class?: { container?: string; icon?: string; input?: string };
		/** Replaces the magnifier. */
		iconSnippet?: Snippet;
		/** Replaces the input (for example with a field of the app). */
		inputSnippet?: Snippet;
		/** Replaces the search button. */
		buttonSnippet?: Snippet<[{ search: () => void }]>;
		/** Called with the text: after `debounce`, on Enter, on the search button and when the field is emptied. */
		onsearch?: (text: string) => void;
	}

	let {
		value = $bindable(),
		label,
		placeholder,
		debounce = 300,
		searchOnType = true,
		clearable = true,
		clearLabel,
		locale: localeProp,
		loading = false,
		buttonLabel,
		input = $bindable(),
		class: clazz = {},
		iconSnippet,
		inputSnippet,
		buttonSnippet,
		onsearch,
		oninput,
		onkeydown,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).searchBar);

	let inputNode = $state<HTMLInputElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastSent = untrack(() => value ?? '');
	let name = $derived(label ?? rest['aria-label'] ?? placeholder);

	$effect(() => () => clearTimeout(timer));

	function search() {
		clearTimeout(timer);
		const text = value ?? '';
		lastSent = text;
		onsearch?.(text);
	}

	function schedule() {
		clearTimeout(timer);
		if (!searchOnType) return;
		if (debounce <= 0) search();
		else timer = setTimeout(() => {
			if ((value ?? '') !== lastSent) search();
		}, debounce);
	}

	function clear() {
		value = '';
		search();
		inputNode?.focus();
	}
</script>

<div
	class={['aurora-search-bar', clazz.container]}
	role="search"
	aria-label={name}
	data-filled={value ? '' : undefined}
	data-loading={loading || undefined}
>
	{#if iconSnippet}
		{@render iconSnippet()}
	{:else}
		<Icon path={SEARCH_ICON} class={['aurora-search-bar-icon', clazz.icon].filter(Boolean).join(' ')} />
	{/if}
	{#if inputSnippet}
		{@render inputSnippet()}
	{:else}
		<input
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			enterkeyhint="search"
			{...rest}
			bind:this={() => inputNode, (node) => (inputNode = input = node)}
			bind:value
			type="search"
			aria-label={name}
			{placeholder}
			class={clazz.input}
			oninput={(event) => {
				oninput?.(event);
				schedule();
			}}
			onkeydown={(event) => {
				onkeydown?.(event);
				if (event.defaultPrevented || event.isComposing) return;
				if (event.key === 'Enter') {
					event.preventDefault();
					search();
				} else if (event.key === 'Escape' && value) {
					event.preventDefault();
					clear();
				}
			}}
		/>
	{/if}
	{#if loading}
		<span class="aurora-search-bar-spinner" aria-hidden="true"></span>
	{:else if clearable && value}
		<button type="button" class="aurora-search-bar-clear" aria-label={clearLabel ?? texts.clear} onclick={clear}>
			<Icon path={CLEAR_ICON} />
		</button>
	{/if}
	{#if buttonSnippet}
		{@render buttonSnippet({ search })}
	{:else if buttonLabel}
		<Button size="sm" onclick={search}>{buttonLabel}</Button>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-search-bar {
			--_ring: var(--search-bar-ring-color, var(--search-bar-default-ring-color));
			--icon-size: var(--search-bar-icon-size, var(--search-bar-default-icon-size));

			display: flex;
			align-items: center;
			gap: var(--search-bar-gap, var(--search-bar-default-gap));
			box-sizing: border-box;
			width: var(--search-bar-width, var(--search-bar-default-width));
			max-width: var(--search-bar-max-width, var(--search-bar-default-max-width));
			height: var(--search-bar-height, var(--search-bar-default-height));
			padding: var(--search-bar-padding, var(--search-bar-default-padding));
			border-radius: var(--search-bar-border-radius, var(--search-bar-default-border-radius));
			background-color: var(--search-bar-background-color, var(--search-bar-default-background-color));
			box-shadow: inset 0 0 0 var(--search-bar-ring-width, var(--search-bar-default-ring-width)) var(--_ring);
			color: var(--search-bar-icon-color, var(--search-bar-default-icon-color));
			transition: box-shadow var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-search-bar:hover:not(:focus-within) {
				--_ring: var(--search-bar-hover-ring-color, var(--search-bar-default-hover-ring-color));
			}
		}

		.aurora-search-bar:focus-within {
			--_ring: var(--search-bar-focus-ring-color, var(--search-bar-default-focus-ring-color));
			box-shadow:
				inset 0 0 0 var(--search-bar-ring-width, var(--search-bar-default-ring-width)) var(--_ring),
				0 0 0 var(--global-focus-ring-width)
					var(--search-bar-focus-glow-color, var(--search-bar-default-focus-glow-color));
			outline: 2px solid transparent;
		}

		.aurora-search-bar:focus-within > :global(.aurora-search-bar-icon) {
			color: var(--search-bar-focus-ring-color, var(--search-bar-default-focus-ring-color));
		}

		input {
			flex: 1;
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--search-bar-color, var(--search-bar-default-color));
			font-family: inherit;
			font-size: var(--search-bar-font-size, var(--search-bar-default-font-size));
			line-height: var(--search-bar-line-height, var(--search-bar-default-line-height));
			appearance: none;
		}

		input::-webkit-search-cancel-button,
		input::-webkit-search-decoration {
			appearance: none;
		}

		input::placeholder {
			color: var(--search-bar-placeholder-color, var(--search-bar-default-placeholder-color));
			opacity: 1;
		}

		.aurora-search-bar-clear {
			display: inline-flex;
			flex: none;
			align-items: center;
			margin: 0;
			padding: 2px;
			border: 0;
			border-radius: var(--global-radius-full);
			background: transparent;
			color: inherit;
			cursor: pointer;
		}

		.aurora-search-bar-clear:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
		}

		.aurora-search-bar-spinner {
			flex: none;
			width: 16px;
			height: 16px;
			margin: 2px;
			box-sizing: border-box;
			border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
			border-top-color: currentColor;
			border-radius: 50%;
			animation: aurora-search-bar-spin 0.8s linear infinite;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-search-bar-spinner {
				animation-duration: 2.4s;
			}
		}
	}

	@keyframes aurora-search-bar-spin {
		to {
			rotate: 360deg;
		}
	}
</style>
