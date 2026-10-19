import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { codemod } from '../src/codemod.ts';
import { lineMap, messageNames, migrationBase, parseSvelteCheck, readBaseline, recordBaseline, remaining, type Diagnostic } from '../src/remaining.ts';
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
		'<PaginatedTable quickFiltersVisible {...rest} />'
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
		'<NameField bind:value={name} />\n<Button loading={saving}>Save</Button>\n<UsersTable searchBarVisible={false} />'
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
			at(table, 'quickFiltersVisible', 'src/lib/components/UsersTable.svelte', `Object literal may only specify known properties, and '"quickFiltersVisible"' does not exist in type 'Props'.`),
			at(page, 'searchBarVisible', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"searchBarVisible"' does not exist in type 'Props'.`)
		];
		const result = remaining(dir, rules, { check: () => ({ ran: true, diagnostics }) });
		const [tableFile, pageFile] = result.files.filter((f) => f.errors.length);
		expect(tableFile.file).toBe('src/lib/components/UsersTable.svelte');
		expect(tableFile.errors[0]).toMatchObject({ component: 'DataTable', name: 'quickFiltersVisible' });
		expect(tableFile.errors[0].explanations[0].id).toBe('PaginatedTable/props.removed/quickFiltersVisible');
		expect(pageFile.errors[0]).toMatchObject({ component: 'DataTable', name: 'searchBarVisible', via: { tag: 'UsersTable', file: 'src/lib/components/UsersTable.svelte' } });
		expect(pageFile.errors[0].explanations[0].id).toBe('PaginatedTable/props.removed/searchBarVisible');
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
			at(page, 'searchBarVisible', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"searchBarVisible"' does not exist in type 'Props'.`),
			at(table, 'quickFiltersVisible', 'src/lib/components/UsersTable.svelte', `Object literal may only specify known properties, and '"quickFiltersVisible"' does not exist in type 'Props'.`)
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
		expect(table.review.find((p) => p.id === 'PaginatedTable/props.removed/quickFiltersVisible')?.todo).toBe('edit');
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
		expect(next.slice(write, look)).toContain('quickFiltersVisible');
		expect(next.slice(write, look)).not.toContain('button-loading');
		const button = next.slice(next.indexOf('### Button', look));
		expect(button).toMatch(/^### Button\n\nPages: \/users\n/);
		expect(button).toContain('`button-loading`\n  - src/routes/users/+page.svelte:');
	});

	test('next keeps the points to look at for the end while there are errors, unless a file is asked for', () => {
		const { dir, read } = migrated();
		const page = read('src/routes/users/+page.svelte');
		const diagnostics = [
			at(page, 'searchBarVisible', 'src/routes/users/+page.svelte', `Object literal may only specify known properties, and '"searchBarVisible"' does not exist in type 'Props'.`)
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

describe('remaining: errors already in the v4 code', () => {
	const old: Diagnostic = { file: 'src/routes/other/+page.svelte', line: 3, column: 1, message: "Property 'x' does not exist on type 'Y'.", code: 2339 };
	const fresh: Diagnostic = { file: 'src/routes/users/+page.svelte', line: 4, column: 1, message: "Object literal may only specify known properties, and '\"searchBarVisible\"' does not exist in type 'Props'.", code: 2353 };

	test('setup records them in the git folder, for the commit the migration started from', () => {
		const { dir } = app(V4);
		prepareBranch(dir, 'aurora-v5');
		const base = migrationBase(dir)!;
		expect(recordBaseline(dir, base, () => ({ ran: true, diagnostics: [old] })).ran).toBe(true);
		expect(readBaseline(dir, base)).toEqual([old]);
		expect(readBaseline(dir, 'another-commit')).toBeUndefined();
		expect(execFileSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf8' })).toBe('');
	});

	test('next and status list them apart and they do not count as errors of the migration', () => {
		const { dir } = app(V4);
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const moved = { ...old, line: 9 };
		const result = remaining(dir, rules, { baseline: [old], check: () => ({ ran: true, diagnostics: [moved, fresh] }) });
		expect(result.check).toMatchObject({ errors: 1, before: 1 });
		expect(result.before).toEqual([moved]);
		expect(result.files.filter((f) => f.errors.length).map((f) => f.file)).toEqual(['src/routes/users/+page.svelte']);
		expect(nextReport(result)).toContain('svelte-check: **1 errors** in 1 files (plus 1 already in the v4 code)');
		expect(remainingReport(result)).toContain('## Errors already there in the v4 code, before the migration');
		const done = remaining(dir, rules, { baseline: [old], check: () => ({ ran: true, diagnostics: [moved] }) });
		expect(nextReport(done)).toContain('No errors from the migration left (the 1 errors of svelte-check that were already there in the v4 code');
	});
});

describe('remaining: look', () => {
	test('a box filled with a v4 background tone is a point to look at, with the surface and border advice', () => {
		const page = svelte("\timport { Button } from '@likable-hair/svelte'", '<div class="rounded-md bg-[rgb(var(--global-color-background-200))] p-4"><Button>Save</Button></div>');
		const { dir } = app({ 'src/routes/+page.svelte': page, 'src/app.css': '.card {\n\tbackground: rgb(var(--global-color-background-100));\n}\n' });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const points = remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) })
			.files.flatMap((f) => f.review.map((p) => ({ ...p, file: f.file })))
			.filter((p) => p.id === 'global-background-boxes');
		expect(points.map((p) => [p.file, p.todo, p.lines])).toEqual([
			['src/app.css', 'review', [2]],
			['src/routes/+page.svelte', 'review', [5]]
		]);
		expect(points[0].text).toContain('var(--global-color-surface)');
	});
});

describe('remaining: types read from ComponentProps', () => {
	test('an optional prop type that brings undefined points to the exported type', () => {
		const spec = { components: [{ name: 'IconsDropdown', props: [{ name: 'values', type: 'IconItem<Data>[]' }] }] };
		const editor = svelte(
			"\timport { IconsDropdown } from '@likable-hair/svelte'\n\timport type { ComponentProps } from 'svelte'\n\tlet items: ComponentProps<typeof IconsDropdown>['values'] = []\n\tlet first = items[0]",
			'<IconsDropdown {items} />'
		);
		const { dir } = app({ 'src/lib/Editor.svelte': editor, 'node_modules/@likable-hair/svelte/dist/spec.json': JSON.stringify(spec) });
		const diagnostics = [at(editor, 'items[0]', 'src/lib/Editor.svelte', "'items' is possibly 'undefined'.", 18048)];
		const [point] = remaining(dir, rules, { base: '', check: () => ({ ran: true, diagnostics }) }).files[0].errors;
		expect(point).toMatchObject({ component: 'IconsDropdown', name: 'values' });
		expect(point.explanations[0].text).toContain("Type it with `IconItem[]` (`import type { IconItem } from '@likable-hair/svelte'`)");
	});

	test('a v4 prop destructured from props typed with the library explains the rename', () => {
		const table = svelte(
			[
				"\timport { DataTable } from '@likable-hair/svelte'",
				"\timport type { ComponentProps } from 'svelte'",
				'\ttype TableProps = ComponentProps<typeof DataTable<{ id: number }>>',
				"\ttype Props = { rows: { id: number }[] } & Omit<TableProps, 'rows'>",
				"\tlet { rows, searchBarColumns = ['name'], ...rest }: Props = $props()"
			].join('\n'),
			'<DataTable {rows} searchColumns={searchBarColumns} {...rest} />'
		);
		const { dir } = app({ 'src/lib/AccountsTable.svelte': table });
		const diagnostics = [at(table, 'searchBarColumns =', 'src/lib/AccountsTable.svelte', "Property 'searchBarColumns' does not exist on type 'Props'.", 2339)];
		const [point] = remaining(dir, rules, { base: '', check: () => ({ ran: true, diagnostics }) }).files[0].errors;
		expect(point).toMatchObject({ component: 'DataTable', name: 'searchBarColumns' });
		expect(point.explanations[0].text).toContain('`searchBarColumns` is now `searchColumns`');
		expect(point.hint).toContain('use the v5 name in the destructuring');
	});

	test('an app component that passes its props to another app wrapper explains with the library rule', () => {
		const page = svelte(
			"\timport AdminTable from '$lib/AdminTable.svelte'",
			'<AdminTable>\n\t{#snippet actionsSnippet({ item })}{item.id}{/snippet}\n</AdminTable>'
		);
		const { dir } = app({
			'svelte.config.js': "export default { kit: { alias: { $lib: 'src/lib' } } };\n",
			'src/lib/UsersTable.svelte': svelte("\timport { DataTable } from '@likable-hair/svelte'\n\tlet { users = [], ...rest } = $props()", '<DataTable rows={users} {...rest} />'),
			'src/lib/AdminTable.svelte': svelte("\timport UsersTable from './UsersTable.svelte'\n\tlet { ...rest } = $props()", '<UsersTable {...rest} />'),
			'src/routes/+page.svelte': page
		});
		const diagnostics = [at(page, 'item }', 'src/routes/+page.svelte', "Property 'item' does not exist on type '{ row: { id: number; }; }'.", 2339)];
		const [point] = remaining(dir, rules, { base: '', check: () => ({ ran: true, diagnostics }) }).files[0].errors;
		expect(point).toMatchObject({ component: 'DataTable', via: { tag: 'AdminTable', file: 'src/lib/AdminTable.svelte' } });
		expect(point.explanations.some((e) => e.text.includes('receives `{ row }`'))).toBe(true);
	});
});

describe('remaining: steps with unless', () => {
	test('a point leaves next once the usage has one of its unless props', () => {
		const page = svelte(
			"\timport { Dialog } from '@likable-hair/svelte'\n\tlet a = $state(false), b = $state(false)",
			'<Dialog bind:open={a}>\n\t<p>Edit</p>\n</Dialog>\n<Dialog bind:open={b}>\n\t<p>Delete</p>\n</Dialog>'
		);
		const { dir, read } = app({ 'src/routes/+page.svelte': page });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const points = () =>
			remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) })
				.files.flatMap((f) => f.review)
				.filter((p) => p.id === 'dialog-accessible-name');
		const current = read('src/routes/+page.svelte');
		const second = current.split('\n').findIndex((line) => line.includes('bind:open={b}')) + 1;
		expect(points()[0].lines).toHaveLength(2);
		writeFileSync(join(dir, 'src/routes/+page.svelte'), current.replace('<Dialog bind:open={a}>', '<Dialog bind:open={a} title="Edit">'));
		expect(points()[0].lines).toEqual([second]);
	});

	test('a point to write leaves next once the use no longer has what triggered it', () => {
		const page = svelte("\timport { DatePicker } from '@likable-hair/svelte'", '<DatePicker selectableYears={[2025, 2026]} />\n<DatePicker selectableYears={[2027]} />');
		const { dir, read } = app({ 'src/routes/+page.svelte': page });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const points = () =>
			remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) })
				.files.flatMap((f) => f.review)
				.filter((p) => p.id === 'date-picker-years');
		expect(points()[0]).toMatchObject({ todo: 'edit', lines: [5, 6] });
		writeFileSync(join(dir, 'src/routes/+page.svelte'), read('src/routes/+page.svelte').replace('selectableYears={[2025, 2026]}', 'min={new Date(2025, 0, 1)}'));
		expect(points()[0].lines).toEqual([6]);
	});

	test('a deleted trigger line still finds its use, and a use gone from the file takes its points away', () => {
		const page = svelte("\timport { DatePicker } from '@likable-hair/svelte'", '<DatePicker\n\tlocale="it"\n\tselectableYears={[2025]}\n/>\n<p>between</p>\n<DatePicker selectableYears={[2027]} />');
		const { dir, read } = app({ 'src/routes/+page.svelte': page });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const points = () =>
			remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) })
				.files.flatMap((f) => f.review)
				.filter((p) => p.id === 'date-picker-years');
		const current = read('src/routes/+page.svelte');
		writeFileSync(join(dir, 'src/routes/+page.svelte'), current.replace('<DatePicker\n\tlocale="it"\n\tselectableYears={[2025]}\n/>', '<DatePicker locale="it" />'));
		expect(points()[0].lines).toEqual([7]);
		writeFileSync(join(dir, 'src/routes/+page.svelte'), current.replace(/<DatePicker[^>]*\/>/g, '<input type="date" />'));
		expect(points()).toEqual([]);
	});

	test('a step for every use leaves out the files deleted since the v4 code', () => {
		const dialog = svelte("\timport { Dialog } from '@likable-hair/svelte'\n\tlet open = $state(false)", '<Dialog bind:open title="Edit"><p>Edit</p></Dialog>');
		const { dir } = app({ 'src/lib/components/OldDialog.svelte': dialog, 'src/routes/+page.svelte': dialog });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const focus = () => remaining(dir, rules, { check: () => ({ ran: true, diagnostics: [] }) }).general.find((g) => g.id === 'dialog-initial-focus');
		expect(focus()).toMatchObject({ usages: 2, files: 2 });
		rmSync(join(dir, 'src/lib/components/OldDialog.svelte'));
		expect(focus()).toMatchObject({ usages: 1, files: 1, byFile: { 'src/routes/+page.svelte': 1 } });
		rmSync(join(dir, 'src/routes/+page.svelte'));
		expect(focus()).toBeUndefined();
	});
});

