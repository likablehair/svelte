import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { analyze, readAliases, scriptImports, type AppStep, type GeneralStep, type Wrapper } from './analyze.ts';
import { codemod } from './codemod.ts';
import { RECIPES } from './dissolve.ts';
import { Lines, listFiles } from './files.ts';
import type { RuleIndex } from './rules.ts';
import { scanSvelte, walk, type ImportRecord, type Node } from './svelte.ts';
import type { ComponentMigration } from './types.ts';

import { LOCAL_PREFIX } from './compile.ts';

const LIB = '@likable-hair/svelte';
const SCRIPT_OPEN = '<script lang="ts">';

export interface Diagnostic {
	file: string;
	line: number;
	column: number;
	message: string;
	code?: number | string;
}

export interface CheckResult {
	ran: boolean;
	diagnostics: Diagnostic[];
	error?: string;
}

export interface Explanation {
	id: string;
	text: string;
}

export interface ErrorPoint extends Diagnostic {
	component?: string;
	via?: { tag: string; file?: string };
	name?: string;
	explanations: Explanation[];
	hint?: string;
}

export interface ReviewPoint {
	file: string;
	lines: number[];
	kind: 'manual' | 'check' | 'not-done' | 'default';
	id: string;
	component?: string;
	title: string;
	text?: string;
}

export interface RemainingFile {
	file: string;
	errors: ErrorPoint[];
	review: ReviewPoint[];
}

export interface Page {
	route: string;
	file: string;
	touched: string[];
	components: string[];
}

export interface Remaining {
	dir: string;
	base?: string;
	check: { ran: boolean; errors: number; error?: string };
	files: RemainingFile[];
	general: GeneralStep[];
	appSteps: AppStep[];
	dropped: { wrapper: string; target?: string; dropped: string[] }[];
	pages: Page[];
	layouts: Page[];
	global: string[];
}

export interface RemainingOptions {
	check?: (dir: string) => CheckResult;
	base?: string;
}

const tryGit = (dir: string, args: string[]) => {
	try {
		return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return undefined;
	}
};

export function parseSvelteCheck(output: string): Diagnostic[] {
	const out: Diagnostic[] = [];
	for (const line of output.split('\n')) {
		const json = /^\d+\s+(\{.*\})\s*$/.exec(line)?.[1];
		if (!json) continue;
		let entry: Record<string, any>;
		try {
			entry = JSON.parse(json);
		} catch {
			continue;
		}
		if (entry.type !== 'ERROR' || !entry.filename) continue;
		out.push({
			file: String(entry.filename).replace(/\\/g, '/'),
			line: (entry.start?.line ?? 0) + 1,
			column: (entry.start?.character ?? 0) + 1,
			message: entry.message,
			code: entry.code
		});
	}
	return out;
}

