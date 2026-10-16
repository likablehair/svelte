<!-- @component Tabs that switch page
With `href` the tabs are links in a `<nav>`: they open in a new browser tab with a middle click and SvelteKit can preload them. The selected one has `aria-current="page"`. In an app, derive `selected` from the current URL (`page.url.pathname`). -->
<script lang="ts">
	import { TabSwitcher } from '#lib';

	let selected = $state('general');
</script>

<TabSwitcher
	aria-label="User settings"
	tabs={[
		{ name: 'general', label: 'General', href: '#general' },
		{ name: 'permissions', label: 'Permissions', href: '#permissions' },
		{ name: 'notifications', label: 'Notifications', href: '#notifications' },
		{ name: 'billing', label: 'Billing', href: '#billing', disabled: true }
	]}
	bind:selected
/>
