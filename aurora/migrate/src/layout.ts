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