export function svelteCheck(dir: string): CheckResult {
	const bin = (name: string) => join(dir, 'node_modules', '.bin', name);
	if (!existsSync(bin('svelte-check')))
		return { ran: false, diagnostics: [], error: 'svelte-check is not installed in the app: add it to the dev dependencies.' };
	if (existsSync(bin('svelte-kit'))) spawnSync(bin('svelte-kit'), ['sync'], { cwd: dir, stdio: 'ignore' });
	const args = ['--output', 'machine-verbose', ...(existsSync(join(dir, 'tsconfig.json')) ? ['--tsconfig', './tsconfig.json'] : [])];
	const run = spawnSync(bin('svelte-check'), args, { cwd: dir, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
	if (run.error) return { ran: false, diagnostics: [], error: run.error.message };
	const diagnostics = parseSvelteCheck(run.stdout ?? '');
	if (!/\bCOMPLETED\b/.test(run.stdout ?? ''))
		return { ran: false, diagnostics, error: `${run.stderr ?? ''}${run.stdout ?? ''}`.trim().split('\n').slice(-3).join(' ') };
	return { ran: true, diagnostics };
}

export function migrationBase(dir: string): string | undefined {
	const branch = tryGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
	if (!branch) return undefined;
	const saved = tryGit(dir, ['config', '--get', `branch.${branch}.migrateBase`]);
	if (saved) return saved;
	const created = tryGit(dir, ['reflog', 'show', '--format=%H', `refs/heads/${branch}`])?.split('\n').filter(Boolean).pop();
	return created ?? tryGit(dir, ['rev-parse', 'HEAD']);
}

export function baseSnapshot(dir: string, base: string): string | undefined {
	const prefix = tryGit(dir, ['rev-parse', '--show-prefix']);
	const top = tryGit(dir, ['rev-parse', '--show-toplevel']);
	if (prefix === undefined || !top) return undefined;
	const target = mkdtempSync(join(tmpdir(), 'svelte-migrate-base-'));
	try {
		const tar = join(target, '.base.tar');
		const tree = prefix ? `${base}:${prefix.replace(/\/$/, '')}` : base;
		execFileSync('git', ['-C', top, 'archive', '--format=tar', '-o', tar, tree], { stdio: 'ignore' });
		execFileSync('tar', ['-xf', tar, '-C', target], { stdio: 'ignore' });
		rmSync(tar);
		if (existsSync(join(dir, 'node_modules'))) symlinkSync(join(dir, 'node_modules'), join(target, 'node_modules'), 'dir');
		return target;
	} catch {
		rmSync(target, { recursive: true, force: true });
		return undefined;
	}
}

export function touchedFiles(dir: string, base: string): string[] {
	const changed = tryGit(dir, ['diff', '--name-only', '--relative', base, '--', '.'])?.split('\n') ?? [];
	const untracked = tryGit(dir, ['ls-files', '--others', '--exclude-standard', '--', '.'])?.split('\n') ?? [];
	return [...new Set([...changed, ...untracked])].filter((file) => file && existsSync(join(dir, file))).sort();
}

export function lineMap(before: string, after: string): (line: number) => number {
	const a = before.split('\n');
	const b = after.split('\n');
	const counts = (lines: string[]) => {
		const map = new Map<string, number>();
		for (const line of lines) {
			const key = line.trim();
			if (key) map.set(key, (map.get(key) ?? 0) + 1);
		}
		return map;
	};
	const countA = counts(a);
	const countB = counts(b);
	const inB = new Map<string, number>();
	b.forEach((line, i) => {
		const key = line.trim();
		if (countB.get(key) === 1) inB.set(key, i);
	});
	const anchors: [number, number][] = [];
	let last = -1;
	a.forEach((line, i) => {
		const key = line.trim();
		const j = countA.get(key) === 1 ? inB.get(key) : undefined;
		if (j === undefined || j <= last) return;
		anchors.push([i, j]);
		last = j;
	});
	return (line) => {
		const i = line - 1;
		let best: [number, number] | undefined;
		for (const anchor of anchors) {
			if (anchor[0] > i) break;
			best = anchor;
		}
		const mapped = best ? best[1] + (i - best[0]) : i;
		return Math.min(Math.max(mapped, 0), Math.max(b.length - 1, 0)) + 1;
	};
}

interface Spot {
	tag?: string;
	attr?: string;
	snippet?: string;
	script: boolean;
	lineText: string;
}

function locate(text: string, svelte: boolean, line: number, column: number): Spot {
	const lines = text.split('\n');
	const lineText = lines[line - 1] ?? '';
	let offset = column - 1;
	for (let i = 0; i < line - 1 && i < lines.length; i++) offset += lines[i].length + 1;
	const source = svelte ? text : `${SCRIPT_OPEN}${text}\n</script>`;
	const at = offset + (svelte ? 0 : SCRIPT_OPEN.length);
	let ast: Node;
	try {
		ast = parse(source, { modern: true }) as unknown as Node;
	} catch {
		return { script: !svelte, lineText };
	}
	const inside = (node: Node | undefined) => !!node && node.start <= at && at < node.end;
	if (inside(ast.instance) || inside(ast.module)) return { script: true, lineText };
	let spot: Spot = { script: false, lineText };
	walk(ast.fragment, (node) => {
		if (node.type !== 'Component' || !inside(node)) return;
		const attrs = node.attributes as Node[];
		const attr = attrs.find(inside);
		if (attr) {
			spot = { tag: node.name, attr: attr.type === 'SpreadAttribute' ? undefined : attr.name, script: false, lineText };
			return;
		}
		const openEnd = attrs.length ? Math.max(...attrs.map((a) => a.end)) + 1 : node.start + node.name.length + 1;
		if (at <= openEnd) {
			spot = { tag: node.name, script: false, lineText };
			return;
		}
		const snippet = ((node.fragment?.nodes ?? []) as Node[]).find(
			(child) => child.type === 'SnippetBlock' && inside(child) && at < (child.body?.start ?? child.end)
		);
		if (snippet) spot = { tag: node.name, snippet: snippet.expression.name, script: false, lineText };
	});
	return spot;
}

const tail = (note?: string) => (note ? ` ${note}` : '');
const instead = (replacement?: string) => (replacement ? ` (instead: ${replacement})` : '');

function argumentText(argument: Record<string, string | null> | undefined) {
	const entries = Object.entries(argument ?? {});
	if (!entries.length) return '';
	return ` (${entries.map(([from, to]) => `\`e.${from}\` → ${to === null ? 'gone' : `\`e${to ? `.${to}` : ''}\``}`).join(', ')})`;
}

export function ruleEntries(rule: ComponentMigration, name: string): Explanation[] {
	const out: Explanation[] = [];
	const id = (path: string, n = name) => `${rule.from}/${path}/${n}`;
	const p = rule.props ?? {};
	for (const r of p.renamed ?? []) {
		if (r.from === name) out.push({ id: id('props.renamed'), text: `\`${name}\` is now \`${r.to}\`.${tail(r.note)}` });
		else if (r.to === name) out.push({ id: id('props.renamed', r.from), text: `\`${r.from}\` became \`${name}\`.${tail(r.note)}` });
	}
	for (const r of p.inverted ?? [])
		if (r.from === name || r.to === name) out.push({ id: id('props.inverted', r.from), text: `\`${r.from}\` became \`${r.to}\`, with the opposite meaning.${tail(r.note)}` });
	for (const r of p.removed ?? []) if (r.name === name) out.push({ id: id('props.removed'), text: `\`${name}\` is gone${instead(r.replacement)}. ${r.note}` });
	for (const r of p.changed ?? []) if (r.name === name) out.push({ id: id('props.changed'), text: `\`${name}\`: ${r.note}` });
	for (const r of p.toCssVar ?? [])
		if (r.name === name) out.push({ id: id('props.toCssVar'), text: `\`${name}\` became the CSS variable \`${r.cssVar}\`.${tail(r.note)}` });
	for (const r of p.types ?? []) if (r.name === name) out.push({ id: id('props.types'), text: `\`${name}\`: \`${r.v4}\` → \`${r.v5}\`.${tail(r.note)}` });
	for (const r of p.values ?? [])
		if (r.name === name)
			out.push({ id: id('props.values'), text: `\`${name}\` values: ${Object.entries(r.values).map(([a, b]) => `\`${a}\` → \`${b}\``).join(', ')}.${tail(r.note)}` });
	const e = rule.events ?? {};
	for (const r of e.changed ?? [])
		if (r.name === name || r.to === name)
			out.push({
				id: id('events.changed', r.name),
				text: `\`${r.name}\`${r.to ? ` is now \`${r.to}\`` : ''}${r.type ? `, it receives \`${r.type}\`` : ''}${argumentText(r.argument)}.${tail(r.note)}`
			});
	for (const r of e.removed ?? []) if (r.name === name) out.push({ id: id('events.removed'), text: `\`${name}\` is gone${instead(r.replacement)}. ${r.note}` });
	const s = rule.snippets ?? {};
	for (const r of s.renamed ?? [])
		if (r.from === name || r.to === name) out.push({ id: id('snippets.renamed', r.from), text: `Snippet \`${r.from}\` is now \`${r.to}\`.${tail(r.note)}` });
	for (const r of s.removed ?? []) if (r.name === name) out.push({ id: id('snippets.removed'), text: `Snippet \`${name}\` is gone${instead(r.replacement)}. ${r.note}` });
	for (const r of s.parameters ?? [])
		if (r.name === name) out.push({ id: id('snippets.parameters'), text: `Snippet \`${name}\` receives \`${r.v5}\` (v4: \`${r.v4}\`).${tail(r.note)}` });
	for (const step of rule.manual ?? []) {
		const when = step.when;
		if (when && [...(when.props ?? []), ...(when.events ?? []), ...(when.snippets ?? [])].includes(name))
			out.push({ id: step.id, text: `${step.summary} ${step.action}` });
	}
	return out;
}

