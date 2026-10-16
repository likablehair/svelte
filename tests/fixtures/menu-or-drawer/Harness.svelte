<script lang="ts">
	import MenuOrDrawer from '#lib/components/composed/common/MenuOrDrawer.svelte';

	let {
		style = '--menu-duration: 0s; --drawer-duration: 0s',
		lines = 2,
		...props
	}: Record<string, any> = $props();

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
	let menuElement = $state<HTMLDivElement>();
	let drawerElement = $state<HTMLDialogElement>();
</script>

<div {style}>
	<button
		type="button"
		bind:this={activator}
		style="position: fixed; top: 100px; left: 400px; width: 120px"
		onclick={() => (open = !open)}
	>
		Open
	</button>
	<output data-testid="state">{open ? 'open' : 'closed'}</output>
	<output data-testid="elements">{menuElement ? 'menu' : ''}{drawerElement ? 'drawer' : ''}</output>
	<MenuOrDrawer bind:open {activator} bind:menuElement bind:drawerElement {...props}>
		{#snippet children({ isDrawer, isMenu, close })}
			<p data-testid="flags">{isDrawer ? 'drawer' : ''}{isMenu ? 'menu' : ''}</p>
			{#each { length: lines }, index (index)}
				<p>Line {index + 1}</p>
			{/each}
			<button type="button" onclick={close}>Done</button>
		{/snippet}
	</MenuOrDrawer>
</div>
