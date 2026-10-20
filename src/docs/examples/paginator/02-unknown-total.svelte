<!-- @component Unknown number of pages
Without `pageCount` the paginator shows the previous, the current and the next page, "next" is always enabled and there is no "last" button. Use it when the backend does not count the results. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(3);
</script>

<Paginator bind:page />
