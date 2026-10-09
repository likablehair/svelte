<script lang="ts">
	import type { Component } from 'svelte';
	import { inline } from './inline.js';
	import type { ExampleDoc } from './types.js';

	let { example, component: Demo }: { example: ExampleDoc; component?: Component } = $props();
</script>

<article class="spec" id={example.id}>
	<header>
		<h3>{example.title}</h3>
		{#if example.description}<p>{@html inline(example.description)}</p>{/if}
	</header>
	<div class="stage">
		{#if Demo}<Demo />{/if}
	</div>
	<details>
		<summary>Code</summary>
		<pre><code>{example.code}</code></pre>
	</details>
</article>

<style>
	header p {
		margin: 4px 0 0;
		color: var(--global-color-text-3);
		font-size: 13px;
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

	pre {
		margin: 0;
		padding: 0 16px 16px;
		overflow-x: auto;
		font-family: var(--global-font-family-mono);
		font-size: 12.5px;
		line-height: 1.6;
		color: var(--global-color-text-2);
	}
</style>
