import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { codemod, cssRenames, mdiExport } from '../src/codemod.ts';
import { loadRules } from '../src/rules.ts';

const rules = loadRules();
const dirs: string[] = [];
const ICONS = ['mdiPlus', 'mdiCog', 'mdiClose', 'mdiAccount', 'mdiFormatHeader1'];

function app(files: Record<string, string>, icons: string[] | null = ICONS) {
	const dir = mkdtempSync(join(tmpdir(), 'migrate-codemod-'));
	dirs.push(dir);
	writeFileSync(join(dir, 'tsconfig.json'), '{}\n');
	if (icons) {
		mkdirSync(join(dir, 'node_modules/@mdi/js'), { recursive: true });
		writeFileSync(
			join(dir, 'node_modules/@mdi/js/mdi.d.ts'),
			icons.map((name) => `export declare const ${name}: string;\n`).join('')
		);
	}
	for (const [rel, text] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, rel)), { recursive: true });
		writeFileSync(join(dir, rel), text);
	}
	return dir;
}

function run(files: Record<string, string>, icons?: string[] | null) {
	const dir = app(files, icons);
	const result = codemod(dir, rules, { write: true });
	return { dir, result, read: (rel: string) => readFileSync(join(dir, rel), 'utf8') };
}

const svelte = (script: string, markup: string) => `<script lang="ts">\n${script}\n</script>\n\n${markup}\n`;

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('codemod: names', () => {
	test('renames a component in the import, the tags and the types', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { ToolTip, Button } from '@likable-hair/svelte';\n\timport type { ComponentProps } from 'svelte';\n\tlet p: ComponentProps<typeof ToolTip> | undefined;",
				'<ToolTip activator={undefined}><b>x</b></ToolTip>\n<ToolTip />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain("import { Tooltip, Button } from '@likable-hair/svelte';");
		expect(out).toContain('ComponentProps<typeof Tooltip>');
		expect(out).toContain('<Tooltip activator={undefined} appearTimeout={0}><b>x</b></Tooltip>\n<Tooltip appearTimeout={0} />');
	});

	test('keeps a local alias and renames only the imported name', () => {
		const { read } = run({
			'src/A.svelte': svelte("\timport { ToolTip as Tip } from '@likable-hair/svelte';", '<Tip />')
		});
		expect(read('src/A.svelte')).toContain("import { Tooltip as Tip } from '@likable-hair/svelte';");
		expect(read('src/A.svelte')).toContain('<Tip appearTimeout={0} />');
	});

	test('turns a deep default import into a root import', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport Button from '@likable-hair/svelte/dist/components/simple/buttons/Button.svelte';",
				'<Button>x</Button>'
			)
		});
		expect(read('src/A.svelte')).toContain("import { Button } from '@likable-hair/svelte';");
	});

	test('renames a function and a store replaced by a reactive object', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { toggleTheme, mediaQuery } from '@likable-hair/svelte';\n\tconst wide = $derived($mediaQuery.l);",
				'<button onclick={() => toggleTheme()}>{$mediaQuery.xs}</button>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain("import { toggleMode, breakpoints } from '@likable-hair/svelte';");
		expect(out).toContain('$derived(breakpoints.l)');
		expect(out).toContain('onclick={() => toggleMode()}>{breakpoints.xs}');
	});

	test('leaves a store used without $ and lists it', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { mediaQuery } from '@likable-hair/svelte';\n\tmediaQuery.subscribe(() => {});",
				'<p>{$mediaQuery.xs}</p>'
			)
		});
		expect(read('src/A.svelte')).toContain('{$mediaQuery.xs}');
		expect(result.skipped.map((s) => s.id)).toContain('imports/renamed/mediaQuery');
	});
});

