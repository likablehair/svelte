<!-- @component Flags
`alpha2` is the ISO code of the country. Flags are 4:3 by default and square with `square`; `--flag-icon-size` sets the height, which otherwise follows the text. With `title` the flag has an accessible name, otherwise it is decorative. -->
<script lang="ts">
	import { FlagIcon } from '#lib';
</script>

<div class="demo">
	<div class="row">
		{#each ['IT', 'FR', 'DE', 'ES', 'GB', 'JP', 'BR', 'CA'] as code (code)}
			<FlagIcon alpha2={code} title={code} --flag-icon-size="26px" />
		{/each}
	</div>
	<div class="row">
		{#each ['it', 'fr', 'de', 'es', 'gb', 'jp', 'br', 'ca'] as code (code)}
			<FlagIcon alpha2={code} square --flag-icon-size="26px" />
		{/each}
	</div>
	<p>Shipping to <FlagIcon alpha2="CH" /> Switzerland and <FlagIcon alpha2="AT" /> Austria.</p>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	p {
		margin: 0;
	}
</style>
