<script lang="ts">
	import { inline } from './inline.js';
	import { styleExample } from './markdown.js';
	import type { ComponentDoc, PropDoc, SnippetDoc } from './types.js';

	let { doc }: { doc: ComponentDoc } = $props();

	const own = <T extends { from?: string }>(rows: T[]) => rows.filter((r) => !r.from);
	const inherited = <T extends { from?: string }>(rows: T[]) => rows.filter((r) => r.from);
	let notAccepted = $derived(
		doc.inherits?.omitted.filter(
			(name) => ![...doc.props, ...doc.snippets, ...doc.events].some((p) => p.name === name)
		) ?? []
	);
</script>

{#snippet propsTable(rows: PropDoc[])}
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
			</thead>
			<tbody>
				{#each rows as p (p.name)}
					<tr>
						<td>
							<code>{p.name}</code>
							{#if p.bindable}<span class="badge">bindable</span>{/if}
							{#if !p.optional}<span class="badge">required</span>{/if}
						</td>
						<td><code>{p.type}</code></td>
						<td>{#if p.default}<code>{p.default}</code>{/if}</td>
						<td>{@html inline(p.description)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet snippetsTable(rows: SnippetDoc[])}
	<div class="table-wrap">
		<table>
			<thead><tr><th>Name</th><th>Parameters</th><th>Description</th></tr></thead>
			<tbody>
				{#each rows as s (s.name)}
					<tr>
						<td><code>{s.name}</code></td>
						<td>{#if s.params}<code>{s.params}</code>{/if}</td>
						<td>{@html inline(s.description)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet eventsTable(rows: PropDoc[])}
	<div class="table-wrap">
		<table>
			<thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
			<tbody>
				{#each rows as e (e.name)}
					<tr>
						<td><code>{e.name}</code></td>
						<td><code>{e.type}</code></td>
						<td>{@html inline(e.description)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet fromBase()}
	{#if doc.inherits}
		<h3>From <a href="/components/{doc.inherits.slug}">{doc.inherits.name}</a></h3>
	{/if}
{/snippet}

<section class="api" aria-labelledby="api-props">
	<h2 id="api-props">Props</h2>
	{#if own(doc.props).length}
		{@render propsTable(own(doc.props))}
	{:else}
		<p>No props of its own.</p>
	{/if}
	{#if doc.inherits}
		{@render fromBase()}
		<p class="hint">
			It accepts the props, snippets and events of <a href="/components/{doc.inherits.slug}"
				>{doc.inherits.name}</a
			>, listed in the tables "From {doc.inherits.name}".
			{#if notAccepted.length}
				Except {#each notAccepted as name, i (name)}{i ? ', ' : ''}<code>{name}</code>{/each}.
			{/if}
		</p>
		{#if inherited(doc.props).length}
			{@render propsTable(inherited(doc.props))}
		{/if}
	{/if}
	{#if doc.htmlElement}
		<p class="hint">
			It also accepts the native attributes and events of <code>&lt;{doc.htmlElement}&gt;</code>
			(for example <code>id</code>, <code>title</code>, <code>aria-label</code>, <code>onkeydown</code>), which are forwarded to the element.
		</p>
	{/if}
</section>

{#if doc.snippets.length}
	<section class="api" aria-labelledby="api-snippets">
		<h2 id="api-snippets">Snippets</h2>
		{#if own(doc.snippets).length}
			{@render snippetsTable(own(doc.snippets))}
		{/if}
		{#if inherited(doc.snippets).length}
			{@render fromBase()}
			{@render snippetsTable(inherited(doc.snippets))}
		{/if}
	</section>
{/if}

{#if doc.events.length}
	<section class="api" aria-labelledby="api-events">
		<h2 id="api-events">Events</h2>
		{#if own(doc.events).length}
			{@render eventsTable(own(doc.events))}
		{/if}
		{#if inherited(doc.events).length}
			{@render fromBase()}
			{@render eventsTable(inherited(doc.events))}
		{/if}
	</section>
{/if}

{#if doc.methods.length}
	<section class="api" aria-labelledby="api-methods">
		<h2 id="api-methods">Methods</h2>
		<p class="hint">
			Call them on the instance: <code>&lt;{doc.name} bind:this={'{'}ref{'}'} /&gt;</code>, then
			<code>ref.{doc.methods[0].name}()</code>.
		</p>
		<div class="table-wrap">
			<table>
				<thead><tr><th>Signature</th><th>Description</th></tr></thead>
				<tbody>
					{#each doc.methods as m (m.name)}
						<tr>
							<td><code>{m.signature}</code></td>
							<td>{@html inline(m.description)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

{#if doc.cssVars.length || doc.cssDefaultsOnly.length || doc.inherits}
	<section class="api" aria-labelledby="api-css">
		<h2 id="api-css">CSS variables</h2>
		{#if doc.cssVars.length || doc.cssDefaultsOnly.length}
			<p class="hint">
				For a single instance, pass them as style props:
				<code>{styleExample(doc)}</code>. The
				<code>--{doc.slug}-default-*</code> defaults apply to the whole app: override them in
				<code>:root</code> or in a theme.
			</p>
		{/if}
		{#if doc.inherits}
			<p class="hint">
				It also takes the variables of <a href="/components/{doc.inherits.slug}#api-css"
					>{doc.inherits.name}</a
				>.
			</p>
		{/if}
		{#if doc.cssVars.length}
			<div class="table-wrap">
				<table>
					<thead><tr><th>Per-instance variable</th><th>Default</th></tr></thead>
					<tbody>
						{#each doc.cssVars as v (v.name)}
							<tr>
								<td><code>{v.name}</code></td>
								<td>
									{#each v.defaults as d (d.name)}
										<div class="default"><code>{d.name}</code> <code class="value">{d.value}</code></div>
									{:else}
										{#if v.inherits}same as <code>{v.inherits}</code>{:else if v.fallback}<code
												class="value">{v.fallback}</code
											>{/if}
									{/each}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		{#if doc.cssDefaultsOnly.length}
			<h3>Other defaults</h3>
			<div class="table-wrap">
				<table>
					<thead><tr><th>Variable</th><th>Value</th></tr></thead>
					<tbody>
						{#each doc.cssDefaultsOnly as d (d.name)}
							<tr><td><code>{d.name}</code></td><td><code class="value">{d.value}</code></td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
{/if}

<style>
	.api {
		margin-top: 48px;
	}

	h2 {
		font-family: var(--global-font-family-display);
		font-size: 26px;
		letter-spacing: -0.03em;
		margin: 0 0 14px;
	}

	h3 {
		font-size: 15px;
		margin: 24px 0 10px;
	}

	.hint {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	.table-wrap {
		overflow-x: auto;
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	th,
	td {
		padding: 10px 14px;
		text-align: left;
		vertical-align: top;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	tr:last-child td {
		border-bottom: 0;
	}

	th {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--global-color-text-3);
		font-weight: 600;
	}

	code {
		font-family: var(--global-font-family-mono);
		font-size: 12px;
		color: var(--global-color-text);
	}

	code.value {
		color: var(--global-color-text-2);
	}

	.default + .default {
		margin-top: 4px;
	}

	h3 a,
	.hint a {
		color: var(--global-color-primary);
	}

	.badge {
		margin-left: 6px;
		padding: 1px 7px;
		border-radius: var(--global-radius-full);
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-size: 10.5px;
	}
</style>
