<!-- @component Search on a server
`searcher` receives the typed text and an `AbortSignal` and returns the items. In an app it calls the API, passing the signal so a newer search cancels the older one: `fetch(url, { signal })`. Here a fake API answers after 700ms. The search starts at 2 characters, half a second after the last keystroke, and meanwhile the list shows skeleton rows. `itemIconSnippet` adds an avatar to each client. -->
<script lang="ts">
	import { AsyncAutocomplete, type Item } from '#lib';

	const CLIENTS = [
		'Giulia Marini',
		'Giorgio Neri',
		'Martina Galli',
		'Marco Rossi',
		'Mario Esposito',
		'Sara Bianchi',
		'Sofia Ricci',
		'Luca Conti',
		'Elena Ferrari',
		'Marta Romano',
		'Davide Colombo',
		'Chiara Greco'
	];

	function wait(ms: number, signal: AbortSignal) {
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		});
	}

	async function searchClients({ searchText, signal }: { searchText: string; signal: AbortSignal }) {
		await wait(700, signal);
		const query = searchText.toLowerCase();
		return CLIENTS.filter((name) => name.toLowerCase().includes(query)).map((name) => ({
			value: name,
			label: name
		}));
	}

	const initials = (name: string) =>
		name
			.split(' ')
			.map((part) => part[0])
			.join('');

	let values: Item[] = $state([]);
</script>

<div class="demo">
	<AsyncAutocomplete label="Client" placeholder="Search a client…" searcher={searchClients} bind:values>
		{#snippet itemIconSnippet({ item })}
			<span class="avatar">{initials(String(item.label))}</span>
		{/snippet}
	</AsyncAutocomplete>
	<p>Selected: {values[0]?.label ?? 'none'}</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}

	.avatar {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-size: 10px;
		font-weight: 700;
	}

	p {
		margin: 10px 0 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
