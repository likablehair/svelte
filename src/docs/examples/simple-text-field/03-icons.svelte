<!-- @component Icons and snippets
Icons can sit outside (`prependIcon`, `appendIcon`) or inside the field (`prependInnerIcon`, `appendInnerIcon`). Snippets replace them, and the label, with any content. -->
<script lang="ts">
	import { mdiHelpCircleOutline, mdiMagnify, mdiStoreOutline } from '@mdi/js';
	import { SimpleTextField } from '#lib';
</script>

<div class="form">
	<SimpleTextField
		label="Salon"
		prependIcon={mdiStoreOutline}
		appendIcon={mdiHelpCircleOutline}
		placeholder="Outer icons"
	/>
	<SimpleTextField placeholder="Allergies, preferences…">
		{#snippet labelSnippet()}
			Notes <em>optional</em>
		{/snippet}
	</SimpleTextField>
	<SimpleTextField type="search" prependInnerIcon={mdiMagnify} placeholder="Search clients…">
		{#snippet appendInnerSnippet()}
			<kbd>⌘K</kbd>
		{/snippet}
	</SimpleTextField>
</div>

<style>
	.form {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}

	em {
		font-style: normal;
		font-weight: 400;
		color: var(--global-color-text-3);
	}

	kbd {
		padding: 2px 6px;
		border-radius: var(--global-radius-xs);
		border: var(--global-border-width) solid var(--global-color-border);
		background: var(--global-color-surface-2);
		font-family: var(--global-font-family-mono);
		font-size: 11px;
	}
</style>
