import { parseCss } from 'svelte/compiler';

type CssNode = { type: string; start: number; end: number; [key: string]: any };

const PAGE = new Set(['html', 'body']);
const TAILWIND_4 = /@import\s+(['"])tailwindcss\1[^;]*;/;
const TAILWIND_3_BASE = /@tailwind\s+base\s*;/;
const LIBRARY_TAILWIND = '@likable-hair/svelte/tailwind.css';
export const LIBRARY_FONTS =
	'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';
const GOOGLE_FONTS_IMPORT = /@import\s+url\(\s*(['"]?)(https:\/\/fonts\.googleapis\.com\/[^'")\s]+)\1\s*\)[^;]*;[ \t]*\n?/g;

export interface CssChange {
	text: string;
	changes: string[];
}

function isElementRule(rule: CssNode) {
	const selectors = (rule.prelude?.children ?? []) as CssNode[];
	if (!selectors.length) return false;
	return selectors.every((complex) => {
		const first = complex.children?.[0]?.selectors?.[0] as CssNode | undefined;
		return first?.type === 'TypeSelector' && !PAGE.has(first.name);
	});
}

function insideLayer(text: string, offset: number, layer: string) {
	const before = text.slice(0, offset);
	const open = before.lastIndexOf(`@layer ${layer}`);
	if (open < 0) return false;
	let depth = 0;
	for (let i = before.indexOf('{', open); i >= 0 && i < offset; i++) {
		if (text[i] === '{') depth++;
		else if (text[i] === '}') depth--;
	}
	return depth > 0;
}

export function prepareAppCss(source: string, layers: string): CssChange {
	let text = source;
	const changes: string[] = [];
	const indent = /\n([ \t]+)\S/.exec(source)?.[1] ?? '\t';
	const edits: { start: number; end: number; value: string }[] = [];

	let rules: CssNode[] = [];
	try {
		rules = (parseCss(source) as unknown as { children: CssNode[] }).children;
	} catch {
		rules = [];
	}
	const moved: string[] = [];
	for (const rule of rules) {
		if (rule.type !== 'Rule' || !isElementRule(rule)) continue;
		const body = source.slice(rule.start, rule.end);
		edits.push({ start: rule.start, end: rule.end, value: `@layer reset {\n${body.replace(/^/gm, indent)}\n}` });
		moved.push(body.slice(0, body.indexOf('{')).trim().split(/\s*,\s*/)[0]);
	}
	for (const edit of edits.sort((a, b) => b.start - a.start))
		text = text.slice(0, edit.start) + edit.value + text.slice(edit.end);
	if (moved.length) changes.push(`element rules moved into @layer reset: ${moved.join(', ')}`);

	const tailwind4 = TAILWIND_4.exec(text);
	if (tailwind4 && !text.includes(LIBRARY_TAILWIND)) {
		const end = tailwind4.index + tailwind4[0].length;
		text = `${text.slice(0, end)}\n@import '${LIBRARY_TAILWIND}';${text.slice(end)}`;
		changes.push(`@import '${LIBRARY_TAILWIND}' after Tailwind`);
	}
	const tailwind3 = TAILWIND_3_BASE.exec(text);
	if (tailwind3 && !insideLayer(text, tailwind3.index, 'reset')) {
		text = `${text.slice(0, tailwind3.index)}@layer reset {\n${indent}@tailwind base;\n}${text.slice(tailwind3.index + tailwind3[0].length)}`;
		changes.push('@tailwind base wrapped in @layer reset');
	}

	if (!text.includes(layers)) {
		const charset = /^@charset[^;]*;\s*/.exec(text);
		const at = charset ? charset[0].length : 0;
		text = `${text.slice(0, at)}${layers}\n\n${text.slice(at)}`;
		changes.push('cascade layer order at the top');
	}
	return { text, changes };
}

function pageRules(source: string) {
	try {
		return (parseCss(source) as unknown as { children: CssNode[] }).children.filter(
			(rule) =>
				rule.type === 'Rule' &&
				(rule.prelude?.children ?? []).every((complex: CssNode) => {
					const parts = complex.children ?? [];
					const first = parts[0]?.selectors ?? [];
					return (
						parts.length === 1 &&
						first.length === 1 &&
						((first[0].type === 'TypeSelector' && PAGE.has(first[0].name)) ||
							(first[0].type === 'PseudoClassSelector' && first[0].name === 'root'))
					);
				})
		);
	} catch {
		return [];
	}
}

export const fontFamilies = (url: string) =>
	[...url.matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1]).replaceAll('+', ' '));

export function useLibraryFonts(source: string, usedElsewhere: (family: string) => boolean): CssChange {
	let text = source;
	const changes: string[] = [];
	const edits: { start: number; end: number; value: string }[] = [];
	for (const rule of pageRules(source)) {
		const fonts = (rule.block.children as CssNode[]).filter(
			(d) => d.type === 'Declaration' && d.property === 'font-family'
		);
		if (!fonts.length || fonts.every((d) => d.value.includes('--global-font-family'))) continue;
		fonts.forEach((d, i) => {
			if (i === 0) edits.push({ start: d.start, end: d.end, value: 'font-family: var(--global-font-family)' });
			else {
				const semicolon = source.indexOf(';', d.end);
				const lineStart = source.lastIndexOf('\n', d.start);
				edits.push({ start: lineStart, end: semicolon + 1, value: '' });
			}
		});
		changes.push(`${source.slice(rule.start, source.indexOf('{', rule.start)).trim()}: font-family from --global-font-family`);
	}
	for (const edit of edits.sort((a, b) => b.start - a.start))
		text = text.slice(0, edit.start) + edit.value + text.slice(edit.end);

	if (text.includes('family=Geist')) return { text, changes };
	let insertAt: number | undefined;
	for (const m of [...text.matchAll(GOOGLE_FONTS_IMPORT)].reverse()) {
		const families = fontFamilies(m[2]);
		const rest = text.slice(0, m.index) + text.slice(m.index! + m[0].length);
		const used = families.some(
			(family) => new RegExp(`font-family[^;{}]*\\b${family}\\b|['"]${family}['"]`).test(rest) || usedElsewhere(family)
		);
		if (used) continue;
		text = rest;
		insertAt = m.index!;
		changes.push(`removed the Google Fonts import of ${families.join(', ')}, no longer used`);
	}
	const line = `@import url('${LIBRARY_FONTS}');\n`;
	if (insertAt === undefined) {
		const layer = /^(@charset[^;]*;\s*)?@layer[^;{]*;\s*/.exec(text);
		insertAt = layer ? layer[0].length : 0;
	}
	text = text.slice(0, insertAt) + line + text.slice(insertAt);
	changes.push('Google Fonts import of Geist, Bricolage Grotesque and Geist Mono (the library fonts)');
	return { text, changes };
}

export const V4_COMPAT = '@likable-hair/svelte/v4-compat.css';

export function addV4Compat(source: string): CssChange {
	if (source.includes(V4_COMPAT)) return { text: source, changes: [] };
	let at = 0;
	try {
		const imports = (parseCss(source) as unknown as { children: CssNode[] }).children.filter(
			(node) => node.type === 'Atrule' && node.name === 'import'
		);
		const last = imports[imports.length - 1];
		if (last) at = source.indexOf(';', last.end - 1) + 1;
	} catch {
		at = 0;
	}
	if (!at) at = /^(@charset[^;]*;\s*)?@layer[^;{]*;/.exec(source)?.[0].length ?? 0;
	const text = `${source.slice(0, at)}\n@import '${V4_COMPAT}';${source.slice(at)}`;
	return { text, changes: [`@import '${V4_COMPAT}' (v4 color names keep working, mapped to the Aurora colors)`] };
}

export function findAppCss(files: { rel: string; text: string }[]): string | undefined {
	const css = files.filter((f) => /\.(css|pcss|postcss)$/.test(f.rel));
	return (
		css.find((f) => TAILWIND_4.test(f.text) || TAILWIND_3_BASE.test(f.text))?.rel ??
		css.find((f) => f.rel === 'src/app.css')?.rel ??
		css.find((f) => f.rel === 'src/app.pcss')?.rel
	);
}