function recipeText(name: string, component: string): string | undefined {
	const recipe = RECIPES[component]?.[name];
	if (!recipe) return undefined;
	if (recipe.manual) return `\`${name}\` belonged to the old wrapper of ${component}, which ${recipe.manual}.`;
	const value = recipe.flag ? `{${name} ? '${recipe.flag}' : undefined}` : `{${name}}`;
	return `\`${name}\` belonged to the old wrapper of ${component}: in v5 it is \`${recipe.to}=${value}\`${recipe.values ? ` (values: ${Object.entries(recipe.values).map(([a, b]) => `'${a}' → '${b}'`).join(', ')})` : ''}.`;
}

const NAME_PATTERNS = [
	/'"?([\w$-]+)"?' does not exist/g,
	/Property '([\w$]+)' is missing/g,
	/'([\w$-]+)' is specified more than once/g,
	/Binding element '([\w$]+)'/g,
	/Did you mean to write '([\w$]+)'/g
];

export function messageNames(message: string): string[] {
	const names: string[] = [];
	for (const pattern of NAME_PATTERNS) for (const match of message.matchAll(pattern)) if (!names.includes(match[1])) names.push(match[1]);
	return names;
}

const HINTS: Record<string, string> = {
	'2590': 'TypeScript gives up on this tag while it has other errors: fix the other errors of the same tag first, this one usually goes away.',
	'2783': 'The tag sets this prop and also spreads an object that contains it (often after a rename made by the codemod): keep one of the two.',
	'7031': 'Usually follows another error of the same component (a renamed callback or snippet, or a prop that no longer exists): fix that one first.',
	'7006': 'Usually follows another error of the same component (a renamed callback or snippet, or a prop that no longer exists): fix that one first.'
};