describe('codemod: props, snippets, CSS variables', () => {
	test('renames props, also bound and shorthand ones, and drops bind where v5 is not bindable', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Checkbox, Chip } from '@likable-hair/svelte';\n\tlet value = $state(false);\n\tlet close = $state(true);",
				'<Checkbox bind:value />\n<Checkbox bind:value={value} />\n<Checkbox {value} />\n<Chip bind:close>x</Chip>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<Checkbox bind:checked={value} />\n<Checkbox bind:checked={value} />\n<Checkbox checked={value} />');
		expect(out).toContain('<Chip closable={close}>x</Chip>');
	});

	test('maps the values that changed with the name', () => {
		const { read } = run({
			'src/A.svelte': svelte("\timport { Autocomplete } from '@likable-hair/svelte';", '<Autocomplete menuAnchor="bottom-center" items={[]} />')
		});
		expect(read('src/A.svelte')).toContain('<Autocomplete placement="bottom" items={[]} />');
	});

	test('inverts props, and drops one that becomes its default', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { PaginatedTable, Chip } from '@likable-hair/svelte';\n\tlet hide = $state(false);",
				'<PaginatedTable hideActions />\n<PaginatedTable hideActions={hide} />\n<PaginatedTable hideSelectAll={!hide} />\n<Chip inactive>x</Chip>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<DataTable selectionBar={false} />\n<DataTable selectionBar={!hide} />\n<DataTable selectAll={hide} />');
		expect(out).toContain('<Chip>x</Chip>');
	});

	test('renames snippets passed as children and as props', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { PaginatedTable } from '@likable-hair/svelte';",
				'<PaginatedTable>\n\t{#snippet customSnippet({ item })}{item}{/snippet}\n</PaginatedTable>\n<PaginatedTable appendSnippet={undefined} />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('{#snippet cellSnippet({ item })}');
		expect(out).toContain('<DataTable actionsSnippet={undefined} />');
	});

	test('renames style props, and merges two that became the same variable', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { Avatar } from '@likable-hair/svelte';",
				'<Avatar --avatar-width="32px" --avatar-height="32px" />\n<Avatar --avatar-width="32px" --avatar-height="40px" />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<Avatar --avatar-size="32px" />');
		expect(out).toContain('<Avatar --avatar-size="32px" --avatar-height="40px" />');
		expect(result.skipped.find((s) => s.name === '--avatar-height')?.reason).toContain('another value');
	});

	test('renames a variable everywhere the app writes or reads it', () => {
		const { read } = run({
			'src/app.css': ':root {\n\t--switch-default-handle-width: 16px;\n}\n',
			'src/A.svelte':
				'<div class="t" style:--switch-handle-width="12px" style="--switch-handle-color: red"></div>\n\n<style>\n\t.t { width: var(--switch-handle-width, var(--switch-default-handle-width)); }\n</style>\n'
		});
		expect(read('src/app.css')).toContain('--switch-default-thumb-size: 16px;');
		const out = read('src/A.svelte');
		expect(out).toContain('style:--switch-thumb-size="12px" style="--switch-thumb-color: red"');
		expect(out).toContain('var(--switch-thumb-size, var(--switch-default-thumb-size))');
	});

	test('in CSS, a name claimed by two components goes to the one it belongs to', () => {
		const renames = cssRenames(rules);
		expect(renames.get('--simple-textfield-width')?.to).toBe('--simple-text-field-width');
		expect(renames.has('--icon-size')).toBe(false);
	});
});

describe('codemod: v4 defaults', () => {
	test('writes the v4 default only where it changes what the app does', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { Menu, Textarea, ToolTip } from '@likable-hair/svelte';\n\tlet rest = {};",
				'<Menu activator={undefined}>x</Menu>\n<Menu\n\tactivator={undefined}\n\topen\n>x</Menu>\n<Menu closeOnClickOutside>x</Menu>\n<Menu {...rest}>x</Menu>\n<Textarea />\n<ToolTip />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<Menu activator={undefined} closeOnClickOutside={false}>x</Menu>');
		expect(out).toContain('<Menu\n\tactivator={undefined}\n\topen\n\tcloseOnClickOutside={false}\n>x</Menu>');
		expect(out).toContain('<Menu closeOnClickOutside>x</Menu>');
		expect(out).toContain('<Menu {...rest}>x</Menu>');
		expect(out).toContain('<Textarea />');
		expect(out).toContain('<Tooltip appearTimeout={0} />');
		expect(result.skipped.find((s) => s.id === 'Menu/props.defaults/closeOnClickOutside')?.reason).toContain('spread');
		expect(result.defaults.map((d) => `${d.component}.${d.name}:${d.kind}`)).toEqual(
			expect.arrayContaining(['Textarea.rows:look', 'ToolTip.placement:look', 'Menu.offset:look'])
		);
	});

	test('does not write it where the rule says the app did it another way', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { DatePickerTextField } from '@likable-hair/svelte';\n\tlet open = $state(false);",
				'<DatePickerTextField ondayClick={() => (open = false)} />\n<DatePickerTextField />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<DatePickerTextField ondayClick={() => (open = false)} />');
		expect(out).toContain('<DatePickerTextField closeOnSelect={false} />');
		expect(result.skipped.find((s) => s.id === 'DatePickerTextField/props.defaults/closeOnSelect')?.reason).toContain('ondayClick');
		expect(result.defaults.some((d) => d.name === 'locale' && d.kind === 'language')).toBe(true);
	});
});

