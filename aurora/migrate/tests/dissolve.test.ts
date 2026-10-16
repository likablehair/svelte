import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { codemod } from '../src/codemod.ts';
import { loadRules } from '../src/rules.ts';

const rules = loadRules();
const dirs: string[] = [];

function run(files: Record<string, string>) {
	const dir = mkdtempSync(join(tmpdir(), 'migrate-dissolve-'));
	dirs.push(dir);
	writeFileSync(join(dir, 'tsconfig.json'), '{}\n');
	mkdirSync(join(dir, 'node_modules/@mdi/js'), { recursive: true });
	writeFileSync(join(dir, 'node_modules/@mdi/js/mdi.d.ts'), 'export declare const mdiPlus: string;\n');
	for (const [rel, text] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, rel)), { recursive: true });
		writeFileSync(join(dir, rel), text);
	}
	const result = codemod(dir, rules, { write: true });
	return {
		result,
		read: (rel: string) => readFileSync(join(dir, rel), 'utf8'),
		exists: (rel: string) => existsSync(join(dir, rel)),
		again: () => codemod(dir, rules, { write: true })
	};
}

const svelte = (script: string, markup: string) => `<script lang="ts">\n${script}\n</script>\n\n${markup}\n`;
const W = 'src/lib/components/common';

const checkbox = svelte(
	"\timport { Checkbox } from '@likable-hair/svelte'\n\timport type { ComponentProps } from 'svelte'\n\tinterface Props extends ComponentProps<typeof Checkbox> {}\n\tlet { value = $bindable(false), ...rest }: Props = $props()",
	'<Checkbox bind:value {...rest} />'
);

const button = svelte(
	[
		"\timport { Button } from '@likable-hair/svelte'",
		"\timport type { ComponentProps } from 'svelte'",
		"\ttype Props = { style?: 'primary' | 'secondary' | 'danger' | 'static' | 'icon'; href?: string; loading?: boolean; disabled?: boolean; class?: string; children?: import('svelte').Snippet } & ComponentProps<typeof Button>",
		"\tlet { class: clazz = '', loading = $bindable(false), disabled = false, style = 'primary', href = undefined, children, ...rest }: Props = $props()",
		"\tlet background = $derived(style == 'danger' ? 'red' : 'blue')"
	].join('\n'),
	[
		'{#if !!href}',
		'\t<a class="link" style:--link-background={background} {href}>{#if !loading}{@render children?.()}{/if}</a>',
		'{:else}',
		'\t<Button {loading} {disabled} class="box-border! {clazz}" --button-padding="10px 20px" --button-background-color={background} --button-width="100%" {...rest}>',
		'\t\t<div style:display="flex">{@render children?.()}</div>',
		'\t</Button>',
		'{/if}'
	].join('\n')
);