interface FileInfo {
	rel: string;
	text: string;
	svelte: boolean;
	libLocals: Map<string, string>;
	appImports: Map<string, string>;
}

interface Env {
	dir: string;
	index: RuleIndex;
	aliases: [string, string][];
	wrappers: Map<string, Wrapper>;
	baseComponents: Map<string, Set<string>>;
}

function resolveModule(env: Env, from: string, source: string, exists: (path: string) => boolean): string | undefined {
	let base: string | undefined;
	if (source.startsWith('.')) base = resolve(dirname(from), source);
	else
		for (const [alias, target] of env.aliases)
			if (source === alias || source.startsWith(`${alias}/`)) {
				base = join(env.dir, target, source.slice(alias.length));
				break;
			}
	if (!base) return undefined;
	return [base, `${base}.ts`, `${base}.js`, `${base}.svelte`, join(base, 'index.ts'), join(base, 'index.js')].find(exists);
}

function fileInfo(env: Env, rel: string): FileInfo | undefined {
	const path = join(env.dir, rel);
	if (!existsSync(path)) return undefined;
	const text = readFileSync(path, 'utf8');
	const svelte = rel.endsWith('.svelte');
	let imports: ImportRecord[];
	if (svelte) {
		const scan = scanSvelte(text);
		imports = scan.error ? scriptImports(text, new Lines(text)) : scan.imports;
	} else imports = scriptImports(text, new Lines(text));
	const libLocals = new Map<string, string>();
	const appImports = new Map<string, string>();
	for (const record of imports) {
		if (record.source === LIB) {
			if (record.imported !== '*' && record.imported !== 'default') libLocals.set(record.local, record.imported);
			continue;
		}
		if (!record.source.endsWith('.svelte')) continue;
		const target = resolveModule(env, path, record.source, existsSync);
		if (target) appImports.set(record.local, relative(env.dir, target));
	}
	return { rel, text, svelte, libLocals, appImports };
}

function rulesFor(env: Env, component: string, file: string, via?: string): ComponentMigration[] {
	const used = new Set([...(env.baseComponents.get(file) ?? []), ...(via ? (env.baseComponents.get(via) ?? []) : [])]);
	return env.index.rules.components
		.filter((rule) => rule.to === component || rule.from === component)
		.sort((a, b) => Number(used.has(b.from)) - Number(used.has(a.from)));
}

