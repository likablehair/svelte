<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Tooltip from '#lib/components/simple/common/Tooltip.svelte';

	type Props = Omit<ComponentProps<typeof Tooltip>, 'activator'> & {
		label?: string;
		wrapperStyle?: string;
	};

	let {
		open = $bindable(),
		label = 'Save',
		wrapperStyle = 'padding: 120px 300px',
		...rest
	}: Props = $props();

	let activator = $state<HTMLButtonElement>();
</script>

<div style={wrapperStyle}>
	<button type="button" bind:this={activator}>{label}</button>
	<button type="button">After {label}</button>
</div>
<button type="button" onclick={() => (open = true)}>Show {label} tip</button>
<output data-testid="state-{label}">{open ? 'open' : 'closed'}</output>
<Tooltip {activator} bind:open {...rest} />
