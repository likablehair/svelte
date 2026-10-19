import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, posix, relative, resolve } from 'node:path';
import { Lines, listFiles } from './files.ts';
import { matchUsage, todoOf, type Effort, type Finding, type Usage } from './match.ts';
import { localRuleFor, type RuleIndex } from './rules.ts';
import { scanSvelte, type Attr, type ImportRecord, type SvelteFile } from './svelte.ts';
import type { AppDefault, ManualStep } from './types.ts';

const LIB = '@likable-hair/svelte';

export interface AppInfo {
	dir: string;
	name: string;
	packageManager: string;
	lib?: string;
	libInstalled?: string;
	svelte?: string;
	svelteInstalled?: string;
	kit?: string;
	tailwind?: string;
	lang?: string;
	paraglide?: string;
	git: { clean: boolean | null; branch?: string; changes?: number };
	warnings: string[];
}

export interface Wrapper {
	file: string;
	component: string;
	kind: 'thin' | 'logic';
	logic: string[];
	rest: boolean;
	forwarded: Record<string, string>;
	fixed: { props: number; styles: number };
	importers: number;
	usages: number;
}

export interface ComponentSummary {
	to?: string;
	status: 'ported' | 'renamed' | 'not-ported' | 'not-in-v4';
	usages: number;
	via: number;
	files: number;
}

export interface GeneralStep {
	id: string;
	component: string;
	summary: string;
	action: string;
	usages: number;
	files: number;
	byFile: Record<string, number>;
}

export interface AppStep {
	id: string;
	kind: ManualStep['kind'];
	summary: string;
	component?: string;
	needed: boolean | null;
	signal?: string;
}

export interface Analysis {
	app: AppInfo;
	usesLibrary: boolean;
	files: { scanned: number; svelte: number; importing: number; parseErrors: { file: string; error: string }[] };
	phase0: { svelte4: boolean; libV3: boolean; legacyFiles: number };
	legacySyntax: { on: number; slot: number; let: number };
	components: Record<string, ComponentSummary>;
	findings: Finding[];
	general: GeneralStep[];
	appSteps: AppStep[];
	wrappers: Wrapper[];
	unknown: Record<string, Record<string, number>>;
	icons: { attributes: number; data: number; dataFiles: number; dynamic: number; classes: number };
	detail: { handlers: number; elsewhere: number; files: number };
	tokens: { uses: number; overrides: number; rgbVar: number; files: number };
	language: { guess: 'it' | 'en' | null; it: number; en: number };
	styleProps: number;
	droppedDependencies: string[];
	appDefaults: AppDefault[];
	totals: {
		auto: number;
		check: number;
		manual: number;
		manualPoints: number;
		manualEdit: number;
		general: number;
		appSteps: number;
		appReview: number;
	};
}

const major = (range?: string) => (range ? Number(/(\d+)/.exec(range)?.[1]) : undefined);
const versionOf = (range?: string) => /(\d+(?:\.\d+){0,2})/.exec(range ?? '')?.[1];

function readJson(path: string): Record<string, any> | undefined {
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		return undefined;
	}
}

function compareVersions(a: string, b: string) {
	const pa = a.split('.').map(Number);
	const pb = b.split('.').map(Number);
	for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
	return 0;
}

const LOCKFILES: [string, string][] = [
	['pnpm-lock.yaml', 'pnpm'],
	['yarn.lock', 'yarn'],
	['bun.lockb', 'bun'],
	['bun.lock', 'bun'],
	['package-lock.json', 'npm']
];

