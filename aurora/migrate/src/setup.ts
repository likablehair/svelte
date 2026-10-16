import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import type { Analysis } from './analyze.ts';
import { addV4Compat, findAppCss, prepareAppCss, useLibraryFonts } from './css.ts';
import { listFiles } from './files.ts';
import { addAppearance, addDefaultLocale, addTitleTemplate, staticTitle } from './layout.ts';

const LIB = '@likable-hair/svelte';
const MDI = ['@mdi/js', '^7.4.47'] as const;
const OWN_VERSION: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
export const AGENT_TOOLS = [
	['@likable-hair/svelte-migrate', `^${OWN_VERSION}`, 'the migration tools for coding agents, until the migration is over'],
	['@likable-hair/svelte-mcp', `^${OWN_VERSION}`, 'MCP server and skills for coding agents']
] as const;
const MAIN_BRANCHES = new Set(['master', 'main', 'develop', 'dev']);

export interface SetupOptions {
	packageSpec?: string;
	branch: string;
	install: boolean;
	layers: string;
	locale?: string;
}

export interface SetupResult {
	branch: string;
	changes: string[];
	install?: string;
}

const git = (dir: string, args: string[]) =>
	execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export const currentBranch = (dir: string) => git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);

export function prepareBranch(dir: string, branch: string): string {
	const current = currentBranch(dir);
	if (current === branch) return current;
	const dirty = git(dir, ['status', '--porcelain']);
	if (dirty)
		throw new Error(
			`The repository of ${dir} has uncommitted changes: commit or stash them first, so that the migration is the only change.`
		);
	if (!MAIN_BRANCHES.has(current))
		throw new Error(`${dir} is on "${current}": switch to the main branch or pass --branch ${current} to keep working on it.`);
	const base = git(dir, ['rev-parse', 'HEAD']);
	git(dir, ['switch', '-c', branch]);
	git(dir, ['config', `branch.${branch}.migrateBase`, base]);
	return branch;
}

function indentOf(text: string) {
	return /\n([ \t]+)"/.exec(text)?.[1] ?? '\t';
}

function setDependency(pkg: Record<string, any>, name: string, version: string, section = 'dependencies') {
	const current = ['dependencies', 'devDependencies'].find((s) => pkg[s]?.[name]) ?? section;
	pkg[current] ??= {};
	if (pkg[current][name] === version) return false;
	pkg[current][name] = version;
	pkg[current] = Object.fromEntries(Object.entries(pkg[current]).sort(([a], [b]) => a.localeCompare(b)));
	return true;
}

const isV5 = (spec: string | undefined) => !!spec && (spec.startsWith('file:') || /^[\^~>=]*5\./.test(spec));

export function updatePackageJson(dir: string, analysis: Analysis, packageSpec?: string): string[] {
	const path = join(dir, 'package.json');
	const text = readFileSync(path, 'utf8');
	const pkg = JSON.parse(text);
	const changes: string[] = [];
	const current = pkg.dependencies?.[LIB] ?? pkg.devDependencies?.[LIB];
	let spec = packageSpec ?? (isV5(current) ? current : '^5.0.0');
	if (packageSpec?.endsWith('.tgz') && existsSync(packageSpec)) {
		mkdirSync(join(dir, 'vendor'), { recursive: true });
		const name = basename(packageSpec);
		copyFileSync(resolve(packageSpec), join(dir, 'vendor', name));
		spec = `file:./vendor/${name}`;
		changes.push(`vendor/${name}: copy of the v5 package`);
	}
	if (setDependency(pkg, LIB, spec)) changes.push(`package.json: ${LIB} ${spec}`);
	if (analysis.icons.attributes + analysis.icons.data > 0 && setDependency(pkg, MDI[0], MDI[1]))
		changes.push(`package.json: ${MDI[0]} ${MDI[1]} (MDI icons become SVG paths)`);
	const oldLib = (() => {
		try {
			return JSON.parse(readFileSync(join(dir, 'node_modules', LIB, 'package.json'), 'utf8'));
		} catch {
			return {};
		}
	})();
	for (const dep of analysis.droppedDependencies) {
		const version = oldLib.dependencies?.[dep] ?? 'latest';
		if (setDependency(pkg, dep, version)) changes.push(`package.json: ${dep} ${version} (imported by the app, came with v4)`);
	}
	for (const [name, version, why] of AGENT_TOOLS) {
		if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) continue;
		setDependency(pkg, name, version, 'devDependencies');
		changes.push(`package.json: ${name} ${version} (${why})`);
	}
	if (changes.length) writeFileSync(path, JSON.stringify(pkg, null, indentOf(text)) + (text.endsWith('\n') ? '\n' : ''));
	return changes;
}

