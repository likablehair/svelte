<script lang="ts">
	import { inline } from '../../docs/inline.js';
	import {
		CLASSES_INTRO,
		CLASSES_TITLE,
		STYLING_INTRO,
		STYLING_SECTIONS,
		STYLING_TITLE,
		tailwindClasses
	} from '../../docs/styling.js';

	const classes = tailwindClasses();
	const groups = [...new Set(classes.map((c) => c.group))];
</script>

<svelte:head>
	<title>{STYLING_TITLE} · Likable Aurora</title>
</svelte:head>

<header class="hero">
	<h1>{STYLING_TITLE}</h1>
	<p class="lead">{@html inline(STYLING_INTRO)}</p>
	<p class="md"><a href="/styling.md">Markdown for LLMs</a></p>
</header>

{#each STYLING_SECTIONS as section (section.title)}
	<section class="group">
		<h2>{section.title}</h2>
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

<section class="group">
	<h2>{CLASSES_TITLE}</h2>
	<p>{@html inline(CLASSES_INTRO)}</p>
	<div class="table-wrap">
		<table>
			<thead><tr><th>Class</th><th>Token</th></tr></thead>
			{#each groups as group (group)}
				<tbody>
					<tr><th colspan="2" class="group-row">{group}</th></tr>
					{#each classes.filter((c) => c.group === group) as c (c.utility)}
						<tr><td><code>{c.utility}</code></td><td><code>{c.token}</code></td></tr>
					{/each}
				</tbody>
			{/each}
		</table>
	</div>
</section>

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

	.group {
		max-width: 820px;
		margin-top: 48px;
	}

	h2 {
		font-family: var(--global-font-family-display);
		font-size: 28px;
		letter-spacing: -0.03em;
		margin: 0 0 16px;
		padding-bottom: 12px;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	p {
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

	.table-wrap {
		overflow-x: auto;
		border-radius: var(--global-radius-lg);
		border: var(--global-border-width) solid var(--global-color-border);
		background: var(--global-color-surface);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	th,
	td {
		padding: 8px 14px;
		text-align: start;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	thead th {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--global-color-text-3);
	}

	.group-row {
		background: var(--global-color-surface-2);
		font-weight: 600;
	}

	tbody:last-child tr:last-child td {
		border-bottom: 0;
	}
</style>
