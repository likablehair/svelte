<!-- @component Truncated text
A common use: show the full text of a truncated cell. The tooltip lives on the top layer, so the `overflow: hidden` of the cell does not clip it. `appearTimeout` sets the hover delay. -->
<script lang="ts">
	import { Tooltip } from '#lib';

	const notes = [
		'Allergic to ammonia-based dyes: use the organic line only.',
		'Prefers afternoon appointments.',
		'Wants to grow the fringe out before the wedding in June, check length at every visit.'
	];
	let cells = $state<HTMLElement[]>([]);
</script>

<ul class="list">
	{#each notes as note, index (index)}
		<li>
			<span class="note" bind:this={cells[index]}>{note}</span>
			<Tooltip activator={cells[index]} text={note} appearTimeout={700} />
		</li>
	{/each}
</ul>

<style>
	.list {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 6px;
		width: min(100%, 260px);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 14px;
	}

	.note {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 6px 10px;
		border-radius: var(--global-radius-sm);
		background: var(--global-color-surface-2);
	}
</style>