export function updateAppCss(dir: string, layers: string, compat = false): string[] {
	const files = listFiles(join(dir, 'src'))
		.filter((path) => /\.(css|pcss|postcss)$/.test(path))
		.map((path) => ({ rel: relative(dir, path), text: readFileSync(path, 'utf8') }));
	const rel = findAppCss(files);
	if (!rel) return ['no main CSS file found: add the cascade layer order to the app CSS by hand'];
	const file = files.find((f) => f.rel === rel)!;
	const others = [
		...listFiles(join(dir, 'src')).filter((path) => relative(dir, path) !== rel),
		...['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.ts', 'src/app.html']
			.map((name) => join(dir, name))
			.filter((path) => existsSync(path))
	].map((path) => readFileSync(path, 'utf8'));
	const usedElsewhere = (family: string) => {
		const pattern = new RegExp(`font-family[^;{}]*\\b${family}\\b|['"]${family}['"]|family=${family.replaceAll(' ', '\\+')}\\b`);
		return others.some((text) => pattern.test(text));
	};
	const layered = prepareAppCss(file.text, layers);
	const fonts = useLibraryFonts(layered.text, usedElsewhere);
	const colors = compat ? addV4Compat(fonts.text) : { text: fonts.text, changes: [] };
	if (colors.text !== file.text) writeFileSync(join(dir, rel), colors.text);
	return [...layered.changes, ...fonts.changes, ...colors.changes].map((change) => `${rel}: ${change}`);
}

export function appLocale(analysis: Analysis, locale?: string) {
	if (locale) return locale;
	const lang = analysis.app.lang?.split('-')[0];
	if (lang && lang !== 'en') return lang;
	return analysis.language.guess === 'it' ? 'it' : undefined;
}

export function updateRootLayout(dir: string, locale: string): string[] {
	const rel = 'src/routes/+layout.svelte';
	const path = join(dir, rel);
	if (!existsSync(path)) return [`${rel} is missing: create it and call setDefaultLocale('${locale}') in its script`];
	const result = addDefaultLocale(readFileSync(path, 'utf8'), locale, existsSync(join(dir, 'tsconfig.json')));
	if (!result.changed) return [];
	writeFileSync(path, result.text);
	return [`${rel}: setDefaultLocale('${locale}') (texts and date formats of the components in that language)`];
}

