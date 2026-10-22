<script lang="ts" generics="Name extends string">
	import { tick, untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Button from '../../../simple/buttons/Button.svelte';
	import NoData from '../../../simple/common/NoData.svelte';
	import Dialog from '../../../simple/dialogs/Dialog.svelte';
	import Icon from '../../../simple/media/Icon.svelte';
	import Chip from '../../../simple/navigation/Chip.svelte';
	import Drawer from '../../../simple/navigation/Drawer.svelte';
	import SearchBar from '../../search/SearchBar.svelte';
	import DashboardWidgetShape from '../DashboardWidgetShape.svelte';
	import { catalogCategories, filterCatalog } from '../../../../utils/dashboard/catalog.js';
	import type {
		DashboardCatalogEntry,
		DashboardCatalogItem,
		DashboardWidgetSize
	} from '../../../../utils/dashboard/types.js';

	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';
	const SEARCHABLE_FROM = 6;
	const FOCUSABLE = 'button:not(:disabled), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

	type Entry = DashboardCatalogEntry<Name>;
	type Texts = {
		catalog: string;
		noFit: string;
		search: string;
		categories: string;
		noResults: string;
		clearFilters: string;
		results: string;
		result: string;
		size: string;
		addSize: string;
		close: string;
	};

	interface Props {
		open: boolean;
		entries: Entry[];
		drawer: boolean;
		texts: Texts;
		locale: string;
		searchable?: boolean;
		autofocus: boolean;
		className?: string;
		onadd: (item: DashboardCatalogItem<Name>, size: DashboardWidgetSize) => void;
		headerSnippet?: Snippet<[]>;
		itemSnippet?: Snippet<
			[
				{
					item: DashboardCatalogItem<Name>;
					sizes: DashboardWidgetSize[];
					add: (size: DashboardWidgetSize) => void;
					sizeButtons: Snippet;
				}
			]
		>;
		bodySnippet?: Snippet<
			[
				{
					entries: Entry[];
					add: (item: DashboardCatalogItem<Name>, size: DashboardWidgetSize) => void;
					close: () => void;
				}
			]
		>;
	}

	let {
		open = $bindable(),
		entries,
		drawer,
		texts,
		locale,
		searchable,
		autofocus,
		className,
		onadd,
		headerSnippet,
		itemSnippet,
		bodySnippet
	}: Props = $props();

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	let search = $state('');
	let chosen = $state<string[]>([]);
	let touched = $state(false);
	let lockedHeight = $state<number>();
	let bodyNode = $state<HTMLElement>();
	let listNode = $state<HTMLElement>();
	let searchInput = $state<HTMLInputElement>();

	let categories = $derived(catalogCategories(entries));
	let chips = $derived(categories.length >= 2);
	let showSearch = $derived(searchable ?? entries.length >= SEARCHABLE_FROM);
	let selection = $derived(chips ? chosen.filter((category) => categories.includes(category)) : []);
	let filtered = $derived(filterCatalog(entries, showSearch ? search : '', selection));
	let shown = $derived(filtered.shown);
	let filtering = $derived((showSearch && !!search.trim()) || selection.length > 0);
	let announcement = $derived(
		touched ? (shown.length === 1 ? texts.result : fill(texts.results, { count: shown.length })) : ''
	);

	$effect.pre(() => {
		if (!open) return;
		untrack(() => {
			search = '';
			chosen = [];
			touched = false;
			lockedHeight = undefined;
		});
	});

	$effect(() => {
		if (!bodyNode || lockedHeight !== undefined) return;
		const surface = bodyNode.closest<HTMLElement>('.aurora-dialog-surface, .aurora-drawer-panel');
		const height = surface ? parseFloat(getComputedStyle(surface).height) : 0;
		if (height) lockedHeight = Math.ceil(height);
	});

	$effect(() => {
		if (!open || !autofocus || !showSearch) return;
		tick().then(() => searchInput?.focus());
	});

	let focusedName: string | undefined;
	let focusedIndex = 0;

	function trackFocus(event: FocusEvent) {
		const name = (event.target as Element).closest<HTMLElement>('[data-name]')?.dataset.name;
		focusedName = name;
		focusedIndex = Math.max(0, shown.findIndex((entry) => entry.item.name === name));
	}

	$effect(() => {
		const names: string[] = shown.map((entry) => entry.item.name);
		untrack(() => {
			if (!focusedName || names.includes(focusedName)) return;
			focusedName = undefined;
			tick().then(() => {
				const active = document.activeElement;
				if (active && active !== document.body && bodyNode?.contains(active) && !active.closest('[inert]')) return;
				const next = shown[Math.min(focusedIndex, shown.length - 1)];
				focusFirst(next && listNode?.querySelector(`[data-name="${CSS.escape(next.item.name)}"]:not([inert])`));
			});
		});
	});

	function focusFirst(container: Element | null | undefined) {
		const target = container?.querySelector<HTMLElement>(FOCUSABLE) ?? searchInput ?? bodyNode?.querySelector<HTMLElement>(FOCUSABLE);
		target?.focus();
	}

	function toggle(category: string) {
		touched = true;
		chosen = selection.includes(category)
			? selection.filter((candidate) => candidate !== category)
			: [...selection, category];
	}

	async function clearFilters() {
		touched = true;
		search = '';
		chosen = [];
		await tick();
		if (searchInput) searchInput.focus();
		else focusFirst(listNode);
	}

	function fill(text: string, values: Record<string, string | number>) {
		return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}

	function duration(node: Element) {
		const raw = getComputedStyle(node).getPropertyValue('--global-duration').trim();
		const value = parseFloat(raw) || 0;
		return raw.endsWith('ms') ? value : value * 1000;
	}

	function leave(node: HTMLElement) {
		if (reducedMotion.current) return { duration: 0 };
		return { duration: duration(node), tick: (t: number) => node.toggleAttribute('data-leaving', t < 1) };
	}

	function slide(node: HTMLElement, { from, to }: { from: DOMRect; to: DOMRect }) {
		const x = from.left - to.left;
		const y = from.top - to.top;
		const time = reducedMotion.current ? 0 : duration(node);
		if (time && (x || y)) {
			const easing = getComputedStyle(node).getPropertyValue('--global-ease').trim() || 'ease';
			node.animate([{ translate: `${x}px ${y}px` }, { translate: '0 0' }], { duration: time, easing });
		}
		return { duration: 0 };
	}

	function close() {
		open = false;
	}
</script>

{#snippet title()}
	{@render headerSnippet?.()}
{/snippet}

{#snippet body()}
	<div class="aurora-dashboard-shaper-catalog-body" bind:this={bodyNode} data-locked={lockedHeight ? '' : undefined}>
		{#if bodySnippet}
			<div class="aurora-dashboard-shaper-catalog-scroll">
				{@render bodySnippet({ entries, add: onadd, close })}
			</div>
		{:else}
			{#if showSearch || chips}
				<div class="aurora-dashboard-shaper-catalog-filters">
					{#if showSearch}
						<SearchBar
							bind:value={search}
							bind:input={searchInput}
							label={texts.search}
							placeholder={texts.search}
							debounce={0}
							{locale}
							class={{ container: 'aurora-dashboard-shaper-catalog-search' }}
							onsearch={() => (touched = true)}
						/>
					{/if}
					{#if chips}
						<div class="aurora-dashboard-shaper-catalog-chips" role="group" aria-label={texts.categories}>
							{#each categories as category (category)}
								<Chip
									selected={selection.includes(category)}
									{locale}
									class="aurora-dashboard-shaper-catalog-chip"
									onclick={() => toggle(category)}
								>
									{category}
									<span class="aurora-dashboard-shaper-catalog-count">{filtered.counts.get(category) ?? 0}</span>
								</Chip>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			<div class="aurora-dashboard-shaper-catalog-scroll">
				<ul
					class="aurora-dashboard-shaper-catalog-list"
					bind:this={listNode}
					data-animated={touched || undefined}
					onfocusin={trackFocus}
				>
					{#each shown as entry (entry.item.name)}
						{@const item = entry.item}
						<li class="aurora-dashboard-shaper-item" data-name={item.name} animate:slide out:leave>
							{#snippet sizeButtons()}
								<span class="aurora-dashboard-shaper-sizes">
									{#each entry.sizes as size (`${size.width}x${size.height}`)}
										<button
											type="button"
											class="aurora-dashboard-shaper-size"
											aria-label={fill(texts.addSize, { title: item.title, ...size })}
											onclick={() => onadd(item, size)}
										>
											<DashboardWidgetShape
												width={size.width}
												height={size.height}
												class="aurora-dashboard-shaper-size-shape"
											/>
											{fill(texts.size, { ...size })}
										</button>
									{/each}
								</span>
							{/snippet}
							{#if itemSnippet}
								{@render itemSnippet({ item, sizes: entry.sizes, add: (size) => onadd(item, size), sizeButtons })}
							{:else}
								{#if item.icon}
									<span class="aurora-dashboard-shaper-item-icon"><Icon path={item.icon} /></span>
								{/if}
								<span class="aurora-dashboard-shaper-item-text">
									<span class="aurora-dashboard-shaper-item-title">{item.title}</span>
									{#if item.description}
										<span class="aurora-dashboard-shaper-item-description">{item.description}</span>
									{/if}
								</span>
								{@render sizeButtons()}
							{/if}
						</li>
					{/each}
				</ul>
				{#if !shown.length}
					{#if filtering}
						<NoData
							size="sm"
							icon={SEARCH_ICON}
							title={texts.noResults}
							{locale}
							class="aurora-dashboard-shaper-no-results"
						>
							<Button buttonType="text" size="sm" onclick={clearFilters}>{texts.clearFilters}</Button>
						</NoData>
					{:else}
						<p class="aurora-dashboard-shaper-no-fit">{texts.noFit}</p>
					{/if}
				{/if}
			</div>
			<div class="aurora-dashboard-shaper-catalog-live" aria-live="polite">{announcement}</div>
		{/if}
	</div>
{/snippet}

{#if drawer}
	<Drawer
		bind:open
		position="bottom"
		title={texts.catalog}
		closable
		closeLabel={texts.close}
		{locale}
		titleSnippet={headerSnippet ? title : undefined}
		style={lockedHeight ? `--_drawer-size: ${lockedHeight}px` : undefined}
		class={{ drawer: ['aurora-dashboard-shaper-catalog', className].filter(Boolean).join(' ') }}
	>
		{@render body()}
	</Drawer>
{:else}
	<Dialog
		bind:open
		title={texts.catalog}
		closable
		closeLabel={texts.close}
		{locale}
		titleSnippet={headerSnippet ? title : undefined}
		style={lockedHeight ? `--_dialog-height: ${lockedHeight}px` : undefined}
		class={{ dialog: ['aurora-dashboard-shaper-catalog', className].filter(Boolean).join(' ') }}
	>
		{@render body()}
	</Dialog>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-dashboard-shaper-catalog) {
			--_dialog-max-width: var(--dashboard-shaper-catalog-width, var(--dashboard-shaper-default-catalog-width));
			--_dialog-max-height: var(--dashboard-shaper-catalog-height, var(--dashboard-shaper-default-catalog-height));
			--_drawer-size: auto;
			--_drawer-max-size: var(--dashboard-shaper-catalog-height, var(--dashboard-shaper-default-catalog-height));
		}

		.aurora-dashboard-shaper-catalog-body {
			--_ring: var(--dashboard-shaper-focus-ring-width, var(--dashboard-shaper-default-focus-ring-width)) solid
				var(--dashboard-shaper-focus-ring-color, var(--dashboard-shaper-default-focus-ring-color));
			--_ring-offset: var(--dashboard-shaper-focus-ring-offset, var(--dashboard-shaper-default-focus-ring-offset));
			--_bleed: calc(var(--global-focus-ring-width) + var(--global-focus-ring-offset));

			display: flex;
			box-sizing: border-box;
			flex-direction: column;
			gap: 14px;
		}

		.aurora-dashboard-shaper-catalog-body[data-locked] {
			height: 100%;
			min-height: 0;
		}

		.aurora-dashboard-shaper-catalog-filters {
			display: flex;
			flex: none;
			flex-direction: column;
			gap: var(--dashboard-shaper-catalog-filters-gap, var(--dashboard-shaper-default-catalog-filters-gap));
		}

		.aurora-dashboard-shaper-catalog-chips {
			display: flex;
			flex-wrap: wrap;
			gap: var(--dashboard-shaper-catalog-chips-gap, var(--dashboard-shaper-default-catalog-chips-gap));
		}

		.aurora-dashboard-shaper-catalog-count {
			margin-inline-start: 4px;
			font-family: var(--global-font-family-mono);
			font-variant-numeric: tabular-nums;
			opacity: 0.7;
		}

		.aurora-dashboard-shaper-catalog-scroll {
			position: relative;
			flex: 1 1 auto;
			min-height: 0;
			margin: calc(-1 * var(--_bleed));
			padding: var(--_bleed);
			overflow: auto;
			overscroll-behavior: contain;
		}

		.aurora-dashboard-shaper-catalog-list {
			position: relative;
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
			gap: 10px;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-dashboard-shaper-catalog-list:empty {
			display: none;
		}

		.aurora-dashboard-shaper-item {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			grid-template-areas: 'icon text' 'sizes sizes';
			align-items: center;
			gap: var(--dashboard-shaper-item-gap, var(--dashboard-shaper-default-item-gap));
			padding: var(--dashboard-shaper-item-padding, var(--dashboard-shaper-default-item-padding));
			border: var(--global-border-width) solid
				var(--dashboard-shaper-item-border-color, var(--dashboard-shaper-default-item-border-color));
			border-radius: var(--dashboard-shaper-item-border-radius, var(--dashboard-shaper-default-item-border-radius));
			background: var(--dashboard-shaper-item-background, var(--dashboard-shaper-default-item-background));
		}

		.aurora-dashboard-shaper-catalog-list[data-animated] > .aurora-dashboard-shaper-item {
			transition:
				opacity var(--global-duration) var(--global-ease),
				scale var(--global-duration) var(--global-ease);
		}

		@starting-style {
			.aurora-dashboard-shaper-catalog-list[data-animated] > .aurora-dashboard-shaper-item {
				opacity: 0;
				scale: var(--dashboard-shaper-item-enter-scale, var(--dashboard-shaper-default-item-enter-scale));
			}
		}

		.aurora-dashboard-shaper-catalog-list > :global(.aurora-dashboard-shaper-item[data-leaving]) {
			opacity: 0;
			scale: var(--dashboard-shaper-item-enter-scale, var(--dashboard-shaper-default-item-enter-scale));
			pointer-events: none;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-dashboard-shaper-catalog-list > .aurora-dashboard-shaper-item {
				scale: none !important;
			}
		}

		.aurora-dashboard-shaper-item-icon {
			--icon-default-size: 22px;

			display: grid;
			grid-area: icon;
			width: var(--dashboard-shaper-item-icon-size, var(--dashboard-shaper-default-item-icon-size));
			height: var(--dashboard-shaper-item-icon-size, var(--dashboard-shaper-default-item-icon-size));
			place-items: center;
			border-radius: var(--global-radius-md);
			background: var(
				--dashboard-shaper-item-icon-background,
				var(--dashboard-shaper-default-item-icon-background)
			);
			color: var(--dashboard-shaper-item-icon-color, var(--dashboard-shaper-default-item-icon-color));
		}

		.aurora-dashboard-shaper-item-text {
			display: flex;
			grid-area: text;
			min-width: 0;
			flex-direction: column;
			gap: 2px;
		}

		.aurora-dashboard-shaper-item:not(:has(.aurora-dashboard-shaper-item-icon)) .aurora-dashboard-shaper-item-text {
			grid-column: 1 / -1;
		}

		.aurora-dashboard-shaper-item-title {
			color: var(--dashboard-shaper-item-title-color, var(--dashboard-shaper-default-item-title-color));
			font-size: var(--dashboard-shaper-item-title-font-size, var(--dashboard-shaper-default-item-title-font-size));
			font-weight: var(
				--dashboard-shaper-item-title-font-weight,
				var(--dashboard-shaper-default-item-title-font-weight)
			);
			line-height: 1.35;
		}

		.aurora-dashboard-shaper-item-description {
			color: var(
				--dashboard-shaper-item-description-color,
				var(--dashboard-shaper-default-item-description-color)
			);
			font-size: var(
				--dashboard-shaper-item-description-font-size,
				var(--dashboard-shaper-default-item-description-font-size)
			);
			line-height: 1.4;
		}

		.aurora-dashboard-shaper-sizes {
			display: flex;
			grid-area: sizes;
			flex-wrap: wrap;
			gap: 6px;
		}

		.aurora-dashboard-shaper-size {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			min-height: 28px;
			padding: 0 10px;
			border: 0;
			border-radius: var(--dashboard-shaper-size-border-radius, var(--dashboard-shaper-default-size-border-radius));
			background: var(--dashboard-shaper-size-background, var(--dashboard-shaper-default-size-background));
			color: var(--dashboard-shaper-size-color, var(--dashboard-shaper-default-size-color));
			font: inherit;
			font-family: var(--global-font-family-mono);
			font-size: var(--dashboard-shaper-size-font-size, var(--dashboard-shaper-default-size-font-size));
			cursor: pointer;
			transition:
				background var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper-size:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		@media (hover: hover) {
			.aurora-dashboard-shaper-size:hover {
				background: var(
					--dashboard-shaper-size-hover-background,
					var(--dashboard-shaper-default-size-hover-background)
				);
				color: var(--dashboard-shaper-size-hover-color, var(--dashboard-shaper-default-size-hover-color));
			}
		}

		.aurora-dashboard-shaper-no-fit {
			margin: 8px 0;
			color: var(--global-color-text-3);
			font-size: 13.5px;
		}

		.aurora-dashboard-shaper-catalog-live {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			border: 0;
			white-space: nowrap;
		}
	}
</style>