const textfield = svelte(
	[
		"\timport { SimpleTextField } from '@likable-hair/svelte'",
		"\timport type { ComponentProps } from 'svelte'",
		'\tinterface Props extends ComponentProps<typeof SimpleTextField> { error?: boolean; valueRequired?: boolean }',
		'\tlet { value = $bindable(), error = false, valueRequired = false, ...rest }: Props = $props()',
		'\tlet localError = $derived((valueRequired && !value) || error)'
	].join('\n'),
	"<SimpleTextField bind:value --simple-textfield-border={localError ? '1px solid red' : undefined} {...rest} />"
);

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('dissolve: wrappers', () => {
	test('a thin wrapper becomes the library component and is deleted', () => {
		const { read, exists, result } = run({
			[`${W}/StandardCheckbox.svelte`]: checkbox,
			'src/routes/+page.svelte': svelte(
				"\timport StandardCheckbox from '$lib/components/common/StandardCheckbox.svelte'\n\tlet on = $state(false)",
				'<StandardCheckbox bind:value={on} id="a" />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { Checkbox } from '@likable-hair/svelte';");
		expect(page).not.toContain('StandardCheckbox');
		expect(page).toContain('<Checkbox bind:checked={on} id="a" />');
		expect(exists(`${W}/StandardCheckbox.svelte`)).toBe(false);
		expect(result.deleted).toEqual([`${W}/StandardCheckbox.svelte`]);
		expect(result.wrappers[0]).toMatchObject({ target: 'Checkbox', usages: 1, dissolved: 1, deleted: true });
	});

	test('keeps what the wrapper props mean and its layout, drops its look', () => {
		const { read, result } = run({
			[`${W}/StandardButton.svelte`]: button,
			'src/routes/+page.svelte': svelte(
				"\timport { Icon } from '@likable-hair/svelte'\n\timport StandardButton from '$lib/components/common/StandardButton.svelte'\n\tlet busy = $state(false)",
				[
					'<StandardButton style="danger" onclick={() => {}}>Delete</StandardButton>',
					'<StandardButton>Save</StandardButton>',
					'<StandardButton style="icon" bind:loading={busy}>x</StandardButton>',
					'<StandardButton style="static" href="/a" class="mt-3">Go</StandardButton>'
				].join('\n')
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { Icon, Button } from '@likable-hair/svelte'");
		expect(page).toContain('<Button --button-width="100%" variant="danger" onclick={() => {}}>Delete</Button>');
		expect(page).toContain('<Button --button-width="100%">Save</Button>');
		expect(page).toContain('<Button --button-width="100%" variant="secondary" buttonType="text" loading={busy}>x</Button>');
		expect(page).toContain('<Button --button-width="100%" variant="secondary" href="/a" class="mt-3">Go</Button>');
		const dropped = result.wrappers[0].dropped.join(' ');
		expect(dropped).toContain('--button-padding="10px 20px"');
		expect(dropped).toContain('class "box-border!"');
		expect(result.changes.some((c) => c.kind === 'wrapper-bind-one-way' && c.name === 'loading')).toBe(true);
	});

	test('maps the literals of an expression, or passes a variable through with a note', () => {
		const { read, result } = run({
			[`${W}/StandardButton.svelte`]: button,
			'src/routes/+page.svelte': svelte(
				"\timport StandardButton from '$lib/components/common/StandardButton.svelte'\n\tlet { a, kind }: { a: boolean; kind: 'primary' | 'danger' } = $props()",
				"<StandardButton style={a ? 'static' : 'danger'}>A</StandardButton>\n<StandardButton style={kind}>B</StandardButton>"
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("variant={a ? 'secondary' : 'danger'}");
		expect(page).toContain('variant={kind}');
		expect(result.changes.find((c) => c.kind === 'wrapper-value')?.note).toContain("'static' → 'secondary'");
	});

	test('an error flag becomes the state of the field', () => {
		const { read } = run({
			[`${W}/StandardTextfield.svelte`]: textfield,
			'src/routes/+page.svelte': svelte(
				"\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'\n\tlet v = $state(''), bad = $state(false)",
				'<StandardTextfield bind:value={v} error />\n<StandardTextfield bind:value={v} error={bad} />\n<StandardTextfield bind:value={v} error={false} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<SimpleTextField bind:value={v} state="error" />');
		expect(page).toContain("<SimpleTextField bind:value={v} state={bad ? 'error' : undefined} />");
		expect(page).toContain('<SimpleTextField bind:value={v} />');
	});

	test('a use that passes a prop with logic keeps the wrapper', () => {
		const { read, exists, result } = run({
			[`${W}/StandardTextfield.svelte`]: textfield,
			'src/routes/+page.svelte': svelte(
				"\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'\n\tlet v = $state('')",
				'<StandardTextfield bind:value={v} valueRequired />\n<StandardTextfield bind:value={v} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import StandardTextfield from '$lib/components/common/StandardTextfield.svelte'");
		expect(page).toContain('<StandardTextfield bind:value={v} valueRequired />');
		expect(page).toContain('<SimpleTextField bind:value={v} />');
		expect(exists(`${W}/StandardTextfield.svelte`)).toBe(true);
		expect(result.skipped.find((s) => s.kind === 'wrapper-usage')?.reason).toContain('valueRequired');
	});

	test('drops a CSS variable the wrapper overrode, which never applied', () => {
		const { read, result } = run({
			[`${W}/StandardButton.svelte`]: button,
			'src/routes/+page.svelte': svelte(
				"\timport StandardButton from '$lib/components/common/StandardButton.svelte'",
				'<StandardButton --button-background-color="green" --button-height="50px">A</StandardButton>'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain('<Button --button-width="100%" --button-height="50px">A</Button>');
		expect(result.changes.some((c) => c.kind === 'wrapper-style-ignored' && c.name === '--button-background-color')).toBe(true);
	});

	test('rewrites the wrapper in types, also a prop picked by name', () => {
		const { read } = run({
			[`${W}/StandardButton.svelte`]: button,
			'src/lib/Confirm.svelte': svelte(
				"\timport type { ComponentProps } from 'svelte'\n\timport StandardButton from './components/common/StandardButton.svelte'\n\tlet { kind }: { kind?: ComponentProps<typeof StandardButton>['style'] } = $props()",
				'<StandardButton style={kind}>OK</StandardButton>'
			)
		});
		const file = read('src/lib/Confirm.svelte');
		expect(file).toContain("ComponentProps<typeof Button>['variant']");
		expect(file).toContain("\n\timport { Button } from '@likable-hair/svelte';\n");
	});

	test('a Svelte 4 wrapper is left alone and an unused wrapper is deleted', () => {
		const { read, exists, result } = run({
			[`${W}/StandardSelect.svelte`]: "<script>\n\timport { Select } from '@likable-hair/svelte'\n\texport let value\n</script>\n\n<Select bind:value {...$$restProps} />\n",
			[`${W}/StandardSwitch.svelte`]: svelte("\timport { Switch } from '@likable-hair/svelte'\n\tlet { value = $bindable(), ...rest } = $props()", '<Switch bind:value {...rest} />'),
			'src/routes/+page.svelte': svelte("\timport StandardSelect from '$lib/components/common/StandardSelect.svelte'", '<StandardSelect value="a" />')
		});
		expect(read('src/routes/+page.svelte')).toContain('<StandardSelect value="a" />');
		expect(exists(`${W}/StandardSelect.svelte`)).toBe(true);
		expect(exists(`${W}/StandardSwitch.svelte`)).toBe(false);
		expect(result.wrappers.find((w) => w.file.endsWith('StandardSelect.svelte'))?.blockers[0]).toContain('sv migrate');
	});

	test('running it again changes nothing', () => {
		const { again } = run({
			[`${W}/StandardButton.svelte`]: button,
			[`${W}/StandardTextfield.svelte`]: textfield,
			'src/routes/+page.svelte': svelte(
				"\timport StandardButton from '$lib/components/common/StandardButton.svelte'\n\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'",
				'<StandardButton style="danger">A</StandardButton>\n<StandardTextfield valueRequired />'
			)
		});
		const second = again();
		expect(second.files).toEqual([]);
		expect(second.deleted).toEqual([]);
	});
});

const labelAndTextfield = (inner: 'StandardTextfield' | 'SimpleTextField') =>
	svelte(
		[
			inner === 'StandardTextfield'
				? "\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'"
				: "\timport { SimpleTextField } from '@likable-hair/svelte'",
			"\timport type { ComponentProps } from 'svelte'",
			`\tinterface Props extends Omit<ComponentProps<typeof ${inner}>, 'class'> { label?: string; class?: { label?: string; input?: string } }`,
			'\tlet { value = $bindable(), label, name, class: clazz = {}, ...rest }: Props = $props()'
		].join('\n'),
		[
			'<label style:font-weight="500" style:margin-left="3px" for={name} class={clazz.label}',
			"\t>{label || ''}</label",
			'>',
			'<div style:margin-top="5px">',
			`\t<${inner} bind:value {name} class={clazz.input} {...rest}></${inner}>`,
			'</div>'
		].join('\n')
	);

describe('dissolve: LabelAnd* components', () => {
	test('a LabelAndTextfield around a Standard wrapper becomes SimpleTextField with label, and the props of the inner wrapper are mapped', () => {
		const { read, exists, result } = run({
			[`${W}/StandardTextfield.svelte`]: textfield,
			[`${W}/LabelAndTextfield.svelte`]: labelAndTextfield('StandardTextfield'),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndTextfield from '$lib/components/common/LabelAndTextfield.svelte'\n\tlet name = $state(''), missing = $state(false)",
				'<LabelAndTextfield label="Nome" name="name" bind:value={name} error={missing} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { SimpleTextField } from '@likable-hair/svelte'");
		expect(page).toContain(`<SimpleTextField label="Nome" name="name" bind:value={name} state={missing ? 'error' : undefined} />`);
		expect(exists(`${W}/LabelAndTextfield.svelte`)).toBe(false);
		expect(exists(`${W}/StandardTextfield.svelte`)).toBe(false);
		const summary = result.wrappers.find((w) => w.file.endsWith('LabelAndTextfield.svelte'))!;
		expect(summary).toMatchObject({ target: 'SimpleTextField', dissolved: 1, deleted: true });
		expect(summary.dropped.join(' ')).toContain('the component draws its own `label`');
	});

	test('a LabelAndTextfield already on the library component still maps the props the old wrapper handled', () => {
		const { read } = run({
			[`${W}/LabelAndTextfield.svelte`]: labelAndTextfield('SimpleTextField'),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndTextfield from '$lib/components/common/LabelAndTextfield.svelte'\n\tlet mail = $state(''), wrong = $state(false)",
				'<LabelAndTextfield label="Email" name="email" type="email" bind:value={mail} error={wrong} hint="Required" />'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain(
			`<SimpleTextField label="Email" name="email" type="email" bind:value={mail} state={wrong ? 'error' : undefined} hint="Required" />`
		);
	});

	test('LabelAndCheckbox becomes Checkbox with label, and the id of the <label for> reaches the checkbox', () => {
		const { read, exists } = run({
			[`${W}/StandardCheckbox.svelte`]: checkbox,
			[`${W}/LabelAndCheckbox.svelte`]: svelte(
				[
					"\timport StandardCheckbox from '$lib/components/common/StandardCheckbox.svelte'",
					"\timport type { ComponentProps } from 'svelte'",
					'\tinterface Props extends ComponentProps<typeof StandardCheckbox> { label: string }',
					'\tlet { label, id, value = $bindable(false), ...rest }: Props = $props()'
				].join('\n'),
				'<div class="container">\n\t<StandardCheckbox bind:value {...rest} />\n\t<label style:margin-left="0.7rem" for={id}>{label} </label>\n</div>\n\n<style>\n\t.container { display: flex; }\n</style>'
			),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndCheckbox from '$lib/components/common/LabelAndCheckbox.svelte'\n\tlet active = $state(false)",
				'<LabelAndCheckbox label="Attivo" id="active" bind:value={active} />'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain('<Checkbox label="Attivo" id="active" bind:checked={active} />');
		expect(exists(`${W}/LabelAndCheckbox.svelte`)).toBe(false);
	});

	test('LabelAndSelect gives its name to the Select, which v4 kept for the <label> only', () => {
		const { read } = run({
			[`${W}/LabelAndSelect.svelte`]: svelte(
				[
					"\timport { Select } from '@likable-hair/svelte'",
					"\timport type { ComponentProps } from 'svelte'",
					'\tinterface Props extends ComponentProps<typeof Select> { label: string; name: string }',
					'\tlet { value = $bindable(undefined), label, name, ...rest }: Props = $props()'
				].join('\n'),
				'<label style:font-weight="500" for={name}>{label}</label>\n<div style:margin-top="5px">\n\t<Select bind:value {...rest} />\n</div>'
			),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndSelect from '$lib/components/common/LabelAndSelect.svelte'\n\tlet role = $state('a')\n\tconst items = [{ value: 'a', label: 'A' }]",
				'<LabelAndSelect label="Ruolo" name="role" {items} bind:value={role} />'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain('<Select label="Ruolo" name="role" {items} bind:value={role} />');
	});

	test('a label with more than the label prop keeps the component', () => {
		const { result, exists } = run({
			[`${W}/LabelAndTextfield.svelte`]: svelte(
				"\timport { SimpleTextField } from '@likable-hair/svelte'\n\tlet { label, required = false, ...rest } = $props()",
				'<label>{label}{#if required}<span>*</span>{/if}</label>\n<SimpleTextField {required} {...rest} />'
			),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndTextfield from '$lib/components/common/LabelAndTextfield.svelte'",
				'<LabelAndTextfield label="Nome" required />'
			)
		});
		expect(exists(`${W}/LabelAndTextfield.svelte`)).toBe(true);
		expect(result.skipped.some((s) => s.id === 'wrappers/LabelAndTextfield')).toBe(true);
	});
});
