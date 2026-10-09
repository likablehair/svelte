<!-- @component Confirmation
`title` names the dialog, `closable` adds the close button and `actionsSnippet` holds the buttons; `close` from the snippet closes it and calls `onclose`. Escape and a click on the backdrop close it too, and focus goes back to the button that opened it. -->
<script lang="ts">
	import { mdiTrashCanOutline } from '@mdi/js';
	import { Button, Dialog } from '#lib';

	let open = $state(false);
	let result = $state('none');
</script>

<Button variant="danger" icon={mdiTrashCanOutline} onclick={() => (open = true)}>Delete client</Button>
<span class="result">Result: {result}</span>

<Dialog bind:open title="Delete client?" closable onclose={() => (result = 'dismissed')}>
	Giulia Marini and her 48 appointments will be removed for good.
	{#snippet actionsSnippet({ close })}
		<Button variant="secondary" onclick={close}>Cancel</Button>
		<Button
			variant="danger"
			onclick={() => {
				result = 'deleted';
				open = false;
			}}
		>
			Delete
		</Button>
	{/snippet}
</Dialog>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
