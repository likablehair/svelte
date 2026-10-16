import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { attrExpression, attrText, Editor, isReference, visit } from './ast.ts';
import { readAliases } from './analyze.ts';
import { dissolve, resolveImport, type WrapperSummary } from './dissolve.ts';
import { Lines, listFiles } from './files.ts';
import { localRuleFor, type RuleIndex } from './rules.ts';
import type { Node } from './svelte.ts';
import type { ComponentApi, ComponentMigration, LocalMigration, ManualTrigger } from './types.ts';

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
}

export function cssRenames(index: RuleIndex): Map<string, CssRename> {
	const byName = new Map<string, CssRename[]>();
	for (const rule of index.rules.components)
		for (const r of rule.cssVars?.renamed ?? []) {
			const list = byName.get(r.from) ?? [];
			list.push({ to: r.to, component: rule.from, note: r.note });
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
	localUsages: Map<string, number>;
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
				const name = taken.get(rule.to) ?? rule.to;
				if (!taken.has(rule.to)) {
					named.push(rule.to);
					taken.set(rule.to, rule.to);
				}
				if (local !== name) renameReferences(roots, local, name, ctx);
				scope.set(local, rule.from);
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

type ObjectRules = { keys?: { from: string; to: string }[]; values?: { key: string; values: Record<string, string> }[]; drop?: string[]; note?: string };

function editObject(ctx: Context, object: Node, calls: ObjectRules, prefix: string, id: string) {
	const properties = object.properties as Node[];
	properties.forEach((property, index) => {
		const key = keyName(property);
		if (!key) return;
		const path = prefix ? `${prefix}.${key}` : key;
		if (calls.drop?.includes(path)) {
			const [start, end] = propertyRange(ctx, properties, index);
			if (ctx.edit.replace(start, end, '')) changed(ctx, property.start, { kind: 'call-key-dropped', id, name: path, note: calls.note, check: true });
			return;
		}
		const rename = calls.keys?.find((k) => k.from === path);
		const to = rename ? rename.to.split('.').pop()! : undefined;
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
			if (expression.callee.type === 'Identifier' && /^\$(state|derived)$/.test(expression.callee.name) && expression.arguments[0])
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
	for (const statement of (instance?.body ?? []) as Node[])
		if (statement.type === 'VariableDeclaration')
			for (const d of statement.declarations as Node[]) if (d.id.type === 'Identifier' && d.init) declarations.set(d.id.name, d.init);
	const seen = new Set<Node>();
	for (const { node, v4 } of usages) {
		const rule = ctx.index.byV4.get(v4);
		if (!rule || !('items' in rule) || !rule.items) continue;
		for (const items of (rule as LocalMigration).items!) {
			const attr = (node.attributes as Node[]).find((a) => (a.type === 'Attribute' || a.type === 'BindDirective') && a.name === items.prop);
			const expression = attr && (attr.type === 'BindDirective' ? attr.expression : attrExpression(attr));
			if (!attr || !expression) continue;
			if (!editItems(ctx, expression, items, `${v4}/items/${items.prop}`, declarations, seen))
				skip(ctx, attr.start, {
					kind: 'item-keys',
					id: `${v4}/items/${items.prop}`,
					name: items.prop,
					reason: `the items are built elsewhere: rename their keys by hand (${[...(items.keys ?? []).map((k) => `${k.from} → ${k.to}`), ...(items.drop ?? []).map((d) => `${d} removed`)].join(', ')})${items.note ? `. ${items.note}` : ''}`
				});
		}
	}
}

function retypeMembers(ctx: Context, ast: Node, scope: Map<string, string>) {
	visit(ast, (node) => {
		if (node.type !== 'TSTypeQuery' || node.exprName?.type !== 'Identifier') return;
		const rule = ctx.index.byV4.get(scope.get(node.exprName.name) ?? '');
		if (!rule || !('files' in rule)) return;
		const member = /^(?:<[^<>]*>)?\s*>\s*\[\s*(['"])(\w+)\1\s*\]/.exec(ctx.text.slice(node.end));
		if (!member) return;
		const name = member[2];
		const to = rule.props?.renamed?.find((r) => r.from === name)?.to ?? rule.snippets?.renamed?.find((r) => r.from === name)?.to;
		if (!to || to === name) return;
		const at = node.end + member.index + member[0].lastIndexOf(name);
		if (ctx.edit.replace(at, at + name.length, to))
			changed(ctx, at, { kind: 'type-member', id: `${rule.from}/types/${name}`, name, to, check: false });
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

	for (const attr of attrs) {
		if (attr.type === 'Attribute' && attr.name.startsWith('--')) continue;

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

function eventMapping(ctx: Context, rule: ComponentMigration | undefined, name: string) {
	const ev = rule?.events?.changed?.find((e) => e.name === name);
	const mapping: Mapping = ev?.argument ?? ctx.index.rules.global.callbacks.argument;
	return { ev, mapping };
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

function renameCssText(ctx: Context, start: number, end: number) {
	const text = ctx.text.slice(start, end);
	for (const m of text.matchAll(/--[A-Za-z0-9_-]+/g)) {
		const name = m[0];
		const rename = ctx.css.get(name);
		if (!rename) continue;
		const pos = start + m.index!;
		if (ctx.edit.replace(pos, pos + name.length, rename.to))
			changed(ctx, pos, {
				kind: 'css-var-renamed',
				id: `${rename.component}/cssVars.renamed/${name}`,
				name,
				to: rename.to,
				note: rename.note,
				check: !!rename.note
			});
	}
}

interface StyleRename {
	to: string;
	id: string;
	note?: string;
}

const valueOf = (ctx: Context, attr: Node) =>
	attr.value === true ? '' : ctx.text.slice(attr.start + (attr.type === 'StyleDirective' ? 6 : 0) + attr.name.length, attr.end);

function renameStyles(ctx: Context, node: Node, lookup: (name: string) => StyleRename | undefined) {
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
		if (!rename) continue;
		const at = attr.start + (attr.type === 'StyleDirective' ? 6 : 0);
		const other = present.get(`${attr.type}:${rename.to}`);
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
	ctx.lets = new Set(
		((ast.instance?.content.body ?? []) as Node[])
			.filter((n) => n.type === 'VariableDeclaration' && n.kind === 'let')
			.flatMap((n) => (n.declarations as Node[]).map((d) => (d.id.type === 'Identifier' ? (d.id.name as string) : '')))
			.filter(Boolean)
	);
	transformCalls(ctx, roots, localCallNames(programs, ctx));
	const scope = renameImports(roots, programs, ctx);
	const functions = functionsByName(ast.instance ? [ast.instance.content] : []);

	const usages: { node: Node; v4: string }[] = [];
	visit(ast.fragment, (node) => {
		if (node.type !== 'Component') return;
		const v4 = scope.get(node.name);
		if (v4) usages.push({ node, v4 });
	});

	const handlerUses = new Map<string, HandlerUse[]>();
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
	const libraryRanges: [number, number][] = [];
	for (const { node, v4 } of usages) {
		for (const attr of node.attributes as Node[]) libraryRanges.push([attr.start, attr.end]);
		const rule = ctx.index.byV4.get(v4);
		if (!rule) continue;
		transformUsage(ctx, node, v4, rule, ctx.index.rules.v5.components[rule.to], functions, handlerUses, done);
	}

	const global = (name: string): StyleRename | undefined => {
		const r = ctx.css.get(name);
		return r && { to: r.to, id: `${r.component}/cssVars.renamed/${name}`, note: r.note };
	};
	visit(ast.fragment, (node) => {
		if (!Array.isArray(node.attributes)) return;
		const v4 = node.type === 'Component' ? scope.get(node.name) : undefined;
		const rule = v4 ? ctx.index.byV4.get(v4) : undefined;
		renameStyles(ctx, node, (name) => {
			const own = rule?.cssVars?.renamed?.find((x) => x.from === name);
			return own ? { to: own.to, id: `${v4}/cssVars.renamed/${name}`, note: own.note } : global(name);
		});
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

function themeLeftovers(dir: string, paths: string[], text: (path: string) => string, result: CodemodResult): string[] {
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
	if (hooks && text(hooks).includes('%theme%'))
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
			lets: new Set()
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
	for (const path of themeLeftovers(dir, paths, finalText, result)) unused.add(path);
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
	if (!available && result.changes.some((c) => c.kind === 'icon-literal'))
		result.skipped.push({ file: 'package.json', line: 1, kind: 'icon-unknown', id: 'icons/unknown', name: MDI, reason: '@mdi/js is not installed: icon names were not checked' });
	return result;
}

