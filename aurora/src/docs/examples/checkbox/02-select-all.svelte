<!-- @component Select all and Shift range
`indeterminate` shows a partial "select all". In `onclick`, `event.shiftKey` tells whether Shift was held while clicking (in Chromium also with the Space key): here Shift selects the whole range from the last clicked row. -->
<script lang="ts">
	import { Checkbox } from '#lib';

	const clients = ['Luca Rossi', 'Giulia Marini', 'Sara Bianchi', 'Marco Conti', 'Elena Ferri'];

	let selected = $state<string[]>(['Giulia Marini']);
	let last = $state<number>();

	let all = $derived(selected.length === clients.length);
	let some = $derived(selected.length > 0 && !all);

	function toggleAll() {
		selected = all ? [] : [...clients];
	}

	function toggle(index: number, event: MouseEvent) {
		const name = clients[index];
		const on = !selected.includes(name);
		const range =
			event.shiftKey && last !== undefined
				? clients.slice(Math.min(last, index), Math.max(last, index) + 1)
				: [name];
		selected = on
			? [...new Set([...selected, ...range])]
			: selected.filter((c) => !range.includes(c));
		last = index;
	}
</script>

<div class="list">
	<Checkbox label="All clients" checked={all} indeterminate={some} onchange={toggleAll} />
	<div class="rows">
		{#each clients as client, i (client)}
			<Checkbox
				label={client}
				checked={selected.includes(client)}
				onclick={(event) => toggle(i, event)}
			/>
		{/each}
	</div>
</div>

<style>
	.list {
		display: grid;
		gap: 12px;
	}

	.rows {
		display: grid;
		justify-items: start;
		gap: 10px;
		padding-inline-start: 28px;
	}
</style>
