<!-- @component Light, system, dark
A click applies the mode to the whole page. "System" follows the operating system, and `theme` tells what the page shows now. -->
<script lang="ts">
	import { ModeSwitch, theme } from '#lib';
</script>

<div class="demo">
	<ModeSwitch />
	<p>Mode: {theme.mode} · the page is {theme.dark ? 'dark' : 'light'}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
	}
</style>