export function lockfile(dir: string): { manager: string; dir: string } {
	for (let current = dir, depth = 0; depth < 4; depth++) {
		const found = LOCKFILES.find(([file]) => existsSync(join(current, file)));
		if (found) return { manager: found[1], dir: current };
		if (existsSync(join(current, '.git'))) break;
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return { manager: 'unknown', dir };
}

function paraglideRuntime(dir: string, deps: Record<string, string>): string | undefined {
	const version = deps['@inlang/paraglide-js'];
	if (!version || (major(version) ?? 0) < 2) return undefined;
	const config = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
		.map((name) => join(dir, name))
		.find((path) => existsSync(path));
	const outdir = (config && /\boutdir\s*:\s*['"]([^'"]+)['"]/.exec(readFileSync(config, 'utf8'))?.[1]) || './src/lib/paraglide';
	const folder = posix.normalize(outdir).replace(/^\.\//, '').replace(/\/$/, '');
	return folder.startsWith('src/lib/') ? `$lib/${folder.slice('src/lib/'.length)}/runtime` : `${posix.relative('src/routes', folder)}/runtime`;
}

function appInfo(dir: string): AppInfo {
	const pkg = readJson(join(dir, 'package.json')) ?? {};
	const deps = { ...pkg.devDependencies, ...pkg.dependencies } as Record<string, string>;
	const installed = (name: string) => readJson(join(dir, 'node_modules', name, 'package.json'))?.version;
	const packageManager = lockfile(dir).manager;
	let git: AppInfo['git'] = { clean: null };
	try {
		const status = execFileSync('git', ['-C', dir, 'status', '--porcelain', '--', '.'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		});
		const branch = execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
		const changes = status.split('\n').filter(Boolean).length;
		git = { clean: changes === 0, branch, changes };
	} catch {
		git = { clean: null };
	}
	const warnings: string[] = [];
	for (const [name, declared, version] of [
		[LIB, deps[LIB], installed(LIB)],
		['svelte', deps.svelte, installed('svelte')]
	] as const)
		if (declared && version && major(declared) !== major(version))
			warnings.push(`${name}: package.json asks for ${declared} but ${version} is installed; the analysis follows the installed one`);
	if (deps[LIB] && !existsSync(join(dir, 'node_modules')))
		warnings.push('node_modules is missing: versions come from package.json only');
	const html = existsSync(join(dir, 'src/app.html')) ? readFileSync(join(dir, 'src/app.html'), 'utf8') : '';
	return {
		dir,
		name: pkg.name ?? basename(dir),
		packageManager,
		lib: deps[LIB],
		libInstalled: installed(LIB),
		svelte: deps.svelte,
		svelteInstalled: installed('svelte'),
		kit: deps['@sveltejs/kit'],
		tailwind: deps.tailwindcss,
		lang: /<html[^>]*\blang="([^"%]+)"/.exec(html)?.[1],
		paraglide: paraglideRuntime(dir, deps),
		git,
		warnings
	};
}

