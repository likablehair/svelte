<script lang="ts">
	import Menu from '#lib/components/simple/common/Menu.svelte';

	let outer = $state(false);
	let inner = $state(false);
	let outerActivator = $state<HTMLButtonElement>();
	let innerActivator = $state<HTMLButtonElement>();
</script>

<div style="--menu-duration: 0s">
	<button type="button" bind:this={outerActivator} onclick={() => (outer = !outer)}>Outer</button>
	<Menu bind:open={outer} activator={outerActivator} aria-label="Outer menu" class="nested-menus-outer">
		<button type="button" bind:this={innerActivator} onclick={() => (inner = !inner)}>Inner</button>
		<Menu bind:open={inner} activator={innerActivator} aria-label="Inner menu">
			<p>Inner content</p>
		</Menu>
	</Menu>
</div>

<style>
	:global(.nested-menus-outer) {
		--_menu-padding: 20px;
		--_menu-min-width: 400px;
	}
</style>
