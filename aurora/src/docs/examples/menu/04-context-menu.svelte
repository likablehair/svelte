<!-- @component Context menu and activator width
`activator` can be any object with `getBoundingClientRect()`: here the point of a right click. `matchActivatorWidth` makes the menu as wide as its activator. -->
<script lang="ts">
	import { Button, Menu } from '#lib';

	let contextOpen = $state(false);
	let point = $state<{ getBoundingClientRect(): DOMRect }>();

	function openAt(event: MouseEvent) {
		event.preventDefault();
		const { clientX, clientY } = event;
		point = { getBoundingClientRect: () => new DOMRect(clientX, clientY, 0, 0) };
		contextOpen = true;
	}

	let wideOpen = $state(false);
	let wideButton = $state<HTMLButtonElement>();
</script>

<div class="area" role="presentation" oncontextmenu={openAt}>Right click anywhere in this area</div>
<Menu bind:open={contextOpen} activator={point} --menu-padding="10px 14px">Opened at the cursor</Menu>

<Button variant="secondary" bind:buttonElement={wideButton} onclick={() => (wideOpen = !wideOpen)} --button-width="260px">
	Menu as wide as this button
</Button>
<Menu bind:open={wideOpen} activator={wideButton} matchActivatorWidth --menu-padding="10px 14px">
	Same width as the button.
</Menu>

<style>
	.area {
		display: grid;
		place-items: center;
		width: 260px;
		height: 90px;
		border: var(--global-border-width) dashed var(--global-color-border-strong);
		border-radius: var(--global-radius-md);
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
