<script lang="ts">
	import '#lib/css/tokens.css';
	import '#lib/css/base.css';
	import '../docs.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { ThemeMode } from '#lib/theme.js';
	import { Toaster } from '#lib';
	import { appearance, changeMode, changeTheme, syncAppearance } from '../docs/appearance.svelte.js';

	import.meta.glob(['/src/lib/themes/*.css', '/src/docs/themes/*.css'], { eager: true });

	let { children, data } = $props();

	const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
	let themes = $derived([
		{ value: '', label: 'Aurora' },
		...data.themes.map((t) => ({ value: t, label: capitalize(t) }))
	]);
	let galleryThemes = $derived(data.galleryThemes.map((t) => ({ value: t, label: capitalize(t) })));
	const modes: { value: ThemeMode; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'system', label: 'System' },
		{ value: 'dark', label: 'Dark' }
	];

	onMount(syncAppearance);
</script>

{#if page.route.id === '/examples/[slug]/[id]'}
	{@render children()}
	<Toaster position="top-end" />
{:else}
<div class="page">
	<aside class="toc">
		<div class="brand">
			<span class="brand-mark">L</span>
			<div>
				<b>Likable Aurora</b>
				<small>@likable-hair/svelte 5</small>
			</div>
		</div>
		{#each data.nav as group (group.title)}
			<h6>{group.title}</h6>
			{#each group.links as link (link.href)}
				<a
					href={link.href}
					class:active={page.url.pathname === link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a
				>
			{/each}
		{/each}
	</aside>

	<main>
		{@render children()}
	</main>

	<Toaster position="top-end" />

	<div class="switcher" role="group" aria-label="Appearance">
		<label>
			<span class="visually-hidden">Theme</span>
			<select value={appearance.theme} onchange={(e) => changeTheme(e.currentTarget.value)}>
				<optgroup label="Library">
					{#each themes as t (t.value)}
						<option value={t.value}>{t.label}</option>
					{/each}
				</optgroup>
				<optgroup label="Gallery">
					{#each galleryThemes as t (t.value)}
						<option value={t.value}>{t.label}</option>
					{/each}
				</optgroup>
			</select>
		</label>
		<div class="segmented">
			{#each modes as m (m.value)}
				<button
					type="button"
					aria-pressed={appearance.mode === m.value}
					onclick={() => changeMode(m.value)}>{m.label}</button
				>
			{/each}
		</div>
	</div>
</div>
{/if}
