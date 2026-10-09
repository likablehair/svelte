import type { ComponentDoc, ExampleDoc, PropDoc, SnippetDoc, TokenGroup } from './types.js';

export function styleExample(doc: ComponentDoc) {
	const names = doc.cssVars.map((v) => v.name);
	const name =
		[`--${doc.slug}-background`, `--${doc.slug}-color`].find((n) => names.includes(n)) ??
		names.find((n) => n.endsWith('-color'));
	if (name) return `<${doc.name} ${name}="tomato">`;
	if (names[0]) return `<${doc.name} ${names[0]}="…">`;
	return `<${doc.name} --${doc.slug}-background="tomato">`;
}

export const PACKAGE = '@likable-hair/svelte';

export const TOKENS_INTRO =
	'Values of the default Aurora theme. Every color has a light and a dark value (`light-dark()`): the mode follows the operating system and `setMode()` forces it. Derived tokens (`-strong`, `-soft`, `-glow`, focus ring, fills) are computed from the base color: if you change `--global-color-primary`, they follow. `--global-fill-*` are backgrounds that carry text: text on them (`on-*`) meets WCAG AA contrast.';

export const FONT_LINK =
	'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap" />';
export const FONT_NOTE =
	'The library does not download fonts: the tokens `--global-font-family`, `--global-font-family-display` and `--global-font-family-mono` name Geist, Bricolage Grotesque and Geist Mono, falling back to the system font. For the Aurora look the app loads them itself, for example from Google Fonts in the `<head>`. When self-hosting, declare the same families with `@font-face`, or change the tokens to your own fonts.';

