<!-- @component Counter
`counter` shows the number of characters below the field, against `maxlength` when it is set. `labelSnippet` adds an "optional" tag to the label. -->
<script lang="ts">
	import { Textarea } from '#lib';

	let notes = $state('Prefers morning appointments. Color 6.3 dark golden blonde.');
</script>

<div class="form">
	<Textarea maxlength={200} counter bind:value={notes}>
		{#snippet labelSnippet()}
			Customer notes <em>optional</em>
		{/snippet}
	</Textarea>
	<Textarea label="Internal memo" counter placeholder="No limit, only the length is shown" />
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
		opacity: 0.7;
	}
</style>