function unique(list: Explanation[]): Explanation[] {
	const seen = new Set<string>();
	return list.filter((entry) => !seen.has(entry.text) && !!seen.add(entry.text));
}

function typeRules(env: Env, info: FileInfo, message: string): { rule: ComponentMigration; name: string }[] {
	const types = [...new Set(message.match(/\b[A-Z]\w*\b/g) ?? [])].filter((name) => env.index.v5Exports.has(name) && !env.index.rules.v5.components[name]);
	const found: { rule: ComponentMigration; name: string; local: boolean }[] = [];
	const imported = new Set(info.libLocals.values());
	for (const type of types) {
		const word = new RegExp(`\\b${type}\\b`);
		for (const rule of env.index.rules.components)
			for (const entry of rule.props?.types ?? [])
				if (word.test(entry.v5)) found.push({ rule, name: entry.name, local: imported.has(rule.to) });
	}
	const local = found.filter((f) => f.local);
	return local.length ? local : found;
}

function explain(env: Env, info: FileInfo, d: Diagnostic): ErrorPoint {
	const point: ErrorPoint = { ...d, explanations: [] };
	const spot = locate(info.text, info.svelte, d.line, d.column);
	const names = [spot.attr, spot.snippet, ...messageNames(d.message)].filter((n, i, all): n is string => !!n && all.indexOf(n) === i);
	let component: string | undefined;
	if (spot.tag) {
		component = info.libLocals.get(spot.tag);
		if (!component) {
			const file = info.appImports.get(spot.tag);
			const wrapper = file ? env.wrappers.get(file) : undefined;
			point.via = { tag: spot.tag, file };
			component = wrapper?.component;
		}
	} else if (spot.script) {
		const typeofName = /\btypeof\s+([\w$]+)/.exec(spot.lineText)?.[1];
		component = typeofName ? info.libLocals.get(typeofName) : undefined;
	}
	point.component = component;
	if (component) {
		const rules = rulesFor(env, component, info.rel, point.via?.file);
		for (const name of names) {
			const rule = rules.find((r) => ruleEntries(r, name).length);
			const entries = rule ? unique(ruleEntries(rule, name)) : [];
			if (!entries.length) continue;
			point.name = name;
			point.explanations = entries;
			break;
		}
		if (!point.explanations.length && point.via)
			for (const name of names) {
				const text = recipeText(name, component);
				if (!text) continue;
				point.name = name;
				point.explanations = [{ id: `wrappers/${name}`, text }];
				break;
			}
	}
	if (!point.explanations.length && !spot.tag) {
		const found = typeRules(env, info, d.message);
		if (found.length) {
			point.component = found[0].rule.to;
			point.name = found[0].name;
			point.explanations = unique(found.flatMap((f) => ruleEntries(f.rule, f.name)));
		}
	}
	if (!point.explanations.length && names.includes('detail')) {
		point.name = 'detail';
		point.explanations = [
			{
				id: 'global-callbacks',
				text: 'v5 callbacks receive their value directly, without `detail`: `e.detail.x` → `e.x`, and `e.detail.nativeEvent` → `e` (the native event).'
			}
		];
	}
	if (point.via && component)
		point.hint = `\`<${point.via.tag}>\` is an app component${point.via.file ? ` (${point.via.file})` : ''} that passes its other props to ${component}: change the prop here, or handle it inside the component.`;
	const hint = HINTS[String(d.code)];
	if (hint) point.hint = point.hint ? `${point.hint} ${hint}` : hint;
	return point;
}

interface Graph {
	imports: Map<string, string[]>;
	files: Set<string>;
}

function importGraph(env: Env): Graph {
	const paths = existsSync(join(env.dir, 'src')) ? listFiles(join(env.dir, 'src')) : [];
	const all = new Set(paths);
	const imports = new Map<string, string[]>();
	for (const path of paths) {
		if (!/\.(svelte|ts|js|mjs)$/.test(path)) continue;
		const text = readFileSync(path, 'utf8');
		const targets = new Set<string>();
		for (const match of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
			const target = resolveModule(env, path, match[1].replace(/\?.*$/, ''), (p) => all.has(p));
			if (target) targets.add(relative(env.dir, target));
		}
		imports.set(relative(env.dir, path), [...targets]);
	}
	return { imports, files: new Set([...all].map((p) => relative(env.dir, p))) };
}

