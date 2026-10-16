<!-- @component Suggestions and multiple selection
Below `searchThreshold` the list shows `items`, here the recent services, filtered locally while the first letter is typed; without `items` it shows a "Type at least N characters" row. `bind:searching` tells whether a search is waiting or running. -->
<script lang="ts">
	import { AsyncAutocomplete, type Item } from '#lib';

	const SERVICES = [
		'Haircut',
		'Long blow-dry',
		'Short blow-dry',
		'Color',
		'Root touch-up',
		'Balayage',
		'Highlights',
		'Keratin treatment',
		'Hair mask',
		'Manicure',
		'Pedicure',
		'Beard trim'
	];

	const recent: Item[] = ['Haircut', 'Color', 'Beard trim'].map((name) => ({
		value: name,
		label: name
	}));

	function wait(ms: number, signal: AbortSignal) {
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		});
	}

	async function searchServices({ searchText, signal }: { searchText: string; signal: AbortSignal }) {
		await wait(600, signal);
		const query = searchText.toLowerCase();
		return SERVICES.filter((name) => name.toLowerCase().includes(query)).map((name) => ({
			value: name,
			label: name
		}));
	}

	let values: Item[] = $state([]);
	let searching = $state(false);
</script>

<div class="demo">
	<AsyncAutocomplete
		label="Services"
		placeholder="Search services…"
		searcher={searchServices}
		items={recent}
		multiple
		bind:values
		bind:searching
	/>
	<p>{searching ? 'Searching…' : `${values.length} selected`}</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 10px 0 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
