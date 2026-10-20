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

	test('a wrapper imported through an alias of the app is dissolved too', () => {
		const { read, exists } = run({
			'svelte.config.js': 'export default { kit: { alias: { "@/*": "./src/lib/*" } } };\n',
			[`${W}/StandardCheckbox.svelte`]: checkbox,
			'src/routes/+page.svelte': svelte(
				"\timport StandardCheckbox from '@/components/common/StandardCheckbox.svelte'\n\tlet on = $state(false)",
				'<StandardCheckbox bind:value={on} />'
			)
		});
		expect(read('src/routes/+page.svelte')).toContain('<Checkbox bind:checked={on} />');
		expect(exists(`${W}/StandardCheckbox.svelte`)).toBe(false);
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

	test('maps the literals of an expression, or passes a variable through and lists it as not done', () => {
		const { read, result } = run({
			[`${W}/StandardButton.svelte`]: button,
			'src/routes/+page.svelte': svelte(
				"\timport StandardButton from '$lib/components/common/StandardButton.svelte'\n\tlet { a, kind }: { a: boolean; kind: 'primary' | 'danger' } = $props()",
				"<StandardButton style={a ? 'static' : 'danger'}>A</StandardButton>\n<StandardButton style={kind}>B</StandardButton>\n<StandardButton style={a ? 'icon' : 'primary'}>C</StandardButton>"
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("variant={a ? 'secondary' : 'danger'}");
		expect(page).toContain('variant={kind}');
		expect(page).toContain("variant={a ? 'secondary' : 'primary'} buttonType={a ? 'text' : 'default'}");
		expect(result.skipped.find((s) => s.kind === 'wrapper-value')?.reason).toContain("'static' → 'secondary'");
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

	const guarded = (props: string, handler: string[]) =>
		svelte(
			["\timport { Button } from '@likable-hair/svelte'", `\tlet { loading = $bindable(false), disabled = false, children, ${props}...rest } = $props()`, ...handler].join('\n'),
			'<Button {loading} {disabled} {...rest} onclick={handleClick}>{@render children?.()}</Button>'
		);

	test('a click guard on disabled and loading is dropped, since the library Button ignores those clicks', () => {
		const { read, exists, result } = run({
			[`${W}/StandardSaveButton.svelte`]: guarded('', ['\tfunction handleClick(event) {', '\t\tif (!disabled && !loading) rest.onclick?.(event)', '\t}']),
			[`${W}/StandardSendButton.svelte`]: guarded('onclick, ', ['\tfunction handleClick(e) {', '\t\tif (!disabled && !loading && onclick) onclick(e)', '\t}']),
			[`${W}/StandardBackButton.svelte`]: guarded('', ['\tfunction handleClick(e) {', '\t\tif (disabled || loading) return', '\t\trest.onclick?.(e)', '\t}']),
			'src/routes/+page.svelte': svelte(
				[
					"\timport StandardSaveButton from '$lib/components/common/StandardSaveButton.svelte'",
					"\timport StandardSendButton from '$lib/components/common/StandardSendButton.svelte'",
					"\timport StandardBackButton from '$lib/components/common/StandardBackButton.svelte'",
					'\tlet busy = $state(false)',
					'\tfunction go() {}'
				].join('\n'),
				[
					'<StandardSaveButton onclick={go} disabled={busy}>Save</StandardSaveButton>',
					'<StandardSendButton onclick={go} loading={busy}>Send</StandardSendButton>',
					'<StandardBackButton onclick={go}>Back</StandardBackButton>'
				].join('\n')
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<Button onclick={go} disabled={busy}>Save</Button>');
		expect(page).toContain('<Button onclick={go} loading={busy}>Send</Button>');
		expect(page).toContain('<Button onclick={go}>Back</Button>');
		expect(result.wrappers.every((w) => w.deleted && !w.blockers.length)).toBe(true);
		expect(exists(`${W}/StandardSaveButton.svelte`)).toBe(false);
	});

	test('a click handler that does more than the guard keeps the wrapper', () => {
		const { read, result } = run({
			[`${W}/StandardTrackButton.svelte`]: guarded('', ['\tfunction handleClick(e) {', '\t\tif (!disabled) {', '\t\t\tconsole.log(e)', '\t\t\trest.onclick?.(e)', '\t\t}', '\t}']),
			[`${W}/StandardBusyButton.svelte`]: guarded('busy = false, ', ['\tfunction handleClick(e) {', '\t\tif (!busy) rest.onclick?.(e)', '\t}']),
			'src/routes/+page.svelte': svelte(
				"\timport StandardTrackButton from '$lib/components/common/StandardTrackButton.svelte'\n\timport StandardBusyButton from '$lib/components/common/StandardBusyButton.svelte'",
				'<StandardTrackButton>A</StandardTrackButton>\n<StandardBusyButton busy>B</StandardBusyButton>'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<StandardTrackButton>A</StandardTrackButton>');
		expect(page).toContain('<StandardBusyButton busy>B</StandardBusyButton>');
		for (const wrapper of result.wrappers) expect(wrapper.blockers).toContain('the wrapper handles `onclick`');
	});

	const nativeSelect = svelte(
		[
			"\timport { Icon } from '@likable-hair/svelte'",
			'\ttype Option = { value: string | number | undefined; text: string }',
			'\tinterface Props { options: Option[]; value?: string | number; disabled?: boolean; height?: string; onchange?: () => void }',
			'\tlet { options, value = $bindable(undefined), disabled = false, height = undefined, onchange }: Props = $props()'
		].join('\n'),
		[
			'<div class="select-wrapper" class:disabled>',
			'\t<select bind:value={value} onchange={onchange} class="select" style:border-radius="5px" style:height={height ?? "39px"} disabled={disabled}>',
			'\t\t{#each options as option}',
			'\t\t\t<option value={option.value} style:padding="10px">',
			'\t\t\t\t{option.text}',
			'\t\t\t</option>',
			'\t\t{/each}',
			'\t</select>',
			'\t<span class="select-chevron"><Icon name="mdi-chevron-down" /></span>',
			'</div>'
		].join('\n')
	);

	test('a wrapper of a native <select> becomes Select, and the options are renamed where they are built', () => {
		const { read, exists, result } = run({
			[`${W}/StandardSelect.svelte`]: nativeSelect,
			'src/routes/+page.svelte': svelte(
				[
					"\timport StandardSelect from '$lib/components/common/StandardSelect.svelte'",
					'\tlet { list }: { list: { id: number; name: string }[] } = $props()',
					"\tconst types: { value: string; text: string }[] = [{ value: 'a', text: 'A' }]",
					"\tconst roles = ['x', 'y'].map((role) => ({ value: role, text: role.toUpperCase() }))",
					'\tlet accounts = $derived(list.map((a) => {',
					'\t\treturn { value: a.id, text: a.name }',
					'\t}))',
					'\tlet type = $state(), role = $state(), account = $state()',
					'\tfunction go() {}'
				].join('\n'),
				[
					'<StandardSelect options={types} bind:value={type} onchange={go} height="30px" />',
					'<StandardSelect options={roles} bind:value={role} disabled />',
					"<StandardSelect options={[{ value: '', text: 'None' }, ...accounts]} bind:value={account} />"
				].join('\n')
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { Select } from '@likable-hair/svelte'");
		expect(page).toContain("const types: { value: string; label: string }[] = [{ value: 'a', label: 'A' }]");
		expect(page).toContain('({ value: role, label: role.toUpperCase() })');
		expect(page).toContain('return { value: a.id, label: a.name }');
		expect(page).toContain('<Select items={types} bind:value={type} onchange={go} />');
		expect(page).toContain('<Select items={roles} bind:value={role} disabled />');
		expect(page).toContain("<Select items={[{ value: '', label: 'None' }, ...accounts]} bind:value={account} />");
		expect(exists(`${W}/StandardSelect.svelte`)).toBe(false);
		const summary = result.wrappers[0];
		expect(summary).toMatchObject({ target: 'Select', dissolved: 3 });
		expect(summary.props).toContainEqual({ name: 'options', handling: '→ items (text → label)' });
		expect(summary.dropped.join(' ')).toContain('style:border-radius="5px"');
	});

	test('options built in another file, or read elsewhere, keep the wrapper and say where to rename them', () => {
		const { read, result } = run({
			[`${W}/StandardSelect.svelte`]: nativeSelect,
			'src/routes/+page.svelte': svelte(
				[
					"\timport StandardSelect from '$lib/components/common/StandardSelect.svelte'",
					'\tlet { warehouses }: { warehouses: { value: number; text: string }[] } = $props()',
					"\tconst units = [{ value: 'kg', text: 'Kilos' }]",
					'\tlet w = $state(), u = $state()'
				].join('\n'),
				[
					'<StandardSelect options={warehouses} bind:value={w} />',
					'<StandardSelect options={units} bind:value={u} />',
					'<p>{units.find((x) => x.value === u)?.text}</p>'
				].join('\n')
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<StandardSelect options={warehouses} bind:value={w} />');
		expect(page).toContain('<StandardSelect options={units} bind:value={u} />');
		expect(page).toContain("const units = [{ value: 'kg', text: 'Kilos' }]");
		const reasons = result.skipped.map((s) => s.reason);
		expect(reasons).toContain('`options`: `warehouses` comes from a prop; rename `text` to `label` where the options are built, then run again');
		expect(reasons).toContain('`options`: `units` is also used outside the options; rename `text` to `label` where the options are built, then run again');
	});

	test('a wrapper of a native <textarea> becomes Textarea, and LabelAndSelect over a native select becomes Select with label', () => {
		const { read, exists } = run({
			[`${W}/StandardSelect.svelte`]: nativeSelect,
			[`${W}/LabelAndSelect.svelte`]: svelte(
				[
					"\timport StandardSelect from '$lib/components/common/StandardSelect.svelte'",
					"\timport type { ComponentProps } from 'svelte'",
					'\ttype Props = { label: string; name: string } & ComponentProps<typeof StandardSelect>',
					'\tlet { value = $bindable(undefined), label, name, ...restProps }: Props = $props()'
				].join('\n'),
				'<label style:font-weight="500" for={name}>{label}</label>\n<div style:margin-top="5px">\n\t<StandardSelect bind:value {...restProps}></StandardSelect>\n</div>'
			),
			[`${W}/StandardTextarea.svelte`]: svelte(
				'\tlet { placeholder = "", value = $bindable(), disabled, error, hint, oninput }: { placeholder?: string; value?: string; disabled?: boolean; error?: boolean; hint?: string; oninput?: () => void } = $props()',
				[
					'<div class="flex flex-col w-full gap-2">',
					'\t<textarea bind:value {placeholder} {disabled} style:--border-color={error ? "red" : "grey"} oninput={oninput}></textarea>',
					'\t{#if hint}<div class="text-xs" style:color={error ? "red" : undefined}>{hint}</div>{/if}',
					'</div>'
				].join('\n')
			),
			'src/routes/+page.svelte': svelte(
				[
					"\timport LabelAndSelect from '$lib/components/common/LabelAndSelect.svelte'",
					"\timport StandardTextarea from '$lib/components/common/StandardTextarea.svelte'",
					"\tconst kinds = [{ value: 1, text: 'One' }]",
					"\tlet kind = $state(1), note = $state(''), bad = $state(false)"
				].join('\n'),
				'<LabelAndSelect label="Tipo" name="kind" options={kinds} bind:value={kind} />\n<StandardTextarea bind:value={note} error={bad} hint="Required" placeholder="Note" />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain("import { Textarea, Select } from '@likable-hair/svelte'");
		expect(page).toContain("const kinds = [{ value: 1, label: 'One' }]");
		expect(page).toContain('<Select label="Tipo" name="kind" items={kinds} bind:value={kind} />');
		expect(page).toContain(`<Textarea bind:value={note} state={bad ? 'error' : undefined} hint="Required" placeholder="Note" />`);
		for (const name of ['StandardSelect', 'LabelAndSelect', 'StandardTextarea']) expect(exists(`${W}/${name}.svelte`)).toBe(false);
	});

	test('an event handled by an element around the children is behaviour, not look', () => {
		const { read, result } = run({
			[`${W}/StandardButton.svelte`]: svelte(
				[
					"\timport { Button } from '@likable-hair/svelte'",
					"\timport { preloadData } from '$app/navigation'",
					'\tlet { urlToPreload = undefined, children, ...rest } = $props()',
					'\tfunction preload() {',
					'\t\tif (urlToPreload) preloadData(urlToPreload)',
					'\t}'
				].join('\n'),
				'<Button {...rest}>\n\t<div style:display="flex" onmouseenter={preload}>{@render children?.()}</div>\n</Button>'
			),
			'src/routes/+page.svelte': svelte(
				"\timport StandardButton from '$lib/components/common/StandardButton.svelte'",
				'<StandardButton urlToPreload="/a">A</StandardButton>\n<StandardButton>B</StandardButton>'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<StandardButton urlToPreload="/a">A</StandardButton>');
		expect(page).toContain('<Button>B</Button>');
		expect(result.skipped.find((s) => s.id === 'wrappers/StandardButton')?.reason).toBe('`urlToPreload` handled by `onmouseenter` of <div>');
	});

	test('a value computed from names of the wrapper is not copied into the page', () => {
		const { read, result } = run({
			[`${W}/StandardTextfield.svelte`]: svelte(
				"\timport { SimpleTextField } from '@likable-hair/svelte'\n\tlet { value = $bindable(), ...restProps } = $props()",
				"<SimpleTextField bind:value {...restProps} --simple-textfield-default-margin-bottom={restProps.hint ? '2px' : '0px'} --simple-textfield-default-width=\"100%\" />"
			),
			[`${W}/StandardAddButton.svelte`]: svelte(
				"\timport { Button } from '@likable-hair/svelte'\n\timport { mdiPlus } from '@mdi/js'\n\tlet { ...rest } = $props()",
				'<Button icon={mdiPlus} {...rest} />'
			),
			'src/routes/+page.svelte': svelte(
				"\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'\n\timport StandardAddButton from '$lib/components/common/StandardAddButton.svelte'\n\tlet v = $state('')",
				'<StandardTextfield bind:value={v} hint="Required" />\n<StandardAddButton />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<SimpleTextField bind:value={v} hint="Required" />');
		expect(page).toContain('<StandardAddButton />');
		const textfield = result.wrappers.find((w) => w.file.endsWith('StandardTextfield.svelte'))!;
		expect(textfield.dropped.join(' ')).toContain('restProps.hint');
		expect(result.wrappers.find((w) => w.file.endsWith('StandardAddButton.svelte'))?.blockers).toEqual(["`icon` is computed from the wrapper's own values"]);
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

describe('dissolve: language from paraglide', () => {
	const table = (extra: string) =>
		svelte(
			[
				"\timport { PaginatedTable } from '@likable-hair/svelte'",
				"\timport { getLocale } from '../../../paraglide/runtime'",
				"\timport type { ComponentProps } from 'svelte'",
				'\tlet { ...rest }: ComponentProps<typeof PaginatedTable> = $props()',
				'\tlet lang = getLocale()',
				extra
			].join('\n'),
			'<PaginatedTable {lang} {...rest} />'
		);
	const page = svelte("\timport StandardPaginatedTable from '$lib/components/common/StandardPaginatedTable.svelte'", '<StandardPaginatedTable />');

	test('a lang computed from getLocale() is dropped, the language comes from setDefaultLocale', () => {
		const { read, result } = run({ [`${W}/StandardPaginatedTable.svelte`]: table(''), 'src/routes/+page.svelte': page });
		const text = read('src/routes/+page.svelte');
		expect(result.wrappers[0]).toMatchObject({ dissolved: 1 });
		expect(text).toContain('<DataTable');
		expect(text).not.toMatch(/\{lang\}|lang=\{|locale|getLocale/);
	});

	test('a lang that the wrapper changes later still keeps the wrapper', () => {
		const { result } = run({ [`${W}/StandardPaginatedTable.svelte`]: table("\tfunction english() { lang = 'en' }"), 'src/routes/+page.svelte': page });
		expect(result.wrappers[0]).toMatchObject({ dissolved: 0 });
	});
});

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

	test('a placeholder with the text of the label goes, since v5 shows the label above the field', () => {
		const { read, result } = run({
			[`${W}/LabelAndTextfield.svelte`]: labelAndTextfield('SimpleTextField'),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndTextfield from '$lib/components/common/LabelAndTextfield.svelte'\n\tlet a = $state(''), b = $state('')",
				'<LabelAndTextfield label="Email" placeholder="email" bind:value={a} />\n<LabelAndTextfield label="Nome" placeholder="Mario" bind:value={b} />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<SimpleTextField label="Email" bind:value={a} />');
		expect(page).toContain('<SimpleTextField label="Nome" placeholder="Mario" bind:value={b} />');
		expect(result.changes.find((c) => c.kind === 'wrapper-placeholder')?.note).toContain('same text as `label`');
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

	test('a label shown only when the label prop is set becomes the label of the component; a label behind another condition does not', () => {
		const { read, exists } = run({
			[`${W}/StandardTextfield.svelte`]: textfield,
			[`${W}/LabelAndTextfield.svelte`]: svelte(
				[
					"\timport StandardTextfield from '$lib/components/common/StandardTextfield.svelte'",
					"\timport type { ComponentProps } from 'svelte'",
					'\ttype Props = { value?: string; label?: string; name: string } & ComponentProps<typeof StandardTextfield>',
					'\tlet { value = $bindable(), label = undefined, name, ...restProps }: Props = $props()'
				].join('\n'),
				"{#if !!label}\n\t<label style:font-weight=\"500\" for={name}>{label || ''}</label>\n{/if}\n\n<div>\n\t<StandardTextfield bind:value={value} {...restProps}></StandardTextfield>\n</div>"
			),
			[`${W}/LabelAndInput.svelte`]: svelte(
				"\timport { SimpleTextField } from '@likable-hair/svelte'\n\tlet { label, showLabel = true, ...rest } = $props()",
				'{#if showLabel}<label>{label}</label>{/if}\n<SimpleTextField {...rest} />'
			),
			'src/routes/+page.svelte': svelte(
				"\timport LabelAndTextfield from '$lib/components/common/LabelAndTextfield.svelte'\n\timport LabelAndInput from '$lib/components/common/LabelAndInput.svelte'\n\tlet v = $state('')",
				'<LabelAndTextfield label="Nome" name="name" bind:value={v} />\n<LabelAndTextfield name="code" bind:value={v} />\n<LabelAndInput label="Codice" />'
			)
		});
		const page = read('src/routes/+page.svelte');
		expect(page).toContain('<SimpleTextField label="Nome" name="name" bind:value={v} />');
		expect(page).toContain('<SimpleTextField name="code" bind:value={v} />');
		expect(page).toContain('<LabelAndInput label="Codice" />');
		expect(exists(`${W}/LabelAndTextfield.svelte`)).toBe(false);
		expect(exists(`${W}/LabelAndInput.svelte`)).toBe(true);
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