export function readAliases(dir: string): [string, string][] {
	const aliases: [string, string][] = [['$lib', 'src/lib']];
	for (const name of ['svelte.config.js', 'svelte.config.ts', 'svelte.config.mjs']) {
		const path = join(dir, name);
		if (!existsSync(path)) continue;
		const block = /alias\s*:\s*\{([^}]*)\}/.exec(readFileSync(path, 'utf8'))?.[1] ?? '';
		for (const m of block.matchAll(/['"]?(\$?[\w@-]+(?:\/\*)?)['"]?\s*:\s*['"]\.?\/?([^'"]+)['"]/g))
			aliases.push([m[1].replace(/\/\*$/, ''), m[2].replace(/\/\*$/, '')]);
	}
	return aliases;
}

const IMPORT = /import\s+(type\s+)?(?:([\w$]+)\s*,?\s*)?(?:\*\s+as\s+([\w$]+)\s*)?(\{[^}]*\})?\s*from\s*['"]([^'"]+)['"]/g;

export function scriptImports(text: string, lines: Lines): ImportRecord[] {
	const records: ImportRecord[] = [];
	for (const m of text.matchAll(IMPORT)) {
		const [, typeAll, def, ns, named, source] = m;
		const line = lines.at(m.index!);
		if (def) records.push({ source, imported: 'default', local: def, type: !!typeAll, line });
		if (ns) records.push({ source, imported: '*', local: ns, type: !!typeAll, line });
		for (const part of (named ?? '').slice(1, -1).split(',')) {
			const spec = part.trim();
			if (!spec) continue;
			const type = !!typeAll || spec.startsWith('type ');
			const [imported, local] = spec.replace(/^type\s+/, '').split(/\s+as\s+/);
			records.push({ source, imported, local: local ?? imported, type, line });
		}
	}
	return records;
}

const isLib = (source: string) =>
	source === LIB || source.startsWith(`${LIB}/`) || source.includes(`node_modules/${LIB}`);

interface FileData {
	path: string;
	rel: string;
	text: string;
	lines: Lines;
	svelte?: SvelteFile;
	imports: ImportRecord[];
}

interface Resolved {
	lib?: string;
	wrapper?: string;
}

const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

const ITALIAN = /\b(Salva|Annulla|Conferma|Elimina|Modifica|Nuovo|Nuova|Cerca|Indietro|Chiudi|Aggiungi|Impostazioni|Utenti|Ruoli|Nome|Cognome|Profilo|Esci|Caricamento|Nessun|Seleziona)\b/g;
const ENGLISH = /\b(Save|Cancel|Confirm|Delete|Edit|New|Search|Back|Close|Add|Settings|Users|Roles|Name|Surname|Profile|Logout|Loading|No results|Select)\b/g;

export function guessLanguage(texts: string[]): Analysis['language'] {
	const markup = texts.map((text) => text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''));
	const it = markup.reduce((sum, text) => sum + count(text, ITALIAN), 0);
	const en = markup.reduce((sum, text) => sum + count(text, ENGLISH), 0);
	const guess = it + en < 3 ? null : it >= en * 2 ? 'it' : en >= it * 2 ? 'en' : null;
	return { guess, it, en };
}

export function analyze(dir: string, index: RuleIndex): Analysis {
	dir = resolve(dir);
	const app = appInfo(dir);
	const aliases = readAliases(dir);
	const roots = ['src', 'tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.ts', 'tailwind.config.mjs'];
	const paths = roots.flatMap((root) => {
		const path = join(dir, root);
		if (!existsSync(path)) return [];
		return root === 'src' ? listFiles(path) : [path];
	});

	const files: FileData[] = paths.map((path) => {
		const text = readFileSync(path, 'utf8');
		const lines = new Lines(text);
		const rel = relative(dir, path);
		if (path.endsWith('.svelte')) {
			const svelte = scanSvelte(text);
			return { path, rel, text, lines, svelte, imports: svelte.imports };
		}
		return { path, rel, text, lines, imports: /\.(ts|js|mjs|cjs)$/.test(path) ? scriptImports(text, lines) : [] };
	});

	const resolveLocal = (from: string, source: string) => {
		if (!source.endsWith('.svelte')) return undefined;
		if (source.startsWith('.')) return resolve(dirname(from), source);
		for (const [alias, target] of aliases)
			if (source === alias || source.startsWith(`${alias}/`)) return join(dir, target, source.slice(alias.length));
		return undefined;
	};

	const libName = (record: ImportRecord) => {
		if (record.imported === 'default') {
			const base = basename(record.source).replace(/\.svelte$/, '');
			return index.v4Components.has(base) ? base : undefined;
		}
		return record.imported === '*' ? undefined : record.imported;
	};

	const importers = new Map<string, Set<string>>();
	for (const file of files)
		for (const record of file.imports) {
			const target = resolveLocal(file.path, record.source);
			if (!target) continue;
			if (!importers.has(target)) importers.set(target, new Set());
			importers.get(target)!.add(file.rel);
		}

	const copies = new Map<string, string>();
	for (const file of files) {
		const rule = file.path.endsWith('.svelte') ? localRuleFor(index, file.path, file.text) : undefined;
		if (rule) copies.set(file.path, rule.from);
	}

	const libScope = (file: FileData) => {
		const scope = new Map<string, string>();
		const namespaces = new Set<string>();
		for (const record of file.imports) {
			const copy = record.imported === 'default' && !record.type ? copies.get(resolveLocal(file.path, record.source) ?? '') : undefined;
			if (copy && file.path !== resolveLocal(file.path, record.source)) scope.set(record.local, copy);
			if (!isLib(record.source) || record.type) continue;
			if (record.imported === '*') namespaces.add(record.local);
			const name = libName(record);
			if (name) scope.set(record.local, name);
		}
		return (tag: string) => {
			const [head, tail] = tag.split('.');
			if (tail && namespaces.has(head)) return tail;
			return tail ? undefined : scope.get(tag);
		};
	};

	const wrappers = new Map<string, Wrapper>();
	const wrapperCalls = new Map<string, { declared: Set<string>; events: Set<string> }>();
	for (const file of files) {
		const scan = file.svelte;
		if (!scan || scan.error) continue;
		const lookup = libScope(file);
		const libNodes = scan.components.filter((c) => lookup(c.tag));
		if (!libNodes.length) continue;
		const root =
			scan.topLevel.length === 1 && scan.topLevel[0].type === 'Component' && lookup(scan.topLevel[0].name)
				? libNodes.find((c) => c.start === scan.topLevel[0].start)
				: undefined;
		const named = /^Standard[A-Z]/.test(basename(file.path));
		const stem = basename(file.path, '.svelte').replace(/^Standard/, '').toLowerCase();
		const matchesName = (c: (typeof libNodes)[number]) => {
			const name = lookup(c.tag)!.toLowerCase();
			return stem.includes(name) || name.includes(stem);
		};
		const spreadsRest = (c: (typeof libNodes)[number]) =>
			c.attrs.some(
				(a) =>
					a.kind === 'spread' &&
					a.expression?.type === 'Identifier' &&
					[scan.restProp, '$$restProps', '$$props'].includes(a.expression.name)
			);
		const node =
			root ??
			libNodes.find((c) => matchesName(c) && spreadsRest(c)) ??
			libNodes.find(spreadsRest) ??
			(named ? (libNodes.find(matchesName) ?? libNodes[0]) : undefined);
		if (!node) continue;
		const declared = new Set(scan.declaredProps);
		const forwarded: Record<string, string> = {};
		const forwardedEvents = new Set<string>();
		let fixedProps = 0;
		let fixedStyles = 0;
		let rest = false;
		for (const attr of node.attrs) {
			if (attr.kind === 'spread') {
				rest = true;
				continue;
			}
			if (attr.kind === 'on' && !attr.expression) {
				forwardedEvents.add(attr.name);
				continue;
			}
			const identifier = attr.expression?.type === 'Identifier' ? attr.expression.name : undefined;
			if (identifier && declared.has(identifier)) forwarded[identifier] = attr.name;
			else if (attr.kind === 'style') fixedStyles++;
			else if (attr.kind !== 'let' && attr.kind !== 'other') fixedProps++;
		}
		const logic = [...new Set(scan.logic)];
		wrappers.set(file.path, {
			file: file.rel,
			component: lookup(node.tag)!,
			kind: root && !logic.length ? 'thin' : 'logic',
			logic,
			rest,
			forwarded,
			fixed: { props: fixedProps, styles: fixedStyles },
			importers: importers.get(file.path)?.size ?? 0,
			usages: 0
		});
		wrapperCalls.set(file.path, { declared, events: forwardedEvents });
	}

	const findings: Finding[] = [];
	const components: Record<string, ComponentSummary> = {};
	const componentFiles = new Map<string, Set<string>>();
	const general = new Map<string, GeneralStep>();
	const appStepsByComponent = new Map<string, AppStep>();
	const unknown: Analysis['unknown'] = {};
	const usageRanges = new Map<string, [number, number][]>();
	let styleProps = 0;
	const legacySyntax = { on: 0, slot: 0, let: 0 };

	const summary = (name: string) => {
		if (!components[name]) {
			const rule = index.byV4.get(name);
			const change = index.exportChanges.get(name);
			components[name] = {
				to: rule?.to ?? change?.replacement,
				status: rule
					? rule.to === name
						? 'ported'
						: 'renamed'
					: change
						? 'not-ported'
						: index.v5Exports.has(name)
							? 'ported'
							: 'not-in-v4',
				usages: 0,
				via: 0,
				files: 0
			};
			componentFiles.set(name, new Set());
		}
		return components[name];
	};

	const runUsage = (usage: Usage) => {
		const entry = summary(usage.component);
		if (usage.via) entry.via++;
		else entry.usages++;
		componentFiles.get(usage.component)!.add(usage.file);
		const rule = index.byV4.get(usage.component);
		if (!rule) {
			if (!usage.via)
				findings.push({
					effort: 'manual',
					kind: entry.status === 'not-ported' ? 'not-ported' : 'not-in-v4',
					id: `${usage.component}/${entry.status}`,
					name: usage.component,
					component: usage.component,
					to: entry.to,
					note: index.exportChanges.get(usage.component)?.note,
					file: usage.file,
					line: usage.line
				});
			return;
		}
		const api = index.rules.v5.components[rule.to];
		const result = matchUsage(usage, rule, api);
		findings.push(...result.findings);
		for (const step of result.general) {
			const key = `${usage.component}/${step.id}`;
			const current = general.get(key) ?? {
				id: step.id,
				component: usage.component,
				summary: step.summary,
				action: step.action,
				usages: 0,
				files: 0,
				byFile: {}
			};
			current.usages++;
			current.byFile[usage.file] = (current.byFile[usage.file] ?? 0) + 1;
			current.files = Object.keys(current.byFile).length;
			general.set(key, current);
		}
		for (const step of result.app)
			if (!step.automatic)
				appStepsByComponent.set(step.id, {
				id: step.id,
				kind: step.kind,
				summary: step.summary,
				component: usage.component,
				needed: null,
				signal: 'component used'
			});
		if (result.unknown.length) {
			const bucket = (unknown[usage.component] ??= {});
			for (const name of result.unknown) bucket[name] = (bucket[name] ?? 0) + 1;
		}
	};

	const filesImporting = new Set<string>();
	for (const file of files) {
		for (const record of file.imports) {
			if (!isLib(record.source)) continue;
			filesImporting.add(file.rel);
			const deep = record.source !== LIB;
			if (deep)
				findings.push({
					effort: 'manual',
					kind: 'deep-import',
					id: 'imports/deep',
					name: record.source,
					file: file.rel,
					line: record.line,
					note: 'Internal path of v4: import from the package root or replace the internal type.'
				});
			const name = libName(record);
			if (!name || deep) continue;
			if (index.v5Exports.has(name)) continue;
			const rule = index.byV4.get(name);
			const change = index.exportChanges.get(name);
			if (rule && rule.to !== name)
				findings.push({ effort: 'auto', kind: 'component-renamed', id: `imports/renamed/${name}`, name, to: rule.to, file: file.rel, line: record.line });
			else if (change)
				findings.push({
					effort: change.kind === 'component' ? 'manual' : 'check',
					kind: change.kind === 'component' ? 'not-ported' : 'export-changed',
					id: `imports/${change.kind}/${name}`,
					name,
					to: change.replacement,
					note: change.note,
					file: file.rel,
					line: record.line
				});
			else if (index.v4Exports.has(name))
				findings.push({ effort: 'check', kind: 'export-removed', id: `imports/removed/${name}`, name, file: file.rel, line: record.line });
			else
				findings.push({ effort: 'manual', kind: 'not-in-v4', id: `imports/not-in-v4/${name}`, name, file: file.rel, line: record.line });
		}

		const scan = file.svelte;
		if (!scan || scan.error) continue;
		const lookup = libScope(file);
		const localWrappers = new Map<string, string>();
		for (const record of scan.imports) {
			const target = resolveLocal(file.path, record.source);
			if (target && wrappers.has(target) && record.imported === 'default') localWrappers.set(record.local, target);
		}
		const ranges: [number, number][] = [];
		for (const node of scan.components) {
			const lib = lookup(node.tag);
			const wrapperPath = lib ? undefined : localWrappers.get(node.tag);
			if (!lib && !wrapperPath) continue;
			ranges.push(...node.attrs.map((a) => [a.start, a.end] as [number, number]));
			for (const attr of node.attrs) {
				if (attr.kind === 'style') styleProps++;
				if (attr.kind === 'on') legacySyntax.on++;
				if (attr.kind === 'let') legacySyntax.let++;
			}
			legacySyntax.slot += node.slots.length;
			if (lib) {
				runUsage({
					component: lib,
					file: file.rel,
					line: node.line,
					attrs: node.attrs,
					snippets: node.snippets,
					slots: node.slots,
					children: node.children,
					defaults: true,
					text: file.text,
					source: file.text.slice(node.start, node.end)
				});
				continue;
			}
			const wrapper = wrappers.get(wrapperPath!)!;
			const calls = wrapperCalls.get(wrapperPath!)!;
			wrapper.usages++;
			const attrs: Attr[] = [];
			for (const attr of node.attrs) {
				if (attr.kind === 'style') attrs.push(attr);
				else if (attr.kind === 'on') {
					if (calls.events.has(attr.name)) attrs.push(attr);
				} else if (attr.kind === 'prop' || attr.kind === 'bind' || attr.kind === 'event') {
					if (calls.declared.has(attr.name)) {
						const to = wrapper.forwarded[attr.name];
						if (to) attrs.push({ ...attr, name: to });
					} else if (wrapper.rest) attrs.push(attr);
				}
			}
			runUsage({
				component: wrapper.component,
				file: file.rel,
				line: node.line,
				via: wrapper.file,
				attrs,
				snippets: wrapper.rest ? node.snippets.filter((s) => !calls.declared.has(s)) : [],
				slots: [],
				children: false,
				defaults: false,
				text: file.text
			});
		}
		usageRanges.set(file.rel, ranges);
	}

	for (const [name, set] of componentFiles) components[name].files = set.size;

	const icons = { attributes: 0, data: 0, dataFiles: 0, dynamic: 0, classes: 0 };
	const detail = { handlers: 0, elsewhere: 0, files: 0 };
	const tokens = { uses: 0, overrides: 0, rgbVar: 0, files: 0 };
	const tokenPattern = new RegExp(index.rules.global.tokens.find, 'g');
	const boxStep = index.rules.global.manual.find((step: ManualStep) => step.id === 'global-background-boxes');
	let boxes = 0;
	const inRanges = (ranges: [number, number][] | undefined, offset: number) =>
		!!ranges?.some(([start, end]) => offset >= start && offset < end);

	for (const file of files) {
		const ranges = usageRanges.get(file.rel);
		let dataHere = 0;
		for (const m of file.text.matchAll(/(["'`])(mdi-[a-z0-9-]+)\1/g)) {
			if (inRanges(ranges, m.index!)) icons.attributes++;
			else dataHere++;
		}
		icons.data += dataHere;
		if (dataHere) icons.dataFiles++;
		icons.classes += count(file.text, /\bmdi\s+(?:mdi-[a-z0-9-]+|\{)/g);

		let detailHere = 0;
		for (const m of file.text.matchAll(/\.detail\b/g)) {
			if (inRanges(ranges, m.index!)) detail.handlers++;
			else {
				detail.elsewhere++;
				detailHere++;
			}
		}
		if (detailHere) detail.files++;

		const uses = count(file.text, tokenPattern);
		tokens.uses += uses;
		tokens.overrides += count(file.text, /--global-color-(?:light|dark)-[a-z]+-\d+\s*:/g);
		tokens.rgbVar += count(file.text, /rgba?\(\s*var\(\s*--global-color-/g);
		if (uses) tokens.files++;

		for (const m of file.text.matchAll(/bg-\[rgba?\(var\(--global-color-background-\d+\)[^\]]*\]|background(?:-color)?\s*:\s*rgba?\(\s*var\(\s*--global-color-background-\d+[^;"'}]*/g)) {
			boxes++;
			findings.push({
				effort: 'manual',
				kind: 'manual',
				id: 'global-background-boxes',
				name: m[0],
				note: boxStep?.summary,
				todo: 'review',
				file: file.rel,
				line: file.lines.at(m.index!)
			});
		}

		for (const m of file.text.matchAll(/(--[a-z][a-z0-9-]*)\s*:|var\(\s*(--[a-z][a-z0-9-]*)/g)) {
			const name = m[1] ?? m[2];
			const rule = index.cssVars.get(name);
			if (!rule || inRanges(ranges, m.index!)) continue;
			const effort: Effort =
				rule.kind === 'renamed'
					? rule.note
						? 'check'
						: 'auto'
					: rule.kind === 'removed'
						? rule.replacement
							? 'check'
							: 'manual'
						: 'check';
			findings.push({
				effort,
				kind: `css-var-${rule.kind}`,
				id: `${rule.component}/cssVars.${rule.kind}/${name}`,
				name,
				component: rule.component,
				to: rule.to ?? rule.replacement,
				note: rule.note,
				file: file.rel,
				line: file.lines.at(m.index!)
			});
		}

		const libLocals = new Map<string, string>();
		for (const record of file.imports)
			if (isLib(record.source)) {
				const name = libName(record);
				if (name) libLocals.set(record.local, name);
			}
		for (const m of file.text.matchAll(/ComponentProps<\s*typeof\s+([\w$]+)\s*>/g)) {
			const name = libLocals.get(m[1]);
			if (name)
				findings.push({
					effort: 'check',
					kind: 'component-props',
					id: `${name}/types/ComponentProps`,
					name: m[1],
					component: name,
					file: file.rel,
					line: file.lines.at(m.index!),
					note: 'Prop types follow the v5 component: svelte-check lists what no longer matches.'
				});
		}
	}

	const language = guessLanguage(files.filter((f) => f.svelte).map((f) => f.text));
	const allText = (pattern: RegExp, filter?: (file: FileData) => boolean) =>
		files.filter((f) => !filter || filter(f)).reduce((sum, f) => sum + count(f.text, pattern), 0);
	const imported = (name: string) =>
		files.some((f) => f.imports.some((r) => isLib(r.source) && r.imported === name));
	const pkg = readJson(join(dir, 'package.json')) ?? {};
	const declaredDeps = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
	const usedDropped = index.rules.global.package.droppedDependencies.filter(
		(dep) => !declaredDeps.has(dep) && files.some((f) => f.imports.some((r) => r.source === dep || r.source.startsWith(`${dep}/`)))
	);
	const css = (f: FileData) => /\.(css|pcss|postcss|scss|svelte)$/.test(f.path);
	const svelteInstalled = versionOf(app.svelteInstalled ?? app.svelte);
	const tailwindMajor = major(app.tailwind);
	const usedComponents = new Set(Object.keys(components));
	const has = (...names: string[]) => names.some((n) => usedComponents.has(n));
	const signals: Record<string, () => Pick<AppStep, 'needed' | 'signal'>> = {
		'global-svelte-version': () => ({
			needed: svelteInstalled ? compareVersions(svelteInstalled, '5.29.0') < 0 : null,
			signal: `svelte ${app.svelteInstalled ?? app.svelte ?? '?'}`
		}),
		'global-dependencies': () => ({
			needed: usedDropped.length > 0,
			signal: usedDropped.length ? `imported without being declared: ${usedDropped.join(', ')}` : 'none missing'
		}),
		'global-layers': () => ({ needed: true }),
		'global-tailwind-3': () => ({ needed: tailwindMajor === 3, signal: app.tailwind && `tailwindcss ${app.tailwind}` }),
		'global-tailwind-4': () => ({ needed: tailwindMajor === 4, signal: app.tailwind && `tailwindcss ${app.tailwind}` }),
		'global-internal-classes': () => {
			const n = allText(/:global\(/g, css);
			return { needed: n > 0 ? null : false, signal: `${n} :global( selectors to review` };
		},
		'global-background-boxes': () => ({ needed: boxes > 0, signal: `${boxes} boxes` }),
		'global-color-tokens': () => ({
			needed: null,
			signal: `${tokens.uses} uses, ${tokens.overrides} overrides: covered by v4-compat.css until cleanup`
		}),
		'global-dark-mode': () => {
			const dark = allText(/\.dark\b/g, css) + allText(/darkMode\s*:/g);
			const api = ['setTheme', 'toggleTheme'].filter(imported);
			return {
				needed: dark > 0 || api.length > 0 ? true : null,
				signal: `${dark} .dark selectors / darkMode settings${api.length ? `, uses ${api.join(', ')}` : ''}`
			};
		},
		'global-icons': () => ({
			needed: icons.attributes + icons.data + icons.classes > 0,
			signal: `${icons.attributes} in attributes, ${icons.data} in data, ${icons.classes} mdi classes`
		}),
		'global-callbacks': () => ({
			needed: detail.handlers + detail.elsewhere > 0,
			signal: `${detail.handlers} .detail in handlers, ${detail.elsewhere} elsewhere`
		}),
		'global-fonts': () => ({ needed: true }),
		'global-overlays': () => ({ needed: has('Dialog', 'Drawer', 'Menu'), signal: '' }),
		'global-default-locale': () => {
			const set = allText(/setDefaultLocale\s*\(/g) > 0;
			const italian = app.lang?.startsWith('it') || language.guess === 'it';
			return {
				needed: set ? false : italian || app.paraglide ? true : language.guess === 'en' ? false : null,
				signal: `<html lang="${app.lang ?? '?'}">, interface text: ${language.it} Italian words, ${language.en} English${app.paraglide ? ', paraglide: the language follows getLocale()' : ''}${set ? ', setDefaultLocale already called' : ''}`
			};
		},
		'global-app-toaster': () => {
			const local = files.filter((f) => /Toast(er)?\.svelte$/.test(f.path)).map((f) => f.rel);
			return { needed: local.length > 0, signal: local.join(', ') || 'no local toaster' };
		},
		'global-dates': () => {
			const n = allText(/\.toISOString\(\)/g);
			return {
				needed: has('DatePicker', 'DatePickerTextField', 'Calendar', 'PeriodPicker') && n > 0 ? true : null,
				signal: `${n} toISOString()`
			};
		},
		'global-time-fields': () => {
			const n = allText(/type=["']time["']/g);
			return { needed: n > 0, signal: `${n} type="time"` };
		},
		'global-date-time-fields': () => {
			const local = files.filter((f) => /DateTimePicker[^/]*\.svelte$/.test(f.path)).map((f) => f.rel);
			return { needed: local.length > 0, signal: local.join(', ') || 'none' };
		},
		'global-filter-converter': () => {
			const n = ['FilterConverter', 'Converter'].filter(imported);
			return { needed: n.length > 0, signal: n.join(', ') || 'not imported' };
		},
		'global-filter-backends': () => ({
			needed: has('Filters', 'DynamicTable', 'PaginatedTable', 'EnhancedPaginatedTable', 'DynamicFilters') ? true : null
		}),
		'global-filter-state': () => ({ needed: null }),
		'global-ssr-mobile': () => ({ needed: imported('mediaQuery') || has('MediaQuery') ? true : null })
	};
	const appSteps: AppStep[] = [
		...index.rules.global.manual.filter((step: ManualStep) => !step.automatic).map((step: ManualStep) => ({
			id: step.id,
			kind: step.kind,
			summary: step.summary,
			...(signals[step.id]?.() ?? { needed: null })
		})),
		...appStepsByComponent.values()
	];

	const parseErrors = files
		.filter((f) => f.svelte?.error)
		.map((f) => ({ file: f.rel, error: f.svelte!.error! }));
	const legacyFiles = files.filter((f) => f.svelte && (f.svelte.legacy.exportLet || f.svelte.legacy.reactive || f.svelte.legacy.dispatch)).length;
	const manualKeys = new Set(findings.filter((f) => f.effort === 'manual').map((f) => `${f.file}#${f.id}`));
	const editKeys = new Set(findings.filter((f) => f.effort === 'manual' && todoOf(f) === 'edit').map((f) => `${f.file}#${f.id}`));
	const generalSteps = [...general.values()];

	return {
		app,
		usesLibrary: filesImporting.size > 0 || !!app.lib,
		files: {
			scanned: files.length,
			svelte: files.filter((f) => f.svelte).length,
			importing: filesImporting.size,
			parseErrors
		},
		phase0: {
			svelte4: (major(app.svelteInstalled ?? app.svelte) ?? 5) < 5,
			libV3: (major(app.libInstalled ?? app.lib) ?? 4) < 4,
			legacyFiles
		},
		legacySyntax,
		components: Object.fromEntries(Object.entries(components).sort(([a], [b]) => a.localeCompare(b))),
		findings,
		general: generalSteps,
		appSteps,
		appDefaults: index.rules.components.flatMap((rule) => ((components[rule.from]?.usages ?? 0) + (components[rule.from]?.via ?? 0) > 0 ? (rule.appDefaults ?? []) : [])),
		wrappers: [...wrappers.values()].sort((a, b) => b.importers - a.importers || a.file.localeCompare(b.file)),
		unknown,
		icons,
		detail,
		tokens,
		language,
		styleProps,
		droppedDependencies: usedDropped,
		totals: {
			auto: findings.filter((f) => f.effort === 'auto').length,
			check: findings.filter((f) => f.effort === 'check').length,
			manual: findings.filter((f) => f.effort === 'manual').length,
			manualPoints: manualKeys.size,
			manualEdit: editKeys.size,
			general: generalSteps.length,
			appSteps: appSteps.filter((s) => s.needed === true).length,
			appReview: appSteps.filter((s) => s.needed === null).length
		}
	};
}
