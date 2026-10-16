<!-- @component Removable chips
`closable` adds a separate close button named by `closeLabel`; `onclose` receives its click. Text that does not fit is cut with an ellipsis: `--chip-max-width` sets a cap. -->
<script lang="ts">
	import { Button, Chip } from '#lib';

	const initial = ['Cut', 'Balayage', 'Keratin treatment with deep conditioning mask', 'Blow-dry'];
	let tags = $state([...initial]);
</script>

<div class="row">
	{#each tags as tag (tag)}
		<Chip
			variant="primary"
			closable
			closeLabel="Remove {tag}"
			title={tag}
			onclose={() => (tags = tags.filter((t) => t !== tag))}
			--chip-max-width="200px"
		>
			{tag}
		</Chip>
	{:else}
		<Button size="sm" variant="secondary" onclick={() => (tags = [...initial])}>Restore</Button>
	{/each}
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
