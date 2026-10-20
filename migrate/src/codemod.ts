import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { attrExpression, attrText, Editor, isReference, visit } from './ast.ts';
import { readAliases } from './analyze.ts';
import { dissolve, resolveImport, type WrapperSummary } from './dissolve.ts';
import { Lines, listFiles } from './files.ts';
import { localRuleFor, variantRule, type RuleIndex } from './rules.ts';
import { pageUrl, parentPage } from './routes.ts';
import { scanSvelte, type Node } from './svelte.ts';
import type { ChildIcon, Collect, ComponentApi, OperatorsRule, ComponentMigration, ItemRules, Removal, SnippetChange, Unpack, Unwrap, ValueChange, LocalMigration, ManualTrigger, NestedRule, PairsRule, ParameterRule, ParentRoute, Rename } from './types.ts';

const LIB = '@likable-hair/svelte';
const MDI = '@mdi/js';
const ICON = /^mdi-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MDI_HELPER = /^mdi-(?:spin|pulse|rotate-\d+|flip-[hv]|\d+px|light|dark|inactive)$/;
const SCRIPT_OPEN = '<script lang="ts">';
const SCRIPT_CLOSE = '\n</script>';
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const PLAIN_TYPE = /^[A-Za-z_$][\w$.]*(?:<[^()]*>)?(?:\s*\|\s*[A-Za-z_$][\w$.]*(?:<[^()]*>)?)*$/;

type Mapping = Record<string, string | null>;

export interface CodemodChange {
	file: string;
	line: number;
	kind: string;
	id: string;
	name: string;
	to?: string;
	note?: string;
	check: boolean;
}

export interface CodemodSkip {
	file: string;
	line: number;
	kind: string;
	id: string;
	name: string;
	reason: string;
}

export interface CodemodDefault {
	file: string;
	line: number;
	component: string;
	name: string;
	v4: string;
	v5: string;
	kind: 'look' | 'language';
	note?: string;
}

export interface CodemodFile {
	path: string;
	rel: string;
	before: string;
	after: string;
}

export interface CodemodResult {
	dir: string;
	files: CodemodFile[];
	changes: CodemodChange[];
	skipped: CodemodSkip[];
	defaults: CodemodDefault[];
	wrappers: WrapperSummary[];
	locals: LocalSummary[];
	deleted: string[];
	parseErrors: { file: string; error: string }[];
}

export interface LocalSummary {
	file: string;
	from: string;
	to: string;
	usages: number;
	deleted: boolean;
}

export interface CodemodOptions {
	write?: boolean;
}

export const mdiExport = (name: string) =>
	'mdi' +
	name
		.slice(4)
		.split('-')
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join('');

export function mdiNames(dir: string): Set<string> | undefined {
	for (let current = resolve(dir); ; current = dirname(current)) {
		const file = join(current, 'node_modules', '@mdi', 'js', 'mdi.d.ts');
		if (existsSync(file))
			return new Set([...readFileSync(file, 'utf8').matchAll(/export declare const (mdi\w+)/g)].map((m) => m[1]));
		if (dirname(current) === current) return undefined;
	}
}

const isLib = (source: string) =>
	source === LIB || source.startsWith(`${LIB}/`) || source.includes(`node_modules/${LIB}`);

const normalize = (name: string) => name.replace(/^--/, '').replaceAll('-', '').toLowerCase();

interface CssRename {
	to: string;
	component: string;
	note?: string;
	toProp?: Rename['toProp'];
	also?: string[];
}

interface CssDrop {
	component: string;
	note: string;
}

export const v5CssVars = (index: RuleIndex) => new Set(Object.values(index.rules.v5.components).flatMap((c) => c.cssVars));

export const v4CssPrefixes = (index: RuleIndex) =>
	[...index.v4Components]
		.map((name) => `--${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-`)
		.sort((a, b) => b.length - a.length);

export function cssDrops(index: RuleIndex, renames: Map<string, CssRename>, v5Vars: Set<string>): Map<string, CssDrop> {
	const kept = new Set<string>();
	const out = new Map<string, CssDrop>();
	for (const rule of index.rules.components) {
		for (const r of rule.cssVars?.renamed ?? []) kept.add(r.from);
		for (const r of rule.cssVars?.changed ?? []) kept.add(r.name);
		for (const r of rule.cssVars?.removed ?? []) {
			if (!r.drop) kept.add(r.name);
			else if (!out.has(r.name)) out.set(r.name, { component: rule.from, note: r.note });
		}
	}
	for (const name of out.keys()) if (kept.has(name) || renames.has(name) || v5Vars.has(name)) out.delete(name);
	return out;
}

export function cssRenames(index: RuleIndex): Map<string, CssRename> {
	const byName = new Map<string, CssRename[]>();
	for (const rule of index.rules.components)
		for (const r of rule.cssVars?.renamed ?? []) {
			if (r.scoped) continue;
			const list = byName.get(r.from) ?? [];
			list.push({ to: r.to, component: rule.from, note: r.note, toProp: r.toProp, also: r.also });
			byName.set(r.from, list);
		}
	const out = new Map<string, CssRename>();
	for (const [name, list] of byName) {
		const targets = new Set(list.map((r) => r.to));
		if (targets.size === 1) {
			out.set(name, list[0]);
			continue;
		}
		const owners = list.filter((r) => normalize(name).startsWith(r.component.toLowerCase()));
		if (new Set(owners.map((r) => r.to)).size === 1) out.set(name, owners[0]);
	}
	return out;
}

interface Context {
	rel: string;
	text: string;
	offset: number;
	lines: Lines;
	edit: Editor;
	changes: CodemodChange[];
	skipped: CodemodSkip[];
	defaults: CodemodDefault[];
	icons: Set<string>;
	index: RuleIndex;
	css: Map<string, CssRename>;
	available?: Set<string>;
	convertDataIcons: boolean;
	typescript: boolean;
	references: Map<string, number>;
	local: (source: string) => { path: string; rule: LocalMigration } | undefined;
	lets: Set<string>;
	instance?: Node;
	localUsages: Map<string, number>;
	parent?: string;
	passThrough?: (source: string) => PassThrough | undefined;
	scope?: Map<string, string>;
	passed?: Set<string> | null;
	variants: Map<Node, string>;
	declared: Map<string, number>;
	drops: Map<string, CssDrop>;
	v4Prefixes: string[];
	v5Vars: Set<string>;
}

interface PassThrough {
	v4: string;
	declared: Set<string>;
	forwarded: Record<string, string>;
	snippets: Record<string, string>;
}

function passThroughOf(text: string, index: RuleIndex, inner: (source: string) => PassThrough | undefined): PassThrough | undefined {
	const scan = scanSvelte(text);
	if (scan.error || !scan.restProp) return undefined;
	const lib = new Map(scan.imports.filter((i) => i.source === LIB).map((i) => [i.local, i.imported]));
	const app = new Map(scan.imports.filter((i) => i.imported === 'default' && i.source.endsWith('.svelte')).map((i) => [i.local, i.source]));
	const targetOf = (tag: string): { v4: string; inner?: PassThrough } | undefined => {
		const name = lib.get(tag);
		const v4 = name ? (index.byV4.get(name)?.from ?? index.rules.components.find((r) => r.to === name)?.from) : undefined;
		if (v4) return { v4 };
		const source = app.get(tag);
		const through = source ? inner(source) : undefined;
		return through && { v4: through.v4, inner: through };
	};
	const nodes = scan.components.flatMap((node) => {
		const target = targetOf(node.tag);
		const spread = node.attrs.some((a) => a.kind === 'spread' && a.expression?.type === 'Identifier' && a.expression.name === scan.restProp);
		return target && spread ? [{ node, ...target }] : [];
	});
	if (!nodes.length || new Set(nodes.map((n) => index.byV4.get(n.v4)?.to)).size !== 1) return undefined;
	const declared = new Set(scan.declaredProps);
	const forwarded: Record<string, string> = {};
	const snippets: Record<string, string> = {};
	const conflicts = new Set<string>();
	const record = (map: Record<string, string>, from: string, to: string | undefined) => {
		if (to === undefined || (map[from] !== undefined && map[from] !== to)) conflicts.add(from);
		else map[from] = to;
	};
	for (const { node, inner } of nodes)
		for (const attr of node.attrs) {
			if (attr.expression?.type !== 'Identifier' || !declared.has(attr.expression.name)) continue;
			const event = /^on[a-z]/.test(attr.name);
			if (!event && !/Snippet$/.test(attr.name)) continue;
			const to = !inner?.declared.has(attr.name) ? attr.name : (event ? inner.forwarded : inner.snippets)[attr.name];
			record(event ? forwarded : snippets, attr.expression.name, to);
		}
	for (const name of conflicts) {
		delete forwarded[name];
		delete snippets[name];
	}
	return { v4: nodes[0].v4, declared, forwarded, snippets };
}

const lineOf = (ctx: Context, pos: number) => ctx.lines.at(Math.max(0, pos - ctx.offset));

function changed(ctx: Context, pos: number, change: Omit<CodemodChange, 'file' | 'line'>) {
	ctx.changes.push({ file: ctx.rel, line: lineOf(ctx, pos), ...change });
}

function skip(ctx: Context, pos: number, entry: Omit<CodemodSkip, 'file' | 'line'>) {
	ctx.skipped.push({ file: ctx.rel, line: lineOf(ctx, pos), ...entry });
}

function iconIdentifier(ctx: Context, value: string, pos: number): string | undefined {
	if (!ICON.test(value) || MDI_HELPER.test(value)) return undefined;
	const name = mdiExport(value);
	if (ctx.available && !ctx.available.has(name)) {
		skip(ctx, pos, { kind: 'icon-unknown', id: 'icons/unknown', name: value, reason: `${name} is not in @mdi/js` });
		return undefined;
	}
	return name;
}

interface LibImport {
	decl: Node;
	spec?: Node;
	imported: string;
	local: string;
	deep: boolean;
}

interface LocalImport {
	decl: Node;
	rule: LocalMigration;
	path: string;
}

function localImports(programs: Node[], ctx: Context): LocalImport[] {
	const out: LocalImport[] = [];
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') continue;
			const found = ctx.local(statement.source.value);
			if (found) out.push({ decl: statement, ...found });
		}
	return out;
}

function libraryImports(programs: Node[], index: RuleIndex): LibImport[] {
	const out: LibImport[] = [];
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type !== 'ImportDeclaration' || !isLib(statement.source.value)) continue;
			const deep = statement.source.value !== LIB;
			for (const spec of statement.specifiers as Node[]) {
				if (spec.type === 'ImportNamespaceSpecifier') continue;
				if (spec.type === 'ImportDefaultSpecifier') {
					const base = basename(statement.source.value).replace(/\.svelte$/, '');
					if (index.v4Components.has(base))
						out.push({ decl: statement, spec, imported: base, local: spec.local.name, deep });
					continue;
				}
				out.push({
					decl: statement,
					spec,
					imported: spec.imported.name ?? spec.imported.value,
					local: spec.local.name,
					deep
				});
			}
		}
	return out;
}

function renameTag(ctx: Context, node: Node, local: string, to: string) {
	ctx.edit.replace(node.start + 1, node.start + 1 + local.length, to);
	const close = ctx.text.lastIndexOf(`</${local}`, node.end);
	if (close > node.start && ctx.text.slice(node.end - 2, node.end) !== '/>') ctx.edit.replace(close + 2, close + 2 + local.length, to);
}

const nodeLiteral = (attr: Node): string | undefined => {
	if (attr.value === true) return 'true';
	const text = attrText(attr);
	if (text !== undefined) return text;
	const expression = attrExpression(attr);
	return expression?.type === 'Literal' ? String(expression.value) : undefined;
};

function renameReferences(roots: unknown[], local: string, to: string, ctx: Context, store = false) {
	const seen = new Set<number>();
	const target = store ? `$${local}` : local;
	let bare = 0;
	const edits: [number, number, string][] = [];
	for (const root of roots)
		visit(root, (node, parent, key) => {
			if (node.type === 'Component' && !store && node.name === local) {
				edits.push([node.start + 1, node.start + 1 + local.length, to]);
				const close = ctx.text.lastIndexOf(`</${local}`, node.end);
				if (close > node.start && ctx.text.slice(node.end - 2, node.end) !== '/>')
					edits.push([close + 2, close + 2 + local.length, to]);
				return;
			}
			if (node.type !== 'Identifier' || seen.has(node.start)) return;
			if (node.name !== target && !(store && node.name === local)) return;
			if (!isReference(node, parent, key)) return;
			seen.add(node.start);
			if (store && node.name === local) {
				bare++;
				return;
			}
			if (parent?.type === 'Property' && parent.shorthand) edits.push([parent.start, parent.end, `${node.name}: ${to}`]);
			else edits.push([node.start, node.end, to]);
		});
	if (bare) return false;
	for (const [start, end, text] of edits) ctx.edit.replace(start, end, text);
	return true;
}

function renameImports(roots: unknown[], programs: Node[], ctx: Context): Map<string, string> {
	const scope = new Map<string, string>();
	const taken = new Map<string, string>();
	const imports = libraryImports(programs, ctx.index);
	for (const record of imports) if (!record.deep) taken.set(record.imported, record.local);
	for (const record of imports) {
		const rule = ctx.index.byV4.get(record.imported);
		const change = ctx.index.exportChanges.get(record.imported);
		const v5 = ctx.index.v5Exports.has(record.imported);
		const to = !v5 && rule && rule.to !== record.imported ? rule.to : !v5 && change?.rename ? change.rename : undefined;
		const store = change?.kind === 'store' && !!change.rename;
		scope.set(record.local, record.imported);
		if (record.deep) {
			if (!rule || !ctx.index.v5Exports.has(rule.to) || record.spec?.type !== 'ImportDefaultSpecifier') continue;
			if ((record.decl.specifiers as Node[]).length !== 1) continue;
			const name = rule.to;
			const local = record.local === record.imported && name !== record.imported ? name : record.local;
			const spec = local === name ? name : `${name} as ${local}`;
			const quote = record.decl.source.raw?.[0] ?? "'";
			const semi = ctx.text.slice(record.decl.end - 1, record.decl.end) === ';' ? ';' : '';
			if (ctx.edit.replace(record.decl.start, record.decl.end, `import { ${spec} } from ${quote}${LIB}${quote}${semi}`)) {
				changed(ctx, record.decl.start, { kind: 'import-deep', id: 'imports/deep', name: record.decl.source.value, to: LIB, check: false });
				if (local !== record.local) renameReferences(roots, record.local, local, ctx);
			}
			continue;
		}
		if (!to || !record.spec) continue;
		const existing = taken.get(to);
		if (existing && existing !== record.local && record.local === record.imported && !store) {
			const specifiers = record.decl.specifiers as Node[];
			const index = specifiers.indexOf(record.spec);
			const [start, end] =
				specifiers.length === 1
					? [record.decl.start, record.decl.end]
					: index < specifiers.length - 1
						? [record.spec.start, specifiers[index + 1].start]
						: [specifiers[index - 1].end, record.spec.end];
			if (ctx.edit.replace(start, end, '')) {
				renameReferences(roots, record.local, existing, ctx);
				changed(ctx, record.spec.start, { kind: 'component-renamed', id: `imports/renamed/${record.imported}`, name: record.imported, to, note: `${to} was already imported: one import for both.`, check: false });
			}
			continue;
		}
		if (existing && existing !== record.local) {
			skip(ctx, record.spec.start, {
				kind: 'import-renamed',
				id: `imports/renamed/${record.imported}`,
				name: record.imported,
				reason: `${to} is already imported: merge the two by hand`
			});
			continue;
		}
		if (store) {
			if (!renameReferences(roots, record.local, to, ctx, true)) {
				skip(ctx, record.spec.start, {
					kind: 'import-renamed',
					id: `imports/renamed/${record.imported}`,
					name: record.imported,
					reason: `used without $: rewrite the uses of the store by hand (${change?.note ?? ''})`
				});
				continue;
			}
			ctx.edit.replace(record.spec.start, record.spec.end, to);
		} else if (record.local === record.imported) {
			ctx.edit.replace(record.spec.start, record.spec.end, to);
			renameReferences(roots, record.local, to, ctx);
		} else ctx.edit.replace(record.spec.imported.start, record.spec.imported.end, to);
		taken.set(to, record.local === record.imported ? to : record.local);
		changed(ctx, record.spec.start, {
			kind: rule ? 'component-renamed' : 'export-renamed',
			id: `imports/renamed/${record.imported}`,
			name: record.imported,
			to,
			note: change?.note,
			check: !!change?.note && !rule
		});
	}
	replaceLocalImports(roots, programs, ctx, scope, taken);
	return scope;
}

