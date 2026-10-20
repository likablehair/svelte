<script lang="ts" generics="Name extends string">
	import type { Snippet } from 'svelte';
	import Dialog from '../../../simple/dialogs/Dialog.svelte';
	import Icon from '../../../simple/media/Icon.svelte';
	import Drawer from '../../../simple/navigation/Drawer.svelte';
	import TabSwitcher from '../../../simple/navigation/TabSwitcher.svelte';
	import type { DashboardCatalogItem, DashboardWidgetSize } from '../../../../utils/dashboard/types.js';

	type Entry = { item: DashboardCatalogItem<Name>; sizes: DashboardWidgetSize[] };
	type Texts = { catalog: string; all: string; noFit: string; size: string; addSize: string; close: string };

	interface Props {
		open: boolean;
		entries: Entry[];
		drawer: boolean;
		texts: Texts;
		locale: string;
		className?: string;
		onadd: (item: DashboardCatalogItem<Name>, size: DashboardWidgetSize) => void;
		headerSnippet?: Snippet<[]>;
		itemSnippet?: Snippet<
			[{ item: DashboardCatalogItem<Name>; sizes: DashboardWidgetSize[]; add: (size: DashboardWidgetSize) => void }]
		>;
	}

	let {
		open = $bindable(),
		entries,
		drawer,
		texts,
		locale,
		className,
		onadd,
		headerSnippet,
		itemSnippet
	}: Props = $props();

	const ALL = '\u0000all';

	let categories = $derived([
		...new Set(entries.map((entry) => entry.item.category).filter((category): category is string => !!category))
	]);
	let tabbed = $derived(categories.length >= 2);
	let category = $state(ALL);
	let shown = $derived(
		tabbed && category !== ALL ? entries.filter((entry) => entry.item.category === category) : entries
	);

	$effect.pre(() => {
		if (open) category = ALL;
	});

	function unit(size: DashboardWidgetSize) {
		return Math.min(7, 28 / size.width, 14 / size.height);
	}

	function fill(text: string, values: Record<string, string | number>) {
		return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}
</script>

{#snippet title()}
	{@render headerSnippet?.()}
{/snippet}

{#snippet body()}
	<div class="aurora-dashboard-shaper-catalog-body">
		{#if tabbed}
			<TabSwitcher
				tabs={[{ name: ALL, label: texts.all }, ...categories.map((name) => ({ name, label: name }))]}
				bind:selected={category}
				mandatory
				variant="segmented"
				aria-label={texts.catalog}
			/>
		{/if}
		{#if shown.length}
			<ul class="aurora-dashboard-shaper-catalog-list">
				{#each shown as entry (entry.item.name)}
					{@const item = entry.item}
					<li class="aurora-dashboard-shaper-item">
						{#if itemSnippet}
							{@render itemSnippet({ item, sizes: entry.sizes, add: (size) => onadd(item, size) })}
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
							<span class="aurora-dashboard-shaper-sizes">
								{#each entry.sizes as size (`${size.width}x${size.height}`)}
									<button
										type="button"
										class="aurora-dashboard-shaper-size"
										aria-label={fill(texts.addSize, { title: item.title, ...size })}
										onclick={() => onadd(item, size)}
									>
										<span
											class="aurora-dashboard-shaper-size-shape"
											style:width="{size.width * unit(size)}px"
											style:height="{size.height * unit(size)}px"
											aria-hidden="true"
										></span>
										{fill(texts.size, { ...size })}
									</button>
								{/each}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="aurora-dashboard-shaper-no-fit">{texts.noFit}</p>
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
		class={{ dialog: ['aurora-dashboard-shaper-catalog', className].filter(Boolean).join(' ') }}
	>
		{@render body()}
	</Dialog>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-dashboard-shaper-catalog) {
			--dialog-default-max-width: var(--dashboard-shaper-catalog-width, var(--dashboard-shaper-default-catalog-width));
			--drawer-default-size: auto;
			--drawer-default-max-size: 85dvh;
		}

		.aurora-dashboard-shaper-catalog-body {
			--_ring: var(--dashboard-shaper-focus-ring-width, var(--dashboard-shaper-default-focus-ring-width)) solid
				var(--dashboard-shaper-focus-ring-color, var(--dashboard-shaper-default-focus-ring-color));
			--_ring-offset: var(--dashboard-shaper-focus-ring-offset, var(--dashboard-shaper-default-focus-ring-offset));

			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.aurora-dashboard-shaper-catalog-list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
			gap: 10px;
			margin: 0;
			padding: 0;
			list-style: none;
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

		.aurora-dashboard-shaper-size-shape {
			box-sizing: border-box;
			flex: none;
			border: 1.5px solid currentColor;
			border-radius: 2px;
			opacity: 0.7;
		}

		.aurora-dashboard-shaper-no-fit {
			margin: 8px 0;
			color: var(--global-color-text-3);
			font-size: 13.5px;
		}
	}
</style>
