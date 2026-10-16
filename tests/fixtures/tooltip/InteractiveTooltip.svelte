<script lang="ts">
	import Tooltip from '#lib/components/simple/common/Tooltip.svelte';

	let { onlink = () => {} }: { onlink?: () => void } = $props();

	let activator = $state<HTMLButtonElement>();
</script>

<div style="padding: 120px 300px">
	<button type="button" bind:this={activator}>Client</button>
	<Tooltip
		{activator}
		interactive
		variant="rich"
		title="Mario Rossi"
		appearTimeout={0}
		style="--tooltip-duration: 0s"
	>
		<a href="#client" onclick={onlink}>Open the client</a>
	</Tooltip>
	<button type="button">Next</button>
</div>
