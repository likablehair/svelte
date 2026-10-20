<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slugify } from './anchors.js';
	import { inline } from './inline.js';
	import type { StylingSection } from './styling.js';

	let {
		title,
		intro,
		markdown,
		sections = [],
		children
	}: { title: string; intro: string; markdown: string; sections?: StylingSection[]; children?: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} · Likable Aurora</title>
	<link rel="alternate" type="text/markdown" href={markdown} />
</svelte:head>

<div class="article">
	<header class="hero">
		<h1>{title}</h1>
		<p class="lead">{@html inline(intro)}</p>
		<p class="md"><a href={markdown}>Markdown for LLMs</a></p>
	</header>

	{#each sections as section (section.title)}
		<section class="group">
			<h2 id={slugify(section.title)}>{section.title}</h2>
			{#each section.blocks as block, i (i)}
				{#if typeof block === 'string'}
					<p>{@html inline(block)}</p>
				{:else}
					<figure>
						{#if block.file}<figcaption>{block.file}</figcaption>{/if}
						<pre class="snippet"><code>{block.source}</code></pre>
					</figure>
				{/if}
			{/each}
		</section>
	{/each}

	{@render children?.()}
</div>

<style>
	.hero {
		padding: 60px 0 20px;
	}

	h1 {
		font-family: var(--global-font-family-display);
		font-weight: 800;
		font-size: clamp(48px, 7vw, 96px);
		line-height: 0.9;
		letter-spacing: -0.05em;
		margin: 0 0 18px;
	}

	.lead {
		max-width: 680px;
		font-size: 17px;
		color: var(--global-color-text-2);
		line-height: 1.6;
		margin: 0;
	}

	.md {
		margin: 12px 0 0;
		font-size: 13px;
	}

	.md a {
		color: var(--global-color-primary);
	}

	.article :global(.group) {
		max-width: 820px;
		margin-top: 48px;
	}

	.article :global(.group h2) {
		font-family: var(--global-font-family-display);
		font-size: 28px;
		letter-spacing: -0.03em;
		margin: 0 0 16px;
		padding-bottom: 12px;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	.article :global(.group p) {
		margin: 0 0 14px;
		color: var(--global-color-text-2);
		line-height: 1.65;
	}

	figure {
		margin: 0 0 16px;
	}

	figcaption {
		margin-bottom: 6px;
		font-family: var(--global-font-family-mono);
		font-size: 11.5px;
		color: var(--global-color-text-3);
	}

	.snippet {
		margin: 0;
		overflow-x: auto;
		padding: 12px 16px;
		font-size: 12.5px;
		line-height: 1.6;
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface-2);
		border: var(--global-border-width) solid var(--global-color-border);
	}
</style>