function replaceLocalImports(roots: unknown[], programs: Node[], ctx: Context, scope: Map<string, string>, taken: Map<string, string>) {
	const entries: { decl: Node; rule: LocalMigration; typeOnly: boolean; named: string[]; kept: Node[] }[] = [];
	for (const { decl, rule } of localImports(programs, ctx)) {
		const typeOnly = decl.importKind === 'type';
		const named: string[] = [];
		const kept: Node[] = [];
		for (const spec of decl.specifiers as Node[]) {
			if (spec.type === 'ImportDefaultSpecifier' && !typeOnly) {
				const local = spec.local.name as string;
				const tags: Node[] = [];
				for (const root of roots) visit(root, (node) => void (node.type === 'Component' && node.name === local && tags.push(node)));
				for (const node of tags) {
					const variant = variantRule(ctx.index, rule, (node.attributes as Node[]).filter((a) => a.type === 'Attribute').map((a) => ({ name: a.name, value: nodeLiteral(a) })));
					if (!variant) continue;
					const name = taken.get(variant.to) ?? variant.to;
					if (!taken.has(variant.to)) {
						named.push(variant.to);
						taken.set(variant.to, variant.to);
					}
					renameTag(ctx, node, local, name);
					ctx.variants.set(node, variant.from);
				}
				scope.set(local, rule.from);
				if (tags.every((node) => ctx.variants.has(node)) && !ctx.references.get(local)) continue;
				const name = taken.get(rule.to) ?? rule.to;
				if (!taken.has(rule.to)) {
					named.push(rule.to);
					taken.set(rule.to, rule.to);
				}
				if (local !== name) renameReferences(roots, local, name, ctx);
				continue;
			}
			const imported = spec.type === 'ImportSpecifier' ? ((spec.imported.name ?? spec.imported.value) as string) : undefined;
			const to = imported ? rule.exports?.find((e) => e.from === imported)?.to : undefined;
			if (!to) {
				kept.push(spec);
				continue;
			}
			const local = spec.local.name as string;
			named.push(`${spec.importKind === 'type' && !typeOnly ? 'type ' : ''}${to === local ? to : `${to} as ${local}`}`);
		}
		if (kept.length)
			skip(ctx, decl.start, {
				kind: 'local-export',
				id: `${rule.from}/exports`,
				name: kept.map((spec) => source(ctx, spec)).join(', '),
				reason: `not exported by the library: move it into the app or replace it (${rule.summary})`
			});
		entries.push({ decl, rule, typeOnly, named, kept });
	}
	const report = (entry: (typeof entries)[number]) =>
		changed(ctx, entry.decl.start, { kind: 'local-import', id: `${entry.rule.from}/import`, name: entry.decl.source.value, to: entry.rule.to, note: entry.rule.summary, check: false });
	const style = (decl: Node) => ({
		quote: decl.source.raw?.[0] ?? "'",
		semi: ctx.text.slice(decl.end - 1, decl.end) === ';' ? ';' : '',
		indent: /^[ \t]*/.exec(ctx.text.slice(ctx.text.lastIndexOf('\n', decl.start) + 1))![0]
	});
	const mergeable = entries.filter((e) => !e.typeOnly && !e.kept.length);
	const names = mergeable.flatMap((e) => e.named);
	const target = names.length ? libraryTarget(programs) : undefined;
	if (target) {
		const specs = target.specifiers as Node[];
		const last = specs[specs.length - 1];
		const lineStart = ctx.text.lastIndexOf('\n', last.start) + 1;
		const multiline = ctx.text.slice(target.start, last.start).includes('\n') && !ctx.text.slice(lineStart, last.start).trim();
		const glue = multiline ? `,\n${/^[ \t]*/.exec(ctx.text.slice(lineStart))![0]}` : ', ';
		ctx.edit.insert(last.end, names.map((n) => `${glue}${n}`).join(''));
	}
	mergeable.forEach((entry, index) => {
		const { quote, semi } = style(entry.decl);
		const first = !target && index === mergeable.findIndex((e) => e.named.length);
		const done = first ? ctx.edit.replace(entry.decl.start, entry.decl.end, `import { ${names.join(', ')} } from ${quote}${LIB}${quote}${semi}`) : removeStatement(ctx, entry.decl);
		if (done) report(entry);
	});
	for (const entry of entries) {
		if (mergeable.includes(entry)) continue;
		const { quote, semi, indent } = style(entry.decl);
		const kind = entry.typeOnly ? 'type ' : '';
		const lines = [
			entry.named.length ? `import ${kind}{ ${entry.named.join(', ')} } from ${quote}${LIB}${quote}${semi}` : '',
			entry.kept.length ? `import ${kind}{ ${entry.kept.map((spec) => source(ctx, spec)).join(', ')} } from ${entry.decl.source.raw}${semi}` : ''
		].filter(Boolean);
		if (ctx.edit.replace(entry.decl.start, entry.decl.end, lines.join(`\n${indent}`))) report(entry);
	}
}

function localCallNames(programs: Node[], ctx: Context): Map<string, LocalMigration> {
	const out = new Map<string, LocalMigration>();
	for (const { decl, rule } of localImports(programs, ctx)) {
		if (!rule.calls) continue;
		for (const spec of decl.specifiers as Node[]) {
			if (spec.type !== 'ImportSpecifier') continue;
			const imported = (spec.imported.name ?? spec.imported.value) as string;
			if (rule.calls.functions.includes(imported)) out.set(spec.local.name, rule);
		}
	}
	return out;
}

const keyName = (property: Node): string | undefined =>
	property.type !== 'Property' || property.computed
		? undefined
		: property.key.type === 'Identifier'
			? property.key.name
			: typeof property.key.value === 'string'
				? property.key.value
				: undefined;

function propertyRange(ctx: Context, list: Node[], index: number): [number, number] {
	const node = list[index];
	if (index < list.length - 1) return [node.start, list[index + 1].start];
	if (index > 0) return [list[index - 1].end, node.end];
	return [node.start, node.end];
}

type ObjectRules = Pick<ItemRules, 'keys' | 'values' | 'drop' | 'nested' | 'pairs' | 'parameters' | 'rewrite' | 'byHand' | 'operators' | 'note'>;

const TIME_TOKENS = /[Hhms]/;

function quoted(ctx: Context, like: Node, value: string): string {
	const q = ctx.text[like.start] === "'" ? "'" : '"';
	return `${q}${value.replaceAll('\\', '\\\\').replaceAll(q, `\\${q}`)}${q}`;
}

