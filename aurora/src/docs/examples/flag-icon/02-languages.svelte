<!-- @component Round flags in chips
A square flag with `--flag-icon-border-radius: 50%` becomes round, for example in a language picker built with `Chip` and its `prependSnippet`. -->
<script lang="ts">
	import { Chip, FlagIcon } from '#lib';

	const LANGUAGES = [
		{ code: 'it', flag: 'it', name: 'Italiano' },
		{ code: 'en', flag: 'gb', name: 'English' },
		{ code: 'es', flag: 'es', name: 'Español' }
	];

	let language = $state('it');
</script>

<div class="demo">
	{#each LANGUAGES as lang (lang.code)}
		<Chip selected={language === lang.code} onclick={() => (language = lang.code)}>
			{#snippet prependSnippet()}
				<FlagIcon
					alpha2={lang.flag}
					square
					--flag-icon-size="18px"
					--flag-icon-border-radius="50%"
				/>
			{/snippet}
			{lang.name}
		</Chip>
	{/each}
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
