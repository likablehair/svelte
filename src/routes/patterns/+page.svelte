<script lang="ts">
	import Article from '../../docs/Article.svelte';
	import Example from '../../docs/Example.svelte';
	import { slugify } from '../../docs/anchors.js';

	let { data } = $props();
</script>

<Article title={data.title} intro={data.intro} markdown="/patterns.md">
	<div class="patterns">
		{#each data.patterns as pattern (pattern.id)}
			<div id={slugify(pattern.title)}>
				<Example example={pattern} frame="/examples/patterns/{pattern.id}" />
			</div>
		{/each}
	</div>
</Article>

<style>
	.patterns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 24px;
		margin-top: 32px;
	}
</style>
