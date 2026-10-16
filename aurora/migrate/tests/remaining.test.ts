import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { codemod } from '../src/codemod.ts';
import { lineMap, messageNames, migrationBase, parseSvelteCheck, remaining, type Diagnostic } from '../src/remaining.ts';
import { nextReport, remainingReport } from '../src/report.ts';
import { loadRules } from '../src/rules.ts';
import { prepareBranch } from '../src/setup.ts';

const rules = loadRules();
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const svelte = (script: string, markup: string) => `<script lang="ts">\n${script}\n</script>\n\n${markup}\n`;

function app(files: Record<string, string>) {
	const dir = mkdtempSync(join(tmpdir(), 'migrate-remaining-'));
	dirs.push(dir);
	const all = { 'package.json': '{ "name": "demo", "dependencies": { "@likable-hair/svelte": "^4.3.0" } }\n', 'tsconfig.json': '{}\n', ...files };
	for (const [rel, text] of Object.entries(all)) {
		mkdirSync(dirname(join(dir, rel)), { recursive: true });
		writeFileSync(join(dir, rel), text);
	}
	const git = (...args: string[]) => execFileSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { stdio: 'ignore' });
	git('init', '-q', '-b', 'master');
	git('add', '-A');
	git('commit', '-q', '-m', 'v4');
	return { dir, read: (rel: string) => readFileSync(join(dir, rel), 'utf8') };
}

function at(text: string, needle: string, file: string, message: string, code = 2353): Diagnostic {
	const index = text.indexOf(needle);
	if (index < 0) throw new Error(`${needle} not in ${file}`);
	const before = text.slice(0, index).split('\n');
	return { file, line: before.length, column: before[before.length - 1].length + 1, message, code };
}

const V4 = {
	'src/lib/components/UsersTable.svelte': svelte(
		[
			"\timport { PaginatedTable } from '@likable-hair/svelte'",
			"\timport type { ComponentProps } from 'svelte'",
			"\tlet { ...rest }: ComponentProps<typeof PaginatedTable> = $props()"
		].join('\n'),
		'<PaginatedTable editFilterMode="one-edit" {...rest} />'
	),
	'src/lib/components/common/StandardTextfield.svelte': svelte(
		[
			"\timport { SimpleTextField } from '@likable-hair/svelte'",
			"\timport type { ComponentProps } from 'svelte'",
			'\tinterface Props extends ComponentProps<typeof SimpleTextField> { error?: boolean }',
			'\tlet { value = $bindable(), error = false, ...rest }: Props = $props()'
		].join('\n'),
		"<SimpleTextField bind:value --simple-textfield-border={error ? '1px solid red' : undefined} {...rest} />"
	),
	'src/lib/components/NameField.svelte': svelte(
		[
			"\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'",
			"\timport type { ComponentProps } from 'svelte'",
			'\tlet { value = $bindable(), ...rest }: ComponentProps<typeof StandardTextfield> = $props()'
		].join('\n'),
		'<div class="field"><StandardTextfield bind:value {...rest} /></div>'
	),
	'src/routes/users/+page.svelte': svelte(
		[
			"\timport { Button } from '@likable-hair/svelte'",
			"\timport UsersTable from '$lib/components/UsersTable.svelte'",
			"\timport NameField from '$lib/components/NameField.svelte'",
			"\tlet name = $state(''), saving = $state(false)"
		].join('\n'),
		'<NameField bind:value={name} />\n<Button loading={saving}>Save</Button>\n<UsersTable onrowClick={(e) => console.log(e.detail.item)} />'
	),
	'src/routes/other/+page.svelte': svelte('', '<p>untouched</p>')
};

