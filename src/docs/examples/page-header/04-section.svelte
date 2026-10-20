<!-- @component Section header
`size="sm"` and `headingLevel={2}` for a header inside a card, a panel or a dialog, where the page already has its `h1`. -->
<script lang="ts">
	import { mdiDownload } from '@mdi/js';
	import { Button, PageHeader } from '#lib';
</script>

<section class="card">
	<PageHeader size="sm" headingLevel={2} title="Invoices" subtitle="Last 12 months">
		{#snippet actionsSnippet()}
			<Button size="sm" variant="secondary" icon={mdiDownload}>Export</Button>
		{/snippet}
	</PageHeader>
</section>

<style>
	.card {
		box-sizing: border-box;
		width: min(100%, 560px);
		padding: 20px;
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
		box-shadow: var(--global-shadow-sm);
	}
</style>
