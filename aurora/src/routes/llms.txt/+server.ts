import { getComponentDoc, listComponents } from '../../docs/api.server.js';
import { PACKAGE } from '../../docs/markdown.js';

export function GET({ url }) {
	const link = (path: string) => new URL(path, url.origin).href;
	const firstSentence = (s?: string) => s?.split(/(?<=\.)\s/)[0] ?? '';
	const lines = [
		`# Likable Aurora (${PACKAGE} 5)`,
		'',
		'> Svelte 5 (runes) component library by Likablehair. Every component is customizable through CSS variables; themes change only the look, at runtime.',
		'',
		`- Install: \`npm i ${PACKAGE}\`; import components from \`${PACKAGE}\`.`,
		`- Styles: \`import '${PACKAGE}/tokens.css'\` (components import it themselves), optional \`${PACKAGE}/base.css\` for the page.`,
		'- Callbacks receive the native event; icons are SVG paths (`@mdi/js`).',
		`- CSS: the library is in cascade layers, so app CSS and Tailwind utilities override it; Tailwind classes for the tokens via \`${PACKAGE}/tailwind.css\` (v4) or \`${PACKAGE}/tailwind-preset\` (v3).`,
		`- Full version in a single file: ${link('/llms-full.txt')}`,
		'',
		'## Foundations',
		'',
		`- [Tokens](${link('/tokens.md')}): \`--global-*\` variables for colors, shape, shadows, fonts, motion; themes and light/dark mode.`,
		`- [CSS and Tailwind](${link('/styling.md')}): cascade layer order, resets, Tailwind 3 and 4 setup, token classes.`,
		'',
		'## Components',
		''
	];
	for (const c of listComponents()) {
		lines.push(`- [${c.name}](${link(`/components/${c.slug}.md`)}): ${firstSentence(getComponentDoc(c.slug)?.description)}`);
	}
	lines.push('');
	return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
