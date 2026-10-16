<!-- @component Variants
Four variants with their own color and icon. `closable` adds a close button that calls `onclose`, where the app removes the banner; `appendSnippet` puts an action on the right. -->
<script lang="ts">
	import { AlertBanner, Button } from '#lib';

	let dismissed = $state<string[]>([]);
	const dismiss = (id: string) => (dismissed = [...dismissed, id]);
</script>

<div class="stack">
	{#if !dismissed.includes('update')}
		<AlertBanner
			title="New version available"
			description="Aurora UI 5.0 follows the light or dark mode of the device."
			closable
			onclose={() => dismiss('update')}
		/>
	{/if}
	{#if !dismissed.includes('confirmed')}
		<AlertBanner
			variant="success"
			title="Appointment confirmed"
			description="We sent Giulia a reminder by text message."
			closable
			onclose={() => dismiss('confirmed')}
		/>
	{/if}
	<AlertBanner variant="warning" title="Low stock" description="3 products are below the minimum level.">
		{#snippet appendSnippet()}
			<Button variant="secondary" size="sm">Reorder</Button>
		{/snippet}
	</AlertBanner>
	{#if !dismissed.includes('payment')}
		<AlertBanner
			variant="error"
			title="Payment failed"
			description="The card was declined by the issuer."
			closable
			onclose={() => dismiss('payment')}
		/>
	{/if}
	{#if dismissed.length}
		<div>
			<Button buttonType="text" size="sm" onclick={() => (dismissed = [])}>Show all again</Button>
		</div>
	{/if}
</div>

<style>
	.stack {
		display: grid;
		gap: 12px;
		width: 100%;
	}
</style>