function closure(graph: Graph, start: string, memo: Map<string, Set<string>>): Set<string> {
	const cached = memo.get(start);
	if (cached) return cached;
	const seen = new Set<string>();
	const stack = [start];
	while (stack.length) {
		const file = stack.pop()!;
		if (seen.has(file)) continue;
		seen.add(file);
		for (const next of graph.imports.get(file) ?? []) stack.push(next);
	}
	memo.set(start, seen);
	return seen;
}

const routeOf = (rel: string) =>
	'/' +
	dirname(relative('src/routes', rel))
		.split('/')
		.filter((segment) => segment !== '.' && !/^\(.*\)$/.test(segment))
		.join('/');

function pagesToLookAt(env: Env, touched: string[], review: Map<string, ReviewPoint[]>) {
	const graph = importGraph(env);
	const memo = new Map<string, Set<string>>();
	const touchedSet = new Set(touched);
	const components = (files: string[]) =>
		[...new Set(files.flatMap((file) => (review.get(file) ?? []).map((point) => point.component).filter((c): c is string => !!c)))].sort();
	const entry = (file: string): Page | undefined => {
		const hit = [...closure(graph, file, memo)].filter((f) => touchedSet.has(f)).sort();
		return hit.length ? { route: routeOf(file), file, touched: hit, components: components(hit) } : undefined;
	};
	const routes = [...graph.files].filter((file) => /^src\/routes\/(?:.*\/)?\+(?:page|layout|error)\.svelte$/.test(file)).sort();
	const pages = routes
		.filter((file) => /\+page\.svelte$/.test(file))
		.map(entry)
		.filter((page): page is Page => !!page)
		.sort((a, b) => b.touched.length - a.touched.length || a.route.localeCompare(b.route));
	const layouts = routes
		.filter((file) => /\+(?:layout|error)\.svelte$/.test(file))
		.map(entry)
		.filter((page): page is Page => !!page);
	const reached = new Set(routes.flatMap((file) => [...closure(graph, file, memo)]));
	const global = touched.filter((file) => !reached.has(file));
	return { pages, layouts, global };
}

function reviewFromBase(env: Env, snapshot: string, current: (rel: string) => string | undefined) {
	const analysis = analyze(snapshot, env.index);
	const result = codemod(snapshot, env.index, { write: false });
	const base = (rel: string) => {
		try {
			return readFileSync(join(snapshot, rel), 'utf8');
		} catch {
			return undefined;
		}
	};
	const maps = new Map<string, ((line: number) => number) | null>();
	const mapLine = (rel: string, line: number) => {
		if (!maps.has(rel)) {
			const before = base(rel);
			const after = current(rel);
			maps.set(rel, before !== undefined && after !== undefined ? lineMap(before, after) : null);
		}
		return maps.get(rel)?.(line);
	};
	const byKey = new Map<string, ReviewPoint>();
	const add = (point: Omit<ReviewPoint, 'lines'>, line: number) => {
		const mapped = mapLine(point.file, line);
		if (mapped === undefined) return;
		const key = `${point.file}\n${point.kind}\n${point.id}\n${point.title}`;
		const existing = byKey.get(key);
		if (existing) {
			if (!existing.lines.includes(mapped)) existing.lines.push(mapped);
		} else byKey.set(key, { ...point, lines: [mapped] });
	};
	const targets = new Map(result.wrappers.map((w) => [`wrappers/${basename(w.file, '.svelte')}`, w.target]));
	const v5Name = (v4?: string) =>
		!v4 ? undefined : (env.index.byV4.get(v4)?.to ?? (env.index.rules.v5.components[v4] || env.index.v4Components.has(v4) ? v4 : undefined));
	const owner = (id: string) => targets.get(id) ?? v5Name(id.split('/').slice(0, id.startsWith(LOCAL_PREFIX) ? 2 : 1).join('/'));
	for (const f of analysis.findings) {
		if (f.effort !== 'manual') continue;
		const step = f.kind === 'manual' ? env.index.byV4.get(f.component ?? '')?.manual?.find((s) => s.id === f.id) : undefined;
		add(
			{
				file: f.file,
				kind: 'manual',
				id: f.id,
				component: v5Name(f.component),
				title: step?.summary ?? `${f.name}${f.to ? ` → ${f.to}` : ''}`,
				text: step?.action ?? f.note
			},
			f.line
		);
	}
	for (const c of result.changes)
		if (c.check) add({ file: c.file, kind: 'check', id: c.id, component: owner(c.id), title: `${c.name}${c.to ? ` → ${c.to}` : ''}`, text: c.note }, c.line);
	for (const s of result.skipped) add({ file: s.file, kind: 'not-done', id: s.id, component: owner(s.id), title: s.name, text: s.reason }, s.line);
	for (const d of result.defaults)
		add({ file: d.file, kind: 'default', id: `${d.component}/defaults/${d.name}`, component: v5Name(d.component), title: `${d.name}: ${d.v4} → ${d.v5} (${d.kind})`, text: d.note }, d.line);
	const review = new Map<string, ReviewPoint[]>();
	for (const point of byKey.values()) {
		point.lines.sort((a, b) => a - b);
		review.set(point.file, [...(review.get(point.file) ?? []), point]);
	}
	const baseComponents = new Map<string, Set<string>>();
	for (const f of analysis.findings)
		if (f.component) baseComponents.set(f.file, new Set([...(baseComponents.get(f.file) ?? []), f.component]));
	return {
		review,
		baseComponents,
		general: analysis.general,
		appSteps: analysis.appSteps.filter((step) => step.needed !== false),
		dropped: result.wrappers.filter((w) => w.dissolved && w.dropped.length).map((w) => ({ wrapper: w.file, target: w.target, dropped: w.dropped }))
	};
}

