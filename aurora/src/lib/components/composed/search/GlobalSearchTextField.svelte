<!-- @component
Search of the whole app, as a command palette: a button that looks like a search field opens a dialog with a search box and the results of `searcher`, grouped by `group`, with the searched text highlighted. Ctrl+K (⌘K on a Mac) opens and closes it from anywhere outside a text field; `shortcut={false}` turns that off. A search starts when the text reaches `searchThreshold` characters, `debounceTimeout` ms after the last keystroke, and a newer search aborts the older one through `signal`. The arrows move through the results, Enter opens the highlighted one: a result with `href` is a link, and choosing any result calls `onselect` and closes the dialog. On screens up to 768px wide the button shows only the magnifier and the dialog takes the whole screen. Its state is exposed as `data-open` and `data-compact` on the root and `data-state` (`idle`, `loading`, `results`, `empty`, `error`) on the dialog for app CSS.
-->
<script lang="ts" module>
	/** A result of `GlobalSearchTextField`. */
	export interface GlobalSearchItem<Data = unknown> {
		/** Identity of the result, unique among the results. */
		value: string | number;
		/** Main text, with the searched text highlighted. */
		label: string;
		/** Secondary text under the label, such as a phone number or a path. */
		description?: string;
		/** SVG path of the icon in the tile at the start of the row. */
		icon?: string;
		/** Makes the result a link: choosing it opens this URL. */
		href?: string;
		/** Name of the section of the result, such as "Clients" or "Pages". Results with the same group are shown together, in the order of their first one. */
		group?: string;
		/** Any app data, passed back to the snippets and to `onselect`. */
		data?: Data;
	}

	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';
	const RESULT_ICON =
		'M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z';
</script>