function editNested(ctx: Context, properties: Node[], index: number, rule: NestedRule, id: string, note?: string) {
	const property = properties[index];
	const value = property.value as Node;
	const fail = (reason: string) => skip(ctx, property.start, { kind: 'item-nested', id, name: `${rule.key}: ${source(ctx, value)}`.slice(0, 120), reason: `${reason}${rule.note ?? note ? ` (${rule.note ?? note})` : ''}` });
	if (value.type !== 'ObjectExpression') return fail(`\`${rule.key}\` is not written here: convert it by hand`);
	let tag: Node | undefined;
	let params: Node | undefined;
	for (const p of value.properties as Node[]) {
		const name = keyName(p);
		if (name === rule.tag) tag = p.value;
		else if (rule.params && name === rule.params) params = p.value;
		else return fail(`\`${rule.key}\` has \`${name ?? source(ctx, p)}\`, which has no equivalent: convert it by hand`);
	}
	if (!tag || tag.type !== 'Literal' || typeof tag.value !== 'string') return fail(`\`${rule.key}.${rule.tag}\` is not a literal: convert it by hand`);
	let mapped = rule.values[tag.value];
	if (mapped === undefined) return fail(`no equivalent for \`${rule.key}: ${tag.value}\`: convert it by hand`);
	const hoisted: string[] = [];
	const dropped: string[] = [];
	if (params) {
		if (params.type !== 'ObjectExpression') return fail(`\`${rule.params}\` is not written here: convert it by hand`);
		for (const p of params.properties as Node[]) {
			const name = keyName(p);
			const hoist = rule.hoist?.find((h) => h.from === name);
			if (hoist && /Function/.test(p.value.type)) return fail(`\`${name}\` is a function: use \`format\` or a \`cell\` snippet`);
			if (hoist) hoisted.push(`${hoist.to}: ${source(ctx, p.value)}`);
			else if (name && rule.drop?.includes(name)) {
				dropped.push(name);
				const time = rule.time?.param === name ? rule.time.values[tag.value] : undefined;
				if (time && p.value.type === 'Literal' && typeof p.value.value === 'string' && TIME_TOKENS.test(p.value.value.replace(/'[^']*'/g, ''))) mapped = time;
			} else return fail(`\`${rule.params}.${name ?? source(ctx, p)}\` has no equivalent: convert it by hand`);
		}
	}
	const parts = [...(mapped === null ? [] : [`${rule.key}: ${quoted(ctx, tag, mapped)}`]), ...hoisted];
	const [start, end] = parts.length ? [property.start, property.end] : propertyRange(ctx, properties, index);
	if (ctx.edit.replace(start, end, parts.join(', ')))
		changed(ctx, property.start, {
			kind: 'item-nested',
			id,
			name: `${rule.key}: ${tag.value}`,
			to: parts.join(', ') || '(removed)',
			note: dropped.length ? `${dropped.join(', ')} removed. ${rule.note ?? ''}`.trim() : rule.note,
			check: dropped.length > 0 || (mapped !== null && !!rule.check?.includes(mapped))
		});
}

function editPairs(ctx: Context, property: Node, rule: PairsRule, id: string) {
	const value = property.value as Node;
	const elements = value.type === 'ArrayExpression' ? (value.elements as (Node | null)[]) : [];
	const pairs = elements.every((e) => e?.type === 'ArrayExpression' && e.elements.length === rule.keys.length && e.elements.every((x: Node | null) => x && x.type !== 'SpreadElement'));
	if (value.type !== 'ArrayExpression' || !pairs) {
		skip(ctx, property.start, { kind: 'item-pairs', id, name: rule.from, reason: `not a literal list of [${rule.keys.join(', ')}]: write \`${rule.to}: [{ ${rule.keys.join(', ')} }]\` by hand` });
		return;
	}
	const objects = elements.map((e) => `{ ${rule.keys.map((k, i) => `${k}: ${source(ctx, e!.elements[i])}`).join(', ')} }`);
	if (ctx.edit.replace(property.start, property.end, `${rule.to}: [${objects.join(', ')}]`))
		changed(ctx, property.start, { kind: 'item-pairs', id, name: rule.from, to: rule.to, check: false });
}

function editParameters(ctx: Context, property: Node, rule: ParameterRule, id: string) {
	const value = property.value as Node;
	const fn = /^(Arrow)?FunctionExpression$/.test(value.type) ? value : undefined;
	const pattern = fn?.params?.[0];
	const uses = pattern?.type === 'ObjectPattern' ? (pattern.properties as Node[]).filter((p) => rule.renamed.some((r) => r.from === keyName(p))) : [];
	if (!fn || (pattern && pattern.type !== 'ObjectPattern')) {
		if (pattern)
			skip(ctx, property.start, { kind: 'item-parameters', id, name: rule.key, reason: `rename ${rule.renamed.map((r) => `\`${r.from}\` → \`${r.to}\``).join(', ')} in the parameter by hand` });
		return;
	}
	for (const p of uses) {
		const r = rule.renamed.find((x) => x.from === keyName(p))!;
		const done = p.shorthand && p.value.type === 'Identifier' ? ctx.edit.replace(p.start, p.end, `${r.to}: ${p.value.name}`) : ctx.edit.replace(p.key.start, p.key.end, r.to);
		if (done) changed(ctx, p.start, { kind: 'item-parameters', id, name: `${rule.key}(${r.from})`, to: r.to, check: false });
	}
}

function editOperators(ctx: Context, object: Node, rule: OperatorsRule, id: string, remove: Set<number>): Set<string> {
	const properties = object.properties as Node[];
	const find = (key: string) => properties.findIndex((p) => keyName(p) === key);
	const at = { type: find(rule.type), mode: find(rule.mode), advanced: find(rule.advanced) };
	if (at.mode < 0) return new Set();
	const literal = (index: number) => {
		const value = index < 0 ? undefined : (properties[index].value as Node);
		return value?.type === 'Literal' ? value.value : undefined;
	};
	const type = literal(at.type);
	const mode = literal(at.mode);
	const advanced = at.advanced < 0 ? false : literal(at.advanced);
	const mode_ = properties[at.mode];
	const fail = (reason: string) => {
		skip(ctx, mode_.start, { kind: 'item-operators', id, name: source(ctx, mode_).slice(0, 120), reason: `${reason}${rule.note ? ` (${rule.note})` : ''}` });
		return new Set([rule.mode, rule.advanced]);
	};
	if (typeof type !== 'string' || typeof mode !== 'string' || typeof advanced !== 'boolean') return fail('`type`, `mode` or `advanced` is not written here: set `operators` by hand');
	const operator = rule.map[type]?.[mode];
	if (!operator) return fail(`\`${type}\` with \`${mode}\` needs a choice: set \`operators\` by hand`);
	const q = ctx.text[(mode_.value as Node).start] === "'" ? "'" : '"';
	const extra = rule.extra?.[`${type}.${mode}`];
	const text = `${advanced ? `defaultOperator: ${q}${operator}${q}` : `operators: [${q}${operator}${q}]`}${extra ? `, ${extra}` : ''}`;
	if (!ctx.edit.replace(mode_.start, mode_.end, text)) return new Set();
	if (at.advanced >= 0) remove.add(at.advanced);
	changed(ctx, mode_.start, { kind: 'item-operators', id, name: `${type} ${mode}${advanced ? ' (advanced)' : ''}`, to: text, check: false });
	return new Set([rule.mode, rule.advanced]);
}

function editObject(ctx: Context, object: Node, calls: ObjectRules, prefix: string, id: string) {
	const properties = object.properties as Node[];
	const present = new Set(properties.map(keyName));
	const remove = new Set<number>();
	const dropped = new Map<number, string>();
	const handled = !prefix && calls.operators ? editOperators(ctx, object, calls.operators, id, remove) : new Set<string>();
	properties.forEach((property, index) => {
		const key = keyName(property);
		if (!key || handled.has(key)) return;
		const path = prefix ? `${prefix}.${key}` : key;
		if (calls.drop?.includes(path)) {
			remove.add(index);
			dropped.set(index, path);
			return;
		}
		const rewrite = calls.rewrite?.find((r) => r.key === path && new RegExp(r.match).test(source(ctx, property.value)));
		if (rewrite && !present.has(rewrite.to)) {
			const q = source(ctx, property.value).includes("'") ? "'" : '"';
			const text = `${rewrite.to}: ${q}${rewrite.value}${q}`;
			if (ctx.edit.replace(property.start, property.end, text)) changed(ctx, property.start, { kind: 'item-rewrite', id, name: path, to: text, check: false });
			return;
		}
		const byHand = calls.byHand?.find((n) => n.key === path);
		if (byHand) return skip(ctx, property.start, { kind: 'item-key', id, name: `${path}: ${source(ctx, property.value)}`.slice(0, 120), reason: byHand.note });
		const nested = calls.nested?.find((n) => n.key === path);
		if (nested) return editNested(ctx, properties, index, nested, id, calls.note);
		const pairs = calls.pairs?.find((n) => n.from === path);
		if (pairs) return editPairs(ctx, property, pairs, id);
		const parameters = calls.parameters?.find((n) => n.key === path);
		if (parameters) editParameters(ctx, property, parameters, id);
		const rename = calls.keys?.find((k) => k.from === path);
		const to = rename ? rename.to.split('.').pop()! : undefined;
		if (to && to !== key && present.has(to)) {
			skip(ctx, property.start, { kind: 'item-key', id, name: path, reason: `\`${to}\` is already there: decide by hand what \`${key}\` becomes${rename!.note ? ` (${rename!.note})` : ''}` });
			return;
		}
		const mapped = calls.values?.find((v) => v.key === path);
		const value = property.value as Node;
		if (mapped && value.type === 'Literal' && typeof value.value === 'string') {
			const next = mapped.values[value.value] ?? mapped.values[value.value.toUpperCase()] ?? mapped.values[value.value.toLowerCase()];
			if (next === undefined) {
				skip(ctx, property.start, { kind: 'call-value', id, name: `${path}: ${source(ctx, value)}`, reason: `no equivalent for this value: set it by hand (${calls.note ?? ''})` });
				return;
			}
			if (ctx.edit.replace(property.start, property.end, `${to ?? key}: ${JSON.stringify(next)}`))
				changed(ctx, property.start, { kind: 'call-key-renamed', id, name: path, to: `${to ?? key}: ${JSON.stringify(next)}`, check: false });
			return;
		}
		if (mapped) {
			skip(ctx, property.start, { kind: 'call-value', id, name: path, reason: `the value is not a literal: map it by hand (${calls.note ?? ''})` });
			return;
		}
		if (to && to !== key) {
			const done = property.shorthand ? ctx.edit.replace(property.start, property.end, `${to}: ${key}`) : ctx.edit.replace(property.key.start, property.key.end, to);
			if (done) changed(ctx, property.start, { kind: 'call-key-renamed', id, name: path, to: rename!.to, check: false });
		}
		if (value.type === 'ObjectExpression') editObject(ctx, value, calls, path, id);
	});
	const indexes = [...remove].sort((a, b) => a - b);
	for (let i = 0; i < indexes.length; ) {
		let j = i;
		while (j + 1 < indexes.length && indexes[j + 1] === indexes[j] + 1) j++;
		const [first, last] = [indexes[i], indexes[j]];
		const [start, end] =
			last < properties.length - 1
				? [properties[first].start, properties[last + 1].start]
				: first > 0
					? [properties[first - 1].end, properties[last].end]
					: [properties[first].start, properties[last].end];
		if (ctx.edit.replace(start, end, ''))
			for (let k = first; k <= last; k++) {
				const path = dropped.get(k);
				if (path) changed(ctx, properties[k].start, { kind: 'call-key-dropped', id, name: path, note: calls.note, check: true });
			}
		i = j + 1;
	}
}

function editItems(ctx: Context, expression: Node, rules: ObjectRules, id: string, declarations: Map<string, Node>, seen: Set<Node>, depth = 0): boolean {
	if (depth > 12) return false;
	switch (expression.type) {
		case 'ArrayExpression':
			return (expression.elements as (Node | null)[]).every((element) => !element || editItems(ctx, element, rules, id, declarations, seen, depth + 1));
		case 'ObjectExpression':
			editObject(ctx, expression, rules, '', id);
			return true;
		case 'SpreadElement':
			return editItems(ctx, expression.argument, rules, id, declarations, seen, depth + 1);
		case 'ConditionalExpression':
			return editItems(ctx, expression.consequent, rules, id, declarations, seen, depth + 1) && editItems(ctx, expression.alternate, rules, id, declarations, seen, depth + 1);
		case 'LogicalExpression':
			return editItems(ctx, expression.right, rules, id, declarations, seen, depth + 1);
		case 'CallExpression':
			if (expression.callee.type === 'Identifier' && /^\$(state|derived|bindable)$/.test(expression.callee.name) && expression.arguments[0])
				return editItems(ctx, expression.arguments[0], rules, id, declarations, seen, depth + 1);
			return false;
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
			return editItems(ctx, expression.expression, rules, id, declarations, seen, depth + 1);
		case 'Identifier': {
			const init = declarations.get(expression.name);
			if (!init) return false;
			if (seen.has(init)) return true;
			seen.add(init);
			return editItems(ctx, init, rules, id, declarations, seen, depth + 1);
		}
		case 'Literal':
			return expression.value === null;
		default:
			return false;
	}
}

function transformItems(ctx: Context, usages: { node: Node; v4: string }[], instance: Node | undefined) {
	const declarations = new Map<string, Node>();
	const props = new Set<string>();
	for (const statement of (instance?.body ?? []) as Node[])
		if (statement.type === 'VariableDeclaration')
			for (const d of statement.declarations as Node[]) {
				if (d.id.type === 'Identifier' && d.init) declarations.set(d.id.name, d.init);
				if (d.id.type !== 'ObjectPattern' || d.init?.type !== 'CallExpression' || d.init.callee.name !== '$props') continue;
				for (const p of d.id.properties as Node[]) {
					const value = p.type === 'Property' ? p.value : undefined;
					if (value?.type === 'AssignmentPattern' && value.left.type === 'Identifier') {
						props.add(value.left.name);
						declarations.set(value.left.name, value.right);
					} else if (value?.type === 'Identifier') props.add(value.name);
				}
			}
	const seen = new Set<Node>();
	const reported = new Set<string>();
	for (const { node, v4 } of usages) {
		const rule = ctx.index.byV4.get(v4);
		if (!rule?.items) continue;
		for (const items of rule.items) {
			const attr = (node.attributes as Node[]).find((a) => (a.type === 'Attribute' || a.type === 'BindDirective') && a.name === items.prop);
			const expression = attr && (attr.type === 'BindDirective' ? attr.expression : attrExpression(attr));
			if (!attr || !expression) continue;
			const what = `(${[...(items.keys ?? []).map((k) => `${k.from} → ${k.to}`), ...(items.operators ? [`${items.operators.mode} and ${items.operators.advanced} → operators`] : []), ...(items.drop ?? []).map((d) => `${d} removed`)].join(', ')})${items.note ? `. ${items.note}` : ''}`;
			const id = `${v4}/items/${items.prop}`;
			const done = editItems(ctx, expression, items, id, declarations, seen);
			const prop = expression.type === 'Identifier' && props.has(expression.name) ? expression.name : undefined;
			const nobodyPasses = done && declarations.has(prop ?? '') && ctx.passed !== null && !ctx.passed?.has(prop!);
			if (prop && !reported.has(prop) && !nobodyPasses) {
				reported.add(prop);
				skip(ctx, attr.start, {
					kind: 'item-keys',
					id,
					name: items.prop,
					reason: `\`${prop}\` is a prop of this component${done && declarations.has(prop) ? ' (its default was converted)' : ''}: rename the keys where the users of this component pass it ${what}`
				});
			} else if (!done && !prop) skip(ctx, attr.start, { kind: 'item-keys', id, name: items.prop, reason: `the items are built elsewhere: rename their keys by hand ${what}` });
		}
	}
}

function memberRename(rule: ComponentMigration, name: string) {
	const to =
		rule.props?.renamed?.find((r) => r.from === name)?.to ??
		rule.props?.inverted?.find((r) => r.from === name)?.to ??
		rule.snippets?.renamed?.find((r) => r.from === name)?.to ??
		rule.events?.changed?.find((r) => r.name === name)?.to;
	return to && to !== name && !to.includes(':') ? to : undefined;
}

function retypeMembers(ctx: Context, ast: Node, scope: Map<string, string>) {
	const rename = (rules: ComponentMigration[], at: number, name: string) => {
		const targets = new Set(rules.map((rule) => memberRename(rule, name)));
		const to = targets.size === 1 ? [...targets][0] : undefined;
		if (to && ctx.edit.replace(at, at + name.length, to))
			changed(ctx, at, { kind: 'type-member', id: `${rules[0].from}/types/${name}`, name, to, check: false });
	};
	const before = (pos: number, size: number) => ctx.text.slice(Math.max(0, pos - size), pos);
	const found = new Map<Node, ComponentMigration[]>();
	visit(ast, (node) => {
		const query = node.type === 'TSTypeQuery' && node.exprName?.type === 'Identifier';
		const reference = node.type === 'TSTypeReference' && node.typeName?.type === 'Identifier';
		if ((!query && !reference) || !/\bComponentProps\s*<\s*$/.test(before(node.start, 40))) return;
		const local = (query ? node.exprName.name : node.typeName.name) as string;
		const name = scope.get(local);
		if (!name) return;
		const own = ctx.index.byV4.get(name);
		const to = own?.to ?? (ctx.index.rules.v5.components[name] ? name : undefined);
		if (!to) return;
		const rules = own ? [own] : ctx.index.rules.components.filter((rule) => rule.to === to && !('files' in rule));
		if (reference && ctx.edit.insert(node.start, 'typeof '))
			changed(ctx, node.start, { kind: 'type-typeof', id: `${rules[0]?.from ?? to}/types/typeof`, name: local, to: `typeof ${local}`, check: false });
		const args = (node.typeArguments?.params ?? []) as Node[];
		const max = ctx.index.rules.v5.components[to]?.generics;
		if (max !== undefined && args.length > max) {
			const [start, end] = max === 0 ? [node.typeArguments.start, node.typeArguments.end] : [args[max - 1].end, args[args.length - 1].end];
			if (ctx.edit.replace(start, end, ''))
				changed(ctx, start, { kind: 'type-arguments', id: `${rules[0]?.from ?? to}/types/generics`, name: source(ctx, node.typeArguments), to: max ? `${max} type argument${max > 1 ? 's' : ''}` : 'none', note: `${to} takes ${max} type argument${max === 1 ? '' : 's'} in v5.`, check: false });
		}
		if (!rules.length) return;
		found.set(node, rules);
		const after = ctx.text.slice(node.end);
		const member = /^\s*>\s*\[\s*(['"])(\w+)\1\s*\]/.exec(after);
		if (member) {
			rename(rules, node.end + member.index + member[0].lastIndexOf(member[2]), member[2]);
			return;
		}
		if (!/\b(?:Omit|Pick)\s*<\s*ComponentProps\s*<\s*$/.test(before(node.start, 60))) return;
		const keys = /^\s*>\s*,\s*((?:(['"])\w+\2\s*\|?\s*)+)>/.exec(after);
		if (!keys) return;
		const start = node.end + keys[0].indexOf(keys[1]);
		for (const key of keys[1].matchAll(/(['"])(\w+)\1/g)) rename(rules, start + key.index + 1, key[2]);
	});
	const aliases = new Map<string, ComponentMigration[]>();
	visit(ast, (node) => {
		const type = node.type === 'TSTypeAliasDeclaration' ? node.typeAnnotation : undefined;
		const rules = type?.type === 'TSTypeReference' && type.typeName?.name === 'ComponentProps' ? found.get(type.typeArguments?.params?.[0]) : undefined;
		if (rules) aliases.set(node.id.name, rules);
	});
	if (!aliases.size) return;
	const aliasOf = (n: Node | undefined) => (n?.type === 'TSTypeReference' && n.typeName?.type === 'Identifier' && !n.typeArguments ? aliases.get(n.typeName.name) : undefined);
	const literals = (n: Node | undefined): Node[] =>
		n?.type === 'TSLiteralType' && typeof n.literal.value === 'string' ? [n.literal] : n?.type === 'TSUnionType' ? (n.types as Node[]).flatMap(literals) : [];
	visit(ast, (node) => {
		const [target, keys] = node.type === 'TSIndexedAccessType' ? [node.objectType, node.indexType] : node.type === 'TSTypeReference' && /^(Omit|Pick)$/.test(node.typeName?.name ?? '') ? (node.typeArguments?.params ?? []) : [];
		const rules = aliasOf(target);
		if (rules) for (const literal of literals(keys)) rename(rules, literal.start + 1, literal.value);
	});
}

function transformCalls(ctx: Context, roots: unknown[], names: Map<string, LocalMigration>) {
	if (!names.size) return;
	for (const root of roots)
		visit(root, (node) => {
			if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') return;
			const rule = names.get(node.callee.name);
			if (!rule?.calls) return;
			const calls = rule.calls;
			const id = `${rule.from}/calls`;
			const arg = (node.arguments as Node[])[0];
			if (!calls.unwrap) {
				if (arg?.type === 'ObjectExpression') editObject(ctx, arg, calls, '', id);
				return;
			}
			if (arg?.type === 'Literal' && typeof arg.value === 'string') return;
			const inner = arg?.type === 'ObjectExpression' ? (arg.properties as Node[]).find((p) => keyName(p) === calls.unwrap) : undefined;
			if (!arg || !inner || inner.value.type !== 'ObjectExpression' || (arg.properties as Node[]).length !== 1) {
				skip(ctx, node.start, {
					kind: 'call-unwrap',
					id,
					name: node.callee.name,
					reason: `the argument is not \`{ ${calls.unwrap}: { ... } }\`: pass the options directly by hand (${calls.note ?? ''})`
				});
				return false;
			}
			const object = inner.value as Node;
			if (ctx.edit.replace(arg.start, object.start, '') && ctx.edit.replace(object.end, arg.end, ''))
				changed(ctx, node.start, { kind: 'call-unwrapped', id, name: `${node.callee.name}({ ${calls.unwrap} })`, to: `${node.callee.name}({ ... })`, check: false });
			editObject(ctx, object, calls, '', id);
			const indent = (pos: number) => /^[ \t]*/.exec(ctx.text.slice(ctx.text.lastIndexOf('\n', pos - 1) + 1))![0];
			const outer = indent(arg.start);
			const own = indent(inner.start);
			if (own.length > outer.length && own.startsWith(outer)) {
				const delta = own.slice(outer.length);
				for (let p = ctx.text.indexOf('\n', object.start); p !== -1 && p < object.end; p = ctx.text.indexOf('\n', p + 1))
					if (ctx.text.startsWith(delta, p + 1)) ctx.edit.replace(p + 1, p + 1 + delta.length, '');
			}
			return false;
		});
}

function transformCallResults(ctx: Context, roots: unknown[], names: Map<string, LocalMigration>) {
	const call = (node: Node | undefined) => {
		const e = node?.type === 'AwaitExpression' ? node.argument : node;
		return e?.type === 'CallExpression' && e.callee.type === 'Identifier' ? names.get(e.callee.name)?.calls?.result : undefined;
	};
	const holders = new Map<string, string>();
	for (const root of roots)
		visit(root, (node) => {
			if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && call(node.init)) holders.set(node.id.name, call(node.init)!);
			if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier' && call(node.right)) holders.set(node.left.name, call(node.right)!);
		});
	for (const root of roots)
		visit(root, (node) => {
			if (node.type !== 'MemberExpression' || node.computed) return;
			const member = call(node.object) ?? (node.object.type === 'Identifier' ? holders.get(node.object.name) : undefined);
			if (!member || node.property.name !== member) return;
			if (ctx.edit.replace(node.object.end, node.end, ''))
				changed(ctx, node.start, { kind: 'call-result', id: `calls/result/${member}`, name: `${source(ctx, node.object).slice(0, 40)}.${member}`, to: 'the returned value', check: false });
		});
}

function libraryTarget(programs: Node[]): Node | undefined {
	for (const program of programs)
		for (const statement of program.body as Node[])
			if (
				statement.type === 'ImportDeclaration' &&
				statement.source.value === LIB &&
				statement.importKind !== 'type' &&
				statement.specifiers.length &&
				(statement.specifiers as Node[]).every((spec) => spec.type === 'ImportSpecifier')
			)
				return statement;
	return undefined;
}

function removeStatement(ctx: Context, node: Node) {
	let start = node.start;
	while (start > 0 && (ctx.text[start - 1] === ' ' || ctx.text[start - 1] === '\t')) start--;
	let end = node.end;
	if (ctx.text[start - 1] === '\n' && (ctx.text[end] === '\n' || end === ctx.text.length)) start--;
	else if (ctx.text[end] === '\n') end++;
	return ctx.edit.replace(start, end, '');
}

const isShorthand = (ctx: Context, attr: Node) =>
	attr.type === 'BindDirective' ? !ctx.text.slice(attr.start, attr.end).includes('=') : ctx.text[attr.start] === '{';

const source = (ctx: Context, node: Node) => ctx.text.slice(node.start, node.end);

function removeAttr(ctx: Context, attr: Node) {
	let start = attr.start;
	while (start > 0 && (ctx.text[start - 1] === ' ' || ctx.text[start - 1] === '\t')) start--;
	let end = attr.end;
	if (ctx.text[start - 1] === '\n') {
		while (end < ctx.text.length && (ctx.text[end] === ' ' || ctx.text[end] === '\t')) end++;
		if (ctx.text[end] === '\n') {
			start--;
		} else end = attr.end;
	}
	return ctx.edit.replace(start, end, '');
}

function renameAttr(ctx: Context, attr: Node, to: string, api: ComponentApi | undefined): boolean {
	if (attr.type === 'BindDirective') {
		const bindable = !api || api.bindable.includes(to) || !api.props.includes(to);
		if (!bindable) {
			if (attr.expression.type === 'SequenceExpression') return false;
			return ctx.edit.replace(attr.start, attr.end, `${to}={${source(ctx, attr.expression)}}`);
		}
		if (isShorthand(ctx, attr)) return ctx.edit.replace(attr.start, attr.end, `bind:${to}={${attr.name}}`);
		return ctx.edit.replace(attr.start + 5, attr.start + 5 + attr.name.length, to);
	}
	if (isShorthand(ctx, attr)) return ctx.edit.replace(attr.start, attr.end, `${to}={${attr.name}}`);
	return ctx.edit.replace(attr.start, attr.start + attr.name.length, to);
}

function balanced(value: string) {
	const open = (value.match(/\(/g) ?? []).length;
	const close = (value.match(/\)/g) ?? []).length;
	return /^[a-z-]+\(/.test(value.trim()) && open > close ? value + ')'.repeat(open - close) : value;
}

function negate(ctx: Context, expression: Node) {
	if (expression.type === 'UnaryExpression' && expression.operator === '!') return source(ctx, expression.argument);
	const text = source(ctx, expression);
	return ['Identifier', 'MemberExpression', 'CallExpression'].includes(expression.type) ? `!${text}` : `!(${text})`;
}

function quotedRange(ctx: Context, attr: Node): [number, number] {
	const parts = attr.value as Node[];
	const start = parts[0].start;
	const end = parts[parts.length - 1].end;
	const quote = ctx.text[start - 1];
	return quote === '"' || quote === "'" ? [start - 1, end + 1] : [start, end];
}

function writeValue(value: string) {
	if (value === 'true') return '';
	if (value === 'false' || /^\{.*\}$/.test(value) || /^-?\d+(\.\d+)?$/.test(value)) return `={${value.replace(/^\{|\}$/g, '')}}`;
	return `="${value}"`;
}

function functionsByName(programs: Node[]) {
	const out = new Map<string, Node>();
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			const target = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
			if (!target) continue;
			if (target.type === 'FunctionDeclaration' && target.id) out.set(target.id.name, target);
			if (target.type === 'VariableDeclaration')
				for (const d of target.declarations as Node[])
					if (
						d.id.type === 'Identifier' &&
						(d.init?.type === 'ArrowFunctionExpression' || d.init?.type === 'FunctionExpression')
					)
						out.set(d.id.name, d.init);
		}
	return out;
}

function memberChain(parents: Map<Node, { parent: Node; key: string }>, ref: Node) {
	const nodes: Node[] = [];
	const path: string[] = [];
	let current = ref;
	for (;;) {
		const up = parents.get(current);
		if (!up || up.parent.type !== 'MemberExpression' || up.key !== 'object' || up.parent.computed) break;
		const property = up.parent.property;
		if (property.type !== 'Identifier') break;
		nodes.push(up.parent);
		path.push(property.name);
		current = up.parent;
	}
	return { nodes, path };
}

function resolvePath(mapping: Mapping, parts: string[]): string | null | undefined {
	for (let k = parts.length; k > 0; k--) {
		const value = mapping[parts.slice(0, k).join('.')];
		if (value === undefined) continue;
		if (value === null) return null;
		return [value, ...parts.slice(k)].filter(Boolean).join('.');
	}
	return undefined;
}

function handlerSignature(fn: Node, mapping: Mapping): string {
	const param = fn.params?.[0] as Node | undefined;
	if (!param) return '';
	const type = param.typeAnnotation?.typeAnnotation;
	const typed = type && (typeMember(type, 'detail') || customEventDetail(type)) ? JSON.stringify(mapping) : '';
	const paths: string[][] = [];
	if (param.type === 'Identifier') {
		const parents = new Map<Node, { parent: Node; key: string }>();
		visit(fn.body, (node, parent, key) => {
			if (parent) parents.set(node, { parent, key });
			if (node.type === 'Identifier' && node.name === param.name && isReference(node, parent, key))
				paths.push(memberChain(parents, node).path);
		});
	} else if (param.type === 'ObjectPattern') {
		for (const prop of param.properties as Node[]) {
			const key = prop.key?.name ?? prop.key?.value;
			paths.push([key]);
			if (prop.value?.type === 'ObjectPattern')
				for (const inner of prop.value.properties as Node[]) paths.push([key, inner.key?.name ?? inner.key?.value]);
		}
	}
	return `${typed}|${paths.map((p) => `${p.join('.')}=${resolvePath(mapping, p)}`).join(',')}`;
}

function rewriteRefs(
	ctx: Context,
	body: Node,
	name: string,
	prefix: string[],
	mapping: Mapping,
	report: (pos: number, reason: string) => void
) {
	const parents = new Map<Node, { parent: Node; key: string }>();
	const refs: Node[] = [];
	visit(body, (node, parent, key) => {
		if (parent) parents.set(node, { parent, key });
		if (node.type === 'Identifier' && node.name === name && isReference(node, parent, key)) refs.push(node);
	});
	let count = 0;
	for (const ref of refs) {
		const { nodes, path } = memberChain(parents, ref);
		const full = [...prefix, ...path];
		if (!full.length && mapping[''] !== undefined) {
			const whole = mapping[''];
			if (whole === null) report(ref.start, `\`${name}\` has no counterpart in v5`);
			else if (whole && ctx.edit.replace(ref.start, ref.end, `${name}.${whole}`)) count++;
			continue;
		}
		let k = full.length;
		while (k > 0 && mapping[full.slice(0, k).join('.')] === undefined) k--;
		if (k === 0) {
			if (!prefix.length && !path.length) report(ref.start, `\`${name}\` is passed on whole: the argument changed shape`);
			else if (full[0] === 'detail') report(ref.start, `\`${name}.${full.join('.')}\` has no counterpart`);
			continue;
		}
		const value = mapping[full.slice(0, k).join('.')];
		if (value === null) {
			report(ref.start, `\`${[name, ...path].join('.')}\` has no counterpart in v5`);
			continue;
		}
		const index = k - prefix.length - 1;
		if (index < 0) continue;
		const next = value ? `${name}.${value}` : name;
		if (next === ctx.text.slice(ref.start, nodes[index].end)) continue;
		if (ctx.edit.replace(ref.start, nodes[index].end, next)) count++;
	}
	return count;
}

function typeMember(type: Node | undefined, name: string): Node | undefined {
	if (type?.type !== 'TSTypeLiteral') return undefined;
	const member = (type.members as Node[]).find(
		(m) => m.type === 'TSPropertySignature' && (m.key.name ?? m.key.value) === name
	);
	return member?.typeAnnotation?.typeAnnotation;
}

function customEventDetail(type: Node | undefined): Node | undefined {
	if (type?.type !== 'TSTypeReference' || type.typeName?.name !== 'CustomEvent') return undefined;
	return (type.typeArguments ?? type.typeParameters)?.params?.[0];
}

function rewriteType(ctx: Context, annotation: Node | undefined, mapping: Mapping, ruleType?: string): boolean {
	const type: Node | undefined = annotation?.typeAnnotation;
	if (!type) return true;
	const holdsDetail = !!typeMember(type, 'detail') || !!customEventDetail(type);
	if (!holdsDetail) return true;
	const keys = Object.keys(mapping);
	const plain = ruleType && PLAIN_TYPE.test(ruleType) ? ruleType : undefined;
	const fallback = () => (plain ? ctx.edit.replace(type.start, type.end, plain) : false);
	const descend = (base: string) => {
		let target: Node | undefined = type;
		for (const [i, segment] of base.split('.').entries())
			target =
				i === 0 && segment === 'detail'
					? (typeMember(target, 'detail') ?? customEventDetail(target))
					: typeMember(target, segment);
		return target;
	};
	const bases = keys.filter((k) => mapping[k] === '').sort((a, b) => b.length - a.length);
	const base = bases.find((b) => descend(b));
	if (!base) return fallback();
	const segments = base.split('.');
	const target = descend(base)!;
	const ancestors = new Set(segments.map((_, i) => segments.slice(0, i + 1).join('.')));
	const renames: [Node, string][] = [];
	for (const key of keys) {
		const value = mapping[key];
		if (ancestors.has(key) || value === null || value === '') continue;
		const parts = key.split('.');
		const inside = key.startsWith(`${base}.`) && parts.length === segments.length + 1;
		if (!inside || !IDENTIFIER.test(value)) return fallback();
		if (value === parts[parts.length - 1]) continue;
		const member =
			target?.type === 'TSTypeLiteral'
				? (target.members as Node[]).find((m) => (m.key?.name ?? m.key?.value) === parts[parts.length - 1])
				: undefined;
		if (member) renames.push([member.key, value]);
	}
	if (!renames.length) return ctx.edit.replace(type.start, type.end, source(ctx, target));
	let text = source(ctx, target);
	for (const [key, value] of renames.sort((a, b) => b[0].start - a[0].start))
		text = text.slice(0, key.start - target.start) + value + text.slice(key.end - target.start);
	return ctx.edit.replace(type.start, type.end, text);
}

function rewritePattern(ctx: Context, param: Node, mapping: Mapping): { name: string; prefix: string[] } | string {
	const props = (param.properties as Node[]).filter((p) => p.type === 'Property');
	if (props.length !== 1 || (param.properties as Node[]).length !== 1) return 'destructures more than `detail`';
	const prop = props[0];
	if ((prop.key.name ?? prop.key.value) !== 'detail' || prop.computed) return 'does not destructure `detail`';
	const end = param.typeAnnotation ? param.typeAnnotation.start : param.end;
	const value = prop.value as Node;
	if (value.type === 'Identifier') {
		if (mapping.detail !== '') return '`detail` has no single counterpart';
		ctx.edit.replace(param.start, end, value.name);
		return { name: value.name, prefix: ['detail'] };
	}
	if (value.type !== 'ObjectPattern') return 'unsupported pattern';
	const inner = (value.properties as Node[]).map((p) => ({
		node: p,
		key: p.type === 'Property' ? (p.key.name ?? p.key.value) : undefined,
		local: p.type === 'Property' && p.value.type === 'Identifier' ? p.value.name : undefined
	}));
	if (inner.some((p) => !p.key || !p.local)) return 'unsupported pattern';
	const whole = inner.filter((p) => mapping[`detail.${p.key}`] === '');
	if (whole.length) {
		if (inner.length !== 1) return 'mixes the new argument with its fields';
		ctx.edit.replace(param.start, end, whole[0].local!);
		return { name: '', prefix: [] };
	}
	if (mapping.detail !== '') return '`detail` has no single counterpart';
	const parts: string[] = [];
	for (const p of inner) {
		const target = mapping[`detail.${p.key}`];
		if (target === null) return `\`detail.${p.key}\` has no counterpart in v5`;
		if (target === undefined || target === p.key) parts.push(source(ctx, p.node));
		else if (IDENTIFIER.test(target)) parts.push(`${target}: ${p.local}`);
		else return `\`detail.${p.key}\` moved to \`${target}\``;
	}
	ctx.edit.replace(param.start, end, `{ ${parts.join(', ')} }`);
	return { name: '', prefix: [] };
}

function rewriteFunction(
	ctx: Context,
	fn: Node,
	mapping: Mapping,
	ruleType: string | undefined,
	report: (pos: number, reason: string) => void
): number {
	const param = fn.params?.[0] as Node | undefined;
	if (!param) return 0;
	let count = 0;
	if (param.type === 'Identifier') {
		count += rewriteRefs(ctx, fn.body, param.name, [], mapping, report);
		const primitive = /^(string|number|boolean|any|unknown)$/.test(param.typeAnnotation ? source(ctx, param.typeAnnotation.typeAnnotation) : '');
		if (mapping[''] && primitive) {
			if (ctx.edit.replace(param.typeAnnotation.start, param.typeAnnotation.end, '')) count++;
		} else if (!rewriteType(ctx, param.typeAnnotation, mapping, ruleType)) report(param.start, 'the parameter type needs a by-hand update');
		else if (param.typeAnnotation) count++;
		return count;
	}
	if (param.type === 'ObjectPattern') {
		const result = rewritePattern(ctx, param, mapping);
		if (typeof result === 'string') {
			report(param.start, result);
			return 0;
		}
		count++;
		if (result.name) count += rewriteRefs(ctx, fn.body, result.name, result.prefix, mapping, report);
		if (!rewriteType(ctx, param.typeAnnotation, mapping, ruleType)) report(param.start, 'the parameter type needs a by-hand update');
		return count;
	}
	report(param.start, 'unsupported parameter');
	return 0;
}

interface HandlerUse {
	attr: Node;
	mapping: Mapping;
}

function hasDetail(ctx: Context, node: Node, mapping: Mapping = {}) {
	const text = source(ctx, node);
	if (mapping[''] !== undefined) return true;
	return [...new Set(['detail', ...Object.keys(mapping).filter(Boolean).map((key) => key.split('.')[0])])].some((head) => new RegExp(`\\b${head}\\b`).test(text));
}

function addAttr(ctx: Context, node: Node, text: string) {
	const attrs = node.attributes as Node[];
	if (!attrs.length) return ctx.edit.insert(node.start + 1 + node.name.length, ` ${text}`);
	const first = attrs[0];
	const last = attrs[attrs.length - 1];
	const multiline = /\n/.test(ctx.text.slice(node.start, first.start)) || /\n/.test(ctx.text.slice(first.end, last.start));
	if (!multiline) return ctx.edit.insert(last.end, ` ${text}`);
	const lineStart = ctx.text.lastIndexOf('\n', last.start) + 1;
	const indent = /^[ \t]*/.exec(ctx.text.slice(lineStart))![0];
	return ctx.edit.insert(last.end, `\n${indent}${text}`);
}

function triggered(node: Node, present: Map<string, Node>, when: ManualTrigger | undefined) {
	if (!when) return undefined;
	const snippets = new Set(((node.fragment?.nodes ?? []) as Node[]).filter((c) => c.type === 'SnippetBlock').map((c) => c.expression.name as string));
	return (
		[...(when.props ?? []), ...(when.events ?? []), ...(when.cssVars ?? [])].find((n) => present.has(n)) ??
		when.snippets?.find((n) => snippets.has(n) || present.has(n))
	);
}

function parentRouteAttr(ctx: Context, route: ParentRoute | undefined, present: Map<string, Node>) {
	if (!route || ctx.parent === undefined || present.has(route.to) || route.unless?.some((name) => present.has(name))) return undefined;
	const attr = present.get(route.from);
	if (!attr || attr.type !== 'Attribute') return undefined;
	const expression = attrExpression(attr);
	return attr.value === true || (expression?.type === 'Literal' && expression.value === true) ? attr : undefined;
}

function transformUsage(
	ctx: Context,
	node: Node,
	v4: string,
	rule: ComponentMigration,
	api: ComponentApi | undefined,
	functions: Map<string, Node>,
	handlerUses: Map<string, HandlerUse[]>,
	done: Set<Node>
) {
	const attrs = node.attributes as Node[];
	const present = new Map(attrs.map((a) => [a.name as string, a]));
	const id = (path: string) => `${v4}/${path}`;
	const p = rule.props ?? {};

	const routed = parentRouteAttr(ctx, p.parentRoute, present);
	if (routed && p.parentRoute && ctx.edit.replace(routed.start, routed.end, `${p.parentRoute.to}="${ctx.parent}"`)) {
		present.set(p.parentRoute.to, routed);
		changed(ctx, routed.start, {
			kind: 'prop-parent-route',
			id: id(`props.parentRoute/${p.parentRoute.from}`),
			name: p.parentRoute.from,
			to: `${p.parentRoute.to}="${ctx.parent}"`,
			note: p.parentRoute.note,
			check: true
		});
	}

	const unwrapped = (p.unwrap ?? []).map((u) => unwrapProp(ctx, node, u, id)).every(Boolean);
	for (const c of p.collect ?? []) collectProps(ctx, node, c, present, id);
	for (const u of p.unpack ?? []) unpackProp(ctx, node, u, p.values, present, id);
	if (p.childIcon) childIconProp(ctx, node, p.childIcon, present, id);

	for (const attr of attrs) {
		if (attr === routed) continue;
		if (attr.type === 'Attribute' && attr.name.startsWith('--')) continue;

		const closing = attr.type === 'Attribute' ? rule.events?.removed?.find((e) => e.name === attr.name && e.closes) : undefined;
		if (closing) {
			dropClosingHandler(ctx, node, attr, closing, id(`events.removed/${attr.name}`));
			continue;
		}

		if (attr.type === 'Attribute' && (/^on[a-z]/.test(attr.name) || rule.events?.changed?.some((e) => e.name === attr.name))) {
			transformEvent(ctx, attr, v4, rule, present, functions, handlerUses, done);
			continue;
		}

		if (attr.type === 'OnDirective') {
			const key = `on:${attr.name}`;
			const ev = rule.events?.changed?.find((e) => e.name === key && e.to);
			if (!ev) continue;
			if ((attr.modifiers as string[] | undefined)?.length || !attr.expression)
				skip(ctx, attr.start, {
					kind: 'event-renamed',
					id: id(`events.changed/${key}`),
					name: key,
					reason: `${attr.expression ? 'event modifiers' : 'a forwarded event'}: rewrite it as \`${ev.to}={...}\` by hand`
				});
			else transformEvent(ctx, attr, v4, rule, present, functions, handlerUses, done, key);
			continue;
		}

		if (attr.type !== 'Attribute' && attr.type !== 'BindDirective') continue;
		const name = attr.name as string;

		const snippet = rule.snippets?.renamed?.find((x) => x.from === name);
		if (snippet && attr.type === 'Attribute') {
			if (!present.has(snippet.to) && renameAttr(ctx, attr, snippet.to, api)) {
				present.set(snippet.to, attr);
				changed(ctx, attr.start, { kind: 'snippet-renamed', id: id(`snippets.renamed/${name}`), name, to: snippet.to, note: snippet.note, check: !!snippet.note });
			}
			continue;
		}

		if (attr.type === 'BindDirective' && api && api.props.includes(name) && !api.bindable.includes(name) && !p.renamed?.some((x) => x.from === name)) {
			if (attr.expression.type !== 'SequenceExpression' && ctx.edit.replace(attr.start, attr.end, `${name}={${source(ctx, attr.expression)}}`))
				changed(ctx, attr.start, {
					kind: 'bind-one-way',
					id: id(`props.bind-one-way/${name}`),
					name: `bind:${name}`,
					to: name,
					note: `\`${name}\` is not bindable in v5: the component never changes it, so the value only flows into it.`,
					check: true
				});
			continue;
		}

		const bound = p.bind?.find((x) => x.name === name);
		if (bound && attr.type === 'Attribute') {
			const expression = attrExpression(attr);
			if (expression?.type === 'Identifier' && ctx.lets.has(expression.name)) {
				const next = isShorthand(ctx, attr) || expression.name === name ? `bind:${name}` : `bind:${name}={${expression.name}}`;
				if (ctx.edit.replace(attr.start, attr.end, next))
					changed(ctx, attr.start, { kind: 'prop-bound', id: id(`props.bind/${name}`), name, to: `bind:${name}`, note: bound.note, check: false });
			} else if (expression)
				skip(ctx, attr.start, { kind: 'prop-bound', id: id(`props.bind/${name}`), name, reason: `pass a variable with \`bind:${name}\`: ${bound.note}` });
			continue;
		}

		const toObject = p.toObject?.find((x) => x.name === name);
		if (toObject && attr.type === 'Attribute') {
			const value = stringValue(ctx, attr);
			if (value !== undefined && ctx.edit.replace(attr.start, attr.end, `${name}={{ ${toObject.key}: ${value} }}`))
				changed(ctx, attr.start, { kind: 'prop-to-object', id: id(`props.toObject/${name}`), name, to: `${name}.${toObject.key}`, note: toObject.note, check: !!toObject.note });
			continue;
		}

		const removed = p.removed?.find((x) => x.name === name);
		if (removed?.drop) {
			if (removeAttr(ctx, attr))
				changed(ctx, attr.start, { kind: 'prop-removed', id: id(`props.removed/${name}`), name, to: removed.replacement, note: removed.note, check: true });
			continue;
		}

		const renamed = p.renamed?.find((x) => x.from === name);
		if (renamed) {
			const to = renamed.to;
			if (present.has(to)) {
				skip(ctx, attr.start, { kind: 'prop-renamed', id: id(`props.renamed/${name}`), name, reason: `\`${to}\` is already set` });
				continue;
			}
			const values = p.values?.find((x) => x.name === to);
			const literal = attrExpression(attr);
			const text =
				attr.value === true
					? 'true'
					: literal?.type === 'Literal' && typeof literal.value === 'boolean'
						? String(literal.value)
						: attrText(attr);
			if (values && text !== undefined && text in values.values) {
				if (ctx.edit.replace(attr.start, attr.end, `${to}${writeValue(values.values[text])}`)) {
					present.set(to, attr);
					changed(ctx, attr.start, { kind: 'prop-renamed', id: id(`props.renamed/${name}`), name, to, note: renamed.note, check: !!renamed.note });
				}
				continue;
			}
			if (renameAttr(ctx, attr, to, api)) {
				present.set(to, attr);
				changed(ctx, attr.start, { kind: 'prop-renamed', id: id(`props.renamed/${name}`), name, to, note: renamed.note, check: !!renamed.note });
				if (values && literal?.type === 'Literal' && typeof literal.value === 'string' && literal.value in values.values) {
					const next = values.values[literal.value];
					ctx.edit.replace(literal.start, literal.end, next === 'true' || next === 'false' ? next : JSON.stringify(next));
				}
			}
			continue;
		}

		const inverted = p.inverted?.find((x) => x.from === name);
		if (inverted && attr.type === 'Attribute') {
			const to = inverted.to;
			if (present.has(to)) continue;
			const expression = attrExpression(attr);
			const text = attrText(attr);
			const boolean =
				attr.value === true
					? true
					: expression?.type === 'Literal' && typeof expression.value === 'boolean'
						? expression.value
						: text === 'true' || text === 'false'
							? text === 'true'
							: undefined;
			const fallback = api?.defaults[to];
			let ok: boolean;
			if (boolean !== undefined) {
				const next = !boolean;
				const drop = next ? fallback === 'true' : fallback === undefined || fallback === 'false';
				ok = drop ? removeAttr(ctx, attr) : ctx.edit.replace(attr.start, attr.end, next ? to : `${to}={false}`);
			} else if (expression && !isShorthand(ctx, attr)) {
				ok =
					ctx.edit.replace(attr.start, attr.start + name.length, to) &&
					ctx.edit.replace(expression.start, expression.end, negate(ctx, expression));
			} else if (expression) ok = ctx.edit.replace(attr.start, attr.end, `${to}={!${name}}`);
			else ok = false;
			if (ok) {
				present.set(to, attr);
				changed(ctx, attr.start, { kind: 'prop-inverted', id: id(`props.inverted/${name}`), name, to, note: inverted.note, check: !!inverted.note });
			}
			continue;
		}

		const css = p.toCssVar?.find((x) => x.name === name);
		if (css && attr.type === 'Attribute') {
			const raw = attrText(attr);
			const expression = attrExpression(attr);
			if (present.has(css.cssVar)) continue;
			const text = raw !== undefined ? balanced(raw) : undefined;
			const next =
				text !== undefined
					? `${css.cssVar}="${text}"`
					: expression && attr.value !== true && !isShorthand(ctx, attr)
						? `${css.cssVar}={${source(ctx, expression)}}`
						: expression && isShorthand(ctx, attr)
							? `${css.cssVar}={${name}}`
							: undefined;
			if (!next) continue;
			if (ctx.edit.replace(attr.start, attr.end, next)) {
				present.set(css.cssVar, attr);
				changed(ctx, attr.start, { kind: 'prop-to-css-var', id: id(`props.toCssVar/${name}`), name, to: css.cssVar, note: css.note, check: !!css.note });
			}
		}
	}

	for (const child of (node.fragment?.nodes ?? []) as Node[]) {
		if (child.type !== 'SnippetBlock') continue;
		const name = child.expression.name as string;
		const r = rule.snippets?.renamed?.find((x) => x.from === name);
		if (!r || present.has(r.to)) continue;
		if (ctx.edit.replace(child.expression.start, child.expression.end, r.to)) {
			present.set(r.to, child);
			changed(ctx, child.start, { kind: 'snippet-renamed', id: id(`snippets.renamed/${name}`), name, to: r.to, note: r.note, check: !!r.note });
		}
	}

	for (const child of (node.fragment?.nodes ?? []) as Node[]) {
		if (child.type !== 'SnippetBlock') continue;
		const name = child.expression.name as string;
		const v5 = rule.snippets?.renamed?.find((x) => x.from === name)?.to ?? name;
		const change = rule.snippets?.parameters?.find((x) => x.name === v5 && x.params);
		if (change) rewriteSnippetParams(ctx, child, change, unwrapped, id(`snippets.parameters/${v5}`));
	}

	const spread = attrs.some((a) => a.type === 'SpreadAttribute');
	for (const r of p.defaults ?? []) {
		if (!r.keepV4 || present.has(r.name)) continue;
		if (!r.behaviour) {
			const kind = /^locale=/.test(r.keepV4) ? 'language' : 'look';
			ctx.defaults.push({ file: ctx.rel, line: lineOf(ctx, node.start), component: v4, name: r.name, v4: r.v4, v5: r.v5, kind, note: r.note });
			continue;
		}
		const reason = spread
			? `\`${r.keepV4}\` keeps the v4 behaviour: add it unless the spread already passes \`${r.name}\``
			: triggered(node, present, r.unless)
				? `\`${r.keepV4}\` not added because of \`${triggered(node, present, r.unless)}\`: ${r.note ?? ''}`
				: undefined;
		if (reason) {
			skip(ctx, node.start, { kind: 'prop-default', id: id(`props.defaults/${r.name}`), name: r.name, reason });
			continue;
		}
		if (addAttr(ctx, node, r.keepV4)) {
			present.set(r.name, node);
			changed(ctx, node.start, { kind: 'prop-default', id: id(`props.defaults/${r.name}`), name: r.name, to: r.keepV4, note: `v4 ${r.v4} → v5 ${r.v5}${r.note ? `. ${r.note}` : ''}`, check: false });
		}
	}
}

function collectProps(ctx: Context, node: Node, rule: Collect, present: Map<string, Node>, id: (path: string) => string) {
	const found = (node.attributes as Node[]).filter((a) => a.type === 'Attribute' && rule.props.some((p) => p.from === a.name));
	if (!found.length) return;
	const names = found.map((a) => a.name).join(', ');
	if (present.has(rule.into)) {
		skip(ctx, node.start, { kind: 'prop-collected', id: id(`props.collect/${rule.into}`), name: names, reason: `\`${rule.into}\` is already set: move ${names} into it by hand${rule.note ? ` (${rule.note})` : ''}` });
		return;
	}
	const entries = new Map<string, string>();
	for (const attr of found) {
		const key = rule.props.find((p) => p.from === attr.name)!.key;
		if (entries.has(key)) continue;
		const text = attrText(attr);
		const expression = attrExpression(attr);
		const value = attr.value === true ? 'true' : text !== undefined ? JSON.stringify(text) : expression ? source(ctx, expression) : undefined;
		if (value === undefined) return skip(ctx, attr.start, { kind: 'prop-collected', id: id(`props.collect/${rule.into}`), name: attr.name, reason: `move it into \`${rule.into}\` by hand` });
		entries.set(key, `${key}: ${value}`);
	}
	const [first, ...rest] = found;
	if (!ctx.edit.replace(first.start, first.end, `${rule.into}={{ ${[...entries.values()].join(', ')} }}`)) return;
	for (const attr of rest) removeAttr(ctx, attr);
	present.set(rule.into, first);
	changed(ctx, first.start, { kind: 'prop-collected', id: id(`props.collect/${rule.into}`), name: names, to: rule.into, note: rule.note, check: false });
}

const stateArgument = (expression: Node): Node => {
	let e = expression;
	while (e.type === 'TSAsExpression' || e.type === 'TSSatisfiesExpression') e = e.expression;
	if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && /^\$(state|derived)$/.test(e.callee.name) && e.arguments[0]) return stateArgument(e.arguments[0]);
	return e;
};

function stripMap(ctx: Context, expression: Node, rule: Unwrap): string | undefined {
	if (expression.type !== 'CallExpression' || expression.callee.type !== 'MemberExpression' || expression.callee.computed || expression.callee.property.name !== 'map') return undefined;
	const fn = expression.arguments[0];
	if (expression.arguments.length !== 1 || !/^(Arrow)?FunctionExpression$/.test(fn?.type) || fn.params.length !== 1 || fn.params[0].type !== 'Identifier') return undefined;
	const param = fn.params[0].name as string;
	const body = fn.body.type === 'BlockStatement' ? (fn.body.body.length === 1 && fn.body.body[0].type === 'ReturnStatement' ? fn.body.body[0].argument : undefined) : fn.body;
	if (body?.type !== 'ObjectExpression') return undefined;
	let found = false;
	for (const p of body.properties as Node[]) {
		const key = keyName(p);
		const value = p.value as Node | undefined;
		if (key === rule.key) {
			const same =
				(value?.type === 'Identifier' && value.name === param) ||
				(value?.type === 'ObjectExpression' && value.properties.length === 1 && value.properties[0].type === 'SpreadElement' && value.properties[0].argument.type === 'Identifier' && value.properties[0].argument.name === param);
			if (!same) return undefined;
			found = true;
		} else if (!key || !rule.empty.includes(key) || !((value?.type === 'ArrayExpression' && !value.elements.length) || (value?.type === 'Identifier' && value.name === 'undefined'))) return undefined;
	}
	return found ? source(ctx, expression.callee.object) : undefined;
}

function unwrapProp(ctx: Context, node: Node, rule: Unwrap, id: (path: string) => string): boolean {
	const attr = (node.attributes as Node[]).find((a) => a.type === 'Attribute' && a.name === rule.prop);
	const expression = attr && attrExpression(attr);
	if (!attr || !expression) return false;
	const targets: Node[] = [];
	if (expression.type === 'Identifier') {
		const name = expression.name as string;
		visit(ctx.instance, (n) => {
			if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === name && n.init) targets.push(stateArgument(n.init));
			if (n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'Identifier' && n.left.name === name) targets.push(stateArgument(n.right));
		});
	} else targets.push(expression);
	const edits = targets.map((t) => (t.type === 'ArrayExpression' && !t.elements.length ? null : stripMap(ctx, t, rule)));
	if (!targets.length || edits.some((e) => e === undefined)) {
		skip(ctx, attr.start, { kind: 'prop-unwrapped', id: id(`props.unwrap/${rule.prop}`), name: rule.prop, reason: `pass the items themselves: ${rule.note ?? ''}`.trim() });
		return false;
	}
	targets.forEach((t, i) => {
		const text = edits[i];
		if (text != null && ctx.edit.replace(t.start, t.end, text))
			changed(ctx, t.start, { kind: 'prop-unwrapped', id: id(`props.unwrap/${rule.prop}`), name: rule.prop, to: text, check: false });
	});
	return true;
}

function snippetsThrough(ctx: Context, node: Node, through: PassThrough, rule: ComponentMigration) {
	const id = (path: string) => `${through.v4}/${path}`;
	const blocks = ((node.fragment?.nodes ?? []) as Node[]).filter((c) => c.type === 'SnippetBlock');
	const present = new Set<string>([...(node.attributes as Node[]).map((a) => a.name as string), ...blocks.map((c) => c.expression.name as string)]);
	const renamed = (name: string) => rule.snippets?.renamed?.find((x) => x.from === name);
	const rename = (pos: number, name: string, to: string, note: string | undefined, edit: () => boolean) => {
		if (present.has(to) || !edit()) return;
		present.add(to);
		changed(ctx, pos, { kind: 'snippet-renamed', id: id(`snippets.renamed/${name}`), name, to, note, check: !!note });
	};
	for (const attr of node.attributes as Node[]) {
		if (attr.type !== 'Attribute' || through.declared.has(attr.name)) continue;
		const r = renamed(attr.name);
		if (r) rename(attr.start, attr.name, r.to, r.note, () => renameAttr(ctx, attr, r.to, undefined));
	}
	for (const child of blocks) {
		const name = child.expression.name as string;
		const key = through.declared.has(name) ? through.snippets[name] : name;
		if (!key) continue;
		const r = renamed(key);
		if (r && !through.declared.has(name)) rename(child.start, name, r.to, r.note, () => ctx.edit.replace(child.expression.start, child.expression.end, r.to));
		const change = rule.snippets?.parameters?.find((x) => x.name === (r?.to ?? key) && x.params);
		if (change) rewriteSnippetParams(ctx, child, change, !rule.props?.unwrap?.length, id(`snippets.parameters/${change.name}`));
	}
}

function rewriteSnippetParams(ctx: Context, snippet: Node, change: SnippetChange, unwrapped: boolean, id: string) {
	const pattern = (snippet.parameters as Node[] | undefined)?.[0];
	if (!pattern) return;
	const fail = (reason: string) => skip(ctx, snippet.start, { kind: 'snippet-parameters', id, name: change.name, reason: `${reason}: v4 ${change.v4} → v5 ${change.v5}${change.note ? `. ${change.note}` : ''}` });
	if (pattern.type !== 'ObjectPattern') return fail('the parameter is not destructured: rename its members by hand');
	const locals = new Map<string, { property: Node; local: string }>();
	for (const property of pattern.properties as Node[]) {
		const key = keyName(property);
		const value = property.value?.type === 'AssignmentPattern' ? property.value.left : property.value;
		if (!key || value?.type !== 'Identifier') return fail('a rest or nested parameter');
		locals.set(key, { property, local: value.name });
	}
	const used = (name: string) => {
		let hit = false;
		visit(snippet.body, (n, parent) => {
			if (n.type === 'Identifier' && n.name === name && !(parent?.type === 'MemberExpression' && parent.property === n && !parent.computed) && !(parent?.type === 'Property' && parent.key === n && !parent.shorthand)) hit = true;
		});
		return hit;
	};
	const guards: HeaderGuards[] = [];
	for (const [key, { local }] of locals) {
		if (change.params![key] !== null || !used(local)) continue;
		const plan = headerGuards(ctx, snippet.body, local);
		if (!plan) return fail(`\`${key}\` is gone and the snippet uses it`);
		guards.push(plan);
	}
	const members = (change.members ?? []).filter((m) => locals.has(m.param));
	if (members.some((m) => m.to === null) && !unwrapped) return fail('the rows were not converted, so the members stay as they are');
	if (pattern.typeAnnotation) return fail('the parameter has a type: rename it by hand');
	const kept = (pattern.properties as Node[]).flatMap((property) => {
		const key = keyName(property)!;
		const to = change.params![key];
		if (to === null) return [];
		return [to !== undefined && to !== key ? `${to}: ${source(ctx, property.value)}` : source(ctx, property)];
	});
	if (!ctx.edit.replace(pattern.start, pattern.end, `{ ${kept.join(', ')} }`)) return;
	for (const plan of guards) for (const [start, end, text] of plan.edits) ctx.edit.replace(start, end, text);
	const header = guards.flatMap((g) => g.header);
	if (header.length)
		changed(ctx, snippet.start, {
			kind: 'snippet-parameters',
			id,
			name: change.name,
			note: `The v4 branch for the header cell (\`index\` -1) was removed with its content: ${header.map((h) => `\`${h.slice(0, 80)}\``).join(', ')}. The column header is drawn by the library now.`,
			check: true
		});
	for (const m of members) {
		const local = locals.get(m.param)!.local;
		visit(snippet.body, (n) => {
			if (n.type !== 'MemberExpression' || n.computed || n.object.type !== 'Identifier' || n.object.name !== local || n.property.name !== m.from) return;
			if (m.to === null) ctx.edit.replace(n.object.end, n.end, '');
			else ctx.edit.replace(n.property.start, n.property.end, m.to);
		});
	}
	changed(ctx, snippet.start, { kind: 'snippet-parameters', id, name: change.name, to: change.v5, note: change.note, check: false });
}

interface HeaderGuards {
	edits: [number, number, string][];
	header: string[];
}

function headerGuards(ctx: Context, body: Node, local: string): HeaderGuards | undefined {
	const isLocal = (n: Node) => n.type === 'Identifier' && n.name === local;
	const minusOne = (n: Node) =>
		(n.type === 'UnaryExpression' && n.operator === '-' && n.argument.type === 'Literal' && n.argument.value === 1) || (n.type === 'Literal' && n.value === -1);
	const zero = (n: Node) => n.type === 'Literal' && n.value === 0;
	const compare = (n: Node, ops: string[], flipped: string[], value: (n: Node) => boolean) =>
		n.type === 'BinaryExpression' &&
		((ops.includes(n.operator) && isLocal(n.left) && value(n.right)) || (flipped.includes(n.operator) && value(n.left) && isLocal(n.right)));
	const row = (n: Node) => compare(n, ['!==', '!=', '>'], ['!==', '!=', '<'], minusOne) || compare(n, ['>='], ['<='], zero);
	const headerCell = (n: Node) => compare(n, ['===', '=='], ['===', '=='], minusOne) || compare(n, ['<'], ['>'], zero);
	const and = (n: Node): Node[] => (n.type === 'LogicalExpression' && n.operator === '&&' ? [...and(n.left), ...and(n.right)] : [n]);
	const mentions = (n: Node) => {
		let hit = false;
		visit(n, (c) => {
			if (isLocal(c)) hit = true;
		});
		return hit;
	};
	const span = (fragment: Node | null | undefined) => {
		const nodes = ((fragment?.nodes ?? []) as Node[]).filter((c) => !(c.type === 'Text' && !c.data.trim()));
		return nodes.length ? ([nodes[0].start, nodes[nodes.length - 1].end] as const) : undefined;
	};
	const wrap = (n: Node) => (/^(LogicalExpression|ConditionalExpression|AssignmentExpression|SequenceExpression)$/.test(n.type) && n.operator !== '&&' ? `(${source(ctx, n)})` : source(ctx, n));
	const plan: HeaderGuards = { edits: [], header: [] };
	const covered: [number, number][] = [];
	let failed = false;
	visit(body, (n) => {
		if (failed || n.type !== 'IfBlock' || !mentions(n.test)) return;
		if (n.elseif) return void (failed = true);
		const alternate = n.alternate as Node | null;
		const elseIf = (alternate?.nodes as Node[] | undefined)?.find((c) => c.type === 'IfBlock' && c.elseif);
		const ops = and(n.test);
		if (ops.length === 1 && headerCell(ops[0])) {
			const cell = span(n.consequent);
			if (cell) plan.header.push(ctx.text.slice(cell[0], cell[1]).replace(/\s+/g, ' '));
			covered.push([n.start, elseIf ? elseIf.test.start : (span(alternate)?.[0] ?? n.end)]);
			if (elseIf) plan.edits.push([n.start, elseIf.test.start, '{#if ']);
			else {
				const kept = span(alternate);
				if (!kept) plan.edits.push([n.start, n.end, '']);
				else plan.edits.push([n.start, kept[0], ''], [kept[1], n.end, '']);
				if (kept) covered.push([kept[1], n.end]);
			}
			return false;
		}
		const guard = ops.filter(row);
		if (!guard.length || ops.some((op) => !guard.includes(op) && mentions(op))) return void (failed = true);
		for (const op of guard) covered.push([op.start, op.end]);
		const rest = ops.filter((op) => !guard.includes(op));
		if (rest.length) {
			plan.edits.push([n.test.start, n.test.end, rest.map(wrap).join(' && ')]);
			return;
		}
		if (elseIf) return void (failed = true);
		const kept = span(n.consequent);
		if (!kept) plan.edits.push([n.start, n.end, '']);
		else plan.edits.push([n.start, kept[0], ''], [kept[1], n.end, '']);
		const cell = span(alternate);
		if (cell) plan.header.push(ctx.text.slice(cell[0], cell[1]).replace(/\s+/g, ' '));
		if (alternate && kept) covered.push([kept[1], n.end]);
	});
	if (failed) return undefined;
	let outside = false;
	visit(body, (n, parent, key) => {
		if (isLocal(n) && isReference(n, parent, key) && !covered.some(([a, b]) => n.start >= a && n.end <= b)) outside = true;
	});
	return outside ? undefined : plan;
}

function dropClosingHandler(ctx: Context, node: Node, attr: Node, rule: Removal, id: string) {
	const bound = (node.attributes as Node[]).find((a) => a.type === 'BindDirective' && a.name === rule.closes);
	const variable = bound?.expression.type === 'Identifier' ? (bound.expression.name as string) : undefined;
	const fn = attrExpression(attr);
	const statements = !fn || !/^(Arrow)?FunctionExpression$/.test(fn.type) ? [] : fn.body.type === 'BlockStatement' ? (fn.body.body as Node[]) : [{ type: 'ExpressionStatement', expression: fn.body, start: fn.body.start, end: fn.body.end } as Node];
	const closes = (s: Node) =>
		s.type === 'ExpressionStatement' &&
		s.expression.type === 'AssignmentExpression' &&
		s.expression.operator === '=' &&
		s.expression.left.type === 'Identifier' &&
		s.expression.left.name === variable &&
		s.expression.right.type === 'Literal' &&
		s.expression.right.value === false;
	if (variable && statements.length === 1 && closes(statements[0])) {
		if (removeAttr(ctx, attr)) changed(ctx, attr.start, { kind: 'event-removed', id, name: attr.name, note: 'It only closed the menu, which now closes by itself.', check: false });
		return;
	}
	skip(ctx, attr.start, { kind: 'event-removed', id, name: attr.name, reason: rule.note });
}

function stringValue(ctx: Context, attr: Node): string | undefined {
	const text = attrText(attr);
	if (text !== undefined) return JSON.stringify(text);
	const expression = attrExpression(attr);
	if (expression) return /^(Object|Array)Expression$/.test(expression.type) ? undefined : source(ctx, expression);
	if (!Array.isArray(attr.value)) return undefined;
	const parts = (attr.value as Node[]).map((part) =>
		part.type === 'Text' ? (part.data as string).replace(/[`\\]|\$\{/g, (m) => `\\${m}`) : `\${${source(ctx, part.expression)}}`
	);
	return `\`${parts.join('')}\``;
}

function mapLiterals(ctx: Context, expression: Node, values: Record<string, string>): string | undefined {
	if (expression.type === 'Literal' && typeof expression.value === 'string') {
		const next = values[expression.value];
		return next === undefined ? undefined : quoted(ctx, expression, next);
	}
	if (expression.type === 'ConditionalExpression') {
		const consequent = mapLiterals(ctx, expression.consequent, values);
		const alternate = mapLiterals(ctx, expression.alternate, values);
		return consequent && alternate ? `${source(ctx, expression.test)} ? ${consequent} : ${alternate}` : undefined;
	}
	return undefined;
}

function unpackProp(ctx: Context, node: Node, rule: Unpack, values: ValueChange[] | undefined, present: Map<string, Node>, id: (path: string) => string) {
	const attr = (node.attributes as Node[]).find((a) => a.type === 'Attribute' && a.name === rule.from);
	const object = attr && attrExpression(attr);
	if (!attr) return;
	const fail = (reason: string) => skip(ctx, attr.start, { kind: 'prop-unpacked', id: id(`props.unpack/${rule.from}`), name: rule.from, reason: `${reason}${rule.note ? ` (${rule.note})` : ''}` });
	if (object?.type !== 'ObjectExpression') return fail(`not an object written here: move ${rule.keys.map((k) => `\`${k.key}\` → \`${k.to}\``).join(', ')} by hand`);
	const attrsOut: string[] = [];
	const kept: string[] = [];
	const moved: string[] = [];
	for (const property of object.properties as Node[]) {
		const key = keyName(property);
		const target = rule.keys.find((k) => k.key === key);
		if (!key || (!target && !rule.drop?.includes(key) && rule.others !== 'drop')) {
			kept.push(source(ctx, property));
			continue;
		}
		if (!target) {
			moved.push(`${key} removed`);
			continue;
		}
		if (present.has(target.to)) return fail(`\`${target.to}\` is already set: merge \`${rule.from}.${key}\` by hand`);
		const value = property.value as Node;
		const map = values?.find((v) => v.name === target.to)?.values;
		const css = target.to.startsWith('--');
		let text: string | undefined;
		if (map) {
			const mapped = mapLiterals(ctx, value, map);
			if (mapped === undefined) return fail(`\`${rule.from}.${key}\` is not a value of the list: convert it to \`${target.to}\` by hand`);
			text = value.type === 'Literal' ? `${target.to}=${mapped.replace(/^'(.*)'$/, '"$1"')}` : `${target.to}={${mapped}}`;
		} else if (css && value.type === 'Literal' && (typeof value.value === 'string' || typeof value.value === 'number'))
			text = `${target.to}="${String(value.value)}${typeof value.value === 'number' && value.value !== 0 ? 'px' : ''}"`;
		else text = !css && value.type === 'Identifier' && value.name === target.to ? `{${value.name}}` : `${target.to}={${source(ctx, value)}}`;
		attrsOut.push(text);
		moved.push(`${key} → ${target.to}`);
	}
	if (!moved.length) return;
	const out = [...attrsOut, ...(kept.length ? [`${rule.from}={{ ${kept.join(', ')} }}`] : [])];
	const done = out.length ? ctx.edit.replace(attr.start, attr.end, out.join(' ')) : removeAttr(ctx, attr);
	if (!done) return;
	for (const k of rule.keys) if (moved.some((m) => m.endsWith(`→ ${k.to}`))) present.set(k.to, attr);
	changed(ctx, attr.start, { kind: 'prop-unpacked', id: id(`props.unpack/${rule.from}`), name: rule.from, to: moved.join(', '), note: rule.note, check: moved.some((m) => m.endsWith(' removed')) });
}

function childIconProp(ctx: Context, node: Node, rule: ChildIcon, present: Map<string, Node>, id: (path: string) => string) {
	if (present.has(rule.to)) return;
	const nodes = (node.fragment?.nodes ?? []) as Node[];
	const children = nodes.filter((n) => !(n.type === 'Text' && !n.data.trim()));
	const child = children.length === 1 ? children[0] : undefined;
	if (child?.type !== 'Component' || ctx.scope?.get(child.name) !== 'Icon') return;
	const attrs = child.attributes as Node[];
	if (attrs.length !== 1 || attrs[0].type !== 'Attribute') return;
	const attr = attrs[0];
	const text = attrText(attr);
	const expression = attrExpression(attr);
	const value =
		attr.name === 'path'
			? expression
				? source(ctx, expression)
				: text !== undefined
					? JSON.stringify(text)
					: undefined
			: attr.name === 'name'
				? expression
					? source(ctx, expression)
					: text !== undefined
						? iconIdentifier(ctx, text, attr.start)
						: undefined
				: undefined;
	if (!value) return;
	const own = node.attributes as Node[];
	const at = own.length ? Math.max(...own.map((a) => a.end)) : node.start + 1 + node.name.length;
	if (!ctx.edit.replace(nodes[0].start, nodes[nodes.length - 1].end, '')) return;
	ctx.edit.insert(at, ` ${rule.to}={${value}}`);
	if (attr.name === 'name' && !expression) ctx.icons.add(value);
	present.set(rule.to, child);
	changed(ctx, child.start, { kind: 'child-icon', id: id('props.childIcon'), name: 'Icon', to: rule.to, note: rule.note, check: !!rule.note });
}

function eventMapping(ctx: Context, rule: ComponentMigration | undefined, name: string) {
	const ev = rule?.events?.changed?.find((e) => e.name === name);
	const mapping: Mapping = ev?.argument ?? ctx.index.rules.global.callbacks.argument;
	return { ev, mapping };
}

function eventToHref(ctx: Context, attr: Node, href: { prop: string; param: string }, functions: Map<string, Node>, id: string, name: string): boolean {
	const expression = attrExpression(attr);
	let fn: Node | undefined;
	let named: string | undefined;
	if (expression?.type === 'ArrowFunctionExpression' || expression?.type === 'FunctionExpression') fn = expression;
	else if (expression?.type === 'Identifier' && functions.has(expression.name) && ctx.references.get(expression.name) === 1) {
		fn = functions.get(expression.name);
		named = expression.name;
	}
	if (!fn || (fn.params as Node[]).length !== 1 || fn.params[0].type !== 'Identifier') return false;
	const param = fn.params[0].name as string;
	let body = fn.body as Node;
	if (body.type === 'BlockStatement') {
		if ((body.body as Node[]).length !== 1 || body.body[0].type !== 'ExpressionStatement') return false;
		body = body.body[0].expression;
	}
	if (body.type === 'AwaitExpression') body = body.argument;
	if (body.type !== 'CallExpression' || body.callee.type !== 'Identifier' || body.callee.name !== 'goto' || (body.arguments as Node[]).length !== 1) return false;
	const original = source(ctx, body.arguments[0]);
	if (/\brow\b/.test(original)) return false;
	const chain = href.param.split('.').map((part) => `\\??\\.${part}`).join('');
	const url = original.replace(new RegExp(`\\b${param}${chain}\\b`, 'g'), 'row');
	if (url === original || new RegExp(`\\b${param}\\b`).test(url)) return false;
	if (!ctx.edit.replace(attr.start, attr.end, `${href.prop}={(row) => ${url}}`)) return false;
	const statement = named ? ((ctx.instance?.body ?? []) as Node[]).find((s) => s.start <= fn.start && fn.end <= s.end) : undefined;
	if (statement && (statement.type === 'FunctionDeclaration' || (statement.type === 'VariableDeclaration' && (statement.declarations as Node[]).length === 1))) {
		let start = statement.start;
		while (start > 0 && /[ \t]/.test(ctx.text[start - 1])) start--;
		const end = ctx.text[statement.end] === '\n' ? statement.end + 1 : statement.end;
		ctx.edit.replace(start, end, '');
	}
	changed(ctx, attr.start, {
		kind: 'event-to-href',
		id,
		name,
		to: href.prop,
		note: `The handler only opened a page: the row is now a link (Ctrl-click and middle click open a new tab, SvelteKit preloads it)${named ? `, and \`${named}\` was deleted` : ''}.`,
		check: true
	});
	return true;
}

function transformEvent(
	ctx: Context,
	attr: Node,
	v4: string,
	rule: ComponentMigration | undefined,
	present: Map<string, Node>,
	functions: Map<string, Node>,
	handlerUses: Map<string, HandlerUse[]>,
	done: Set<Node>,
	key?: string
) {
	const name = key ?? (attr.name as string);
	if (rule?.events?.removed?.some((e) => e.name === name)) return;
	const { ev, mapping } = eventMapping(ctx, rule, name);
	if (ev?.href && attr.type === 'Attribute' && !present.has(ev.href.prop) && eventToHref(ctx, attr, ev.href, functions, `${v4}/events.changed/${name}`, name)) return;
	const expression = attrExpression(attr);
	const id = `${v4}/events.${ev ? 'changed' : 'argument'}/${name}`;
	const report = (pos: number, reason: string) => skip(ctx, pos, { kind: 'event-argument', id, name, reason });
	let rewritten = 0;
	if (expression && Object.keys(mapping).length) {
		if (expression.type === 'ArrowFunctionExpression' || expression.type === 'FunctionExpression') {
			if (hasDetail(ctx, expression, mapping)) rewritten = rewriteFunction(ctx, expression, mapping, ev?.type, report);
		} else if (expression.type === 'Identifier' && functions.has(expression.name)) {
			const fn = functions.get(expression.name)!;
			if (!done.has(fn) && hasDetail(ctx, fn, mapping)) {
				done.add(fn);
				const uses = handlerUses.get(expression.name) ?? [];
				const refs = ctx.references.get(expression.name) ?? 0;
				const signatures = new Set(uses.map((u) => handlerSignature(fn, u.mapping)));
				if (uses.length !== refs) report(fn.start, `\`${expression.name}\` is also used elsewhere: update it by hand`);
				else if (signatures.size > 1) report(fn.start, `\`${expression.name}\` handles callbacks with different arguments`);
				else rewritten = rewriteFunction(ctx, fn, mapping, ev?.type, report);
			}
		} else if (hasDetail(ctx, expression, mapping)) report(expression.start, 'handler is not a function: update it by hand');
	}
	if (rewritten)
		changed(ctx, attr.start, { kind: 'event-argument', id, name, note: ev?.note, check: !!ev?.note && !ev.to });
	if (ev?.to && ev.to !== name && !present.has(ev.to)) {
		if (ctx.edit.replace(attr.start, attr.start + name.length, ev.to)) {
			present.set(ev.to, attr);
			changed(ctx, attr.start, { kind: 'event-renamed', id: `${v4}/events.changed/${name}`, name, to: ev.to, note: ev.note, check: !!ev.note });
		}
	}
}

function collectReferenceCounts(roots: unknown[]) {
	const counts = new Map<string, number>();
	for (const root of roots)
		visit(root, (node, parent, key) => {
			if (node.type !== 'Identifier' || !isReference(node, parent, key)) return;
			if (parent?.type === 'FunctionDeclaration' && key === 'id') return;
			if (parent?.type === 'VariableDeclarator' && key === 'id') return;
			counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
		});
	return counts;
}

function iconLiterals(ctx: Context, roots: unknown[], libraryRanges: [number, number][]) {
	const inLibrary = (pos: number) => libraryRanges.some(([a, b]) => pos >= a && pos < b);
	const literalsOf = (root: unknown) =>
		visit(root, (node, parent, key) => {
			if (node.type === 'RegularElement' || node.type === 'SvelteElement') {
				for (const attr of node.attributes as Node[]) {
					if (attr.type === 'ClassDirective') continue;
					if (attr.type === 'Attribute' && attr.name === 'class') continue;
					literalsOf(attr);
				}
				literalsOf(node.fragment);
				return false;
			}
			if (node.type === 'Component' || node.type === 'SvelteComponent' || node.type === 'SvelteSelf') {
				for (const attr of node.attributes as Node[]) {
					if (attr.type === 'Attribute' && attr.name === 'class') continue;
					const text = attr.type === 'Attribute' ? attrText(attr) : undefined;
					if (text !== undefined && ICON.test(text)) {
						if (!ctx.convertDataIcons && !inLibrary(attr.start)) continue;
						const icon = iconIdentifier(ctx, text, attr.start);
						if (!icon) continue;
						const [start, end] = quotedRange(ctx, attr);
						if (ctx.edit.replace(start, end, `{${icon}}`)) {
							ctx.icons.add(icon);
							changed(ctx, attr.start, { kind: 'icon-literal', id: 'icons/transform', name: text, to: icon, check: false });
						}
						continue;
					}
					literalsOf(attr);
				}
				literalsOf(node.fragment);
				return false;
			}
			const literal =
				(node.type === 'Literal' && typeof node.value === 'string') ||
				(node.type === 'TemplateLiteral' && !(node.expressions as Node[]).length);
			if (!literal) return;
			const value = node.type === 'Literal' ? node.value : (node.quasis as Node[]).map((q) => q.value.cooked).join('');
			if (!ICON.test(value)) return;
			if (parent?.type === 'TSLiteralType' || parent?.type.startsWith('Import') || parent?.type.startsWith('Export')) return;
			if (parent?.type === 'Property' && key === 'key' && !parent.computed) return;
			if (!ctx.convertDataIcons && !inLibrary(node.start)) return;
			const icon = iconIdentifier(ctx, value, node.start);
			if (!icon) return;
			if (ctx.edit.replace(node.start, node.end, icon)) {
				ctx.icons.add(icon);
				changed(ctx, node.start, { kind: 'icon-literal', id: 'icons/transform', name: value, to: icon, check: false });
			}
			return false;
		});
	for (const root of roots) literalsOf(root);
}

function importIcons(ctx: Context, program: Node | undefined, scriptStart?: number) {
	if (!ctx.icons.size) return;
	const names = [...ctx.icons].sort();
	const body = (program?.body ?? []) as Node[];
	const existing = body.find((s) => s.type === 'ImportDeclaration' && s.source.value === MDI && (s.specifiers as Node[]).every((x) => x.type === 'ImportSpecifier'));
	if (existing) {
		const have = new Set((existing.specifiers as Node[]).map((s) => s.local.name));
		const missing = names.filter((n) => !have.has(n));
		const specifiers = existing.specifiers as Node[];
		if (missing.length && specifiers.length) ctx.edit.insert(specifiers[specifiers.length - 1].end, `, ${missing.join(', ')}`);
		return;
	}
	const imports = body.filter((s) => s.type === 'ImportDeclaration');
	const last = imports[imports.length - 1];
	const quote = last?.source.raw?.[0] ?? "'";
	const semi = last ? (ctx.text.slice(last.end - 1, last.end) === ';' ? ';' : '') : ';';
	const line = `import { ${names.join(', ')} } from ${quote}${MDI}${quote}${semi}`;
	if (last) {
		const lineStart = ctx.text.lastIndexOf('\n', last.start) + 1;
		const indent = /^[ \t]*/.exec(ctx.text.slice(lineStart))![0];
		ctx.edit.insert(last.end, `\n${indent}${line}`);
		return;
	}
	if (program && ctx.offset && program.start === ctx.offset) {
		ctx.edit.insert(ctx.offset, `${line}\n${ctx.text[ctx.offset] === '\n' ? '' : '\n'}`);
		return;
	}
	if (program) {
		const start = program.start;
		const newline = ctx.text[start] === '\n' ? 1 : 0;
		const first = body[0];
		const lineStart = first ? ctx.text.lastIndexOf('\n', first.start) + 1 : start + newline;
		const indent = first ? /^[ \t]*/.exec(ctx.text.slice(lineStart))![0] : '\t';
		ctx.edit.insert(start + newline, `${newline ? '' : '\n'}${indent}${line}\n`);
		return;
	}
	const at = scriptStart ?? 0;
	const lang = ctx.typescript ? ' lang="ts"' : '';
	ctx.edit.insert(at, `${at ? '\n\n' : ''}<script${lang}>\n\t${line}\n</script>${at ? '' : '\n\n'}`);
}

function declarationEnd(text: string, from: number, end: number): { value: [number, number]; end: number; semicolon: boolean } {
	let depth = 0;
	let i = from;
	for (; i < end; i++) {
		const c = text[i];
		if (c === '(') depth++;
		else if (c === ')') depth--;
		else if (depth <= 0 && (c === ';' || c === '}')) break;
	}
	const semicolon = text[i] === ';';
	return { value: [from, i], end: semicolon ? i + 1 : i, semicolon };
}

function removeDeclaration(ctx: Context, pos: number, end: number) {
	const lineStart = ctx.text.lastIndexOf('\n', pos - 1) + 1;
	const lineEnd = ctx.text.indexOf('\n', end);
	const alone = !ctx.text.slice(lineStart, pos).trim() && !ctx.text.slice(end, lineEnd === -1 ? ctx.text.length : lineEnd).trim();
	if (alone && lineEnd !== -1) return ctx.edit.replace(lineStart, lineEnd + 1, '');
	const after = /^[ \t]*/.exec(ctx.text.slice(end))![0].length;
	return ctx.edit.replace(pos, end + after, '');
}

function cssReason(ctx: Context, name: string): string {
	const rule = ctx.index.cssVars.get(name);
	if (rule?.kind === 'removed')
		return `not a v5 variable, so it has no effect: ${rule.note}${rule.replacement ? ` Instead: \`${rule.replacement}\`.` : ''} Remove it, or move the value there only if the Aurora look does not fit.`;
	return 'not a v5 variable and no rule maps it, so it has no effect: remove it, or move the value to the v5 variable of the same part (`component <Name>` lists them) only if the Aurora look does not fit.';
}

function renameCssText(ctx: Context, start: number, end: number) {
	const text = ctx.text.slice(start, end);
	const declarations = [...text.matchAll(/(?<![\w-])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => ({ name: m[1], at: m.index!, colon: m.index! + m[0].length }));
	const blockOf = (at: number) => {
		const open = Math.max(text.lastIndexOf('{', at), text.lastIndexOf('}', at));
		const close = text.indexOf('}', at);
		return [open + 1, close === -1 ? text.length : close];
	};
	for (const m of text.matchAll(/--[A-Za-z0-9_-]+/g)) {
		const name = m[0];
		const previous = text[m.index! - 1];
		if (previous && /[\w-]/.test(previous)) continue;
		const pos = start + m.index!;
		const declaration = declarations.find((d) => d.at === m.index);
		const rename = ctx.css.get(name);
		if (rename) {
			if (!ctx.edit.replace(pos, pos + name.length, rename.to)) continue;
			changed(ctx, pos, {
				kind: 'css-var-renamed',
				id: `${rename.component}/cssVars.renamed/${name}`,
				name,
				to: rename.to,
				note: rename.note,
				check: !!rename.note
			});
			if (!declaration || !rename.also?.length) continue;
			const [blockStart, blockEnd] = blockOf(m.index!);
			const inBlock = declarations.filter((d) => d.at >= blockStart && d.at < blockEnd && d !== declaration).map((d) => d.name);
			const targets = rename.also.filter(
				(target) =>
					!inBlock.some((other) => {
						const claim = ctx.css.get(other);
						return other === target || claim?.to === target || (!!claim?.also?.includes(target) && claim.also.length < rename.also!.length);
					})
			);
			if (!targets.length) continue;
			const decl = declarationEnd(text, declaration.colon, blockEnd);
			const raw = text.slice(...decl.value);
			const value = raw.trim();
			const lineStart = text.lastIndexOf('\n', m.index!) + 1;
			const indent = /^[ \t]*/.exec(text.slice(lineStart))![0];
			const glue = lineStart === 0 || text.slice(lineStart, m.index!).trim() ? ' ' : `\n${indent}`;
			const at = decl.semicolon ? decl.end : decl.value[0] + raw.trimEnd().length;
			ctx.edit.insert(start + at, `${decl.semicolon ? '' : ';'}${targets.map((t) => `${glue}${t}: ${value};`).join('')}`);
			continue;
		}
		if (!declaration || ctx.v5Vars.has(name) || name.startsWith('--global-')) continue;
		const drop = ctx.drops.get(name);
		if (drop) {
			const decl = declarationEnd(text, declaration.colon, blockOf(m.index!)[1]);
			if (removeDeclaration(ctx, pos, start + decl.end))
				changed(ctx, pos, { kind: 'css-var-removed', id: `${drop.component}/cssVars.removed/${name}`, name, note: drop.note, check: true });
			continue;
		}
		const listed = ctx.index.cssVars.get(name);
		if (listed?.kind === 'removed' || ctx.v4Prefixes.some((prefix) => name.startsWith(prefix)))
			skip(ctx, pos, {
				kind: 'css-var-unknown',
				id: listed ? `${listed.component}/cssVars.removed/${name}` : 'css/unknown',
				name,
				reason: cssReason(ctx, name)
			});
	}
}

interface StyleRename {
	to: string;
	id: string;
	note?: string;
	drop?: boolean;
	dropWhen?: { match: string; note: string };
	toProp?: Rename['toProp'];
}

const valueOf = (ctx: Context, attr: Node) =>
	attr.value === true ? '' : ctx.text.slice(attr.start + (attr.type === 'StyleDirective' ? 6 : 0) + attr.name.length, attr.end);

function sameAsDefault(ctx: Context, api: ComponentApi | undefined, name: string, attr: Node) {
	const prefix = api && `--${api.slug}-`;
	const library = api?.cssValues?.[name];
	const value = attr.type === 'Attribute' ? attrText(attr) : undefined;
	if (!prefix || !library || value === undefined || !name.startsWith(prefix) || !/-(?:min-|max-)?(?:width|height)$/.test(name)) return false;
	const normal = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();
	if (normal(value) !== normal(library)) return false;
	if (name.startsWith(`${prefix}default-`)) return (ctx.declared.get(name) ?? 0) <= 1;
	return !ctx.declared.get(`${prefix}default-${name.slice(prefix.length)}`);
}

function renameStyles(ctx: Context, node: Node, lookup: (name: string) => StyleRename | undefined, api?: ComponentApi) {
	const present = new Map<string, Node>();
	for (const attr of node.attributes as Node[])
		if ((attr.type === 'Attribute' || attr.type === 'StyleDirective') && attr.name.startsWith('--'))
			present.set(`${attr.type}:${attr.name}`, attr);
	for (const attr of node.attributes as Node[]) {
		if (attr.type === 'Attribute' && attr.name === 'style' && Array.isArray(attr.value)) {
			for (const part of attr.value as Node[]) if (part.type === 'Text') renameCssText(ctx, part.start, part.end);
			continue;
		}
		if ((attr.type !== 'Attribute' && attr.type !== 'StyleDirective') || !attr.name.startsWith('--')) continue;
		const rename = lookup(attr.name);
		const final = rename && !rename.drop ? rename.to : attr.name;
		if (!rename?.drop && sameAsDefault(ctx, api, final, attr)) {
			if (removeAttr(ctx, attr))
				changed(ctx, attr.start, {
					kind: 'css-var-removed',
					id: rename?.id ?? `${api!.slug}/cssVars.default/${final}`,
					name: attr.name,
					note: `Same value as the v5 default of \`${final}\`: removed.`,
					check: false
				});
			continue;
		}
		if (!rename) continue;
		const dropWhen = rename.dropWhen && new RegExp(rename.dropWhen.match).test(valueOf(ctx, attr)) ? rename.dropWhen : undefined;
		if (rename.drop || dropWhen) {
			if (removeAttr(ctx, attr)) changed(ctx, attr.start, { kind: 'css-var-removed', id: rename.id, name: attr.name, note: dropWhen?.note ?? rename.note, check: !!dropWhen });
			continue;
		}
		const at = attr.start + (attr.type === 'StyleDirective' ? 6 : 0);
		const other = present.get(`${attr.type}:${rename.to}`);
		const literal = attr.type === 'Attribute' ? attrText(attr)?.trim() : undefined;
		const toProp = rename.toProp;
		if (
			toProp &&
			(!other || other === attr) &&
			literal !== undefined &&
			literal in toProp.values &&
			api?.props.includes(toProp.prop) &&
			!(node.attributes as Node[]).some((a) => a.name === toProp.prop)
		) {
			const prop = toProp.values[literal];
			const done = prop === null ? removeAttr(ctx, attr) : ctx.edit.replace(attr.start, attr.end, `${toProp.prop}="${prop}"`);
			if (done) {
				present.set(`${attr.type}:${rename.to}`, attr);
				changed(ctx, attr.start, {
					kind: 'css-var-renamed',
					id: rename.id,
					name: attr.name,
					to: prop === null ? `${toProp.prop} (default)` : `${toProp.prop}="${prop}"`,
					check: false
				});
			}
			continue;
		}
		if (other && other !== attr) {
			if (valueOf(ctx, other) === valueOf(ctx, attr) && removeAttr(ctx, attr))
				changed(ctx, attr.start, { kind: 'css-var-renamed', id: rename.id, name: attr.name, to: rename.to, note: `Same value as \`${rename.to}\`, which is already set: removed.`, check: false });
			else skip(ctx, attr.start, { kind: 'css-var-renamed', id: rename.id, name: attr.name, reason: `\`${rename.to}\` is already set with another value: keep one` });
			continue;
		}
		if (ctx.edit.replace(at, at + attr.name.length, rename.to)) {
			present.set(`${attr.type}:${rename.to}`, attr);
			changed(ctx, attr.start, { kind: 'css-var-renamed', id: rename.id, name: attr.name, to: rename.to, note: rename.note, check: !!rename.note });
		}
	}
}

