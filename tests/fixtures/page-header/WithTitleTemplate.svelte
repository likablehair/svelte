<script lang="ts">
	import { untrack } from 'svelte';
	import PageHeader from '#lib/components/simple/common/PageHeader.svelte';
	import { setTitleTemplate } from '#lib/utils/title.js';

	let {
		template,
		page = 'a',
		titleA = 'Users',
		titleB = 'Roles',
		documentTitle,
		headingLevel = 1
	}: {
		template?: string | ((title: string) => string);
		page?: 'a' | 'b' | 'both' | 'none';
		titleA?: string;
		titleB?: string;
		documentTitle?: string | false;
		headingLevel?: 1 | 2;
	} = $props();

	const initial = untrack(() => template);
	if (initial) setTitleTemplate(initial);
</script>

<svelte:head><title>Tatum</title></svelte:head>

{#if page === 'a' || page === 'both'}
	<PageHeader title={titleA} {documentTitle} {headingLevel} />
{/if}
{#if page === 'b' || page === 'both'}
	<PageHeader title={titleB} />
{/if}
