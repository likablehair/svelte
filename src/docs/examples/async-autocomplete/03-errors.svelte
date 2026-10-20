<!-- @component Errors
When `searcher` throws or rejects, the list shows `errorText` and `onerror` receives the error; searches aborted by a newer one are not errors. `errorSnippet` replaces the error row: its `search` runs the search again. Turn on the switch to make the fake API fail. -->
<script lang="ts">
	import { mdiRefresh } from '@mdi/js';
	import { AsyncAutocomplete, Button, Switch } from '#lib';

	const PRODUCTS = ['Shampoo', 'Conditioner', 'Hair mask', 'Hair oil', 'Hairspray', 'Styling gel'];

	let failing = $state(true);
	let errors = $state(0);

	function wait(ms: number, signal: AbortSignal) {
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		});
	}

	async function searchProducts({ searchText, signal }: { searchText: string; signal: AbortSignal }) {
		await wait(600, signal);
		if (failing) throw new Error('Service unavailable');
		const query = searchText.toLowerCase();
		return PRODUCTS.filter((name) => name.toLowerCase().includes(query)).map((name) => ({
			value: name,
			label: name
		}));
	}
</script>

<div class="demo">
	<Switch label="Make the server fail" bind:checked={failing} />
	<AsyncAutocomplete
		label="Product"
		placeholder="Search a product…"
		searcher={searchProducts}
		onerror={() => errors++}
	>
		{#snippet errorSnippet({ error, search })}
			<span class="error">
				{error instanceof Error ? error.message : "Couldn't load results"}
				<Button buttonType="text" size="sm" icon={mdiRefresh} onclick={search}>Retry</Button>
			</span>
		{/snippet}
	</AsyncAutocomplete>
	<p>Errors: {errors}</p>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
		max-width: 340px;
	}

	.error {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		color: var(--global-color-error);
	}

	p {
		margin: 0;
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
