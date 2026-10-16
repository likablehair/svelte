import { PACKAGE } from './spec.ts';
import type { ComponentSpec, SearchEntry, Spec } from './types.ts';

const fold = (text: string) =>
	text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();

const firstSentence = (text = '') =>
	text.replace(/`([^`]*)`/g, '$1').replace(/\s+/g, ' ').trim().split(/(?<=\.)\s/)[0] ?? '';

export function findComponent(spec: Spec, name: string): ComponentSpec | undefined {
	const wanted = fold(name.trim().replace(/^<|\/?>$/g, ''));
	return spec.components.find((c) => fold(c.name) === wanted || fold(c.slug) === wanted);
}

export function closestComponents(spec: Spec, name: string, count = 5) {
	const wanted = fold(name);
	return spec.components
		.map((c) => ({ name: c.name, score: similarity(fold(c.name), wanted) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, count)
		.map((c) => c.name);
}

function similarity(a: string, b: string) {
	if (a.includes(b) || b.includes(a)) return 1;
	const pairs = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
	const left = pairs(a);
	const right = pairs(b);
	const shared = [...left].filter((p) => right.has(p)).length;
	return (2 * shared) / (left.size + right.size || 1);
}

export function notFound(spec: Spec, name: string) {
	return `No component named "${name}". Closest: ${closestComponents(spec, name).join(', ')}. Use list_components for the full list.`;
}

export function listComponents(spec: Spec, category?: string) {
	const rows = spec.components.filter((c) => !category || c.category === category);
	const groups = new Map<string, string[]>();
	for (const c of rows) {
		const list = groups.get(c.category) ?? [];
		list.push(`- ${c.name}: ${firstSentence(c.description)}`);
		groups.set(c.category, list);
	}
	return [
		`${PACKAGE} ${spec.version}: ${rows.length} components. Import them from '${PACKAGE}'.`,
		...[...groups].map(([group, lines]) => `\n## ${group}\n${lines.join('\n')}`)
	].join('\n');
}

export const SECTIONS = ['examples', 'props', 'snippets', 'events', 'methods', 'types', 'css'] as const;
export type Section = (typeof SECTIONS)[number];

const SECTION_TITLES: Record<Section, RegExp> = {
	examples: /^examples$/i,
	props: /^props/i,
	snippets: /^snippets/i,
	events: /^events/i,
	methods: /^methods/i,
	types: /^types/i,
	css: /^css variables/i
};