export function updateTitleTemplate(dir: string): string[] {
	const rel = 'src/routes/+layout.svelte';
	const path = join(dir, rel);
	if (!existsSync(path)) return [];
	const source = readFileSync(path, 'utf8');
	const html = join(dir, 'src/app.html');
	const name = staticTitle(source) ?? (existsSync(html) ? staticTitle(readFileSync(html, 'utf8')) : undefined);
	if (!name) {
		if (/\bsetTitleTemplate\s*\(/.test(source)) return [];
		return [`${rel}: no fixed <title> found, so setTitleTemplate is not called: call setTitleTemplate('{title} · <app name>') by hand to let PageHeader write the tab title`];
	}
	const result = addTitleTemplate(source, name, existsSync(join(dir, 'tsconfig.json')));
	if (!result.changed) return [];
	writeFileSync(path, result.text);
	return [`${rel}: setTitleTemplate('{title} · ${name}') (every PageHeader writes the tab title, "${name}" stays for the pages without one)`];
}

export function setHtmlLang(html: string, locale: string): string {
	const tag = /<html\b[^>]*>/.exec(html);
	if (!tag) return html;
	const lang = /\blang=(["'])([^"']*)\1/.exec(tag[0]);
	if (lang && lang[2].split('-')[0] === locale.split('-')[0]) return html;
	const updated = lang ? tag[0].replace(lang[0], `lang="${locale}"`) : tag[0].replace(/^<html/, `<html lang="${locale}"`);
	return html.slice(0, tag.index) + updated + html.slice(tag.index + tag[0].length);
}

export function dropThemePlaceholder(html: string): string {
	const tag = /<html\b[^>]*>/.exec(html);
	if (!tag || !tag[0].includes('%theme%')) return html;
	let updated = tag[0].replace(/\s+data-mode=(["'])%theme%\1/, '');
	const cls = /\sclass=(["'])([^"']*)\1/.exec(updated);
	if (cls && cls[2].includes('%theme%')) {
		const rest = cls[2].replace('%theme%', '').trim().replace(/\s+/g, ' ');
		updated = updated.replace(cls[0], rest ? ` class="${rest}"` : '');
	}
	return html.slice(0, tag.index) + updated + html.slice(tag.index + tag[0].length);
}

export function updateAppearance(dir: string): string[] {
	const changes: string[] = [];
	const htmlPath = join(dir, 'src/app.html');
	if (existsSync(htmlPath)) {
		const html = readFileSync(htmlPath, 'utf8');
		const text = dropThemePlaceholder(html);
		if (text !== html) {
			writeFileSync(htmlPath, text);
			changes.push('src/app.html: removed %theme% from <html> (the saved mode is applied by appearanceScript in the root layout)');
		}
	}
	const rel = 'src/routes/+layout.svelte';
	const layout = join(dir, rel);
	if (!existsSync(layout)) return [...changes, `${rel} is missing: create it, call rememberAppearance() and put appearanceScript() in <svelte:head>`];
	const result = addAppearance(readFileSync(layout, 'utf8'), existsSync(join(dir, 'tsconfig.json')));
	if (result.changed) {
		writeFileSync(layout, result.text);
		changes.push(`${rel}: rememberAppearance() and appearanceScript() (the light/dark choice is kept in localStorage, key "theme" as in v4, and applied before the first paint)`);
	}
	return changes;
}

export function updateHtmlLang(dir: string, locale: string): string[] {
	const path = join(dir, 'src/app.html');
	if (!existsSync(path)) return [];
	const html = readFileSync(path, 'utf8');
	const text = setHtmlLang(html, locale);
	if (text === html) return [];
	writeFileSync(path, text);
	return [`src/app.html: <html lang="${locale}"> (the language of the interface, read by screen readers)`];
}

export function installCommand(packageManager: string) {
	return packageManager === 'unknown' ? 'npm' : packageManager;
}

export function setup(dir: string, analysis: Analysis, options: SetupOptions): SetupResult {
	const branch = prepareBranch(dir, options.branch);
	const changes = updatePackageJson(dir, analysis, options.packageSpec);
	const installNeeded = changes.length > 0;
	changes.push(...updateAppCss(dir, options.layers, analysis.tokens.uses + analysis.tokens.overrides > 0));
	const locale = appLocale(analysis, options.locale);
	if (locale) changes.push(...updateRootLayout(dir, locale), ...updateHtmlLang(dir, locale));
	changes.push(...updateAppearance(dir), ...updateTitleTemplate(dir));
	let install: string | undefined;
	if (options.install && installNeeded) {
		install = `${installCommand(analysis.app.packageManager)} install`;
		execFileSync(installCommand(analysis.app.packageManager), ['install'], { cwd: dir, stdio: 'inherit' });
	}
	return { branch, changes, install };
}
