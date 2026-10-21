<script lang="ts">
	import Drawer from '#lib/components/simple/navigation/Drawer.svelte';

	let outer = $state(true);
	let inner = $state(false);
</script>

<div style="--drawer-duration: 0s">
	<Drawer bind:open={outer} aria-label="Outer" class={{ drawer: 'nested-drawers-outer' }}>
		<button type="button" onclick={() => (inner = true)}>Open inner</button>
		<Drawer bind:open={inner} position="bottom" aria-label="Inner">
			<p>Inner content</p>
		</Drawer>
	</Drawer>
</div>

<style>
	:global(.nested-drawers-outer) {
		--_drawer-size: 240px;
		--_drawer-padding: 0px 0px 14px;
		--_drawer-backdrop-background: rgb(1, 2, 3);
	}
</style>