function transformSvelte(ctx: Context) {
	let ast: Node;
	try {
		ast = parse(ctx.text, { modern: true }) as unknown as Node;
	} catch (error) {
		return (error as Error).message.split('\n')[0];
	}
	const programs = [ast.instance?.content, ast.module?.content].filter(Boolean) as Node[];
	const roots = [ast.instance?.content, ast.module?.content, ast.fragment].filter(Boolean);
	ctx.references = collectReferenceCounts(roots);
	ctx.instance = ast.instance?.content;
	ctx.lets = new Set(
		((ast.instance?.content.body ?? []) as Node[])
			.filter((n) => n.type === 'VariableDeclaration' && n.kind === 'let')
			.flatMap((n) => (n.declarations as Node[]).map((d) => (d.id.type === 'Identifier' ? (d.id.name as string) : '')))
			.filter(Boolean)
	);
	transformCalls(ctx, roots, localCallNames(programs, ctx));
	transformCallResults(ctx, roots, localCallNames(programs, ctx));
	const scope = renameImports(roots, programs, ctx);
	ctx.scope = scope;
	const functions = functionsByName(ast.instance ? [ast.instance.content] : []);

	const usages: { node: Node; v4: string }[] = [];
	visit(ast.fragment, (node) => {
		if (node.type !== 'Component') return;
		const v4 = ctx.variants.get(node) ?? scope.get(node.name);
		if (v4) usages.push({ node, v4 });
	});

	const appImports = new Map<string, string>();
	for (const program of programs)
		for (const decl of program.body as Node[])
			if (decl.type === 'ImportDeclaration' && /\.svelte$/.test(decl.source.value))
				for (const spec of decl.specifiers as Node[]) if (spec.type === 'ImportDefaultSpecifier') appImports.set(spec.local.name, decl.source.value);
	const via: { node: Node; through: PassThrough; events: { attr: Node; key: string }[] }[] = [];
	visit(ast.fragment, (node) => {
		if (node.type !== 'Component' || scope.has(node.name)) return;
		const source = appImports.get(node.name);
		const through = source ? ctx.passThrough?.(source) : undefined;
		if (!through) return;
		const events = (node.attributes as Node[]).flatMap((attr) => {
			if (attr.type !== 'Attribute' || !/^on[a-z]/.test(attr.name)) return [];
			const key = through.declared.has(attr.name) ? through.forwarded[attr.name] : attr.name;
			return key ? [{ attr, key }] : [];
		});
		via.push({ node, through, events });
	});

	const handlerUses = new Map<string, HandlerUse[]>();
	for (const { through, events } of via)
		for (const { attr, key } of events) {
			const expression = attrExpression(attr);
			if (expression?.type !== 'Identifier') continue;
			const list = handlerUses.get(expression.name) ?? [];
			list.push({ attr, mapping: eventMapping(ctx, ctx.index.byV4.get(through.v4), key).mapping });
			handlerUses.set(expression.name, list);
		}
	for (const { node, v4 } of usages)
		for (const attr of node.attributes as Node[]) {
			const directive = attr.type === 'OnDirective';
			const listed = !!ctx.index.byV4.get(v4)?.events?.changed?.some((e) => e.name === attr.name);
			if (!directive && (attr.type !== 'Attribute' || (!/^on[a-z]/.test(attr.name) && !listed))) continue;
			const expression = attrExpression(attr);
			if (expression?.type !== 'Identifier') continue;
			const list = handlerUses.get(expression.name) ?? [];
			list.push({ attr, mapping: eventMapping(ctx, ctx.index.byV4.get(v4), directive ? `on:${attr.name}` : attr.name).mapping });
			handlerUses.set(expression.name, list);
		}

	for (const { v4 } of usages)
		if (ctx.index.byV4.get(v4) && 'files' in ctx.index.byV4.get(v4)!) ctx.localUsages.set(v4, (ctx.localUsages.get(v4) ?? 0) + 1);

	transformItems(ctx, usages, ast.instance?.content);
	retypeMembers(ctx, ast, scope);

	const done = new Set<Node>();
	for (const { node, through, events } of via) {
		const rule = ctx.index.byV4.get(through.v4);
		if (!rule) continue;
		const present = new Map((node.attributes as Node[]).map((a) => [a.name as string, a]));
		for (const { attr, key } of events) {
			const ev = rule.events?.changed?.find((e) => e.name === key);
			if (through.declared.has(attr.name)) for (const name of [ev?.to, ev?.href?.prop]) if (name) present.set(name, attr);
			transformEvent(ctx, attr, through.v4, rule, present, functions, handlerUses, done, key);
		}
		snippetsThrough(ctx, node, through, rule);
	}
	const libraryRanges: [number, number][] = [];
	for (const { node, v4 } of usages) {
		for (const attr of node.attributes as Node[]) libraryRanges.push([attr.start, attr.end]);
		const rule = ctx.index.byV4.get(v4);
		if (!rule) continue;
		transformUsage(ctx, node, v4, rule, ctx.index.rules.v5.components[rule.to], functions, handlerUses, done);
	}

	const global = (name: string): StyleRename | undefined => {
		const r = ctx.css.get(name);
		return r && { to: r.to, id: `${r.component}/cssVars.renamed/${name}`, note: r.note, toProp: r.toProp };
	};
	visit(ast.fragment, (node) => {
		if (!Array.isArray(node.attributes)) return;
		const v4 = node.type === 'Component' ? (ctx.variants.get(node) ?? scope.get(node.name)) : undefined;
		const rule = v4 ? ctx.index.byV4.get(v4) : undefined;
		renameStyles(ctx, node, (name) => {
			const own = rule?.cssVars?.renamed?.find((x) => x.from === name);
			const dropped = rule?.cssVars?.removed?.find((x) => x.name === name && x.drop);
			if (dropped) return { to: '', id: `${v4}/cssVars.removed/${name}`, note: dropped.note, drop: true };
			return own ? { to: own.to, id: `${v4}/cssVars.renamed/${name}`, note: own.note, dropWhen: own.dropWhen, toProp: own.toProp } : global(name);
		}, rule ? ctx.index.rules.v5.components[rule.to] : undefined);
	});

	iconLiterals(ctx, roots, libraryRanges);
	if (ast.css) renameCssText(ctx, ast.css.content.start, ast.css.content.end);
	importIcons(ctx, ast.instance?.content, ast.module ? ast.module.end : 0);
	return undefined;
}