const order = (a: string, b: string) => Number(!a.startsWith('src/lib/')) - Number(!b.startsWith('src/lib/')) || a.localeCompare(b);

export function remaining(dir: string, index: RuleIndex, options: RemainingOptions = {}): Remaining {
	dir = resolve(dir);
	const env: Env = { dir, index, aliases: readAliases(dir), wrappers: new Map(), baseComponents: new Map() };
	for (const wrapper of analyze(dir, index).wrappers) env.wrappers.set(wrapper.file, wrapper);
	const out: Remaining = { dir, check: { ran: false, errors: 0 }, files: [], general: [], appSteps: [], dropped: [], pages: [], layouts: [], global: [] };
	const current = (rel: string) => {
		try {
			return readFileSync(join(dir, rel), 'utf8');
		} catch {
			return undefined;
		}
	};

	const base = options.base ?? migrationBase(dir);
	let review = new Map<string, ReviewPoint[]>();
	if (base) {
		out.base = base;
		const snapshot = baseSnapshot(dir, base);
		if (snapshot)
			try {
				const found = reviewFromBase(env, snapshot, current);
				review = found.review;
				env.baseComponents = found.baseComponents;
				out.general = found.general;
				out.appSteps = found.appSteps;
				out.dropped = found.dropped;
			} finally {
				rmSync(snapshot, { recursive: true, force: true });
			}
	}

	const check = (options.check ?? svelteCheck)(dir);
	out.check = { ran: check.ran, errors: check.diagnostics.length, error: check.error };
	const errors = new Map<string, ErrorPoint[]>();
	const infos = new Map<string, FileInfo | undefined>();
	for (const d of check.diagnostics) {
		if (!infos.has(d.file)) infos.set(d.file, fileInfo(env, d.file));
		const info = infos.get(d.file);
		const point = info ? explain(env, info, d) : { ...d, explanations: [] };
		errors.set(d.file, [...(errors.get(d.file) ?? []), point]);
	}

	const withErrors = [...errors.keys()].sort(order);
	const reviewOnly = [...review.keys()].filter((file) => !errors.has(file)).sort(order);
	for (const file of [...withErrors, ...reviewOnly])
		out.files.push({
			file,
			errors: (errors.get(file) ?? []).sort((a, b) => a.line - b.line || a.column - b.column),
			review: (review.get(file) ?? []).sort((a, b) => a.lines[0] - b.lines[0])
		});

	if (base) Object.assign(out, pagesToLookAt(env, touchedFiles(dir, base), review));
	return out;
}
