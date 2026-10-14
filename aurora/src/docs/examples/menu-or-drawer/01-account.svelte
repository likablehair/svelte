<!-- @component Account menu
On a wide screen the content opens in a menu below the button; up to 1024px wide it opens in a bottom sheet as tall as the content. `isDrawer` adapts the layout, `close` closes from inside. Narrow the window to see the sheet. -->
<script lang="ts">
	import { mdiAccountOutline, mdiCogOutline, mdiLogout } from '@mdi/js';
	import { Avatar, Button, MenuOrDrawer } from '#lib';

	let open = $state(false);
	let activator = $state<HTMLButtonElement | HTMLAnchorElement>();
	let signedOut = $state(false);
</script>

<Button
	buttonType="text"
	variant="secondary"
	aria-haspopup="true"
	aria-expanded={open}
	bind:buttonElement={activator}
	onclick={() => (open = !open)}
>
	<Avatar name="Giulia Marini" size="sm" />
	Giulia Marini
</Button>
{#if signedOut}<span class="note">Signed out</span>{/if}

<MenuOrDrawer bind:open {activator} placement="bottom-start" drawerProps={{ 'aria-label': 'Account' }}>
	{#snippet children({ isDrawer, close })}
		<div class="account" class:sheet={isDrawer}>
			<div class="who">
				<Avatar name="Giulia Marini" size={isDrawer ? 'lg' : 'md'} />
				<div>
					<strong>Giulia Marini</strong>
					<span>giulia@example.com</span>
				</div>
			</div>
			<Button buttonType="text" variant="secondary" icon={mdiAccountOutline} href="#profile">Profile</Button>
			<Button buttonType="text" variant="secondary" icon={mdiCogOutline} href="#settings">Settings</Button>
			<Button
				buttonType="text"
				variant="danger"
				icon={mdiLogout}
				onclick={() => {
					signedOut = true;
					close();
				}}
			>
				Sign out
			</Button>
		</div>
	{/snippet}
</MenuOrDrawer>

<style>
	.note {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	.account {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 2px;
		width: 240px;
		padding: 4px;
	}

	.account.sheet {
		width: auto;
		padding: 0;
	}

	.account :global(.aurora-button) {
		justify-content: flex-start;
	}

	.who {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
		padding: 6px 8px 10px;
		border-bottom: 1px solid var(--global-color-border);
	}

	.who div {
		display: grid;
	}

	.who span {
		color: var(--global-color-text-3);
		font-size: 12px;
	}
</style>
