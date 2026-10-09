import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { getComponentDoc, listComponents } from '../../src/docs/api.server.js';
import type { ComponentMigration, GlobalMigration } from '../../migrations/types.js';

const NEW_IN_V5 = ['DotsLoader', 'RadioGroup', 'Toaster'];

const files = import.meta.glob<ComponentMigration | GlobalMigration>('/migrations/v4-to-v5/*.ts', {
	import: 'default',
	eager: true
});
const global = files['/migrations/v4-to-v5/global.ts'] as GlobalMigration;
const rules = Object.entries(files)
	.filter(([path]) => !path.endsWith('/global.ts'))
	.map(([path, rule]) => ({ file: path.split('/').pop()!.replace(/\.ts$/, ''), rule: rule as ComponentMigration }));

const v4Index = readFileSync(new URL('../../../src/lib/index.ts', import.meta.url), 'utf8');
const v4Components = [...v4Index.matchAll(/default\s+as\s+(\w+)\s*\}\s*from\s*'[^']+\.svelte'/g)].map(
	(m) => m[1]
);
const v4Exports = [...v4Index.matchAll(/export\s*\{([^}]+)\}/g)].flatMap((m) =>
	m[1].split(',').map((part) => part.trim().split(/\s+as\s+/).pop()!)
);

const sources = import.meta.glob<string>(['/src/lib/**/*.svelte', '/src/lib/**/*.css'], {
	query: '?raw',
	import: 'default',
	eager: true
});
const v5Components = listComponents();
const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function api(name: string) {
	const doc = getComponentDoc(kebab(name))!;
	const file = `/src/lib/${doc.file}`;
	const svelte = sources[file];
	const css = sources[file.replace(/\.svelte$/, '.css')] ?? '';
	const names = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].map((m) => m[1]);
	const internal = new Set(names(svelte, /(--[a-z][a-z0-9-]*)\s*:/g));
	const publicCssVars = new Set(
		[
			...doc.cssVars.flatMap((v) => [v.name, ...v.defaults.map((d) => d.name)]),
			...doc.cssDefaultsOnly.map((d) => d.name),
			...names(svelte + css, /var\(\s*(--[a-z][a-z0-9-]*)/g),
			...names(css, /(--[a-z][a-z0-9-]*)\s*:/g)
		].filter((name) => !internal.has(name))
	);
	const cssVars = new Set([...publicCssVars, ...names(svelte, /(--[a-z][a-z0-9-]*)/g)]);
	return {
		props: new Set(doc.props.map((p) => p.name)),
		snippets: new Set(doc.snippets.map((s) => s.name)),
		events: new Set(doc.events.map((e) => e.name)),
		forwardsNative: !!doc.htmlElement,
		cssVars,
		publicCssVars
	};
}

describe('v4 → v5 migration rules', () => {
	test('every v5 component that exists in v4 has its rule file', () => {
		const covered = new Set(rules.map((r) => r.rule.to));
		const missing = v5Components
			.map((c) => c.name)
			.filter((name) => !covered.has(name) && !NEW_IN_V5.includes(name));
		expect(missing).toEqual([]);
	});

	test('every v4 export is migrated, listed in global.exports, or still pending there', () => {
		const handled = new Set([
			...rules.map((r) => r.rule.from),
			...global.exports.map((e) => e.name),
			...v5Components.map((c) => c.name)
		]);
		expect(v4Exports.filter((name) => !handled.has(name))).toEqual([]);
	});

	test('global.exports does not list what v5 already exports', () => {
		const v5 = new Set(v5Components.map((c) => c.name));
		expect(global.exports.filter((e) => e.pending && v5.has(e.name)).map((e) => e.name)).toEqual(
			[]
		);
	});

	test('manual step ids are unique', () => {
		const ids = [...global.manual, ...rules.flatMap((r) => r.rule.manual ?? [])].map((m) => m.id);
		expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
	});

	describe.each(rules)('$file', ({ file, rule }) => {
		test('names match the file, a v4 component and a v5 component', () => {
			expect(rule.to).toBe(file);
			expect(v4Components).toContain(rule.from);
			expect(v5Components.map((c) => c.name)).toContain(rule.to);
		});

		test('v5 names exist in the v5 component and removed v4 names do not', () => {
			const v5 = api(rule.to);
			const problems: string[] = [];
			const mustExist = (kind: string, set: Set<string>, name: string) => {
				if (!set.has(name)) problems.push(`${kind} "${name}" is not in v5 ${rule.to}`);
			};
			const mustNotExist = (kind: string, set: Set<string>, name: string) => {
				if (set.has(name)) problems.push(`${kind} "${name}" still exists in v5 ${rule.to}`);
			};
			const { props, events, snippets, cssVars } = rule;

			for (const r of [...(props?.renamed ?? []), ...(props?.inverted ?? [])]) {
				if (!r.native) mustExist('prop', v5.props, r.to);
				mustNotExist('renamed prop', v5.props, r.from);
			}
			for (const r of props?.removed ?? []) mustNotExist('removed prop', v5.props, r.name);
			for (const r of props?.changed ?? []) {
				if (!r.native) mustExist('changed prop', v5.props, r.name);
			}
			for (const r of props?.toCssVar ?? []) {
				mustExist('CSS variable', v5.cssVars, r.cssVar);
				mustNotExist('prop moved to CSS', v5.props, r.name);
			}
			for (const name of [
				...(props?.defaults ?? []).map((d) => d.name),
				...(props?.values ?? []).map((d) => d.name),
				...(props?.types ?? []).map((d) => d.name),
				...(props?.icons ?? [])
			]) {
				mustExist('prop', v5.props, name);
			}

			for (const e of events?.changed ?? []) {
				const name = e.to ?? e.name;
				if (!v5.events.has(name) && !(v5.forwardsNative && /^on[a-z]+$/.test(name))) {
					problems.push(`event "${name}" is neither declared nor native in v5 ${rule.to}`);
				}
			}
			for (const r of events?.removed ?? []) mustNotExist('removed event', v5.events, r.name);

			for (const r of snippets?.renamed ?? []) {
				mustExist('snippet', v5.snippets, r.to);
				mustNotExist('renamed snippet', v5.snippets, r.from);
			}
			for (const r of snippets?.removed ?? []) mustNotExist('removed snippet', v5.snippets, r.name);
			for (const r of snippets?.parameters ?? []) mustExist('snippet', v5.snippets, r.name);

			for (const r of cssVars?.renamed ?? []) {
				mustExist('CSS variable', v5.cssVars, r.to);
				mustNotExist('renamed CSS variable', v5.publicCssVars, r.from);
			}
			for (const r of cssVars?.changed ?? []) mustExist('changed CSS variable', v5.cssVars, r.name);
			for (const r of cssVars?.removed ?? []) {
				mustNotExist('removed CSS variable', v5.publicCssVars, r.name);
			}

			expect(problems).toEqual([]);
		});

		test('manual step ids start with the component name', () => {
			const prefix = `${kebab(rule.to)}-`;
			expect((rule.manual ?? []).map((m) => m.id).filter((id) => !id.startsWith(prefix))).toEqual(
				[]
			);
		});
	});
});
