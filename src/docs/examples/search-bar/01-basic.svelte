<!-- @component Search as you type
`onsearch` receives the text 300ms after the last keystroke (`debounce`), at once on Enter and when the field is emptied with the × or Escape. `loading` shows a spinner. -->
<script lang="ts">
	import { SearchBar } from '#lib';

	const clients = ['Giulia Marini', 'Luca Rossi', 'Sara Bianchi', 'Giuseppe Verdi', 'Marta Neri'];

	let value = $state('');
	let loading = $state(false);
	let results = $state(clients);

	function onsearch(text: string) {
		loading = true;
		setTimeout(() => {
			results = clients.filter((client) => client.toLowerCase().includes(text.toLowerCase()));
			loading = false;
		}, 400);
	}
</script>

<div class="example">
	<SearchBar bind:value label="Search clients" placeholder="Search clients" {loading} {onsearch} />
	<ul>
		{#each results as client (client)}
			<li>{client}</li>
		{/each}
	</ul>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: min(420px, 100%);
	}

	ul {
		margin: 0;
		padding-inline-start: 20px;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