<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './GlobalSearchTextField.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Dialog from '../../simple/dialogs/Dialog.svelte';
	import CircularLoader from '../../simple/loaders/CircularLoader.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { highlightParts, type TextPart } from '../../../utils/table/manager.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onselect'> {
		/** Returns the results for the text; `signal` aborts when a newer search starts or the dialog closes. Results are shown in the order they come, grouped by `group`. */
		searcher?: (params: { searchText: string; signal: AbortSignal }) => Promise<GlobalSearchItem<Data>[]>;
		/** Whether the dialog is open. */
		open?: boolean;
		/** Text of the button, also the name of the search box. Defaults to "Search", in the language of `locale`. */
		label?: string;
		/** Placeholder of the search box. Defaults to "Search…", in the language of `locale`. */
		placeholder?: string;
		/** Letter that opens the dialog together with Ctrl (⌘ on a Mac). `false` turns the shortcut off. */
		shortcut?: string | false;
		/** Characters needed to start a search. */
		searchThreshold?: number;
		/** Milliseconds after the last keystroke before searching. */
		debounceTimeout?: number;
		/** Text shown when a search finds nothing; `{text}` is the searched text. Defaults to "No results for “{text}”", in the language of `locale`. */
		emptyText?: string;
		/** Text shown when `searcher` fails. Defaults to "The search failed. Try again.", in the language of `locale`. */
		errorText?: string;
		/** Text of the button that closes the dialog on screens up to 768px wide, where there is no Escape key. Defaults to "Cancel", in the language of `locale`. */
		cancelLabel?: string;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Extra classes for each part. */
		class?: { container?: string; button?: string; shortcut?: string; dialog?: string };
		/** The button that opens the dialog. */
		buttonElement?: HTMLButtonElement;
		/** Called when a result is chosen, with the result and the click or key event, before the dialog closes (and before a link navigates). */
		onselect?: (selection: { item: GlobalSearchItem<Data>; event: MouseEvent | KeyboardEvent }) => void;
		/** Called whenever the dialog closes. */
		onclose?: () => void;
		/** Called when `searcher` throws or rejects, except for aborted searches. */
		onerror?: (error: unknown) => void;
		/** Replaces the button. Call `open` to open the dialog; `shortcut` is the text of the shortcut, such as "⌘K". */
		triggerSnippet?: Snippet<[{ open: () => void; shortcut: string }]>;
		/** Replaces the content of a result row. `parts` is the label split into highlighted and plain pieces. */
		itemSnippet?: Snippet<[{ item: GlobalSearchItem<Data>; active: boolean; parts: TextPart[] }]>;
		/** Replaces the title of a group. */
		groupSnippet?: Snippet<[{ group: string; items: GlobalSearchItem<Data>[] }]>;
		/** Replaces the message shown when nothing is found. */
		emptySnippet?: Snippet<[{ searchText: string }]>;
		/** Replaces the bar under the results with the keyboard hints. */
		footerSnippet?: Snippet;
	}

	let {
		searcher,
		open = $bindable(),
		label,
		placeholder,
		shortcut = 'k',
		searchThreshold = 1,
		debounceTimeout = 300,
		emptyText,
		errorText,
		cancelLabel,
		locale: localeProp,
		class: clazz = {},
		buttonElement = $bindable(),
		onselect,
		onclose,
		onerror,
		triggerSnippet,
		itemSnippet,
		groupSnippet,
		emptySnippet,
		footerSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).globalSearch);
	let compact = $derived(breakpoints.sAndDown);

	let mac = $state(false);
	$effect(() => {
		mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
	});
	let shortcutText = $derived(shortcut ? `${mac ? '⌘' : 'Ctrl '}${shortcut.toUpperCase()}` : '');

	let searchText = $state('');
	let results = $state.raw<GlobalSearchItem<Data>[]>([]);
	let status = $state<'idle' | 'loading' | 'results' | 'empty' | 'error'>('idle');
	let active = $state(0);
	let controller: AbortController | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	type Group = { name: string; items: { item: GlobalSearchItem<Data>; index: number }[] };

	let groups = $derived.by(() => {
		const list: Group[] = [];
		results.forEach((item, index) => {
			const name = item.group ?? '';
			let group = list.find((entry) => entry.name === name);
			if (!group) list.push((group = { name, items: [] }));
			group.items.push({ item, index });
		});
		return list;
	});
	let ordered = $derived(groups.flatMap((group) => group.items.map((entry) => entry.item)));

	function optionId(index: number) {
		return `${uid}-option-${index}`;
	}

	function stop() {
		clearTimeout(timer);
		controller?.abort();
		controller = undefined;
	}

	function run(query: string) {
		stop();
		if (!searcher || query.trim().length < searchThreshold) {
			results = [];
			status = 'idle';
			return;
		}
		status = 'loading';
		timer = setTimeout(() => {
			const current = new AbortController();
			controller = current;
			Promise.resolve()
				.then(() => searcher({ searchText: query, signal: current.signal }))
				.then((found) => {
					if (current.signal.aborted) return;
					results = found;
					active = 0;
					status = found.length ? 'results' : 'empty';
				})
				.catch((error) => {
					if (current.signal.aborted) return;
					results = [];
					status = 'error';
					onerror?.(error);
				});
		}, debounceTimeout);
	}

	function openDialog() {
		open = true;
	}

	let wasOpen = false;
	$effect(() => {
		if (open) {
			wasOpen = true;
			return;
		}
		if (!wasOpen) return;
		wasOpen = false;
		stop();
		searchText = '';
		results = [];
		status = 'idle';
		onclose?.();
	});

	$effect(() => stop);

	$effect(() => {
		if (!shortcut) return;
		const key = shortcut.toLowerCase();
		const handle = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== key) return;
			const target = event.target as HTMLElement | null;
			const editable =
				target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
			if (editable && !target?.closest('.aurora-global-search-dialog')) return;
			event.preventDefault();
			open = !open;
		};
		window.addEventListener('keydown', handle);
		return () => window.removeEventListener('keydown', handle);
	});

	function choose(item: GlobalSearchItem<Data>, event: MouseEvent | KeyboardEvent) {
		onselect?.({ item, event });
		open = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		const count = ordered.length;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!count) return;
			active = (active + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
			document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter') {
			const item = ordered[active];
			if (!item || status !== 'results') return;
			event.preventDefault();
			if (item.href) document.getElementById(optionId(active))?.click();
			else choose(item, event);
		}
	}

	let resultCount = $derived(status === 'results' ? ordered.length : 0);
</script>

<div
	{...rest}
	data-open={open || undefined}
	data-compact={compact || undefined}
	class={['aurora-global-search', clazz.container]}