describe('remaining: parsing', () => {
	test('reads the errors of svelte-check machine-verbose output, 1-based', () => {
		const output = [
			'1 START "/app"',
			'2 {"type":"ERROR","filename":"src/A.svelte","start":{"line":4,"character":2},"end":{"line":4,"character":9},"message":"Boom","code":2353,"source":"ts"}',
			'3 {"type":"WARNING","filename":"src/B.svelte","start":{"line":0,"character":0},"end":{"line":0,"character":1},"message":"Meh","code":"a11y"}',
			'4 COMPLETED 10 FILES 1 ERRORS 1 WARNINGS 2 FILES_WITH_PROBLEMS'
		].join('\n');
		expect(parseSvelteCheck(output)).toEqual([{ file: 'src/A.svelte', line: 5, column: 3, message: 'Boom', code: 2353 }]);
	});

	test('finds the prop names in the TypeScript messages', () => {
		expect(messageNames(`Object literal may only specify known properties, and '"menuProps"' does not exist in type 'Props'.`)).toEqual(['menuProps']);
		expect(messageNames("Property 'label' is missing in type '{ value: string; }' but required in type 'IconItem'.")).toEqual(['label']);
		expect(messageNames("Object literal may only specify known properties, but 'error' does not exist in type 'Props'. Did you mean to write 'onerror'?")).toEqual([
			'error',
			'onerror'
		]);
	});

	test('maps a line of the v4 file onto the current one', () => {
		const map = lineMap('a\nb\nc\nd\n', 'import x\na\nb2\nc\nd\n');
		expect(map(1)).toBe(2);
		expect(map(3)).toBe(4);
		expect(map(4)).toBe(5);
	});
});

