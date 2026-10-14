<script lang="ts">
	import MenuOrDrawerOptions from '#lib/components/composed/common/MenuOrDrawerOptions.svelte';

	let { style = '--menu-duration: 0s; --drawer-duration: 0s', ...props }: Record<string, any> = $props();

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
</script>

<div {style}>
	<button type="button" bind:this={activator} onclick={() => (open = !open)}>Open</button>
	<output data-testid="state">{open ? 'open' : 'closed'}</output>
	<MenuOrDrawerOptions bind:open {activator} {...props} />
</div>