describe('codemod: callback arguments', () => {
	test('drops detail in inline handlers', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Button, HierarchyMenu } from '@likable-hair/svelte';\n\tfunction go(e: MouseEvent) {}",
				'<Button onclick={(e) => go(e.detail.nativeEvent)}>x</Button>\n<HierarchyMenu options={[]} onoptionClick={(e) => console.log(e.detail.option?.name)} />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('onclick={(e) => go(e)}');
		expect(out).toContain('onoptionClick={(e) => console.log(e.option?.name)}');
	});

	test('rewrites a named handler and its parameter type', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Button } from '@likable-hair/svelte';\n\tfunction handle(e: { detail: { nativeEvent: MouseEvent } }) {\n\t\te.detail.nativeEvent.preventDefault();\n\t}",
				'<Button onclick={handle}>x</Button>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('function handle(e: MouseEvent) {\n\t\te.preventDefault();');
	});

	test('renames an event and the fields of its argument, also in the type', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { PaginatedTable } from '@likable-hair/svelte';\n\tlet size = 10;\n\tconst load = (e: { detail: { page: number; rowsPerPage: number } }) => {\n\t\tsize = e.detail.rowsPerPage;\n\t};",
				'<PaginatedTable onpaginationChange={load} />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('const load = (e: { page: number; pageSize: number }) => {\n\t\tsize = e.pageSize;');
		expect(out).toContain('<DataTable onquerychange={load} />');
	});

	test('rewrites destructured arguments', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Button, HierarchyMenu } from '@likable-hair/svelte';",
				'<Button onclick={({ detail: { nativeEvent } }) => nativeEvent.stopPropagation()}>x</Button>\n<HierarchyMenu options={[]} onoptionClick={({ detail }) => console.log(detail.option)} />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('onclick={(nativeEvent) => nativeEvent.stopPropagation()}');
		expect(out).toContain('onoptionClick={(detail) => console.log(detail.option)}');
	});

	test('leaves what has no counterpart and lists it', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { Checkbox, Button } from '@likable-hair/svelte';\n\tfunction other(e: unknown) {}\n\tfunction handle(e: any) { console.log(e.detail.nativeEvent); }",
				'<Checkbox onchange={(e) => console.log(e.detail.shiftKeyPressed)} />\n<Button onclick={handle}>x</Button>\n<button onclick={() => handle(1)}>y</button>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('e.detail.shiftKeyPressed');
		expect(out).toContain('console.log(e.detail.nativeEvent)');
		const reasons = result.skipped.map((s) => s.reason).join('\n');
		expect(reasons).toContain('no counterpart in v5');
		expect(reasons).toContain('also used elsewhere');
	});

	test('rewrites a handler shared by callbacks that give the same result', () => {
		const { read, result } = run({
			'src/A.svelte': svelte(
				"\timport { CollapsibleSideBarLayout, HierarchyMenu } from '@likable-hair/svelte';\n\tfunction pick(e: any) { console.log(e.detail.option.name); }",
				'<CollapsibleSideBarLayout onmenuSelect={pick}>\n\t{#snippet menuSnippet()}<HierarchyMenu options={[]} onoptionClick={pick} />{/snippet}\n</CollapsibleSideBarLayout>'
			)
		});
		expect(read('src/A.svelte')).toContain('console.log(e.option.name)');
		expect(result.skipped).toEqual([]);
	});
});

