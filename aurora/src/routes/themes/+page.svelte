<script lang="ts">
	import Button from '#lib/components/simple/buttons/Button.svelte';
	import { appearance, changeTheme } from '../../docs/appearance.svelte.js';
	import { PACKAGE } from '../../docs/markdown.js';

	let { data } = $props();

	const example = `@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

@layer global.theme {
	:root[data-theme='my-theme'] {
		--global-color-primary: light-dark(#d6336c, #f06595);
		--global-radius-scale: 2;
	}
}`;
	const usage = `import './my-theme.css';
import { setTheme } from '${PACKAGE}';

setTheme('my-theme');`;

	let libraryThemes = $derived(data.themes.filter((t) => !t.gallery));
	let galleryThemes = $derived(data.themes.filter((t) => t.gallery));
</script>

<svelte:head>
	<title>Themes · Likable Aurora</title>
</svelte:head>

<header class="hero">
	<h1>Themes</h1>
	<p class="lead">
		A theme is a CSS file that redefines some <code>--global-*</code> tokens. Components do not
		change: the look of the whole app does, in light and dark, even at runtime.
	</p>
</header>

<section class="group">
	<h2>How to create one</h2>
	<div class="steps">
		<div>
			<p>1. A CSS file with the tokens to change. The ones you leave out stay as in Aurora.</p>
			<pre class="snippet"><code>{example}</code></pre>
		</div>
		<div>
			<p>2. Import it in the app and activate it.</p>
			<pre class="snippet"><code>{usage}</code></pre>
		</div>
	</div>
</section>

{#snippet card(name: string, label: string, note: string, source?: string)}
	<article class="spec">
		<header class="card-head">
			<div>
				<h3>{label}</h3>
				<p>{note}</p>
			</div>
			<Button
				size="sm"
				variant={appearance.theme === name ? 'primary' : 'secondary'}
				aria-pressed={appearance.theme === name}
				onclick={() => changeTheme(name)}
			>
				{appearance.theme === name ? 'Active' : 'Try'}
			</Button>
		</header>
		{#if source}
			<details>
				<summary>CSS</summary>
				<pre><code>{source}</code></pre>
			</details>
		{/if}
	</article>
{/snippet}

<section class="group">
	<h2>In the library</h2>
	<p class="hint">Shipped in the package: <code>import '{PACKAGE}/themes/&lt;name&gt;.css'</code>.</p>
	<div class="grid">
		{@render card('', 'Aurora', 'Default theme, already in tokens.css.')}
		{#each libraryThemes as theme (theme.name)}
			{@render card(theme.name, theme.name, `${theme.declarations} tokens`, theme.source)}
		{/each}
	</div>
</section>

<section class="group">
	<h2>Gallery</h2>
	<p class="hint">Examples of how much a few tokens can change. They are not in the package: copy them into your app.</p>
	<div class="grid">
		{#each galleryThemes as theme (theme.name)}
			{@render card(theme.name, theme.name, `${theme.declarations} tokens`, theme.source)}
		{/each}
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

	.group {
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

	.hint {
		margin: -6px 0 16px;
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 16px;
	}

	.steps p {
		margin: 0 0 8px;
		color: var(--global-color-text-2);
	}

	.snippet,
	pre {
		margin: 0;
		overflow-x: auto;
		padding: 12px 16px;
		font-size: 12.5px;
		line-height: 1.6;
	}

	.snippet {
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface-2);
		border: var(--global-border-width) solid var(--global-color-border);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
		align-items: start;
	}

	.grid :global(.spec) {
		margin-top: 0;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		text-transform: capitalize;
	}

	.card-head p {
		margin: 2px 0 0;
		color: var(--global-color-text-3);
		font-size: 12.5px;
		text-transform: none;
	}

	details {
		border-top: var(--global-border-width) solid var(--global-color-border);
	}

	summary {
		padding: 10px 16px;
		cursor: pointer;
		color: var(--global-color-text-2);
		font-size: 12.5px;
	}

	details pre {
		padding-top: 0;
		color: var(--global-color-text-2);
	}
</style>
