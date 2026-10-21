<script lang="ts">
	import SidebarLayout from '#lib/components/layouts/SidebarLayout.svelte';
	import MenuOrDrawer from '#lib/components/composed/common/MenuOrDrawer.svelte';

	let { drawerOpened = $bindable(), ...props }: Record<string, any> = $props();

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
</script>

<SidebarLayout bind:drawerOpened {...props}>
	{#snippet userSnippet()}
		<button type="button" bind:this={activator} onclick={() => (open = !open)}>Account</button>
		<MenuOrDrawer bind:open {activator} drawerProps={{ title: 'Account' }}>
			<p>Profile</p>
			<p>Sign out</p>
		</MenuOrDrawer>
	{/snippet}
</SidebarLayout>
