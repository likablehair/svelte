<script lang="ts">
	import Menu from '#lib/components/simple/common/Menu.svelte';
	import Tooltip from '#lib/components/simple/common/Tooltip.svelte';

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
	let item = $state<HTMLButtonElement>();
</script>

<div style="padding: 120px 300px">
	<button type="button" bind:this={activator} onclick={() => (open = !open)}>Options</button>
</div>
<Menu bind:open {activator} role="menu" aria-label="Options menu">
	<button type="button" role="menuitem" bind:this={item}>Archive</button>
	<Tooltip activator={item} text="Moves the item to the archive" appearTimeout={0} />
</Menu>
