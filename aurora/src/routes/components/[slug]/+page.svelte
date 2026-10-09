<script lang="ts">
	import ApiTables from '../../../docs/ApiTables.svelte';
	import Example from '../../../docs/Example.svelte';
	import { inline } from '../../../docs/inline.js';
	import { PACKAGE } from '../../../docs/markdown.js';

	const dev = import.meta.env.DEV;

	let { data } = $props();
	let doc = $derived(data.doc);

	let missing = $derived([
		...(doc.description ? [] : ['a `<!-- @component ... -->` comment in the component']),
		...[...doc.props, ...doc.snippets, ...doc.events]
			.filter((p) => !p.description)
			.map((p) => `JSDoc for \`${p.name}\` in the \`Props\` interface`),
		...doc.methods
			.filter((m) => !m.description)
			.map((m) => `JSDoc for the exported function \`${m.name}\``),
		...(data.examples.length ? [] : [`examples in \`src/docs/examples/${doc.slug}/\``])
	]);
</script>

<svelte:head>
	<title>{doc.name} · Likable Aurora</title>
	{#if doc.description}<meta name="description" content={doc.description} />{/if}
	<link rel="alternate" type="text/markdown" href="/components/{doc.slug}.md" />
</svelte:head>

<header class="hero">
	<h1>{doc.name}</h1>
	{#if doc.description}<p class="lead">{@html inline(doc.description)}</p>{/if}
	<pre class="import"><code>import {'{'} {doc.name} {'}'} from '{PACKAGE}';</code></pre>
	<p class="meta">
		<code>src/lib/{doc.file}</code> ·
		<a href="/components/{doc.slug}.md">Markdown for LLMs</a>
	</p>
</header>

{#if dev && missing.length}
	<aside class="missing">
		<b>Incomplete docs</b> (visible in development only):
		<ul>
			{#each missing as item (item)}<li>{@html inline(item)}</li>{/each}
		</ul>
	</aside>
{/if}

{#each data.examples as example (example.id)}
	<Example {example} component={example.component} />
{/each}

<ApiTables {doc} />

<style>
	.hero {
		padding: 60px 0 28px;
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
		margin: 0 0 18px;
	}

	.import {
		display: inline-block;
		margin: 0 0 10px;
		padding: 8px 14px;
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface-2);
		border: var(--global-border-width) solid var(--global-color-border);
		font-family: var(--global-font-family-mono);
		font-size: 13px;
	}

	.meta {
		margin: 0;
		font-size: 12.5px;
		color: var(--global-color-text-3);
	}

	.meta code {
		font-family: var(--global-font-family-mono);
	}

	.missing {
		margin-bottom: 16px;
		padding: 12px 16px;
		border-radius: var(--global-radius-lg);
		background: var(--global-color-warning-soft);
		border: var(--global-border-width) solid var(--global-color-warning);
		font-size: 13px;
	}

	.missing ul {
		margin: 6px 0 0;
		padding-left: 18px;
	}

	.meta a {
		color: var(--global-color-primary);
	}
</style>