const cell = (s: string | undefined) => (s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const code = (s: string | undefined) => (s ? `\`${cell(s)}\`` : '');

function table(head: string[], rows: string[][]) {
	if (!rows.length) return '';
	return [
		`| ${head.join(' | ')} |`,
		`| ${head.map(() => '---').join(' | ')} |`,
		...rows.map((r) => `| ${r.join(' | ')} |`)
	].join('\n');
}

export function componentMarkdown(doc: ComponentDoc, examples: ExampleDoc[]) {
	const out: string[] = [`# ${doc.name}`, ''];
	if (doc.description) out.push(doc.description, '');
	out.push(
		'```ts',
		`import { ${doc.name} } from '${PACKAGE}';`,
		'```',
		'',
		`Category: ${doc.category}. Source: \`src/lib/${doc.file}\`.`,
		''
	);

	if (examples.length) {
		out.push('## Examples', '');
		for (const ex of examples) {
			out.push(`### ${ex.title}`, '');
			if (ex.description) out.push(ex.description, '');
			out.push('```svelte', ex.code, '```', '');
		}
	}

	const own = <T extends { from?: string }>(rows: T[]) => rows.filter((r) => !r.from);
	const inherited = <T extends { from?: string }>(rows: T[]) => rows.filter((r) => r.from);
	const base = doc.inherits;
	const fromBase = base ? `### From ${base.name}` : '';
	const propsTable = (rows: PropDoc[]) =>
		table(
			['Name', 'Type', 'Default', 'Description'],
			rows.map((p) => [
				`\`${p.name}\`${p.bindable ? ' (bindable)' : ''}${p.optional ? '' : ' (required)'}`,
				code(p.type),
				code(p.default),
				cell(p.description)
			])
		);
	const snippetsTable = (rows: SnippetDoc[]) =>
		table(
			['Name', 'Parameters', 'Description'],
			rows.map((s) => [`\`${s.name}\``, code(s.params), cell(s.description)])
		);
	const eventsTable = (rows: PropDoc[]) =>
		table(
			['Name', 'Type', 'Description'],
			rows.map((e) => [`\`${e.name}\``, code(e.type), cell(e.description)])
		);

	out.push('## Props', '');
	if (own(doc.props).length) out.push(propsTable(own(doc.props)), '');
	else out.push('No props of its own.', '');
	if (base) {
		const names = new Set([...doc.props, ...doc.snippets, ...doc.events].map((p) => p.name));
		const notAccepted = base.omitted.filter((name) => !names.has(name));
		out.push(
			fromBase,
			'',
			`It accepts the props, snippets and events of ${base.name} (\`/components/${base.slug}.md\`), listed in the tables "From ${base.name}".` +
				(notAccepted.length ? ` Except ${notAccepted.map((n) => `\`${n}\``).join(', ')}.` : ''),
			''
		);
		if (inherited(doc.props).length) out.push(propsTable(inherited(doc.props)), '');
	}
	if (doc.htmlElement) {
		out.push(
			`It also accepts the native attributes and events of \`<${doc.htmlElement}>\` (for example \`id\`, \`title\`, \`aria-label\`, \`onkeydown\`), which are forwarded to the element.`,
			''
		);
	}

	if (doc.snippets.length) {
		out.push('## Snippets', '');
		if (own(doc.snippets).length) out.push(snippetsTable(own(doc.snippets)), '');
		if (inherited(doc.snippets).length)
			out.push(fromBase, '', snippetsTable(inherited(doc.snippets)), '');
	}

	if (doc.events.length) {
		out.push('## Events', '');
		if (own(doc.events).length) out.push(eventsTable(own(doc.events)), '');
		if (inherited(doc.events).length)
			out.push(fromBase, '', eventsTable(inherited(doc.events)), '');
	}

	if (doc.methods.length) {
		out.push(
			'## Methods',
			'',
			`Call them on the instance: \`<${doc.name} bind:this={ref} />\`, then \`ref.${doc.methods[0].name}()\`.`,
			'',
			table(
				['Signature', 'Description'],
				doc.methods.map((m) => [code(m.signature), cell(m.description)])
			),
			''
		);
	}

	if (doc.cssVars.length || doc.cssDefaultsOnly.length || base) {
		out.push('## CSS variables', '');
		if (doc.cssVars.length || doc.cssDefaultsOnly.length)
			out.push(
				`For a single instance, pass them as style props: \`${styleExample(doc)}\`. ` +
					`The \`--${doc.slug}-default-*\` defaults apply to the whole app: override them in \`:root\` or in a theme.`,
				''
			);
		if (base) out.push(`It also takes the variables of ${base.name} (\`/components/${base.slug}.md\`).`, '');
		if (doc.cssVars.length) {
			out.push(
				table(
					['Per-instance variable', 'Default'],
					doc.cssVars.map((v) => [
						`\`${v.name}\``,
						v.defaults.length
							? v.defaults.map((d) => `\`${d.name}\`: ${code(d.value)}`).join('<br>')
							: v.inherits
								? `same as \`${v.inherits}\``
								: code(v.fallback)
					])
				),
				''
			);
		}
		if (doc.cssDefaultsOnly.length) {
			out.push(
				'### Other defaults',
				'',
				table(
					['Variable', 'Value'],
					doc.cssDefaultsOnly.map((d) => [`\`${d.name}\``, code(d.value)])
				),
				''
			);
		}
	}

	return out.join('\n');
}

export function tokensMarkdown(groups: TokenGroup[], themes: string[]) {
	const out: string[] = ['# Tokens', '', TOKENS_INTRO, ''];
	out.push(
		"To change them across the whole app: `:root { --global-color-primary: #e11d48; }` in the app's CSS (it always wins over defaults and themes).",
		''
	);
	for (const g of groups) {
		out.push(
			`## ${g.title}`,
			'',
			table(
				['Token', 'Value'],
				g.tokens.map((t) => [`\`${t.name}\``, code(t.value)])
			),
			''
		);
	}
	out.push('## Fonts', '', FONT_NOTE, '', '```html', FONT_LINK, '```', '');
	out.push(
		'## Themes',
		'',
		`Import the theme CSS (\`import '${PACKAGE}/themes/<name>.css'\`) and activate it with \`setTheme('<name>')\`, which sets \`data-theme\` on \`<html>\`. \`setMode('light' | 'dark' | 'system')\` forces the mode.`,
		'',
		'- `aurora`: default theme, already included in `tokens.css`.'
	);
	for (const t of themes) out.push(`- \`${t}\``);
	out.push('');
	return out.join('\n');
}
