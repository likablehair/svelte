<!-- @component Detail page
`backHref` adds a link back to the list: a native link, so it opens in a new tab and SvelteKit preloads it. `prependSnippet` holds an `Avatar` and `subtitleSnippet` adds a status `Chip`; the primary action goes last. -->
<script lang="ts">
	import { mdiCalendarPlus, mdiPencilOutline } from '@mdi/js';
	import { Avatar, Button, Chip, PageHeader } from '#lib';
</script>

<div class="page">
	<PageHeader title="Giulia Marini" backHref="#clients" backLabel="Clients">
		{#snippet prependSnippet()}
			<Avatar name="Giulia Marini" size="lg" />
		{/snippet}
		{#snippet subtitleSnippet()}
			<span class="meta">Client since March 2023 <Chip size="sm" variant="success">Active</Chip></span>
		{/snippet}
		{#snippet actionsSnippet()}
			<Button variant="secondary" icon={mdiPencilOutline}>Edit</Button>
			<Button icon={mdiCalendarPlus}>New booking</Button>
		{/snippet}
	</PageHeader>
</div>

<style>
	.page {
		width: 100%;
	}

	.meta {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
</style>
