<script lang="ts">
	import Tooltip from '#lib/components/simple/common/Tooltip.svelte';

	let rows = $state(['First', 'Second']);
	let buttons = $state<Record<string, HTMLButtonElement | undefined>>({});
</script>

{#each rows as row (row)}
	<div>
		<button
			type="button"
			bind:this={buttons[row]}
			onclick={() => (rows = rows.filter((other) => other !== row))}
		>
			Remove {row}
		</button>
		<Tooltip activator={buttons[row]} text="Remove {row}" />
	</div>
{/each}
