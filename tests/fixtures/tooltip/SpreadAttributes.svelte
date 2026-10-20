<script lang="ts">
	import Tooltip from '#lib/components/simple/common/Tooltip.svelte';

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
	let attributes = $state.raw({ text: 'First text' });
</script>

<div style="padding: 120px 300px">
	<button type="button" bind:this={activator}>Target</button>
</div>
<button type="button" onclick={() => (attributes = { text: 'Second text' })}>
	Change text
</button>
<button type="button" onclick={() => (open = true)}>Show tip</button>
<Tooltip {activator} bind:open {...attributes} />