export function componentMarkdown(component: ComponentSpec, sections?: Section[]) {
	if (!sections?.length) return component.markdown;
	const [head, ...parts] = component.markdown.split(/^(?=## )/m);
	const kept = parts.filter((part) => {
		const title = part.slice(3, part.indexOf('\n')).trim();
		return sections.some((section) => SECTION_TITLES[section].test(title));
	});
	return [head, ...kept].join('').trimEnd() || head;
}

export function examples(component: ComponentSpec, id?: string) {
	if (!id) {
		if (!component.examples.length) return `${component.name} has no examples.`;
		return [
			`Examples of ${component.name} (call get_example with an id for the code):`,
			...component.examples.map((e) => `- ${e.id}: ${e.title}${e.description ? `. ${firstSentence(e.description)}` : ''}`)
		].join('\n');
	}
	const example = component.examples.find((e) => e.id === id || fold(e.title) === fold(id));
	if (!example) return `No example "${id}" for ${component.name}. Available: ${component.examples.map((e) => e.id).join(', ')}`;
	return [`### ${example.title}`, example.description ?? '', '```svelte', example.code.trim(), '```']
		.filter(Boolean)
		.join('\n\n');
}

const KIND_ORDER = ['component', 'page', 'prop', 'event', 'snippet', 'method', 'example', 'type', 'css', 'token'];

export function searchDocs(spec: Spec, searchText: string, limit = 20) {
	const query = fold(searchText.trim()).replace(/\s+/g, ' ');
	if (!query) return 'Empty query.';
	const words = query.split(' ');
	const score = (entry: SearchEntry) => {
		const label = fold(entry.label);
		const near = entry.context ? `${label} ${fold(entry.context)}` : label;
		const far = `${near} ${fold(entry.description ?? '')} ${fold(entry.text ?? '')}`;
		if (label === query) return 0;
		if (label.startsWith(query)) return 1;
		if (label.includes(query)) return 2;
		if (words.every((w) => near.includes(w))) return 3;
		if (words.every((w) => far.includes(w))) return 4;
		return -1;
	};
	const named = (entry: SearchEntry) => {
		const near = fold(`${entry.label} ${entry.context ?? ''}`);
		return words.filter((w) => near.includes(w)).length;
	};
	const found = spec.search
		.map((entry) => ({ entry, score: score(entry), named: named(entry) }))
		.filter((r) => r.score >= 0)
		.sort(
			(a, b) =>
				a.score - b.score ||
				b.named - a.named ||
				KIND_ORDER.indexOf(a.entry.kind) - KIND_ORDER.indexOf(b.entry.kind) ||
				a.entry.label.length - b.entry.label.length
		)
		.slice(0, limit);
	if (!found.length) return `Nothing found for "${searchText}". Try other words or list_components.`;
	return found
		.map(({ entry }) => {
			const where = entry.kind === 'component' ? '' : entry.context ? ` (${entry.context})` : '';
			const about = entry.description ? `: ${entry.description}` : '';
			return `- [${entry.kind}] ${entry.label}${where}${about}`;
		})
		.join('\n');
}

export function listThemes(spec: Spec) {
	const library = spec.themes.filter((t) => !t.gallery);
	const gallery = spec.themes.filter((t) => t.gallery);
	return [
		'Themes change only the look (tokens), never behaviour or layout. Light and dark live inside each theme.',
		'',
		'## Default',
		'- aurora: built in, no import needed.',
		'',
		`## In the package (import '${PACKAGE}/themes/<name>.css')`,
		...library.map((t) => `- ${t.name} (${t.declarations} tokens)`),
		'',
		'## Gallery (not in the package: get_theme returns the CSS to copy into the app)',
		...gallery.map((t) => `- ${t.name} (${t.declarations} tokens)`)
	].join('\n');
}

export function theme(spec: Spec, name: string) {
	const wanted = fold(name);
	if (wanted === 'aurora') {
		return 'aurora is the default theme: it is the token defaults themselves, nothing to import. Call setTheme(null) to go back to it. See get_tokens for the values.';
	}
	const found = spec.themes.find((t) => fold(t.name) === wanted);
	if (!found) return `No theme "${name}". Available: aurora, ${spec.themes.map((t) => t.name).join(', ')}`;
	const activate = `import { setTheme } from '${PACKAGE}';\n\nsetTheme('${found.name}');`;
	const usage = found.gallery
		? [
				`"${found.name}" is a gallery theme, not shipped in the package. To use it:`,
				`1. Save the CSS below in the app, e.g. src/lib/themes/${found.name}.css, and import it once (root +layout.svelte or the main CSS).`,
				'2. Activate it at runtime (it sets data-theme on <html>):',
				'```ts\n' + activate + '\n```',
				'Or set it statically with <html data-theme="' + found.name + '"> in app.html.'
			]
		: [
				`"${found.name}" ships with the package:`,
				'```ts\n' + `import '${PACKAGE}/themes/${found.name}.css';\n` + activate + '\n```'
			];
	return [...usage, '', '```css', found.source, '```'].join('\n');
}

export function createThemeGuide(spec: Spec) {
	const sample = spec.themes.find((t) => t.name === 'ocean') ?? spec.themes[0];
	return [
		'A theme is a CSS file that redefines some --global-* tokens under :root[data-theme=\'<name>\'], inside @layer global.theme, starting with the library layer order line. Tokens left out stay as in Aurora. Use light-dark(light, dark) for colors so both modes work. Never style components here: only tokens.',
		'',
		'Example from the gallery:',
		'```css',
		sample?.source ?? '',
		'```',
		'',
		'Token reference:',
		spec.tokens.markdown
	].join('\n');
}

export function patterns(spec: Spec, name?: string) {
	const list = spec.patterns ?? [];
	if (!list.length) return `${PACKAGE} ${spec.version} has no page patterns.`;
	if (!name) {
		return [
			'Page patterns (whole pages built only with the library and the tokens; call get_pattern with a name for the code):',
			...list.map((p) => `- ${p.id.replace(/^\d+-/, '')}: ${p.title}. ${firstSentence(p.description)}`)
		].join('\n');
	}
	const wanted = fold(name);
	const found = list.find(
		(p) => fold(p.id) === wanted || fold(p.id.replace(/^\d+-/, '')) === wanted || fold(p.title) === wanted
	);
	if (!found) return `No pattern "${name}". Available: ${list.map((p) => p.id.replace(/^\d+-/, '')).join(', ')}`;
	return [
		`## ${found.title}`,
		found.description ?? '',
		"`./data.js` in the code is a fake backend of the docs: replace it with the app's data.",
		'```svelte',
		found.code,
		'```'
	]
		.filter(Boolean)
		.join('\n\n');
}
