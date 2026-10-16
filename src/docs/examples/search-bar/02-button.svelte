<!-- @component With a search button
`buttonLabel` adds a button at the end, as in the prototype; with `searchOnType={false}` the search runs only on Enter, on the button and when the field is emptied. -->
<script lang="ts">
	import { SearchBar } from '#lib';

	let searched = $state('');
</script>

<div class="example">
	<SearchBar
		label="Search"
		placeholder="Search clients, services, products…"
		buttonLabel="Search"
		searchOnType={false}
		onsearch={(text) => (searched = text)}
		--search-bar-height="48px"
	/>
	<p>{searched ? `Searched: ${searched}` : 'Nothing searched yet'}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: min(420px, 100%);
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
