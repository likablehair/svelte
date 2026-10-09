<script lang="ts">
	import { inline } from '../docs/inline.js';
	import { FONT_LINK, FONT_NOTE, TOKENS_INTRO } from '../docs/markdown.js';

	let { data } = $props();

	function kind(name: string) {
		if (name.startsWith('--global-color-') || /^--global-(gradient|fill)/.test(name)) return 'paint';
		if (/-(color|background)$/.test(name)) return 'paint';
		if (/^--global-radius-(?!scale)/.test(name) || name.endsWith('-radius')) return 'radius';
		if (name.startsWith('--global-shadow-') || name.endsWith('-shadow')) return 'shadow';
		if (name === '--global-focus-ring-color') return 'ring';
		if (name.startsWith('--global-font-family')) return 'font';
		return 'value';
	}
</script>

<svelte:head>
	<title>Tokens · Likable Aurora</title>
	<link rel="alternate" type="text/markdown" href="/tokens.md" />
</svelte:head>

<header class="hero">
	<h1>Tokens</h1>
	<p class="lead">
		The <code>--global-*</code> variables define the look of every component and of the app. A
		theme changes their values; components stay the same.
	</p>
	<p class="text">{@html inline(TOKENS_INTRO)}</p>
	<p class="meta"><code>src/lib/css/tokens.css</code> · <a href="/tokens.md">Markdown for LLMs</a></p>
</header>

{#each data.groups as group (group.title)}
	<section class="group">
		<h2>{group.title}</h2>
		<div class="swatches">
			{#each group.tokens as token (token.name)}
				{@const k = kind(token.name)}
				<div class="swatch" title={token.value}>
					{#if k === 'paint'}
						<div class="chip" style:background="var({token.name})"></div>
					{:else if k === 'radius'}
						<div class="chip radius" style:border-radius="var({token.name})"></div>
					{:else if k === 'shadow'}
						<div class="chip elevated" style:box-shadow="var({token.name})"></div>
					{:else if k === 'ring'}
						<div
							class="chip elevated"
							style:outline="var(--global-focus-ring-width) solid var({token.name})"
						></div>
					{:else if k === 'font'}
						<div class="chip sample" style:font-family="var({token.name})">Aa Likable</div>
					{:else}
						<div class="chip sample value">{token.value}</div>
					{/if}
					<code>{token.name}</code>
				</div>
			{/each}
		</div>
	</section>
{/each}

<section class="group">
	<h2>Fonts</h2>
	<p class="text">{@html inline(FONT_NOTE)}</p>
	<pre class="snippet"><code>{FONT_LINK}</code></pre>
</section>

<section class="group">
	<h2>Themes</h2>
	<p class="hint">
		Import the theme CSS and activate it with <code>setTheme('name')</code>. Try them on the
		<a href="/themes">Themes</a> page or with the picker at the bottom right.
	</p>
	<ul class="themes">
		<li><code>aurora</code> — default theme, in <code>tokens.css</code>.</li>
		{#each data.themes as theme (theme)}
			<li><code>{theme}</code></li>
		{/each}
	</ul>
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
		max-width: 620px;
		font-size: 17px;
		color: var(--global-color-text-2);
		line-height: 1.6;
		margin: 0 0 12px;
	}

	.meta {
		margin: 0;
		font-size: 12.5px;
		color: var(--global-color-text-3);
	}

	.meta a {
		color: var(--global-color-primary);
	}

	.group {
		margin-top: 56px;
	}

	h2 {
		font-family: var(--global-font-family-display);
		font-size: 28px;
		letter-spacing: -0.03em;
		margin: 0 0 16px;
		padding-bottom: 12px;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	.hint a {
		color: var(--global-color-primary);
	}

	.hint {
		margin: -6px 0 16px;
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	code {
		font-family: var(--global-font-family-mono);
		font-size: 11.5px;
		color: var(--global-color-text-2);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 16px;
	}

	.swatch {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.swatch code {
		overflow-wrap: anywhere;
	}


	.chip {
		height: 64px;
		border-radius: var(--global-radius-lg);
		border: var(--global-border-width) solid var(--global-color-border);
	}

	.chip.radius {
		background: var(--global-color-primary-soft);
		border-color: var(--global-color-primary);
	}

	.chip.elevated {
		background: var(--global-color-surface-solid);
		margin: 4px 8px 8px;
	}

	.chip.sample {
		display: grid;
		place-items: center;
		padding: 0 8px;
		background: var(--global-color-surface);
		font-size: 20px;
		overflow: hidden;
	}

	.chip.value {
		font-family: var(--global-font-family-mono);
		font-size: 11.5px;
		color: var(--global-color-text-2);
		text-align: center;
		overflow-wrap: anywhere;
	}

	.text {
		max-width: 720px;
		color: var(--global-color-text-2);
		line-height: 1.6;
	}

	.snippet {
		overflow-x: auto;
		padding: 12px 16px;
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface-2);
		border: var(--global-border-width) solid var(--global-color-border);
		font-size: 12.5px;
	}

	.themes {
		margin: 0;
		padding-left: 18px;
		color: var(--global-color-text-2);
		line-height: 1.8;
	}
</style>
