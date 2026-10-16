<!-- @component More or fewer numbers
`siblingCount` sets how many pages appear on each side of the current one; `showFirstLast={false}` hides the buttons to the first and the last page, which are already reachable through the numbers. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(10);
</script>

<div class="rows">
	<Paginator bind:page pageCount={40} siblingCount={0} showFirstLast={false} />
	<Paginator bind:page pageCount={40} siblingCount={2} />
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
