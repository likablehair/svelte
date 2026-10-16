<!-- @component Remote search
To search on a server, read `searchText`, fetch the results into `items` and pass `searchFunction={() => true}` so they are not filtered again. `loading` shows a spinner in the field and a loading row; `noResultsText` explains an empty list. Here the request is simulated with a 600ms delay. -->
<script lang="ts">
	import { Autocomplete, type Item } from '#lib';

	const CLIENTS = [
		'Giulia Marini',
		'Giorgio Neri',
		'Martina Galli',
		'Marco Rossi',
		'Sara Bianchi',
		'Sofia Ricci',
		'Luca Conti',
		'Elena Ferrari'
	];

	let searchText = $state('');
	let items: Item[] = $state([]);
	let loading = $state(false);
	let tooShort = $derived(searchText.trim().length < 2);

	$effect(() => {
		const query = searchText.trim().toLowerCase();
		if (query.length < 2) {
			items = [];
			loading = false;
			return;
		}
		loading = true;
		const timer = setTimeout(() => {
			items = CLIENTS.filter((name) => name.toLowerCase().includes(query)).map((name) => ({
				value: name,
				label: name
			}));
			loading = false;
		}, 600);
		return () => clearTimeout(timer);
	});
</script>

<div class="demo">
	<Autocomplete
		label="Client"
		placeholder="Type at least 2 letters…"
		bind:searchText
		{items}
		{loading}
		searchFunction={() => true}
		noResultsText={tooShort ? 'Type at least 2 letters' : 'No clients found'}
	/>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}
</style>
