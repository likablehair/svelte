<script lang="ts">
	import Menu from '#lib/components/simple/common/Menu.svelte';

	let first = $state(false);
	let second = $state(false);
	let nested = $state(false);
	let pinned = $state(false);
	let firstButton = $state<HTMLButtonElement>();
	let secondButton = $state<HTMLButtonElement>();
	let nestedButton = $state<HTMLButtonElement>();
	let pinnedButton = $state<HTMLButtonElement>();
</script>

<button type="button" bind:this={firstButton} onclick={() => (first = !first)}>First</button>
<button type="button" bind:this={secondButton} onclick={() => (second = !second)}>Second</button>
<button type="button" bind:this={pinnedButton} onclick={() => (pinned = !pinned)}>Pinned</button>

<Menu bind:open={first} activator={firstButton} role="menu" aria-label="First menu">
	<button
		type="button"
		role="menuitem"
		bind:this={nestedButton}
		onclick={() => (nested = !nested)}
	>
		More
	</button>
	<Menu
		bind:open={nested}
		activator={nestedButton}
		placement="right-start"
		role="menu"
		aria-label="Nested menu"
	>
		<button type="button" role="menuitem">Deep</button>
	</Menu>
</Menu>

<Menu bind:open={second} activator={secondButton} role="menu" aria-label="Second menu">
	<button type="button" role="menuitem">Other</button>
</Menu>

<Menu
	bind:open={pinned}
	activator={pinnedButton}
	closeOnClickOutside={false}
	role="menu"
	aria-label="Pinned menu"
>
	<button type="button" role="menuitem">Stay</button>
</Menu>