function transformScript(ctx: Context) {
	let ast: Node;
	try {
		ast = parse(ctx.text, { modern: true }) as unknown as Node;
	} catch (error) {
		return (error as Error).message.split('\n')[0];
	}
	const program = ast.instance?.content as Node | undefined;
	if (!program) return undefined;
	ctx.references = collectReferenceCounts([program]);
	transformCalls(ctx, [program], localCallNames([program], ctx));
	transformCallResults(ctx, [program], localCallNames([program], ctx));
	renameImports([program], [program], ctx);
	iconLiterals(ctx, [program], []);
	importIcons(ctx, program);
	return undefined;
}

const IMPORT_SOURCE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;

function resolveSource(dir: string, from: string, source: string, aliases: [string, string][]): string | undefined {
	const clean = source.replace(/\?.*$/, '');
	if (clean.startsWith('.')) return resolve(dirname(from), clean);
	for (const [alias, target] of aliases)
		if (clean === alias || clean.startsWith(`${alias}/`)) return join(dir, target, clean.slice(alias.length));
	return resolveImport(dir, from, clean);
}

function unusedCopies(dir: string, paths: string[], copies: string[], text: (path: string) => string, gone: Set<string>, aliases: [string, string][]) {
	const unused = new Set<string>();
	for (let found = true; found; ) {
		found = false;
		for (const copy of copies) {
			if (unused.has(copy)) continue;
			const used = paths.some((file) => {
				if (file === copy || unused.has(file) || gone.has(file) || !/\.(svelte|ts|js)$/.test(file)) return false;
				for (const match of text(file).matchAll(IMPORT_SOURCE))
					if (resolveSource(dir, file, match[1], aliases) === copy) return true;
				return false;
			});
			if (!used) {
				unused.add(copy);
				found = true;
			}
		}
	}
	return unused;
}