describe('codemod: icons', () => {
	test('turns MDI names into @mdi/js imports in attributes and data', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Icon, Button } from '@likable-hair/svelte';\n\tconst items = [{ icon: 'mdi-cog' }, { icon: `mdi-format-header-1` }];\n\ttype Name = 'mdi-plus';\n\tconst map = { 'mdi-plus': 1 };",
				'<Icon name="mdi-plus" />\n<Button icon={open ? \'mdi-close\' : \'mdi-plus\'}>x</Button>\n<i class="mdi-spin"></i>\n<span class={"mdi-account"}></span>'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain("import { Icon, Button } from '@likable-hair/svelte';\n\timport { mdiClose, mdiCog, mdiFormatHeader1, mdiPlus } from '@mdi/js';");
		expect(out).toContain("[{ icon: mdiCog }, { icon: mdiFormatHeader1 }]");
		expect(out).toContain("type Name = 'mdi-plus';");
		expect(out).toContain("{ 'mdi-plus': 1 }");
		expect(out).toContain('<Icon path={mdiPlus} />');
		expect(out).toContain('icon={open ? mdiClose : mdiPlus}');
		expect(out).toContain('<span class={"mdi-account"}>');
	});

	test('adds to an existing @mdi/js import and to TypeScript files', () => {
		const { read } = run({
			'src/A.svelte': svelte("\timport { mdiCog } from '@mdi/js';\n\timport { Icon } from '@likable-hair/svelte';", '<Icon name="mdi-plus" />'),
			'src/menu.ts': "export const menu = [{ icon: 'mdi-account' }];\n"
		});
		expect(read('src/A.svelte')).toContain("import { mdiCog, mdiPlus } from '@mdi/js';");
		expect(read('src/menu.ts')).toBe("import { mdiAccount } from '@mdi/js';\n\nexport const menu = [{ icon: mdiAccount }];\n");
	});

	test('creates the script when a file has none', () => {
		const { read } = run({ 'src/A.svelte': '<Foo icon="mdi-plus" />\n' });
		expect(read('src/A.svelte')).toBe("<script lang=\"ts\">\n\timport { mdiPlus } from '@mdi/js';\n</script>\n\n<Foo icon={mdiPlus} />\n");
	});

	test('leaves names that @mdi/js does not have and lists them', () => {
		const { read, result } = run({ 'src/menu.ts': "export const a = 'mdi-not-an-icon';\n" });
		expect(read('src/menu.ts')).toContain("'mdi-not-an-icon'");
		expect(result.skipped[0]).toMatchObject({ id: 'icons/unknown', name: 'mdi-not-an-icon' });
	});

	test('when the app still draws MDI classes, converts only library attributes', () => {
		const { read } = run({
			'src/A.svelte': svelte(
				"\timport { Icon } from '@likable-hair/svelte';\n\tconst icon = 'mdi-cog';",
				'<Icon name="mdi-plus" />\n<span class="mdi mdi-cog"></span>\n<Foo icon="mdi-cog" />'
			)
		});
		const out = read('src/A.svelte');
		expect(out).toContain('<Icon path={mdiPlus} />');
		expect(out).toContain("const icon = 'mdi-cog';");
		expect(out).toContain('<Foo icon="mdi-cog" />');
	});

	test('mdiExport camel-cases the name', () => {
		expect(mdiExport('mdi-format-header-1')).toBe('mdiFormatHeader1');
	});
});

