<script lang="ts">
	import type { Component } from 'svelte';
	import { inline } from './inline.js';
	import type { ExampleDoc } from './types.js';

	let {
		example,
		component: Demo,
		frame
	}: { example: ExampleDoc; component?: Component; frame?: string } = $props();

	let boxWidth = $state(1280);
	let narrow = $derived(boxWidth < 640);
	let frameWidth = $derived(narrow ? boxWidth : 1280);
	let frameHeight = $derived(narrow ? 640 : 720);
	let scale = $derived(Math.min(1, boxWidth / frameWidth));
</script>

<article class="spec" id={example.id}>
	<header>
		<h3>{example.title}</h3>
		{#if example.description}<p>{@html inline(example.description)}</p>{/if}
		{#if frame}<p><a href={frame} target="_blank">Open the example alone</a> to try other window sizes.</p>{/if}
	</header>
	{#if frame}
		<div class="frame-box" bind:clientWidth={boxWidth} style:height="{frameHeight * scale}px">
			<iframe
				class="frame"
				src={frame}
				title={example.title}
				loading="lazy"
				width={frameWidth}
				height={frameHeight}
				style:transform="scale({scale})"
			></iframe>
		</div>
	{:else}
		<div class="stage">
			{#if Demo}<Demo />{/if}
		</div>
	{/if}
	<details>
		<summary>Code</summary>
		<pre><code>{example.code}</code></pre>
	</details>
</article>

<style>
	.frame-box {
		overflow: hidden;
		border-top: var(--global-border-width) solid var(--global-color-border);
	}

	.frame {
		display: block;
		border: 0;
		transform-origin: 0 0;
	}

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
