<!-- @component Form page
`back` alone goes back in the browser history. `onback` runs first: calling `event.preventDefault()` keeps the user on the page, here to confirm before leaving unsaved changes. -->
<script lang="ts">
	import { ConfirmOrCancelButtons, PageHeader } from '#lib';

	let leaving = $state(false);
</script>

<div class="page">
	<PageHeader
		back
		title="New client"
		subtitle="The client gets an email to confirm the account."
		description="Fields marked with * are required."
		onback={(event) => {
			event.preventDefault();
			leaving = true;
		}}
	>
		{#snippet actionsSnippet()}
			<ConfirmOrCancelButtons confirmText="Save" />
		{/snippet}
	</PageHeader>
	{#if leaving}
		<p class="note">Back stopped by <code>onback</code>: ask before leaving.</p>
	{/if}
</div>

<style>
	.page {
		width: 100%;
	}

	.note {
		margin: 12px 0 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
