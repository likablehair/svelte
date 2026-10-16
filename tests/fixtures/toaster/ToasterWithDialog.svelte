<script lang="ts">
	import Dialog from '#lib/components/simple/dialogs/Dialog.svelte';
	import Toaster from '#lib/components/simple/notifiers/Toaster.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Toaster />
<Dialog bind:open title="Edit appointment">
	<p>Save the changes.</p>
</Dialog>