describe('codemod: runs', () => {
	test('running it again changes nothing', () => {
		const files = {
			'src/A.svelte': svelte(
				"\timport { ToolTip, Icon, Checkbox, PaginatedTable, Button } from '@likable-hair/svelte';\n\tlet value = $state(false);\n\tfunction handle(e: { detail: { nativeEvent: MouseEvent } }) { e.detail.nativeEvent.preventDefault(); }",
				'<ToolTip />\n<Icon name="mdi-plus" />\n<Checkbox bind:value />\n<PaginatedTable hideActions rowsPerPage={5} />\n<Button onclick={handle} --button-background-color="red">x</Button>'
			),
			'src/app.css': ':root { --button-default-color: red; }\n'
		};
		const dir = app(files);
		const first = codemod(dir, rules, { write: true });
		expect(first.files.length).toBe(2);
		const second = codemod(dir, rules, { write: true });
		expect(second.files).toEqual([]);
		expect(second.changes).toEqual([]);
	});

	test('a dry run writes nothing', () => {
		const dir = app({ 'src/A.svelte': svelte("\timport { ToolTip } from '@likable-hair/svelte';", '<ToolTip />') });
		const result = codemod(dir, rules);
		expect(result.files).toHaveLength(1);
		expect(readFileSync(join(dir, 'src/A.svelte'), 'utf8')).toContain('<ToolTip />');
	});

	test('reports files it cannot parse and leaves them', () => {
		const { result } = run({ 'src/A.svelte': '<div>\n' });
		expect(result.parseErrors).toHaveLength(1);
	});

	test('no rename chains: a v5 name is never also a v4 name of the same rule', () => {
		for (const rule of rules.rules.components)
			for (const key of ['props', 'snippets', 'cssVars'] as const) {
				const renamed = rule[key]?.renamed ?? [];
				const from = new Set(renamed.map((r) => r.from));
				for (const r of renamed) expect(from.has(r.to), `${rule.from} ${key} ${r.from} → ${r.to}`).toBe(false);
			}
	});
});

