import { parse } from 'svelte/compiler';
import type { Node } from './svelte.ts';

const LIB = '@likable-hair/svelte';

export function addDefaultLocale(source: string, locale: string, typescript = true): { text: string; changed: boolean } {
	if (/\bsetDefaultLocale\s*\(/.test(source)) return { text: source, changed: false };
	const ast = parse(source, { modern: true }) as unknown as Node;
	const script = ast.instance as Node | undefined;
	if (!script) {
		const lang = typescript ? ' lang="ts"' : '';
		return {
			text: `<script${lang}>\n\timport { setDefaultLocale } from '${LIB}';\n\n\tsetDefaultLocale('${locale}');\n</script>\n\n${source}`,
			changed: true
		};
	}
	const body = script.content.body as Node[];
	const imports = body.filter((n) => n.type === 'ImportDeclaration');
	const last = imports[imports.length - 1];
	const lineStart = (offset: number) => source.lastIndexOf('\n', offset - 1) + 1;
	const indent = last ? /^[ \t]*/.exec(source.slice(lineStart(last.start)))![0] : '\t';
	const semi = !last || source[last.end - 1] === ';' ? ';' : '';
	const call = `setDefaultLocale('${locale}')${semi}`;
	const library = imports.find(
		(n) =>
			n.source.value === LIB &&
			n.importKind !== 'type' &&
			n.specifiers.length &&
			n.specifiers.every((s: Node) => s.type === 'ImportSpecifier')
	);
	const edits: { at: number; value: string }[] = [];
	if (library) {
		const lastSpecifier = library.specifiers[library.specifiers.length - 1] as Node;
		edits.push({ at: lastSpecifier.end, value: ', setDefaultLocale' });
	}
	const after = last ? last.end : script.content.start;
	const importLine = library ? '' : `\n${indent}import { setDefaultLocale } from '${LIB}'${semi}`;
	edits.push({ at: after, value: `${importLine}\n\n${indent}${call}` });
	let text = source;
	for (const edit of edits.sort((a, b) => b.at - a.at)) text = text.slice(0, edit.at) + edit.value + text.slice(edit.at);
	return { text, changed: true };
}

export function addAppearance(source: string, typescript = true): { text: string; changed: boolean } {
	if (/\brememberAppearance\s*\(/.test(source)) return { text: source, changed: false };
	const head = `<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>`;
	const ast = parse(source, { modern: true }) as unknown as Node;
	const script = ast.instance as Node | undefined;
	if (!script) {
		const lang = typescript ? ' lang="ts"' : '';
		return {
			text: `<script${lang}>\n\timport { appearanceScript, rememberAppearance } from '${LIB}';\n\n\trememberAppearance();\n</script>\n\n${head}\n\n${source}`,
			changed: true
		};
	}
	const body = script.content.body as Node[];
	const imports = body.filter((n) => n.type === 'ImportDeclaration');
	const last = imports[imports.length - 1];
	const lineStart = (offset: number) => source.lastIndexOf('\n', offset - 1) + 1;
	const indent = last ? /^[ \t]*/.exec(source.slice(lineStart(last.start)))![0] : '\t';
	const semi = !last || source[last.end - 1] === ';' ? ';' : '';
	const library = imports.find(
		(n) =>
			n.source.value === LIB &&
			n.importKind !== 'type' &&
			n.specifiers.length &&
			n.specifiers.every((s: Node) => s.type === 'ImportSpecifier')
	);
	const edits: { at: number; value: string }[] = [];
	if (library) {
		const lastSpecifier = library.specifiers[library.specifiers.length - 1] as Node;
		edits.push({ at: lastSpecifier.end, value: ', appearanceScript, rememberAppearance' });
	}
	const after = last ? last.end : script.content.start;
	const importLine = library ? '' : `\n${indent}import { appearanceScript, rememberAppearance } from '${LIB}'${semi}`;
	edits.push({ at: after, value: `${importLine}\n\n${indent}rememberAppearance()${semi}` });
	const existing = (ast.fragment.nodes as Node[]).find((n) => n.type === 'SvelteHead');
	if (existing) {
		const open = source.indexOf('>', existing.start) + 1;
		const next = /^\n([ \t]*)/.exec(source.slice(open));
		edits.push({ at: open, value: `${next ? `\n${next[1]}` : ''}{@html '<script>' + appearanceScript() + '</script>'}` });
	} else edits.push({ at: script.end, value: `\n\n${head}` });
	let text = source;
	for (const edit of edits.sort((a, b) => b.at - a.at)) text = text.slice(0, edit.at) + edit.value + text.slice(edit.at);
	return { text, changed: true };
}
