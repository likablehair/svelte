<!-- @component Bottom sheet with actions
`actionsSnippet` stays pinned at the bottom while the body scrolls. `persistent` keeps the sheet open on Escape and on the backdrop, so the filters can only be applied or reset. -->
<script lang="ts">
	import { mdiFilterVariant } from '@mdi/js';
	import { Button, Drawer } from '#lib';

	const services = ['Cut', 'Color', 'Balayage', 'Perm', 'Treatment', 'Styling', 'Extensions', 'Bridal'];
	let open = $state(false);
	let selected = $state<string[]>([]);
	let applied = $state<string[]>([]);
</script>

<Button variant="secondary" icon={mdiFilterVariant} onclick={() => (open = true)}>Filters</Button>
<span class="result">Applied: {applied.join(', ') || 'none'}</span>

<Drawer
	bind:open
	position="bottom"
	persistent
	title="Filter by service"
	--drawer-size="min(420px, 85dvh)"
	--drawer-padding="18px 16px"
>
	{#each services as service (service)}
		<label>
			<input type="checkbox" value={service} bind:group={selected} />
			{service}
		</label>
	{/each}
	{#snippet actionsSnippet({ close })}
		<Button buttonType="text" variant="secondary" onclick={() => (selected = [])}>Reset</Button>
		<Button
			onclick={(event) => {
				applied = [...selected];
				close(event);
			}}
		>
			Apply
		</Button>
	{/snippet}
</Drawer>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 6px;
		border-bottom: 1px solid var(--global-color-border);
	}
</style>
