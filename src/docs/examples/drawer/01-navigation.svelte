<!-- @component Navigation
A drawer from the left with a title, the close button and a navigation list in the body. Choosing an item closes it with `close` from the snippet. -->
<script lang="ts">
	import { mdiAccountOutline, mdiCalendarOutline, mdiMenu, mdiViewDashboardOutline } from '@mdi/js';
	import { Button, Drawer, Icon } from '#lib';

	const items = [
		{ label: 'Dashboard', icon: mdiViewDashboardOutline },
		{ label: 'Calendar', icon: mdiCalendarOutline },
		{ label: 'Clients', icon: mdiAccountOutline }
	];
	let open = $state(false);
	let current = $state('Dashboard');
</script>

<Button variant="secondary" icon={mdiMenu} onclick={() => (open = true)}>Open drawer</Button>

<Drawer bind:open title="Menu" closable --drawer-size="260px">
	{#snippet children({ close })}
		<nav>
			{#each items as item (item.label)}
				<a
					href="#{item.label.toLowerCase()}"
					aria-current={item.label === current ? 'page' : undefined}
					onclick={(event) => {
						event.preventDefault();
						current = item.label;
						close(event);
					}}
				>
					<Icon path={item.icon} />{item.label}
				</a>
			{/each}
		</nav>
	{/snippet}
</Drawer>

<style>
	nav {
		display: grid;
		gap: 2px;
	}

	a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 10px;
		border-radius: var(--global-radius-md);
		color: var(--global-color-text-2);
		text-decoration: none;
		--icon-size: 18px;
	}

	a:hover {
		background: var(--global-color-surface-2);
		color: var(--global-color-text);
	}

	a[aria-current='page'] {
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-weight: 600;
	}
</style>
