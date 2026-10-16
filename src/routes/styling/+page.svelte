<script lang="ts">
	import Article from '../../docs/Article.svelte';
	import { slugify } from '../../docs/anchors.js';
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

<Article title={STYLING_TITLE} intro={STYLING_INTRO} markdown="/styling.md" sections={STYLING_SECTIONS}>
	<section class="group">
		<h2 id={slugify(CLASSES_TITLE)}>{CLASSES_TITLE}</h2>
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
</Article>

<style>
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
