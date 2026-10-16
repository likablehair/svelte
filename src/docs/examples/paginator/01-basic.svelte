<!-- @component Pages of a list
`bind:page` holds the current page and `pageCount` the number of pages. The first and the last page are always there, the current one has a page on each side and "…" stands for the hidden ones, so the paginator keeps the same number of buttons while paging. Load the page in `onchange`. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(7);
	let loaded = $state(7);
</script>

<div class="list">
	<Paginator bind:page pageCount={24} onchange={(event) => (loaded = event.page)} />
	<p>Showing page {loaded} of 24</p>
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