describe('remaining: points the current code closes', () => {
	const check = () => ({ ran: true, diagnostics: [] });

	test('a step with contains stays while the use still has the v4 text, and is not listed without it', () => {
		const layout = (content: string) =>
			svelte("\timport { CollapsibleSideBarLayout } from '@likable-hair/svelte'", `<CollapsibleSideBarLayout>\n\t${content}\n</CollapsibleSideBarLayout>`);
		const scroll = (dir: string) =>
			remaining(dir, rules, { check })
				.files.flatMap((f) => f.review)
				.filter((p) => p.id === 'sidebar-layout-scroll');
		const wrapped = '<div style:height="calc(100dvh - 50px)" class="overflow-auto"><slot /></div>';
		const { dir, read } = app({ 'src/routes/+layout.svelte': layout(wrapped) });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		expect(scroll(dir)).toHaveLength(1);
		writeFileSync(join(dir, 'src/routes/+layout.svelte'), read('src/routes/+layout.svelte').replace(/<div style:height[^>]*>(.*)<\/div>/, '$1'));
		expect(scroll(dir)).toEqual([]);

		const plain = app({ 'src/routes/+layout.svelte': layout('<slot />') });
		prepareBranch(plain.dir, 'aurora-v5');
		codemod(plain.dir, rules, { write: true });
		expect(scroll(plain.dir)).toEqual([]);
	});

	test('a snippet the tool could not rewrite leaves next once its parameters are the v5 ones', () => {
		const page = svelte(
			"\timport { PaginatedTable } from '@likable-hair/svelte'",
			'<PaginatedTable>\n\t{#snippet appendSnippet({ index, item })}\n\t\t<span>{index}: {item?.id}</span>\n\t{/snippet}\n</PaginatedTable>'
		);
		const { dir, read } = app({ 'src/routes/+page.svelte': page });
		prepareBranch(dir, 'aurora-v5');
		codemod(dir, rules, { write: true });
		const notDone = () =>
			remaining(dir, rules, { check })
				.files.flatMap((f) => f.review)
				.filter((p) => p.kind === 'not-done' && p.id.endsWith('/snippets.parameters/actionsSnippet'));
		expect(notDone()).toHaveLength(1);
		const current = read('src/routes/+page.svelte');
		writeFileSync(join(dir, 'src/routes/+page.svelte'), current.replace(/\{#snippet actionsSnippet\(\{ index, item \}\)\}/, '{#snippet actionsSnippet({ row: item })}').replace('{index}: ', ''));
		expect(notDone()).toEqual([]);
	});
});
