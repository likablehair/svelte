<!-- @component Light and dark only
`system={false}` removes the system option. Until the user picks one, the page follows the operating system and the icon of the mode it shows is selected; a click on it fixes that mode. -->
<script lang="ts">
	import { ModeSwitch, theme } from '#lib';
</script>

<div class="demo">
	<ModeSwitch system={false} />
	<p>Mode: {theme.mode}</p>
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
