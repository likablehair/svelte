<script lang="ts">
	import Menu from '#lib/components/simple/common/Menu.svelte';

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
	let attributes = $state.raw({ 'aria-label': 'First menu' });
</script>

<button type="button" bind:this={activator} onclick={() => (open = !open)}>Target</button>
<button type="button" onclick={() => (attributes = { 'aria-label': 'Second menu' })}>
	Change label
</button>
<Menu {activator} bind:open closeOnClickOutside={false} role="menu" {...attributes}>
	<button type="button" role="menuitem">Item</button>
</Menu>
