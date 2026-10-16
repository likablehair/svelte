<script lang="ts">
	import '#lib/css/tokens.css';
	import '#lib/css/base.css';
	import '../docs.css';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import {
		GlobalSearchTextField,
		HierarchyMenu,
		ModeSwitch,
		Select,
		SidebarLayout,
		Toaster,
		type HierarchyMenuOption,
		type Item
	} from '#lib';
	import { appearance, changeMode, changeTheme, syncAppearance } from '../docs/appearance.svelte.js';
	import { searchDocs } from '../docs/search.js';

	import.meta.glob(['/src/lib/themes/*.css', '/src/docs/themes/*.css'], { eager: true });

	let { children, data } = $props();

	const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
	let themeItems: Item<{ gallery: boolean }>[] = $derived([
		{ value: '', label: 'Aurora', data: { gallery: false } },
		...data.themes.map((t) => ({ value: t, label: capitalize(t), data: { gallery: false } })),
		...data.galleryThemes.map((t) => ({ value: t, label: capitalize(t), data: { gallery: true } }))
	]);

	let nav = $derived(
		data.nav.map((group) => ({
			title: group.title,
			options: group.links.map(
				(link): HierarchyMenuOption => ({ name: link.href, label: link.label, href: link.href })
			)
		}))
	);

	onMount(syncAppearance);

	$effect(() => {
		const hash = decodeURIComponent(page.url.hash.slice(1));
		let target: HTMLElement | null = null;
		let active = true;
		tick().then(() => {
			if (!active || !hash) return;
			target = document.getElementById(hash);
			target?.setAttribute('data-target', '');
		});
		return () => {
			active = false;
			target?.removeAttribute('data-target');
		};
	});
</script>

{#snippet brand()}
	<div class="brand">
		<span class="brand-mark">L</span>
		<div>
			<b>Likable Aurora</b>
			<small>@likable-hair/svelte 5</small>
		</div>
	</div>
{/snippet}

{#snippet switcher(place: string)}
	<div class="switcher switcher-{place}" role="group" aria-label="Appearance">
		<Select
			items={themeItems}
			value={appearance.theme}
			aria-label="Theme"
			--select-width="170px"
			onchange={(e: Event) => changeTheme((e.currentTarget as HTMLSelectElement).value)}
		>
			{#snippet itemSnippet({ item })}
				<span class="theme-option">
					{item.label}
					{#if item.data?.gallery}<small>gallery</small>{/if}
				</span>
			{/snippet}
		</Select>
		<ModeSwitch label="Mode" onchange={({ mode }) => changeMode(mode)} />
	</div>
{/snippet}

{#if page.route.id === '/examples/[slug]/[id]'}
	{@render children()}
	<Toaster position="top-end" />
{:else}
	<SidebarLayout
		expandOn="none"
		sidebarExpanded
		currentPath={page.url.pathname}
		class={{ container: 'docs-shell' }}
	>
		{#snippet logoSnippet()}
			{@render brand()}
		{/snippet}
		{#snippet menuSnippet()}
			{#each nav as group (group.title)}
				<h6 class="nav-title" id="nav-{group.title.toLowerCase()}">{group.title}</h6>
				<HierarchyMenu
					options={group.options}
					currentPath={page.url.pathname}
					aria-labelledby="nav-{group.title.toLowerCase()}"
				/>
			{/each}
		{/snippet}
		{#snippet headerSnippet()}
			<div class="header-brand">{@render brand()}</div>
			<GlobalSearchTextField
				searcher={(params) => searchDocs({ ...params, currentPath: page.url.pathname })}
				debounceTimeout={80}
				label="Search the docs"
				placeholder="Components, props, CSS variables, tokens…"
				class={{ container: 'docs-search' }}
				--global-search-text-field-max-width="280px"
			/>
			<div class="header-space"></div>
			{@render switcher('header')}
		{/snippet}
		{#snippet userSnippet({ hamburgerVisible })}
			{#if hamburgerVisible}{@render switcher('drawer')}{/if}
		{/snippet}

		{@render children()}
	</SidebarLayout>

	<Toaster position="top-end" />
{/if}
