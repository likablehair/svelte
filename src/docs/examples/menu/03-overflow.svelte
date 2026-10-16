<!-- @component Inside a scrolling container
The menu opens on the top layer, so a parent with `overflow: hidden` or `auto` cannot clip it, and it follows the activator while the container scrolls. -->
<script lang="ts">
	import { Button, Menu } from '#lib';

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
</script>

<div class="box">
	<p>This box has <code>overflow: auto</code> and a fixed height.</p>
	<Button size="sm" bind:buttonElement={activator} onclick={() => (open = !open)}>Open menu</Button>
	<p>Scroll inside the box: the menu stays attached to the button.</p>
	<div class="spacer"></div>
</div>

<Menu bind:open {activator} --menu-padding="12px" --menu-width="220px">
	Not clipped by the box, even though it overflows it.
</Menu>

<style>
	.box {
		height: 140px;
		width: 260px;
		overflow: auto;
		padding: 12px;
		border: var(--global-border-width) dashed var(--global-color-border-strong);
		border-radius: var(--global-radius-md);
		font-size: 13px;
		color: var(--global-color-text-2);
	}

	.spacer {
		height: 200px;
	}
</style>
