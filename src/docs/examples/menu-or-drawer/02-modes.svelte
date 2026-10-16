<!-- @component Forcing the menu or the sheet
`mode="menu"` and `mode="drawer"` open always the same one, whatever the screen. The sheet can have a title and a close button through `drawerProps`; `--drawer-size` fixes its height. -->
<script lang="ts">
	import { MenuOrDrawer, Button } from '#lib';

	let menuOpen = $state(false);
	let drawerOpen = $state(false);
	let menuButton = $state<HTMLButtonElement | HTMLAnchorElement>();
</script>

<div class="demo">
	<Button variant="secondary" bind:buttonElement={menuButton} onclick={() => (menuOpen = !menuOpen)}>
		Always a menu
	</Button>
	<Button variant="secondary" onclick={() => (drawerOpen = true)}>Always a sheet</Button>
</div>

<MenuOrDrawer bind:open={menuOpen} activator={menuButton} mode="menu" menuProps={{ 'aria-label': 'Info' }}>
	<p class="text">A menu even on a phone, for content that must stay next to its button.</p>
</MenuOrDrawer>

<MenuOrDrawer
	bind:open={drawerOpen}
	mode="drawer"
	drawerProps={{ title: 'Delivery', closable: true }}
	--drawer-size="min(320px, 85dvh)"
>
	<p class="text">A bottom sheet even on a desktop, with a fixed height.</p>
</MenuOrDrawer>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.text {
		max-width: 260px;
		margin: 0;
		padding: 8px 10px;
		font-size: 13px;
	}
</style>
