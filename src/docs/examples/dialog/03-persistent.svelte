<!-- @component Persistent and nested
With `persistent` Escape and the backdrop do nothing: only the buttons close it. A dialog opened from another one stacks on top, and Escape closes only the topmost. -->
<script lang="ts">
	import { Button, Dialog } from '#lib';

	let terms = $state(false);
	let details = $state(false);
</script>

<Button variant="secondary" onclick={() => (terms = true)}>Open terms</Button>

<Dialog bind:open={terms} persistent title="Accept the new terms">
	You need to accept the terms of service to keep using the booking calendar.
	<Button buttonType="text" onclick={() => (details = true)}>Read the details</Button>
	{#snippet actionsSnippet({ close })}
		<Button variant="secondary" onclick={close}>Not now</Button>
		<Button onclick={close}>Accept</Button>
	{/snippet}
</Dialog>

<Dialog bind:open={details} title="Terms of service" closable --dialog-max-width="520px">
	The salon keeps your appointments and contact details for as long as your account is active.
</Dialog>
