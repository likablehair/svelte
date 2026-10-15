<!-- @component Snippets
`appendSnippet` adds content at the end of each box, such as an arrow; `prependSnippet` adds content at the start, such as an avatar; `descriptionSnippet` renders a richer description. -->
<script lang="ts">
	import { Avatar, BoxList, Icon, type BoxListItem } from '#lib';
	import { mdiChevronRight } from '@mdi/js';

	const people: BoxListItem<{ visits: number }>[] = [
		{ name: 'giulia', label: 'Giulia Marini', href: '#giulia', data: { visits: 12 } },
		{ name: 'luca', label: 'Luca Rossi', href: '#luca', data: { visits: 3 } },
		{ name: 'sara', label: 'Sara Bianchi', href: '#sara', data: { visits: 27 } }
	];
</script>

<div class="demo">
	<BoxList boxes={people} aria-label="Clients">
		{#snippet prependSnippet({ box })}
			<Avatar name={box.label} alt="" />
		{/snippet}
		{#snippet descriptionSnippet({ box })}
			<strong>{box.data?.visits}</strong> visits this year
		{/snippet}
		{#snippet appendSnippet()}
			<Icon path={mdiChevronRight} />
		{/snippet}
	</BoxList>
</div>

<style>
	.demo {
		width: min(100%, 760px);
	}
</style>
