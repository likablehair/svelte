<!-- @component Icons only
With `iconsOnly`, as in a collapsed sidebar, the labels become tooltips, a badge becomes a dot and a parent opens a menu with its children. Switch it off to see the full menu. -->
<script lang="ts">
	import {
		mdiAccountMultipleOutline,
		mdiCalendarOutline,
		mdiCogOutline,
		mdiPackageVariantClosed,
		mdiViewDashboardOutline
	} from '@mdi/js';
	import { HierarchyMenu, Switch, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'dashboard', label: 'Dashboard', icon: mdiViewDashboardOutline },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline, badge: 12 },
		{ name: 'clients', label: 'Clients', icon: mdiAccountMultipleOutline },
		{ name: 'warehouse', label: 'Warehouse', icon: mdiPackageVariantClosed, badge: 3 },
		{
			name: 'settings',
			label: 'Settings',
			icon: mdiCogOutline,
			options: [
				{ name: 'general', label: 'General' },
				{ name: 'hours', label: 'Opening hours' }
			]
		}
	];

	let iconsOnly = $state(true);
	let selected = $state('hours');
</script>

<div class="demo">
	<Switch bind:checked={iconsOnly} label="Icons only" />
	<div class="rail" data-narrow={iconsOnly ? '' : undefined}>
		<HierarchyMenu {options} bind:selected {iconsOnly} aria-label="Main menu" />
	</div>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		justify-items: start;
	}

	.rail {
		box-sizing: border-box;
		width: 260px;
		padding: 12px 10px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface);
	}

	.rail[data-narrow] {
		width: 64px;
	}
</style>