describe('remaining: an app after the codemod', () => {
	function migrated() {
		const { dir, read } = app(V4);
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		return { dir, read };
	}

	test('setup records the commit the migration started from', () => {
		const { dir } = app(V4);
		const head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
		prepareBranch(dir, 'aurora-v5');
		expect(execFileSync('git', ['-C', dir, 'config', 'branch.aurora-v5.migrateBase'], { encoding: 'utf8' }).trim()).toBe(head);
		expect(migrationBase(dir)).toBe(head);
	});

	test('explains each svelte-check error with the rule of the v4 component', () => {
		const { dir, read } = migrated();
		const table = read('src/lib/components/UsersTable.svelte');
		const page = read('src/routes/users/+page.svelte');
		const diagnostics = [
			at(table, 'editFilterMode', 'src/lib/components/UsersTable.svelte', `Object literal may only specify known properties, and '"editFilterMode"' does not exist in type 'Props'.`),
			at(page, 'onrowClick', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"onrowClick"' does not exist in type 'Props'.`)
		];
		const result = remaining(dir, rules, { check: () => ({ ran: true, diagnostics }) });
		const [tableFile, pageFile] = result.files.filter((f) => f.errors.length);
		expect(tableFile.file).toBe('src/lib/components/UsersTable.svelte');
		expect(tableFile.errors[0]).toMatchObject({ component: 'DataTable', name: 'editFilterMode' });
		expect(tableFile.errors[0].explanations[0].id).toBe('PaginatedTable/props.removed/editFilterMode');
		expect(pageFile.errors[0]).toMatchObject({ component: 'DataTable', name: 'onrowClick', via: { tag: 'UsersTable', file: 'src/lib/components/UsersTable.svelte' } });
		expect(pageFile.errors[0].explanations[0].id).toBe('PaginatedTable/events.changed/onrowClick');
		expect(pageFile.errors[0].hint).toContain('app component');
	});

	test('a prop an app component passed to a dissolved wrapper gets the recipe of that wrapper', () => {
		const { dir, read } = app({
			...V4,
			'src/routes/users/+page.svelte': svelte(
				"\timport NameField from '$lib/components/NameField.svelte'\n\tlet name = $state(''), wrong = $state(false)",
				'<NameField bind:value={name} error={wrong} />'
			)
		});
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const page = read('src/routes/users/+page.svelte');
		const diagnostics = [at(page, 'error=', 'src/routes/users/+page.svelte', "Object literal may only specify known properties, but 'error' does not exist in type 'Props'.")];
		const point = remaining(dir, rules, { check: () => ({ ran: true, diagnostics }) }).files[0].errors[0];
		expect(point).toMatchObject({ component: 'SimpleTextField', name: 'error' });
		expect(point.explanations[0].text).toContain("state={error ? 'error' : undefined}");
	});

	test('lists what to look at from the v4 code and the pages that use the changed files', () => {
		const { dir } = migrated();
		const result = remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) });
		const page = result.files.find((f) => f.file === 'src/routes/users/+page.svelte')!;
		expect(page.errors).toEqual([]);
		expect(page.review.some((p) => p.component === 'Button' && p.kind === 'manual')).toBe(true);
		expect(result.pages.map((p) => p.route)).toEqual(['/users']);
		expect(result.pages[0].touched).toContain('src/lib/components/UsersTable.svelte');
		const next = nextReport(result);
		expect(next).toContain('No svelte-check errors left');
		expect(next).toContain('/users');
		expect(remainingReport(result)).toContain('## Pages to try');
	});

	test('next shows the first file with errors, then the others', () => {
		const { dir, read } = migrated();
		const table = read('src/lib/components/UsersTable.svelte');
		const page = read('src/routes/users/+page.svelte');
		const diagnostics = [
			at(page, 'onrowClick', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"onrowClick"' does not exist in type 'Props'.`),
			at(table, 'editFilterMode', 'src/lib/components/UsersTable.svelte', `Object literal may only specify known properties, and '"editFilterMode"' does not exist in type 'Props'.`)
		];
		const next = nextReport(remaining(dir, rules, { check: () => ({ ran: true, diagnostics }) }));
		expect(next.indexOf('## src/lib/components/UsersTable.svelte')).toBeGreaterThan(0);
		expect(next).toContain('- src/routes/users/+page.svelte: 1 errors');
		expect(next).not.toContain('## src/routes/users/+page.svelte');
	});

	test('each point says whether it needs code or only a look', () => {
		const { dir } = migrated();
		const result = remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) });
		const table = result.files.find((f) => f.file === 'src/lib/components/UsersTable.svelte')!;
		const page = result.files.find((f) => f.file === 'src/routes/users/+page.svelte')!;
		expect(table.review.find((p) => p.id === 'PaginatedTable/props.removed/editFilterMode')?.todo).toBe('edit');
		expect(page.review.find((p) => p.id === 'button-loading')?.todo).toBe('review');
		expect(result.files[0].file).toBe('src/lib/components/UsersTable.svelte');
	});

	test('next lists the points to write file by file, then the points to look at by component', () => {
		const { dir } = migrated();
		const next = nextReport(remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) }));
		const write = next.indexOf('## To write');
		const look = next.indexOf('## To look at, by component');
		const pages = next.indexOf('## Pages to try');
		expect(write).toBeGreaterThan(0);
		expect(look).toBeGreaterThan(write);
		expect(pages).toBeGreaterThan(look);
		expect(next.slice(write, look)).toContain('### src/lib/components/UsersTable.svelte');
		expect(next.slice(write, look)).toContain('editFilterMode');
		expect(next.slice(write, look)).not.toContain('button-loading');
		const button = next.slice(next.indexOf('### Button', look));
		expect(button).toMatch(/^### Button\n\nPages: \/users\n/);
		expect(button).toContain('`button-loading`\n  - src/routes/users/+page.svelte:');
	});

	test('next keeps the points to look at for the end while there are errors, unless a file is asked for', () => {
		const { dir, read } = migrated();
		const page = read('src/routes/users/+page.svelte');
		const diagnostics = [
			at(page, 'onrowClick', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"onrowClick"' does not exist in type 'Props'.`)
		];
		const result = remaining(dir, rules, { check: () => ({ ran: true, diagnostics }) });
		const next = nextReport(result);
		expect(next).toContain('## src/routes/users/+page.svelte');
		expect(next).not.toContain('button-loading');
		expect(next).toMatch(/\d+ points to look at in this file come at the end/);
		const file = nextReport(result, 'src/routes/users/+page.svelte');
		expect(file).toContain('### To look at in this file');
		expect(file).toContain('button-loading');
		expect(remainingReport(result)).toContain('| file | errors | to write | to look at | components |');
	});

	test('without svelte-check it says so and still lists what to look at', () => {
		const { dir } = migrated();
		const result = remaining(dir, rules, { check: () => ({ ran: false, diagnostics: [], error: 'svelte-check is not installed in the app' }) });
		expect(nextReport(result)).toContain('svelte-check did not run');
		expect(result.files.some((f) => f.review.length)).toBe(true);
	});
});