function dropThemeChunk(text: string): { text: string; line: number } | undefined {
	let ast: Node;
	try {
		ast = parse(`${SCRIPT_OPEN}${text}${SCRIPT_CLOSE}`, { modern: true }) as unknown as Node;
	} catch {
		return undefined;
	}
	const offset = SCRIPT_OPEN.length;
	const onlyTheme = (fn: Node) => {
		const html = fn.params[0]?.type === 'ObjectPattern' ? (fn.params[0].properties as Node[]).find((p) => keyName(p) === 'html')?.value?.name : undefined;
		if (!html) return false;
		const replaces = (node: Node | undefined) =>
			node?.type === 'CallExpression' &&
			node.callee.type === 'MemberExpression' &&
			node.callee.object.type === 'Identifier' &&
			node.callee.object.name === html &&
			node.callee.property.name === 'replace' &&
			node.arguments[0]?.type === 'Literal' &&
			node.arguments[0].value === '%theme%';
		if (fn.body.type !== 'BlockStatement') return replaces(fn.body);
		const [first, second, ...rest] = fn.body.body as Node[];
		return (
			!rest.length &&
			first?.type === 'ExpressionStatement' &&
			first.expression.type === 'AssignmentExpression' &&
			first.expression.left.name === html &&
			replaces(first.expression.right) &&
			second?.type === 'ReturnStatement' &&
			second.argument?.name === html
		);
	};
	let found: { start: number; end: number; line: number } | undefined;
	visit(ast.instance?.content, (node) => {
		if (found || node.type !== 'CallExpression' || (node.arguments as Node[]).length !== 2 || node.arguments[1].type !== 'ObjectExpression') return;
		const properties = node.arguments[1].properties as Node[];
		const index = properties.findIndex((p) => keyName(p) === 'transformPageChunk');
		const value = properties[index]?.value;
		if (!value || !/Function/.test(value.type) || !onlyTheme(value)) return;
		const line = text.slice(0, properties[index].start - offset).split('\n').length;
		if (properties.length === 1) found = { start: node.arguments[0].end, end: node.end - 1, line };
		else {
			const next = properties[index + 1];
			found = next ? { start: properties[index].start, end: next.start, line } : { start: properties[index - 1].end, end: properties[index].end, line };
		}
	});
	if (!found) return undefined;
	return { text: text.slice(0, found.start - offset) + text.slice(found.end - offset), line: found.line };
}

