<!-- @component Expand on hover
With `expandOn="hover"` the sidebar stays a rail of icons and widens over the content while the pointer, or the keyboard focus, is on it, so the page does not move. `expandOn="click"` widens it with a click on the rail instead, until a click outside or Escape. -->
<script lang="ts">
	import {
		mdiAccountMultipleOutline,
		mdiCalendarOutline,
		mdiChartBoxOutline,
		mdiViewDashboardOutline
	} from '@mdi/js';
	import { SidebarLayout, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'dashboard', label: 'Dashboard', icon: mdiViewDashboardOutline },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline },
		{ name: 'clients', label: 'Clients', icon: mdiAccountMultipleOutline },
		{ name: 'reports', label: 'Reports', icon: mdiChartBoxOutline }
	];

	let selected = $state('dashboard');
</script>

<SidebarLayout expandOn="hover" {options} bind:selected>
	{#snippet logoSnippet({ collapsed })}
		<div class="logo">
			<span class="logo-mark">L</span>
			{#if !collapsed}<b>Likable</b>{/if}
		</div>
	{/snippet}
	{#snippet headerSnippet()}
		<b>{options.find((option) => option.name === selected)?.label}</b>
	{/snippet}

	<p>Move the pointer over the rail on the left.</p>
</SidebarLayout>

<style>
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
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

	p {
		margin: 0;
		color: var(--global-color-text-2);
	}
</style>
