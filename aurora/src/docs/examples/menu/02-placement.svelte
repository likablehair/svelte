<!-- @component Placement
`placement` picks the side and the alignment. When there is not enough space the menu flips to the opposite side and shifts to stay in the viewport. Opening one menu closes the others. -->
<script lang="ts">
	import { Button, Menu } from '#lib';

	const placements = ['bottom-start', 'bottom-end', 'top', 'right', 'left'] as const;
	let open = $state<Record<string, boolean>>(Object.fromEntries(placements.map((p) => [p, false])));
	let buttons = $state<Record<string, HTMLButtonElement>>({});
</script>

{#each placements as placement (placement)}
	<Button
		variant="secondary"
		size="sm"
		bind:buttonElement={buttons[placement]}
		onclick={() => (open[placement] = !open[placement])}
	>
		{placement}
	</Button>
	<Menu bind:open={open[placement]} activator={buttons[placement]} {placement} --menu-padding="10px 14px">
		<code>placement="{placement}"</code>
	</Menu>
{/each}
