<!-- @component Collapsible sidebar
The default `expandOn="toggle"`: the button at the top of the sidebar widens and narrows it, pushing the content. Narrow, the logo turns into that button while the pointer is on the sidebar, and a click on an empty spot of the rail widens the sidebar too. Narrow, the menu shows only icons, with tooltips and the children of a parent in a menu. Make the window narrower than 1024px to get the menu button and the drawer. In an app `currentPath` is `page.url.pathname`; here the links only change `path`. -->
<script lang="ts">
	import {
		mdiAccountMultipleOutline,
		mdiBellOutline,
		mdiCalendarOutline,
		mdiChartBoxOutline,
		mdiCogOutline,
		mdiLogout,
		mdiPackageVariantClosed,
		mdiViewDashboardOutline
	} from '@mdi/js';
	import { Button, SidebarLayout, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'dashboard', label: 'Dashboard', icon: mdiViewDashboardOutline, href: '/' },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline, href: '/agenda', badge: 12 },
		{ name: 'clients', label: 'Clients', icon: mdiAccountMultipleOutline, href: '/clients' },
		{
			name: 'warehouse',
			label: 'Warehouse',
			icon: mdiPackageVariantClosed,
			href: '/warehouse',
			badge: 3
		},
		{ name: 'reports', label: 'Reports', icon: mdiChartBoxOutline, href: '/reports' },
		{
			name: 'settings',
			label: 'Settings',
			icon: mdiCogOutline,
			options: [
				{ name: 'general', label: 'General', href: '/settings/general' },
				{ name: 'hours', label: 'Opening hours', href: '/settings/hours' }
			]
		}
	];

	let path = $state('/agenda');
	let sidebarExpanded = $state(true);
	let selected: string | undefined = $state();
	const title = $derived(
		options.flatMap((option) => [option, ...(option.options ?? [])]).find((o) => o.name === selected)
			?.label
	);
</script>

<SidebarLayout
	{options}
	bind:sidebarExpanded
	bind:selected
	currentPath={path}
	onmenuSelect={({ option, nativeEvent }) => {
		nativeEvent.preventDefault();
		path = option.href ?? path;
	}}
>
	{#snippet logoSnippet({ collapsed })}
		<div class="logo">
			<span class="logo-mark">L</span>
			{#if !collapsed}<b>Likable</b>{/if}
		</div>
	{/snippet}
	{#snippet headerSnippet()}
		<span class="title">{title}</span>
		<Button buttonType="icon" variant="secondary" icon={mdiBellOutline} aria-label="Notifications" />
		<span class="avatar">GM</span>
	{/snippet}
	{#snippet userSnippet({ collapsed })}
		<Button
			buttonType={collapsed ? 'icon' : 'text'}
			variant="secondary"
			icon={mdiLogout}
			aria-label={collapsed ? 'Log out' : undefined}
		>
			{#if !collapsed}Log out{/if}
		</Button>
	{/snippet}

	<div class="cards">
		{#each { length: 8 } as _, index (index)}
			<div class="card"></div>
		{/each}
	</div>
</SidebarLayout>

<style>
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 36px;
		padding-left: 8px;
		font-size: 17px;
		white-space: nowrap;
	}

	.logo-mark {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: var(--global-gradient);
		color: var(--global-color-on-primary);
		font-weight: 700;
	}

	.title {
		flex: 1;
		font-weight: 600;
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-size: 12px;
		font-weight: 600;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}

	.card {
		height: 140px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface);
	}
</style>
