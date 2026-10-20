<!-- @component Delete
The usual case: `onconfirm` returns the Promise of the request, the dialog shows a spinner on the action and blocks closing while it runs, then closes by itself. The title names the thing; without `confirmText` the button says "Delete". -->
<script lang="ts">
	import { mdiTrashCanOutline } from '@mdi/js';
	import { Button, ConfirmDialog } from '#lib';

	let open = $state(false);
	let result = $state('none');

	function deleteClient() {
		return new Promise((resolve) => setTimeout(resolve, 1200)).then(() => (result = 'deleted'));
	}
</script>

<Button variant="danger" icon={mdiTrashCanOutline} onclick={() => (open = true)}>Delete client</Button>
<span class="result">Result: {result}</span>

<ConfirmDialog
	bind:open
	title="Delete the client?"
	description="Giulia Marini and her 48 appointments will be removed for good."
	icon={mdiTrashCanOutline}
	onconfirm={deleteClient}
	oncancel={() => (result = 'cancelled')}
/>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
