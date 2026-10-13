<!-- @component Pages as links
With `pageHref` every control is a link: the page can live in the URL (`?page=3`), a middle click opens it in a new tab and SvelteKit can preload it. A plain click still updates `page` and calls `onchange`. In an app, read the page from `page.url.searchParams` in `load`. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(1);
</script>

<Paginator bind:page pageCount={8} pageHref={(target) => `#page-${target}`} />
