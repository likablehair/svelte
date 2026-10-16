<!-- @component Inside a dialog
A modal `Dialog` or `Drawer` makes the rest of the page inert, so while one is open the toasts show inside it and stay clickable. -->
<script lang="ts">
	import { addSuccessToast, Button, Dialog } from '#lib';

	let open = $state(false);
</script>

<Button variant="secondary" onclick={() => (open = true)}>Open dialog</Button>

<Dialog bind:open title="Edit appointment" closable>
	<p>Save the changes: the toast appears on top of the dialog.</p>
	{#snippet actionsSnippet()}
		<Button
			onclick={() =>
				addSuccessToast({ title: 'Changes saved', action: { label: 'View', onclick: () => {} } })}
		>
			Save
		</Button>
	{/snippet}
</Dialog>
