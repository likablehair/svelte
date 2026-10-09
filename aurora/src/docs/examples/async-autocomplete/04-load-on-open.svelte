<!-- @component Load on open and refresh
With `searchThreshold={0}` the first search runs, with an empty text, as soon as the list opens: the server can answer with its first results. They are kept, so reopening the list does not search again; `search()`, called on the instance bound with `bind:this`, loads them again. -->
<script lang="ts">
	import { mdiRefresh } from '@mdi/js';
	import { AsyncAutocomplete, Button } from '#lib';

	const STAFF = ['Anna', 'Beatrice', 'Carlo', 'Daniela', 'Enrico', 'Federica', 'Gianni', 'Ilaria'];

	let loads = $state(0);
	let autocomplete: ReturnType<typeof AsyncAutocomplete> | undefined = $state();

	function wait(ms: number, signal: AbortSignal) {
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		});
	}

	async function searchStaff({ searchText, signal }: { searchText: string; signal: AbortSignal }) {
		await wait(600, signal);
		loads++;
		const query = searchText.toLowerCase();
		return STAFF.filter((name) => name.toLowerCase().includes(query)).map((name) => ({
			value: name,
			label: name
		}));
	}
</script>

<div class="demo">
	<AsyncAutocomplete
		bind:this={autocomplete}
		label="Stylist"
		placeholder="Choose a stylist…"
		searcher={searchStaff}
		searchThreshold={0}
		debounceTimeout={300}
	/>
	<div class="row">
		<Button variant="secondary" size="sm" icon={mdiRefresh} onclick={() => autocomplete?.search()}>
			Refresh
		</Button>
		<span>Searches: {loads}</span>
	</div>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		max-width: 340px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
