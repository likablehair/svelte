<!-- @component Custom style
Every part has a CSS variable: here round buttons, the body font and a soft current page. -->
<script lang="ts">
	import { Paginator } from '#lib';

	let page = $state(2);
</script>

<Paginator
	bind:page
	pageCount={6}
	showFirstLast={false}
	--paginator-font-family="inherit"
	--paginator-button-size="34px"
	--paginator-button-border-radius="999px"
	--paginator-current-background="var(--global-color-primary-soft)"
	--paginator-current-color="var(--global-color-primary)"
	--paginator-current-box-shadow="none"
/>
