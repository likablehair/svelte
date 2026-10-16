import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { analyze } from '../src/analyze.ts';
import { loadRules } from '../src/rules.ts';
import { dropThemePlaceholder, prepareBranch, setHtmlLang, updateAppCss, updatePackageJson, updateTailwindConfig, updateTitleTemplate } from '../src/setup.ts';

const fixture = fileURLToPath(new URL('./fixtures/app-v4', import.meta.url));
const dirs: string[] = [];

function copyApp() {
	const dir = mkdtempSync(join(tmpdir(), 'migrate-setup-'));
	dirs.push(dir);
	cpSync(fixture, dir, { recursive: true });
	return dir;
}

function gitRepo(dir: string) {
	const run = (...args: string[]) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' });
	run('init', '-q', '-b', 'master');
	run('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A');
	run('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'init');
	return (args: string[]) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('setup: package.json', () => {
	test('puts v5 in place of v4 and adds @mdi/js when the app uses MDI icons', () => {
		const dir = copyApp();
		const changes = updatePackageJson(dir, analyze(dir, loadRules()), '^5.0.0');
		const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
		expect(pkg.dependencies['@likable-hair/svelte']).toBe('^5.0.0');
		expect(pkg.dependencies['@mdi/js']).toBe('^7.4.47');
		expect(Object.keys(pkg.dependencies)).toEqual([...Object.keys(pkg.dependencies)].sort());
		expect(pkg.devDependencies['@likable-hair/svelte-migrate']).toMatch(/^\^\d/);
		expect(pkg.devDependencies['@likable-hair/svelte-mcp']).toMatch(/^\^\d/);
		expect(changes).toHaveLength(4);
	});

	test('copies a .tgz into vendor/ and keeps the indentation of the file', () => {
		const dir = copyApp();
		const tgz = join(dir, 'lib.tgz');
		writeFileSync(tgz, 'x');
		writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@likable-hair/svelte': '^4.3.1' } }, null, 2) + '\n');
		updatePackageJson(dir, analyze(dir, loadRules()), tgz);
		const text = readFileSync(join(dir, 'package.json'), 'utf8');
		expect(existsSync(join(dir, 'vendor/lib.tgz'))).toBe(true);
		expect(text).toContain('\n  "dependencies": {\n    "@likable-hair/svelte": "file:./vendor/lib.tgz"');
	});

	test('running it again changes nothing', () => {
		const dir = copyApp();
		updatePackageJson(dir, analyze(dir, loadRules()), '^5.0.0');
		expect(updatePackageJson(dir, analyze(dir, loadRules()), '^5.0.0')).toEqual([]);
	});
});

describe('setup: Svelte, Tailwind 3 and the buttons margin', () => {
	function tailwind3App(config: string) {
		const dir = copyApp();
		const path = join(dir, 'package.json');
		const pkg = JSON.parse(readFileSync(path, 'utf8'));
		pkg.dependencies.svelte = '^5.0.0';
		pkg.dependencies.tailwindcss = '^3.3.2';
		writeFileSync(path, JSON.stringify(pkg, null, '\t'));
		writeFileSync(join(dir, 'tailwind.config.js'), config);
		return dir;
	}

	test('raises svelte below 5.29, and tailwindcss when the dark variant needs it', () => {
		const dir = tailwind3App("import forms from '@tailwindcss/forms'\n\nconst config = {\n\tdarkMode: ['class'],\n\tplugins: [forms]\n}\n\nexport default config\n");
		updatePackageJson(dir, analyze(dir, loadRules()), '^5.0.0');
		const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
		expect(pkg.dependencies.svelte).toBe('^5.29.0');
		expect(pkg.dependencies.tailwindcss).toBe('^3.4.1');
	});

	test('the Tailwind 3 config gets the preset and the dark variant of the library, once', () => {
		const dir = tailwind3App("import forms from '@tailwindcss/forms'\n\nconst config = {\n\tdarkMode: ['class'],\n\tplugins: [forms]\n}\n\nexport default config\n");
		expect(updateTailwindConfig(dir, '^3.4.1')).toHaveLength(2);
		const text = readFileSync(join(dir, 'tailwind.config.js'), 'utf8');
		expect(text).toContain("import forms from '@tailwindcss/forms'\nimport aurora from '@likable-hair/svelte/tailwind-preset';\n");
		expect(text).toContain('const config = {\n\tpresets: [aurora],\n\tdarkMode: [\'variant\', [\'&:is([data-mode="dark"] *)\'');
		expect(updateTailwindConfig(dir, '^3.4.1')).toEqual([]);
		expect(updateTailwindConfig(dir, '^4.0.0')).toEqual([]);
	});

	test('an existing presets list gets the library preset first', () => {
		const dir = tailwind3App("export default {\n\tpresets: [other],\n\tcontent: []\n};\n");
		updateTailwindConfig(dir, '^3.4.1');
		expect(readFileSync(join(dir, 'tailwind.config.js'), 'utf8')).toBe(
			"import aurora from '@likable-hair/svelte/tailwind-preset';\nexport default {\n\tpresets: [aurora, other],\n\tcontent: []\n};\n"
		);
	});

	test('the v4 space above ConfirmOrCancelButtons becomes an app default', () => {
		const dir = copyApp();
		const changes = updateAppCss(dir, '@layer reset, theme;', false, true);
		expect(changes.some((c) => c.includes('--confirm-or-cancel-buttons-default-margin-top'))).toBe(true);
		const css = readFileSync(join(dir, 'src/app.css'), 'utf8');
		expect(css).toContain(':root {\n\t--confirm-or-cancel-buttons-default-margin-top: 20px;\n}\n');
		updateAppCss(dir, '@layer reset, theme;', false, true);
		expect(readFileSync(join(dir, 'src/app.css'), 'utf8')).toBe(css);
	});
});

describe('setup: branch', () => {
	test('creates the branch from the main branch without committing', () => {
		const dir = copyApp();
		const git = gitRepo(dir);
		expect(prepareBranch(dir, 'aurora-v5')).toBe('aurora-v5');
		expect(git(['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('aurora-v5');
		expect(git(['rev-list', '--count', 'HEAD'])).toBe('1');
		expect(prepareBranch(dir, 'aurora-v5')).toBe('aurora-v5');
	});

	test('refuses to start from a repository with uncommitted changes', () => {
		const dir = copyApp();
		gitRepo(dir);
		writeFileSync(join(dir, 'new.txt'), 'x');
		expect(() => prepareBranch(dir, 'aurora-v5')).toThrow(/uncommitted changes/);
	});

	test('on the migration branch the uncommitted changes are the migration: it goes on', () => {
		const dir = copyApp();
		gitRepo(dir);
		prepareBranch(dir, 'aurora-v5');
		writeFileSync(join(dir, 'new.txt'), 'x');
		expect(prepareBranch(dir, 'aurora-v5')).toBe('aurora-v5');
	});

	test('refuses to start from a feature branch', () => {
		const dir = copyApp();
		const git = gitRepo(dir);
		git(['switch', '-q', '-c', 'feature']);
		expect(() => prepareBranch(dir, 'aurora-v5')).toThrow(/is on "feature"/);
	});
});

describe('setup: package spec on a second run', () => {
	test('keeps a v5 already in package.json when no package is given', () => {
		const dir = copyApp();
		writeFileSync(
			join(dir, 'package.json'),
			JSON.stringify({
				dependencies: { '@likable-hair/svelte': 'file:./vendor/x.tgz', '@mdi/js': '^7.4.47' },
				devDependencies: { '@likable-hair/svelte-mcp': '^0.1.0', '@likable-hair/svelte-migrate': '^0.1.0' }
			})
		);
		expect(updatePackageJson(dir, analyze(dir, loadRules()))).toEqual([]);
	});
});

describe('setup: <html lang>', () => {
	test('sets the language of the interface on <html>, keeping the other attributes', () => {
		expect(setHtmlLang('<!DOCTYPE html>\n<html lang="en" class="%theme%">\n', 'it')).toBe('<!DOCTYPE html>\n<html lang="it" class="%theme%">\n');
		expect(setHtmlLang('<html>\n', 'it')).toBe('<html lang="it">\n');
		expect(setHtmlLang('<html lang="it-IT">', 'it')).toBe('<html lang="it-IT">');
	});
});

describe('setup: saved mode', () => {
	test('%theme% leaves <html>: the mode comes from appearanceScript', () => {
		expect(dropThemePlaceholder('<html lang="it" class="%theme%">')).toBe('<html lang="it">');
		expect(dropThemePlaceholder('<html class="h-full %theme%">')).toBe('<html class="h-full">');
		expect(dropThemePlaceholder('<html lang="it" data-mode="%theme%">')).toBe('<html lang="it">');
		const done = '<html class="h-full">';
		expect(dropThemePlaceholder(done)).toBe(done);
	});
});

describe('setup: tab title', () => {
	test('setTitleTemplate with the name of the <title> of the root layout, else of app.html', () => {
		const dir = copyApp();
		const layout = join(dir, 'src/routes/+layout.svelte');
		writeFileSync(layout, '<svelte:head><title>Tatum</title></svelte:head>\n<slot />\n');
		expect(updateTitleTemplate(dir)[0]).toContain("setTitleTemplate('{title} · Tatum')");
		expect(readFileSync(layout, 'utf8')).toContain("setTitleTemplate('{title} · Tatum');");
		expect(updateTitleTemplate(dir)).toEqual([]);

		writeFileSync(layout, '<slot />\n');
		writeFileSync(join(dir, 'src/app.html'), '<html><head><title>Biblio</title>%sveltekit.head%</head></html>');
		updateTitleTemplate(dir);
		expect(readFileSync(layout, 'utf8')).toContain("setTitleTemplate('{title} · Biblio');");
	});

	test('without a fixed title it only says what to do', () => {
		const dir = copyApp();
		const layout = join(dir, 'src/routes/+layout.svelte');
		writeFileSync(layout, '<svelte:head><title>{name}</title></svelte:head>\n');
		writeFileSync(join(dir, 'src/app.html'), '<html><head>%sveltekit.head%</head></html>');
		expect(updateTitleTemplate(dir)[0]).toContain('call setTitleTemplate');
		expect(readFileSync(layout, 'utf8')).toBe('<svelte:head><title>{name}</title></svelte:head>\n');
	});
});

