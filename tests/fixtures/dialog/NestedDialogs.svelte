<script lang="ts">
	import Dialog from '#lib/components/simple/dialogs/Dialog.svelte';

	let outer = $state(true);
	let inner = $state(false);
</script>

<div style="--dialog-duration: 0s">
	<Dialog bind:open={outer} title="Outer" class={{ dialog: 'nested-dialogs-outer' }}>
		<button type="button" onclick={() => (inner = true)}>Open inner</button>
		<Dialog bind:open={inner} title="Inner">
			<p>Inner content</p>
		</Dialog>
	</Dialog>
</div>

<style>
	:global(.nested-dialogs-outer) {
		--_dialog-max-width: 600px;
		--_dialog-padding: 0px;
		--_dialog-border-radius: 0px;
	}
</style>
