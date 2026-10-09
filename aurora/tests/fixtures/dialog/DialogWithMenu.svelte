<script lang="ts">
	import Menu from '#lib/components/simple/common/Menu.svelte';
	import Dialog from '#lib/components/simple/dialogs/Dialog.svelte';

	let open = $state(true);
	let menuOpen = $state(false);
	let activator = $state<HTMLButtonElement>();
</script>

<Dialog bind:open title="Edit client">
	<button type="button" bind:this={activator} onclick={() => (menuOpen = !menuOpen)}>
		Options
	</button>
	<Menu bind:open={menuOpen} {activator} role="menu" aria-label="Options menu">
		<button type="button" role="menuitem">Archive</button>
	</Menu>
</Dialog>