describe('codemod: local copies', () => {
	const pageTitle = svelte(
		"\timport { Icon } from '@likable-hair/svelte';\n\tlet { title, prependVisible = false, prependRoute = undefined, appendSnippet } = $props();",
		'<div>{#if prependVisible}<button><Icon name="mdi-arrow-left" /></button>{/if}<h1>{title}</h1>{@render appendSnippet?.()}</div>'
	);

	test('replaces a local copy with the library component, applies its rule and deletes the copy', () => {
		const { result, read, dir } = run({
			'src/lib/components/common/PageTitle.svelte': pageTitle,
			'src/routes/+page.svelte': svelte(
				"\timport PageTitle from '$lib/components/common/PageTitle.svelte';\n\timport { Button } from '@likable-hair/svelte';",
				'<PageTitle title="Clients" prependVisible prependRoute="/settings" marginTop="10px">\n\t{#snippet appendSnippet()}<Button>New</Button>{/snippet}\n</PageTitle>'
			),
			'src/routes/b/+page.svelte': svelte(
				"\timport Title from '../../lib/components/common/PageTitle.svelte';",
				'<Title title="Other" titleSize="xs" />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("\timport { Button, PageHeader } from '@likable-hair/svelte';\n</script>");
		expect(page).not.toContain('PageTitle');
		expect(page).toContain('<PageHeader title="Clients" back backHref="/settings" marginTop="10px">');
		expect(page).toContain('{#snippet actionsSnippet()}');
		expect(page).toContain('</PageHeader>');
		expect(read('src/routes/b/+page.svelte')).toContain('<PageHeader title="Other" size="sm" />');
		expect(result.deleted).toEqual(['src/lib/components/common/PageTitle.svelte']);
		expect(result.locals).toEqual([
			{ file: 'src/lib/components/common/PageTitle.svelte', from: 'local/PageTitle', to: 'PageHeader', usages: 2, deleted: true }
		]);
		expect(result.changes.filter((c) => c.kind === 'local-import').map((c) => c.file).sort()).toEqual([
			'src/routes/+page.svelte',
			'src/routes/b/+page.svelte'
		]);
		const again = codemod(dir, rules, { write: true });
		expect(again.files).toEqual([]);
	});

	test('the back control without a route links to the parent page of a +page.svelte', () => {
		const use = (markup: string) => svelte("\timport PageTitle from '$lib/components/common/PageTitle.svelte';", markup);
		const { result, read } = run({
			'src/lib/components/common/PageTitle.svelte': pageTitle,
			'src/routes/+page.svelte': use('<p>home</p>'),
			'src/routes/(main)/settings/users/+page.svelte': use('<PageTitle title="Users" />'),
			'src/routes/(main)/settings/users/create/+page.svelte': use('<PageTitle title="New user" prependVisible />'),
			'src/routes/(main)/settings/users/[id]/+page@.svelte': use('<PageTitle title="User" prependVisible={true} />'),
			'src/routes/(main)/clients/[id]/edit/+page.svelte': use('<PageTitle title="Edit" prependVisible />'),
			'src/routes/reports/monthly/+page.svelte': use('<PageTitle title="Monthly" prependVisible />'),
			'src/routes/(main)/settings/roles/+page.svelte': use('<PageTitle title="Roles" prependVisible={open} />'),
			'src/lib/components/Panel.svelte': use('<PageTitle title="Panel" prependVisible />')
		});
		expect(read('src/routes/(main)/settings/users/create/+page.svelte')).toContain('<PageHeader title="New user" backHref="/settings/users" />');
		expect(read('src/routes/(main)/settings/users/[id]/+page@.svelte')).toContain('<PageHeader title="User" backHref="/settings/users" />');
		expect(read('src/routes/(main)/clients/[id]/edit/+page.svelte')).toContain('<PageHeader title="Edit" back />');
		expect(read('src/routes/reports/monthly/+page.svelte')).toContain('<PageHeader title="Monthly" backHref="/" />');
		expect(read('src/routes/(main)/settings/roles/+page.svelte')).toContain('<PageHeader title="Roles" back={open} />');
		expect(read('src/lib/components/Panel.svelte')).toContain('<PageHeader title="Panel" back />');
		expect(result.changes.filter((c) => c.kind === 'prop-parent-route').map((c) => c.to)).toEqual([
			'backHref="/settings/users"',
			'backHref="/settings/users"',
			'backHref="/"'
		]);
	});

	test('keeps the copy while a file still imports it, and moves mapped named imports to the library', () => {
		const { result, read } = run({
			'src/lib/components/common/PageTitle.svelte': pageTitle,
			'src/lib/titles.ts': "import PageTitle from './components/common/PageTitle.svelte';\nexport const component = PageTitle;\n",
			'src/routes/+page.svelte': svelte(
				"\timport PageTitle, { helper } from '$lib/components/common/PageTitle.svelte';",
				'<PageTitle title="Clients" />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { PageHeader } from '@likable-hair/svelte';");
		expect(page).toContain("import { helper } from '$lib/components/common/PageTitle.svelte';");
		expect(result.skipped.find((s) => s.kind === 'local-export')?.name).toBe('helper');
		expect(read('src/lib/titles.ts')).toContain("import { PageHeader } from '@likable-hair/svelte';\nexport const component = PageHeader;");
		expect(result.deleted).toEqual([]);
		expect(result.locals[0].deleted).toBe(false);
	});

	test('toast calls: imports from the library, options without data, keys renamed, colors mapped, also in .ts files', () => {
		const toaster = "<script lang=\"ts\" module>\n\timport { createToaster } from '@melt-ui/svelte';\n\texport const addToast = () => {};\n\texport const addErrorToast = () => {};\n\texport const addSuccessToast = () => {};\n\texport const removeToast = () => {};\n</script>\n";
		const { read, result } = run({
			'src/lib/components/common/Toaster.svelte': toaster,
			'src/routes/+layout.svelte': svelte("\timport Toaster from '$lib/components/common/Toaster.svelte';", '<Toaster />'),
			'src/routes/+page.svelte': svelte(
				"\timport { addErrorToast } from '$lib/components/common/Toaster.svelte';\n\tfunction fail() {\n\t\taddErrorToast({\n\t\t\tdata: {\n\t\t\t\ttitle: 'Failed',\n\t\t\t\tdescription: 'Retry',\n\t\t\t\tcloseDelay: 0,\n\t\t\t\tshowLoading: true\n\t\t\t}\n\t\t});\n\t}",
				"<button onclick={() => addErrorToast({ data: { title: 'x', description: 'y' } })}>x</button>"
			),
			'src/lib/jobs.ts':
				"import { addSuccessToast, addToast, removeToast } from '../lib/components/common/Toaster.svelte';\nexport function done() {\n\tconst t = addSuccessToast({ data: { title: 'Done', description: '', action: { label: 'Open', handler: () => {}, urlToPreload: '/x', usePreloadData: true } } });\n\taddToast({ data: { title: 'Info', description: '', color: '#0CF574' } });\n\taddToast({ data: { title: 'Odd', description: '', color: 'purple' } });\n\tremoveToast(t.id);\n}\n"
		});
		expect(read('src/routes/+layout.svelte')).toContain("import { Toaster } from '@likable-hair/svelte';");
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { addErrorToast } from '@likable-hair/svelte';");
		expect(page).toContain("\t\taddErrorToast({\n\t\t\ttitle: 'Failed',\n\t\t\tdescription: 'Retry',\n\t\t\tduration: 0,\n\t\t\tloading: true\n\t\t});");
		expect(page).toContain("onclick={() => addErrorToast({ title: 'x', description: 'y' })}");
		const jobs = read('src/lib/jobs.ts');
		expect(jobs).toContain("import { addSuccessToast, addToast, removeToast } from '@likable-hair/svelte';");
		expect(jobs).toContain("addSuccessToast({ title: 'Done', description: '', action: { label: 'Open', onclick: () => {}, href: '/x' } })");
		expect(jobs).toContain('variant: "success"');
		expect(jobs).toContain("color: 'purple'");
		expect(result.skipped.find((s) => s.kind === 'call-value')?.name).toBe("color: 'purple'");
		expect(result.deleted).toEqual(['src/lib/components/common/Toaster.svelte']);
	});

	test('item keys, members of ComponentProps types and exported types follow the rule', () => {
		const boxMenu = "<script lang=\"ts\" module>\n\texport type BoxItem = { name: string; label: string; onClick?: () => void };\n</script>\n<script lang=\"ts\">\n\tlet { items = [] } = $props();\n</script>\n";
		const { read } = run({
			'src/lib/components/common/BoxMenu.svelte': boxMenu,
			'src/routes/+page.svelte': svelte(
				"\timport BoxMenu, { type BoxItem } from '$lib/components/common/BoxMenu.svelte';\n\timport type { ComponentProps } from 'svelte';\n\tlet extra: ComponentProps<typeof BoxMenu>['items'] = [];\n\tconst more: BoxItem[] = [{ name: 'b', label: 'B', onClick: () => {} }];\n\tlet admin = true;",
				"<BoxMenu items={[{ name: 'a', label: 'A', onClick: () => {} }, ...(admin ? more : [])]} />"
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { BoxList, type BoxListItem as BoxItem } from '@likable-hair/svelte';");
		expect(page).toContain("ComponentProps<typeof BoxList>['boxes']");
		expect(page).toContain("<BoxList boxes={[{ name: 'a', label: 'A', onclick: () => {} }, ...(admin ? more : [])]} />");
		expect(page).toContain("const more: BoxItem[] = [{ name: 'b', label: 'B', onclick: () => {} }];");
	});

	test('one-way open becomes bind:open on a let, defaults are written, Svelte 4 events become callback props', () => {
		const dialog = svelte("\tlet { open = $bindable(), title = 'Sei sicuro?', confirm, cancel } = $props();", '<div></div>');
		const mufasa = svelte("\timport { createEventDispatcher } from 'svelte';\n\tconst dispatch = createEventDispatcher<{ 'confirm-click': {} }>();", '<div></div>');
		const { read, result } = run({
			'src/lib/components/common/ConfirmOrCancelDialog.svelte': dialog,
			'src/lib/components/common/ConfirmDialog.svelte': mufasa,
			'src/routes/+page.svelte': svelte(
				"\timport ConfirmOrCancelDialog from '$lib/components/common/ConfirmOrCancelDialog.svelte';\n\timport ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';\n\tlet open = $state(false);\n\tconst fixed = false;\n\tfunction save() {}",
				'<ConfirmOrCancelDialog open={open} confirm={save} />\n<ConfirmOrCancelDialog open={fixed} title="Delete?" />\n<ConfirmDialog bind:open on:confirm-click={save} on:cancel-click={() => (open = false)} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { ConfirmDialog } from '@likable-hair/svelte';");
		expect(page).toContain('<ConfirmDialog bind:open onconfirm={save} closeOnConfirm={false} title="Sei sicuro?" />');
		expect(page).toContain('<ConfirmDialog open={fixed} title="Delete?" closeOnConfirm={false} />');
		expect(result.skipped.find((s) => s.kind === 'prop-bound')?.reason).toContain('bind:open');
		expect(page).toContain('<ConfirmDialog bind:open onconfirm={save} oncancel={() => (open = false)} variant="primary"');
		expect(result.deleted.sort()).toEqual(['src/lib/components/common/ConfirmDialog.svelte', 'src/lib/components/common/ConfirmOrCancelDialog.svelte']);
	});

	test('Divider props become CSS variables, with expressions and a missing parenthesis closed', () => {
		const divider = svelte("\texport let color = '', weight = '1px', marginTop = '10px';", '<div style:height={weight}></div>');
		const { read } = run({
			'src/lib/components/common/Divider.svelte': divider,
			'src/routes/+page.svelte': svelte(
				"\timport Divider from '$lib/components/common/Divider.svelte';\n\tlet w = '2px';",
				'<Divider color="rgb(var(--global-color-primary-500)" weight={w} marginTop="0px" />'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain(
			'<Divider --divider-color="rgb(var(--global-color-primary-500))" --divider-weight={w} --divider-margin-top="0px" />'
		);
	});

	test('the theme cookie leftovers: the endpoint goes when nothing calls it, the hooks replacement is reported', () => {
		const themeSwitch = svelte("\tlet { value = false } = $props();\n\tfunction toggle() { fetch('/api/setTheme?dark=' + value); }", '<button onclick={toggle}>t</button>');
		const { read, result } = run({
			'src/app.html': '<html lang="it">\n<body>%sveltekit.body%</body>\n</html>\n',
			'src/hooks.server.ts': "export const handle = async ({ event, resolve }) => resolve(event, { transformPageChunk: ({ html }) => html.replace('%theme%', event.cookies.get('theme') ?? '') });\n",
			'src/routes/api/setTheme/+server.ts': "export const GET = async ({ cookies, url }) => { cookies.set('theme', url.searchParams.get('dark') == 'true' ? 'dark' : 'light', { path: '/' }); return new Response(); };\n",
			'src/lib/components/common/ThemeSwitch.svelte': themeSwitch,
			'src/routes/+page.svelte': svelte("\timport ThemeSwitch from '$lib/components/common/ThemeSwitch.svelte';", '<ThemeSwitch value={false} />')
		});
		expect(read('src/routes/+page.svelte')).toContain('<ModeSwitch />');
		expect(result.deleted.sort()).toEqual(['src/lib/components/common/ThemeSwitch.svelte', 'src/routes/api/setTheme/+server.ts']);
		expect(result.skipped.find((s) => s.id === 'local/ThemeSwitch/hooks')?.file).toBe('src/hooks.server.ts');
	});

	test('dead copies listed in the global rules go only when nothing imports them', () => {
		const { result } = run({
			'src/lib/components/common/Loader.svelte': '<div>loading</div>\n',
			'src/lib/components/common/Subtitle.svelte': '<h2><slot /></h2>\n',
			'src/routes/+page.svelte': svelte("\timport Subtitle from '$lib/components/common/Subtitle.svelte';", '<Subtitle>Hi</Subtitle>')
		});
		expect(result.deleted).toEqual(['src/lib/components/common/Loader.svelte']);
		expect(result.changes.filter((c) => c.kind === 'dead-file').map((c) => c.name)).toEqual(['Loader.svelte']);
	});

	test('TabToggleSwitch: the bare tab name becomes event.tab.name, tabs get href, the type is the library one', () => {
		const copy = "<script lang=\"ts\" module>\n\texport type TabToggle = { name: string; label: string; redirectUrl?: string };\n</script>\n<script lang=\"ts\">\n\tlet { activeTab = $bindable(''), tabs, onTabChange = () => {} } = $props();\n</script>\n";
		const { read } = run({
			'src/lib/components/common/TabToggleSwitch.svelte': copy,
			'src/routes/+page.svelte': svelte(
				"\timport TabToggleSwitch, { type TabToggle } from '$lib/components/common/TabToggleSwitch.svelte';\n\tlet active = $state('a');\n\tconst tabs: TabToggle[] = [{ name: 'a', label: 'A', redirectUrl: '/a' }];",
				'<TabToggleSwitch bind:activeTab={active} {tabs} minWidth="100%" onTabChange={(tabName: string) => console.log(tabName)} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { TabSwitcher, type Tab as TabToggle } from '@likable-hair/svelte';");
		expect(page).toContain("const tabs: TabToggle[] = [{ name: 'a', label: 'A', href: '/a' }];");
		expect(page).toContain('<TabSwitcher bind:selected={active} {tabs} ontabClick={(tabName) => console.log(tabName.tab.name)} variant="segmented" />');
	});
});