>
	{#if triggerSnippet}
		{@render triggerSnippet({ open: openDialog, shortcut: shortcutText })}
	{:else}
		<button
			bind:this={buttonElement}
			type="button"
			class={['aurora-global-search-button', clazz.button]}
			aria-haspopup="dialog"
			aria-expanded={!!open}
			aria-label={compact ? (label ?? texts.label) : undefined}
			aria-keyshortcuts={shortcut ? `Control+${shortcut.toUpperCase()} Meta+${shortcut.toUpperCase()}` : undefined}
			onclick={openDialog}
		>
			<span class="aurora-global-search-button-icon"><Icon path={SEARCH_ICON} /></span>
			{#if !compact}
				<span class="aurora-global-search-button-label">{label ?? texts.label}</span>
				{#if shortcutText}
					<kbd class={['aurora-global-search-shortcut', clazz.shortcut]} aria-hidden="true">{shortcutText}</kbd>
				{/if}
			{/if}
		</button>
	{/if}
</div>

<Dialog
	bind:open
	aria-label={label ?? texts.dialog}
	data-fullscreen={compact || undefined}
	data-state={status}
	class={{ dialog: ['aurora-global-search-dialog', clazz.dialog].filter(Boolean).join(' ') }}
>
	<div class="aurora-global-search-box">
		<span class="aurora-global-search-box-icon"><Icon path={SEARCH_ICON} /></span>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="aurora-global-search-input"
			type="text"
			role="combobox"
			autocomplete="off"
			spellcheck="false"
			autofocus
			aria-label={label ?? texts.label}
			aria-expanded={status === 'results'}
			aria-controls="{uid}-listbox"
			aria-autocomplete="list"
			aria-activedescendant={status === 'results' && ordered[active] ? optionId(active) : undefined}
			placeholder={placeholder ?? texts.placeholder}
			bind:value={searchText}
			oninput={() => run(searchText)}
			onkeydown={handleKeydown}
		/>
		{#if status === 'loading'}
			<span class="aurora-global-search-loader"><CircularLoader label="" --circular-loader-size="18px" /></span>
		{/if}
		{#if compact}
			<Button buttonType="text" size="sm" onclick={() => (open = false)}>{cancelLabel ?? texts.cancel}</Button>
		{:else}
			<kbd class="aurora-global-search-escape" aria-hidden="true">ESC</kbd>
		{/if}
	</div>
	<div class="aurora-global-search-results">
		<div id="{uid}-listbox" role="listbox" aria-label={texts.results} class="aurora-global-search-listbox">
			{#if status === 'results'}
				{#each groups as group, groupIndex (group.name)}
					<div role="group" aria-labelledby={group.name ? `${uid}-group-${groupIndex}` : undefined}>
						{#if group.name}
							<div id="{uid}-group-{groupIndex}" class="aurora-global-search-group" role="presentation">
								{#if groupSnippet}
									{@render groupSnippet({ group: group.name, items: group.items.map((entry) => entry.item) })}
								{:else}
									{group.name}
								{/if}
							</div>
						{/if}
						{#each group.items as entry (entry.item.value)}
							{@const position = ordered.indexOf(entry.item)}
							{@const isActive = position === active}
							{@const parts = highlightParts(entry.item.label, searchText)}
							<svelte:element
								this={entry.item.href ? 'a' : 'div'}
								id={optionId(position)}
								href={entry.item.href}
								role="option"
								tabindex="-1"
								aria-selected={isActive}
								data-active={isActive || undefined}
								class="aurora-global-search-option"
								onmousemove={() => (active = position)}
								onclick={(event: MouseEvent) => choose(entry.item, event)}
							>
								{#if itemSnippet}
									{@render itemSnippet({ item: entry.item, active: isActive, parts })}
								{:else}
									<span class="aurora-global-search-option-icon"><Icon path={entry.item.icon ?? RESULT_ICON} /></span>
									<span class="aurora-global-search-option-text">
										<span class="aurora-global-search-option-label">
											{#each parts as part, index (index)}{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}
										</span>
										{#if entry.item.description}
											<span class="aurora-global-search-option-description">{entry.item.description}</span>
										{/if}
									</span>
									{#if isActive}<span class="aurora-global-search-option-enter" aria-hidden="true">↵</span>{/if}
								{/if}
							</svelte:element>
						{/each}
					</div>
				{/each}
			{/if}
		</div>
		{#if status === 'empty'}
			<p class="aurora-global-search-message">
				{#if emptySnippet}
					{@render emptySnippet({ searchText })}
				{:else}
					{(emptyText ?? texts.noResults).replace('{text}', searchText.trim())}
				{/if}
			</p>
		{:else if status === 'error'}
			<p class="aurora-global-search-message" data-error role="alert">{errorText ?? texts.error}</p>
		{/if}
		<p class="aurora-global-search-live" aria-live="polite">
			{status === 'loading' ? texts.loading : status === 'results' ? `${resultCount}` : ''}
		</p>
	</div>
	<div class="aurora-global-search-footer" data-hidden={(compact && !footerSnippet) || undefined}>
		{#if footerSnippet}
			{@render footerSnippet()}
		{:else}
			<span><kbd>↑</kbd><kbd>↓</kbd>{texts.navigate}</span>
			<span><kbd>↵</kbd>{texts.open}</span>
			<span><kbd>esc</kbd>{texts.close}</span>
		{/if}
	</div>
</Dialog>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-global-search {
			display: block;
			width: var(--global-search-text-field-width, var(--global-search-text-field-default-width));
			max-width: var(--global-search-text-field-max-width, var(--global-search-text-field-default-max-width));
		}

		.aurora-global-search[data-compact] {
			width: auto;
		}

		.aurora-global-search-button {
			display: flex;
			align-items: center;
			gap: 8px;
			box-sizing: border-box;
			width: 100%;
			height: var(--global-search-text-field-height, var(--global-search-text-field-default-height));
			margin: 0;
			padding: var(--global-search-text-field-padding, var(--global-search-text-field-default-padding));
			border: var(--global-input-border-width) solid
				var(--global-search-text-field-border-color, var(--global-search-text-field-default-border-color));
			border-radius: var(--global-search-text-field-border-radius, var(--global-search-text-field-default-border-radius));
			background: var(--global-search-text-field-background, var(--global-search-text-field-default-background));
			color: var(--global-search-text-field-color, var(--global-search-text-field-default-color));
			font: inherit;
			font-size: var(--global-search-text-field-font-size, var(--global-search-text-field-default-font-size));
			text-align: start;
			cursor: pointer;
			transition:
				border-color var(--global-duration-fast) var(--global-ease),
				box-shadow var(--global-duration-fast) var(--global-ease);
		}

		.aurora-global-search[data-compact] .aurora-global-search-button {
			justify-content: center;
			width: var(--global-search-text-field-height, var(--global-search-text-field-default-height));
			padding: 0;
		}

		@media (hover: hover) {
			.aurora-global-search-button:hover {
				border-color: var(--global-search-text-field-hover-border-color, var(--global-search-text-field-default-hover-border-color));
			}
		}

		.aurora-global-search-button:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-global-search-button-icon {
			display: inline-flex;
			flex: none;
			color: var(--global-search-text-field-icon-color, var(--global-search-text-field-default-icon-color));
			--icon-size: var(--global-search-text-field-icon-size, var(--global-search-text-field-default-icon-size));
		}

		.aurora-global-search-button-label {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-global-search-shortcut,
		.aurora-global-search-escape,
		.aurora-global-search-footer kbd {
			padding: 1px 5px;
			border: 1px solid var(--global-search-text-field-kbd-border-color, var(--global-search-text-field-default-kbd-border-color));
			border-radius: var(--global-radius-xs);
			background: var(--global-search-text-field-kbd-background, var(--global-search-text-field-default-kbd-background));
			color: var(--global-search-text-field-kbd-color, var(--global-search-text-field-default-kbd-color));
			font-family: var(--global-font-family-mono);
			font-size: var(--global-search-text-field-kbd-font-size, var(--global-search-text-field-default-kbd-font-size));
			white-space: nowrap;
		}

		:global(.aurora-dialog.aurora-global-search-dialog) {
			--dialog-padding: 0;
			--dialog-width: var(--global-search-text-field-dialog-width, var(--global-search-text-field-default-dialog-width));
			--dialog-max-height: var(--global-search-text-field-dialog-max-height, var(--global-search-text-field-default-dialog-max-height));
			--dialog-transition-y: -8px;
			align-items: flex-start;
			padding-top: var(--global-search-text-field-dialog-top, var(--global-search-text-field-default-dialog-top));
		}

		:global(.aurora-dialog.aurora-global-search-dialog[data-fullscreen]) {
			--dialog-width: 100%;
			--dialog-height: 100%;
			--dialog-max-height: 100%;
			--dialog-border-radius: 0;
			--dialog-border-width: 0;
			padding: 0;
		}

		:global(.aurora-global-search-dialog .aurora-dialog-body) {
			display: flex;
			flex: 1;
			flex-direction: column;
			min-height: 0;
			overflow: hidden;
		}

		.aurora-global-search-box {
			display: flex;
			flex: none;
			align-items: center;
			gap: 10px;
			height: var(--global-search-text-field-box-height, var(--global-search-text-field-default-box-height));
			padding: 0 12px 0 18px;
			border-bottom: 1px solid var(--global-search-text-field-divider-color, var(--global-search-text-field-default-divider-color));
		}

		.aurora-global-search-box-icon {
			display: inline-flex;
			color: var(--global-search-text-field-box-icon-color, var(--global-search-text-field-default-box-icon-color));
			--icon-size: 22px;
		}

		.aurora-global-search-input {
			flex: 1;
			min-width: 0;
			height: 100%;
			padding: 0;
			border: 0;
			background: transparent;
			color: inherit;
			font: inherit;
			font-size: var(--global-search-text-field-box-font-size, var(--global-search-text-field-default-box-font-size));
			outline: none;
		}

		.aurora-global-search-loader {
			display: inline-flex;
		}

		.aurora-global-search-input::placeholder {
			color: var(--global-input-placeholder-color);
		}

		.aurora-global-search-results {
			flex: 1;
			min-height: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
		}

		.aurora-global-search-listbox {
			padding: 4px 0;
		}

		.aurora-global-search-listbox:empty {
			display: none;
		}

		.aurora-global-search-group {
			padding: 12px 16px 6px;
			color: var(--global-search-text-field-group-color, var(--global-search-text-field-default-group-color));
			font-size: var(--global-search-text-field-group-font-size, var(--global-search-text-field-default-group-font-size));
			font-weight: 600;
			letter-spacing: 0.12em;
			text-transform: uppercase;
		}

		.aurora-global-search-option {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px 14px;
			color: inherit;
			text-decoration: none;
			cursor: pointer;
		}

		.aurora-global-search-option[data-active] {
			background: var(--global-search-text-field-option-active-background, var(--global-search-text-field-default-option-active-background));
		}

		.aurora-global-search-option-icon {
			display: grid;
			flex: none;
			place-items: center;
			box-sizing: border-box;
			width: 28px;
			height: 28px;
			border: 1px solid var(--global-search-text-field-divider-color, var(--global-search-text-field-default-divider-color));
			border-radius: var(--global-radius-sm);
			background: var(--global-search-text-field-option-icon-background, var(--global-search-text-field-default-option-icon-background));
			color: var(--global-search-text-field-option-icon-color, var(--global-search-text-field-default-option-icon-color));
			--icon-size: 18px;
		}

		.aurora-global-search-option[data-active] .aurora-global-search-option-icon {
			border-color: transparent;
			background: var(--global-search-text-field-option-active-icon-background, var(--global-search-text-field-default-option-active-icon-background));
			color: var(--global-search-text-field-option-active-icon-color, var(--global-search-text-field-default-option-active-icon-color));
		}

		.aurora-global-search-option-text {
			display: flex;
			flex: 1;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-global-search-option-label {
			overflow: hidden;
			font-weight: 500;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-global-search-option-label mark {
			background: none;
			color: var(--global-search-text-field-mark-color, var(--global-search-text-field-default-mark-color));
			font-weight: 700;
		}

		.aurora-global-search-option-description {
			overflow: hidden;
			color: var(--global-search-text-field-description-color, var(--global-search-text-field-default-description-color));
			font-size: 12px;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-global-search-option-enter {
			color: var(--global-search-text-field-description-color, var(--global-search-text-field-default-description-color));
			font-family: var(--global-font-family-mono);
			font-size: 12px;
		}

		.aurora-global-search-message {
			margin: 0;
			padding: 20px 16px;
			color: var(--global-search-text-field-description-color, var(--global-search-text-field-default-description-color));
			text-align: center;
		}

		.aurora-global-search-message[data-error] {
			color: var(--global-color-error);
		}

		.aurora-global-search-live {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.aurora-global-search-footer {
			display: flex;
			flex: none;
			flex-wrap: wrap;
			gap: 16px;
			padding: 10px 16px;
			border-top: 1px solid var(--global-search-text-field-divider-color, var(--global-search-text-field-default-divider-color));
			color: var(--global-search-text-field-description-color, var(--global-search-text-field-default-description-color));
			font-size: 11.5px;
		}

		.aurora-global-search-footer kbd {
			margin-right: 4px;
		}

		.aurora-global-search-footer[data-hidden] {
			display: none;
		}
	}
</style>
