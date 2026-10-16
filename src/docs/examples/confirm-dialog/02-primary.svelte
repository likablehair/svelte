<!-- @component Not destructive
`variant="primary"` is for actions that can be undone or are not dangerous: the icon and the button take the primary color, the button says "Confirm" unless `confirmText` changes it, and it gets the focus. An array in `description` renders one paragraph per item. -->
<script lang="ts">
	import { mdiSendOutline } from '@mdi/js';
	import { Button, ConfirmDialog } from '#lib';

	let open = $state(false);
	let sent = $state(0);
</script>

<Button icon={mdiSendOutline} onclick={() => (open = true)}>Send invoices</Button>
<span class="result">Sent: {sent}</span>

<ConfirmDialog
	bind:open
	variant="primary"
	title="Send 12 invoices?"
	description={[
		'Every client gets an email with the PDF of the invoice.',
		'You can send them again from the invoice page.'
	]}
	icon={mdiSendOutline}
	confirmText="Send"
	onconfirm={() => {
		sent += 12;
	}}
/>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
