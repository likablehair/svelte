<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Menu from '#lib/components/simple/common/Menu.svelte';

	type Props = Omit<ComponentProps<typeof Menu>, 'activator' | 'children'> & {
		activatorStyle?: string;
		containerStyle?: string;
		scrollable?: boolean;
	};

	let {
		open = $bindable(false),
		activatorStyle,
		containerStyle,
		scrollable = false,
		...rest
	}: Props = $props();

	let activator = $state<HTMLButtonElement>();
</script>

<div data-testid="container" style={containerStyle}>
	<button
		type="button"
		bind:this={activator}
		style={activatorStyle}
		onclick={() => (open = !open)}
	>
		Actions
	</button>
	{#if scrollable}
		<div style="height: 600px"></div>
	{/if}
</div>
<button type="button">Outside</button>
<button type="button" onclick={() => (open = false)}>Set closed</button>
<output data-testid="state">{open ? 'open' : 'closed'}</output>
<Menu bind:open {activator} role="menu" aria-label="Actions menu" {...rest}>
	<button type="button" role="menuitem">Edit</button>
	<button type="button" role="menuitem">Delete</button>
</Menu>
