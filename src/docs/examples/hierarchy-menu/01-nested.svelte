<!-- @component Nested options
Parents open and close their children with a click; the options above the selected one are highlighted and opened. Without links, `bind:selected` holds the `name` of the chosen option. Use the arrow keys to move, Right and Left to open and close. -->
<script lang="ts">
	import {
		mdiAccountMultipleOutline,
		mdiCalendarOutline,
		mdiCogOutline,
		mdiShieldAccountOutline,
		mdiViewDashboardOutline
	} from '@mdi/js';
	import { HierarchyMenu, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'dashboard', label: 'Dashboard', icon: mdiViewDashboardOutline },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline },
		{ name: 'clients', label: 'Clients', icon: mdiAccountMultipleOutline },
		{
			name: 'settings',
			label: 'Settings',
			icon: mdiCogOutline,
			options: [
				{ name: 'general', label: 'General' },
				{ name: 'hours', label: 'Opening hours' },
				{
					name: 'billing',
					label: 'Billing',
					options: [
						{ name: 'methods', label: 'Payment methods' },
						{ name: 'invoices', label: 'Invoices' }
					]
				}
			]
		},
		{
			name: 'permissions',
			label: 'Permissions',
			icon: mdiShieldAccountOutline,
			options: [
				{ name: 'roles', label: 'Roles' },
				{ name: 'users', label: 'Users' }
			]
		}
	];

	let selected = $state('invoices');
</script>

<div class="menu">
	<HierarchyMenu {options} bind:selected aria-label="Main menu" />
	<p>Selected: <code>{selected}</code></p>
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