function themeLeftovers(dir: string, paths: string[], text: (path: string) => string, result: CodemodResult, outputs: Map<string, string>): string[] {
	const html = existsSync(join(dir, 'src/app.html')) ? readFileSync(join(dir, 'src/app.html'), 'utf8') : '';
	if (!html || html.includes('%theme%')) return [];
	const out: string[] = [];
	const endpoint = paths.find((path) => /src[\\/]routes[\\/]api[\\/]setTheme[\\/]\+server\.(ts|js)$/.test(path));
	const called = paths.some((path) => path !== endpoint && text(path).includes('/api/setTheme'));
	if (endpoint && !called && /cookies\.set\(\s*['"]theme['"]/.test(text(endpoint))) out.push(endpoint);
	if (endpoint && called)
		for (const path of paths)
			if (path !== endpoint && text(path).includes('/api/setTheme'))
				result.skipped.push({
					file: relative(dir, path),
					line: text(path).slice(0, text(path).indexOf('/api/setTheme')).split('\n').length,
					kind: 'theme-cookie',
					id: 'local/ThemeSwitch/cookie',
					name: '/api/setTheme',
					reason: 'the light/dark choice is kept by rememberAppearance(): replace this toggle with ModeSwitch and remove the call; the endpoint goes when nothing calls it'
				});
	const hooks = paths.find((path) => /src[\\/]hooks\.server\.(ts|js)$/.test(path));
	const dropped = hooks && text(hooks).includes('%theme%') ? dropThemeChunk(text(hooks)) : undefined;
	if (hooks && dropped && !dropped.text.includes('%theme%')) {
		outputs.set(hooks, dropped.text);
		result.changes.push({
			file: relative(dir, hooks),
			line: dropped.line,
			kind: 'theme-cookie',
			id: 'local/ThemeSwitch/hooks',
			name: '%theme%',
			note: 'app.html no longer has %theme%: its replacement, which read the `theme` cookie, was removed. The mode is now saved in localStorage by ModeSwitch: users who had chosen light or dark choose again once.',
			check: false
		});
	} else if (hooks && text(hooks).includes('%theme%'))
		result.skipped.push({
			file: relative(dir, hooks),
			line: text(hooks).slice(0, text(hooks).indexOf('%theme%')).split('\n').length,
			kind: 'theme-cookie',
			id: 'local/ThemeSwitch/hooks',
			name: '%theme%',
			reason: 'app.html no longer has %theme%: remove its replacement and the reading of the `theme` cookie'
		});
	return out;
}

export function codemod(dir: string, index: RuleIndex, options: CodemodOptions = {}): CodemodResult {
	dir = resolve(dir);
	const available = mdiNames(dir);
	const css = cssRenames(index);
	const v5Vars = v5CssVars(index);
	const drops = cssDrops(index, css, v5Vars);
	const v4Prefixes = v4CssPrefixes(index);
	const typescript = existsSync(join(dir, 'tsconfig.json'));
	const paths = existsSync(join(dir, 'src')) ? listFiles(join(dir, 'src')) : [];
	const texts = new Map(paths.map((path) => [path, readFileSync(path, 'utf8')]));
	const mdiClasses = [...texts.values()].some((text) => /\bclass=["'{][^"'}]*\bmdi\s+(?:mdi-|\{)/.test(text));
	const result: CodemodResult = { dir, files: [], changes: [], skipped: [], defaults: [], wrappers: [], locals: [], deleted: [], parseErrors: [] };
	const dissolved = dissolve(dir, index, texts);
	result.wrappers = dissolved.wrappers;
	const checked = new Set(['wrapper-look', 'wrapper-style-ignored', 'wrapper-prop-ignored', 'wrapper-spread', 'wrapper-default', 'wrapper-bind-one-way']);
	for (const c of dissolved.changes)
		result.changes.push({ file: c.file, line: c.line, kind: c.kind, id: `wrappers/${c.wrapper}`, name: c.name, to: c.to, note: c.note, check: checked.has(c.kind) });
	for (const s of dissolved.skipped)
		result.skipped.push({ file: s.file, line: s.line, kind: s.kind, id: `wrappers/${s.wrapper}`, name: s.name, reason: s.reason });

	const aliases = readAliases(dir);
	const copies = new Map<string, LocalMigration>();
	for (const path of paths) {
		if (!path.endsWith('.svelte') || dissolved.deleted.includes(path)) continue;
		const rule = localRuleFor(index, path, texts.get(path));
		if (rule) copies.set(path, rule);
	}
	const copyNames = new Set([...copies.keys()].map((path) => basename(path)));
	const importsCopy = (text: string) => [...copyNames].some((name) => text.includes(name));
	const localUsages = new Map<string, number>();
	const outputs = new Map<string, string>();
	const passed = new Map<string, Set<string> | null>();
	for (const path of paths) {
		if (!path.endsWith('.svelte') || dissolved.deleted.includes(path)) continue;
		const scan = scanSvelte(dissolved.texts.get(path) ?? texts.get(path)!);
		if (scan.error) continue;
		const targets = new Map(
			scan.imports
				.filter((i) => i.imported === 'default' && i.source.endsWith('.svelte'))
				.map((i) => [i.local, resolveSource(dir, path, i.source, aliases)])
		);
		for (const node of scan.components) {
			const target = targets.get(node.tag);
			if (!target) continue;
			if (node.attrs.some((a) => a.kind === 'spread')) passed.set(target, null);
			else if (passed.get(target) !== null) passed.set(target, new Set([...(passed.get(target) ?? []), ...node.attrs.map((a) => a.name)]));
		}
	}
	const passThroughs = new Map<string, PassThrough>();
	for (let round = 0, found = true; found && round < 5; round++) {
		found = false;
		for (const path of paths) {
			if (!path.endsWith('.svelte') || dissolved.deleted.includes(path) || copies.has(path) || passThroughs.has(path)) continue;
			const inner = (source: string) => {
				const target = resolveSource(dir, path, source, aliases);
				return target && target !== path ? passThroughs.get(target) : undefined;
			};
			const through = passThroughOf(dissolved.texts.get(path) ?? texts.get(path)!, index, inner);
			if (through) passThroughs.set(path, through), (found = true);
		}
	}
	const pages = new Set(paths.map((path) => pageUrl(relative(dir, path))).filter((url) => url !== undefined));
	const targets = new Map<string, Set<string>>();
	for (const rule of index.rules.components)
		for (const r of rule.cssVars?.renamed ?? []) targets.set(r.from, new Set([...(targets.get(r.from) ?? []), r.to, ...(r.also ?? [])]));
	const declared = new Map<string, number>();
	for (const [path, text] of texts) {
		if (dissolved.deleted.includes(path)) continue;
		for (const m of (dissolved.texts.get(path) ?? text).matchAll(/(?<![\w-])(--[A-Za-z0-9_-]+)\s*[:=]/g))
			for (const name of new Set([m[1], ...(targets.get(m[1]) ?? [])])) declared.set(name, (declared.get(name) ?? 0) + 1);
	}

	for (const path of paths) {
		const original = texts.get(path)!;
		const rel = relative(dir, path);
		if (dissolved.deleted.includes(path)) {
			result.deleted.push(rel);
			if (options.write) unlinkSync(path);
			continue;
		}
		const input = dissolved.texts.get(path) ?? original;
		const svelte = path.endsWith('.svelte');
		const script = /\.(ts|js|mjs|cjs)$/.test(path);
		const style = /\.(css|pcss|postcss|scss)$/.test(path);
		if (!svelte && !script && !style) continue;
		if (script && ((!/@likable-hair\/svelte|['"`]mdi-/.test(input) && !importsCopy(input)) || input.includes('</script'))) continue;
		const text = script ? `${SCRIPT_OPEN}${input}${SCRIPT_CLOSE}` : input;
		const ctx: Context = {
			rel,
			text,
			offset: script ? SCRIPT_OPEN.length : 0,
			lines: new Lines(input),
			edit: new Editor(text),
			changes: result.changes,
			skipped: result.skipped,
			defaults: result.defaults,
			icons: new Set(),
			index,
			css,
			available,
			convertDataIcons: !mdiClasses,
			typescript,
			references: new Map(),
			local: (from) => {
				const target = resolveSource(dir, path, from, aliases);
				const rule = target ? copies.get(target) : undefined;
				return target && rule && target !== path ? { path: target, rule } : undefined;
			},
			localUsages,
			variants: new Map(),
			declared,
			drops,
			v4Prefixes,
			v5Vars,
			passed: passed.has(path) ? passed.get(path)! : new Set(),
			passThrough: (from) => {
				const target = resolveSource(dir, path, from, aliases);
				return target && target !== path ? passThroughs.get(target) : undefined;
			},
			lets: new Set(),
			parent: parentPage(rel, pages)
		};
		const error = svelte ? transformSvelte(ctx) : script ? transformScript(ctx) : (renameCssText(ctx, 0, text.length), undefined);
		if (error) {
			result.parseErrors.push({ file: rel, error });
			continue;
		}
		const output = ctx.edit.changed ? ctx.edit.toString() : text;
		const after = script ? output.slice(SCRIPT_OPEN.length, output.length - SCRIPT_CLOSE.length) : output;
		if (after !== original) outputs.set(path, after);
	}

	const unused = unusedCopies(dir, paths, [...copies.keys()], (path) => outputs.get(path) ?? dissolved.texts.get(path) ?? texts.get(path)!, new Set(dissolved.deleted), aliases);
	const finalText = (path: string) => (unused.has(path) || dissolved.deleted.includes(path) ? '' : (outputs.get(path) ?? dissolved.texts.get(path) ?? texts.get(path) ?? ''));
	for (const path of themeLeftovers(dir, paths, finalText, result, outputs)) unused.add(path);
	const dead = new Set(index.rules.global.deadFiles ?? []);
	const candidates = paths.filter(
		(path) => dead.has(basename(path)) && /[\\/]src[\\/]lib[\\/]components[\\/]/.test(path) && !copies.has(path) && !unused.has(path)
	);
	for (const path of unusedCopies(dir, paths.filter((p) => !unused.has(p)), candidates, finalText, new Set(dissolved.deleted), aliases)) {
		unused.add(path);
		result.changes.push({ file: relative(dir, path), line: 1, kind: 'dead-file', id: 'global/deadFiles', name: basename(path), note: 'No file imported it.', check: false });
	}
	for (const [path, rule] of copies)
		result.locals.push({
			file: relative(dir, path),
			from: rule.from,
			to: rule.to,
			usages: localUsages.get(rule.from) ?? 0,
			deleted: unused.has(path)
		});
	result.locals.sort((a, b) => a.file.localeCompare(b.file));
	for (const path of paths) {
		const rel = relative(dir, path);
		if (unused.has(path)) {
			result.deleted.push(rel);
			if (options.write) unlinkSync(path);
			continue;
		}
		const after = outputs.get(path);
		if (after === undefined) continue;
		result.files.push({ path, rel, before: texts.get(path)!, after });
		if (options.write) writeFileSync(path, after);
	}
	result.deleted.sort();
	const gone = new Set(result.deleted);
	result.changes = result.changes.filter((c) => !c.check || !gone.has(c.file));
	result.skipped = result.skipped.filter((s) => !gone.has(s.file));
	result.defaults = result.defaults.filter((d) => !gone.has(d.file));
	if (!available && result.changes.some((c) => c.kind === 'icon-literal'))
		result.skipped.push({ file: 'package.json', line: 1, kind: 'icon-unknown', id: 'icons/unknown', name: MDI, reason: '@mdi/js is not installed: icon names were not checked' });
	return result;
}

