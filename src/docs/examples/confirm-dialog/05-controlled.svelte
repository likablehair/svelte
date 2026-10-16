<!-- @component Closed by the app
With `closeOnConfirm={false}` the app decides when to close by setting `open`, and drives the spinner with `loading`, as the copies of the dialog in the apps did. `actionsSnippet` replaces the buttons: here a third action, with `confirm` and `cancel` from the snippet to keep the behaviour. -->
<script lang="ts">
	import { mdiFileDocumentRemoveOutline } from '@mdi/js';
	import { Button, ConfirmDialog } from '#lib';

	let open = $state(false);
	let loading = $state(false);
	let result = $state('none');

	async function remove(what: string) {
		loading = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		loading = false;
		result = what;
		open = false;
	}
</script>

<Button variant="secondary" icon={mdiFileDocumentRemoveOutline} onclick={() => (open = true)}
	>Remove report</Button
>
<span class="result">Result: {result}</span>

<ConfirmDialog
	bind:open
	{loading}
	closeOnConfirm={false}
	title="Remove the report?"
	description="You can remove only this version or every version of the report."
	icon={mdiFileDocumentRemoveOutline}
	onconfirm={() => remove('this version')}
>
	{#snippet actionsSnippet({ confirm, cancel, loading })}
		<Button variant="secondary" disabled={loading} onclick={cancel}>Cancel</Button>
		<Button variant="danger" buttonType="text" disabled={loading} onclick={() => remove('all versions')}
			>All versions</Button
		>
		<Button variant="danger" {loading} onclick={confirm}>This version</Button>
	{/snippet}
</ConfirmDialog>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
