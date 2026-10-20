<!-- @component Link
With `href` the button renders an `<a>`: use it for navigation that should look like a button, with every variant and size. `target="_blank"` adds `rel="noopener noreferrer"`; a disabled link loses its `href`. For an inline text link use `LinkButton`. -->
<script lang="ts">
	import { mdiArrowRight, mdiDownload, mdiOpenInNew } from '@mdi/js';
	import { Button } from '#lib';
</script>

<div class="row">
	<Button href="#appointments" appendIcon={mdiArrowRight}>All appointments</Button>
	<Button href="https://svelte.dev" target="_blank" variant="secondary" icon={mdiOpenInNew}>
		Svelte docs
	</Button>
	<Button href="/llms.txt" download variant="secondary" icon={mdiDownload}>Download</Button>
	<Button href="#disabled" variant="secondary" disabled>Disabled link</Button>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
