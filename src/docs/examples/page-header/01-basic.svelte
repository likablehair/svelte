<!-- @component List page
A title, one line of subtitle and the page action on the right. The title is the `h1` of the page. -->
<script lang="ts">
	import { mdiPlus } from '@mdi/js';
	import { Button, PageHeader } from '#lib';
</script>

<div class="page">
	<PageHeader title="Bookings" subtitle="Every appointment of the salon, past and upcoming.">
		{#snippet actionsSnippet()}
			<Button icon={mdiPlus}>New booking</Button>
		{/snippet}
	</PageHeader>
</div>

<style>
	.page {
		width: 100%;
	}
</style>
