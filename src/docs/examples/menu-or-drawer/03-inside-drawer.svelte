<!-- @component Inside a drawer
A MenuOrDrawer opened from inside a Drawer, as in the mobile drawer of SidebarLayout. On a wide screen the menu opens next to its button, above the drawer; up to 1024px wide the bottom sheet covers the whole width at the bottom of the screen, as tall as its content, with its own padding: it does not take the size of the drawer around it. Narrow the window to see the sheet. -->
<script lang="ts">
	import { mdiAccountOutline, mdiCogOutline, mdiLogout, mdiMenu } from '@mdi/js';
	import { Avatar, Button, Drawer, MenuOrDrawer } from '#lib';

	let drawerOpen = $state(false);
	let accountOpen = $state(false);
	let activator = $state<HTMLButtonElement | HTMLAnchorElement>();
</script>

<Button variant="secondary" icon={mdiMenu} onclick={() => (drawerOpen = true)}>Open drawer</Button>

<Drawer bind:open={drawerOpen} title="Menu" closable>
	<div class="body">
		<p class="text">The account button opens a MenuOrDrawer from inside this drawer.</p>
		<Button
			buttonType="text"
			variant="secondary"
			aria-haspopup="true"
			aria-expanded={accountOpen}
			bind:buttonElement={activator}
			onclick={() => (accountOpen = !accountOpen)}
		>
			<Avatar name="Giulia Marini" size="sm" />
			Giulia Marini
		</Button>
	</div>

	<MenuOrDrawer
		bind:open={accountOpen}
		{activator}
		placement="top-start"
		drawerProps={{ title: 'Account' }}
		menuProps={{ 'aria-label': 'Account' }}
	>
		{#snippet children({ close })}
			<div class="account">
				<Button buttonType="text" variant="secondary" icon={mdiAccountOutline} onclick={close}>Profile</Button>
				<Button buttonType="text" variant="secondary" icon={mdiCogOutline} onclick={close}>Settings</Button>
				<Button buttonType="text" variant="danger" icon={mdiLogout} onclick={close}>Sign out</Button>
			</div>
		{/snippet}
	</MenuOrDrawer>
</Drawer>

<style>
	.body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.text {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}

	.account {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 2px;
		min-width: 200px;
	}

	.account :global(.aurora-button) {
		justify-content: flex-start;
	}
</style>
