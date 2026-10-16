<!-- @component Links and the current page
Options with `href` are links. Pass the path of the page as `currentPath`, in SvelteKit `page.url.pathname` from `$app/state`: the option whose `href` is the longest match is selected, also on the pages below it (`/clients` on `/clients/12`). Here the links only change `path` instead of navigating. -->
<script lang="ts">
	import {
		mdiAccountMultipleOutline,
		mdiCalendarOutline,
		mdiChartBoxOutline,
		mdiCogOutline,
		mdiViewDashboardOutline
	} from '@mdi/js';
	import { HierarchyMenu, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'dashboard', label: 'Dashboard', icon: mdiViewDashboardOutline, href: '/' },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline, href: '/agenda' },
		{ name: 'clients', label: 'Clients', icon: mdiAccountMultipleOutline, href: '/clients' },
		{ name: 'reports', label: 'Reports', icon: mdiChartBoxOutline, href: '/reports' },
		{
			name: 'settings',
			label: 'Settings',
			icon: mdiCogOutline,
			href: '/settings',
			options: [
				{ name: 'general', label: 'General', href: '/settings/general' },
				{ name: 'hours', label: 'Opening hours', href: '/settings/hours' }
			]
		}
	];

	let path = $state('/clients/12');
</script>

<div class="menu">
	<HierarchyMenu
		{options}
		currentPath={path}
		aria-label="Main menu"
		onoptionClick={({ option, nativeEvent }) => {
			nativeEvent.preventDefault();
			path = option.href ?? path;
		}}
	/>
	<p>Path: <code>{path}</code></p>
</div>

<style>
	.menu {
		display: grid;
		gap: 16px;
		width: 260px;
		padding-left: 10px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
