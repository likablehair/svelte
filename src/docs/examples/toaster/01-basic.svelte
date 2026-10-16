<!-- @component Variants
Mount `<Toaster />` once in the root layout (these docs do, at the top right), then call the functions from anywhere, `.ts` files included. A string is the title; an object adds a `description` and more. -->
<script lang="ts">
	import { addErrorToast, addInfoToast, addSuccessToast, addWarningToast, Button } from '#lib';
</script>

<div class="row">
	<Button variant="secondary" onclick={() => addSuccessToast('Appointment saved')}>Success</Button>
	<Button
		variant="secondary"
		onclick={() =>
			addErrorToast({ title: 'Payment failed', description: 'The card was declined by the issuer.' })}
	>
		Error
	</Button>
	<Button
		variant="secondary"
		onclick={() =>
			addWarningToast({ title: 'Low stock', description: '3 products are below the minimum level.' })}
	>
		Warning
	</Button>
	<Button
		variant="secondary"
		onclick={() => addInfoToast({ title: 'New version available', duration: 0 })}
	>
		Info that stays
	</Button>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
