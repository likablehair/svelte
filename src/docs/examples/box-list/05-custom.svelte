<!-- @component Compact grid
Boxes without icon or description make a list of quick links; `--box-list-min-width` sets the width of the columns and `--box-list-gap` the space between the boxes. -->
<script lang="ts">
	import { BoxList, Icon, type BoxListItem } from '#lib';
	import { mdiArrowRight } from '@mdi/js';

	const boxes: BoxListItem[] = [
		{ name: 'today', label: 'Today', href: '#today' },
		{ name: 'week', label: 'This week', href: '#week' },
		{ name: 'month', label: 'This month', href: '#month' },
		{ name: 'year', label: 'This year', href: '#year' }
	];
</script>

<div class="demo">
	<BoxList {boxes} aria-label="Agenda" --box-list-min-width="150px" --box-list-gap="8px">
		{#snippet appendSnippet()}
			<Icon path={mdiArrowRight} />
		{/snippet}
	</BoxList>
</div>

<style>
	.demo {
		width: min(100%, 760px);
	}
</style>
