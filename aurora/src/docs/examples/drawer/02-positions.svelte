<!-- @component Positions
`position` picks the side. Top and bottom drawers get rounded inner corners; `--drawer-size` is the width on the sides and the height on top and bottom. -->
<script lang="ts">
	import { Button, Drawer } from '#lib';

	const positions = ['left', 'right', 'top', 'bottom'] as const;
	let open = $state(false);
	let position = $state<(typeof positions)[number]>('left');
</script>

<div class="row">
	{#each positions as side (side)}
		<Button
			variant="secondary"
			onclick={() => {
				position = side;
				open = true;
			}}
		>
			{side}
		</Button>
	{/each}
</div>

<Drawer bind:open {position} title="Drawer on the {position}" closable>
	Escape or a click on the backdrop closes it.
</Drawer>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
