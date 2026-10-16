<script lang="ts">
	import ConfirmOrCancelButtons from '#lib/components/composed/forms/ConfirmOrCancelButtons.svelte';
	import PageHeader from '#lib/components/simple/common/PageHeader.svelte';
</script>

<div style="width: 600px">
	<PageHeader title="New client">
		{#snippet actionsSnippet()}
			<ConfirmOrCancelButtons />
		{/snippet}
	</PageHeader>
</div>
