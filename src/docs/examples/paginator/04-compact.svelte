<!-- @component Compact
`compact` shows "3 / 12" between the arrows instead of the page numbers, for a card footer or a phone screen. Screen readers hear "Page 3 of 12" when the page changes. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(3);
</script>

<Paginator bind:page pageCount={12} compact />
