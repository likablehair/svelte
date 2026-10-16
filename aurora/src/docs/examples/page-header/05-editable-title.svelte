<!-- @component Editable title
`titleSnippet` replaces the content of the heading, here with a field that renames a dashboard. The heading level and the layout stay the same. -->
<script lang="ts">
	import { mdiContentSave } from '@mdi/js';
	import { Button, PageHeader } from '#lib';

	let name = $state('Sales overview');
</script>

<div class="page">
	<PageHeader back subtitle="Drag the widgets to arrange them.">
		{#snippet titleSnippet()}
			<input class="name" aria-label="Dashboard name" bind:value={name} />
		{/snippet}
		{#snippet actionsSnippet()}
			<Button icon={mdiContentSave}>Save</Button>
		{/snippet}
	</PageHeader>
</div>

<style>
	.page {
		width: 100%;
	}

	.name {
		box-sizing: border-box;
		width: 100%;
		padding: 2px 6px;
		margin-inline-start: -6px;
		border: var(--global-border-width) solid transparent;
		border-radius: var(--global-radius-sm);
		background: transparent;
		color: inherit;
		font: inherit;
	}

	@media (hover: hover) {
		.name:hover {
			border-color: var(--global-color-border);
		}
	}

	.name:focus-visible {
		outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
		outline-offset: var(--global-focus-ring-offset);
	}
</style>
