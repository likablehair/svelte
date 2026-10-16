import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { analyze } from '../src/analyze.ts';
import { literalStrings } from '../src/match.ts';
import { markdownReport, summaryTable } from '../src/report.ts';
import { loadRules } from '../src/rules.ts';

const index = loadRules();
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const v4 = analyze(fixture('app-v4'), index);
const v3 = analyze(fixture('app-v3'), index);

const find = (analysis: typeof v4, id: string, file?: string) =>
	analysis.findings.filter((f) => f.id === id && (!file || f.file === file));

describe('analyze: app on v4', () => {
	test('reads versions, language and the package manager', () => {
		expect(v4.app.lib).toBe('^4.3.1');
		expect(v4.app.tailwind).toBe('^4.0.0');
		expect(v4.app.lang).toBe('it');
		expect(v4.phase0).toEqual({ svelte4: false, libV3: false, legacyFiles: 0 });
		expect(v4.files.parseErrors).toEqual([]);
	});

	test('counts direct usages and usages through wrappers', () => {
		expect(v4.components.Button).toMatchObject({ status: 'ported', usages: 2, via: 1, files: 2 });
		expect(v4.components.ToolTip).toMatchObject({ status: 'renamed', to: 'Tooltip', usages: 1 });
	});

	test('recognizes a thin wrapper that forwards the rest of its props', () => {
		expect(v4.wrappers).toEqual([
			{
				file: 'src/lib/components/StandardButton.svelte',
				component: 'Button',
				kind: 'thin',
				logic: [],
				rest: true,
				forwarded: {},
				fixed: { props: 0, styles: 1 },
				importers: 1,
				usages: 1
			}
		]);
	});

	test('props passed to a wrapper are checked against the wrapped component', () => {
		const via = v4.findings.filter((f) => f.via === 'src/lib/components/StandardButton.svelte');
		expect(via.map((f) => [f.effort, f.id])).toEqual([
			['auto', 'Button/props.icons/icon'],
			['auto', 'Button/events.changed/onclick'],
			['auto', 'Button/cssVars.renamed/--button-background-color'],
			['manual', 'button-loading']
		]);
		expect(via.some((f) => f.name === 'label')).toBe(false);
	});

	test('classifies literal icons and renames as automatic', () => {
		expect(find(v4, 'Icon/props.renamed/name')).toMatchObject([{ effort: 'auto', kind: 'icon-literal', to: 'path' }]);
		expect(find(v4, 'Button/props.icons/icon', 'src/routes/+page.svelte')[0]).toMatchObject({ effort: 'auto', line: 14 });
		expect(find(v4, 'imports/renamed/ToolTip')).toMatchObject([{ effort: 'auto', to: 'Tooltip', line: 2 }]);
	});

	test('renames with a note and removals with a replacement are to check', () => {
		expect(find(v4, 'Chip/props.renamed/close')).toMatchObject([{ effort: 'check', to: 'closable' }]);
		expect(find(v4, 'ToolTip/props.removed/menuProps')).toMatchObject([{ effort: 'check' }]);
	});

	test('manual steps fire only when their trigger is on the usage', () => {
		expect(find(v4, 'button-disabled')).toMatchObject([{ file: 'src/routes/+page.svelte', line: 14 }]);
		expect(find(v4, 'button-append-snippet')).toEqual([]);
		expect(v4.general.find((g) => g.id === 'button-fixed-height')).toMatchObject({ usages: 2, files: 2 });
	});

	test('v4 defaults missing from a usage: behaviour ones are automatic, look ones to check', () => {
		expect(find(v4, 'ToolTip/props.defaults/appearTimeout')).toMatchObject([{ effort: 'auto', to: 'appearTimeout={0}' }]);
		expect(find(v4, 'ToolTip/props.defaults/placement')).toMatchObject([{ effort: 'check', to: 'placement="bottom"' }]);
		expect(find(v4, 'Button/props.defaults/placement')).toEqual([]);
	});

	test('reports deep imports, changed exports and v4 CSS variables in stylesheets', () => {
		expect(find(v4, 'imports/deep')).toMatchObject([{ effort: 'manual', line: 3 }]);
		expect(find(v4, 'imports/utility/FilterConverter')).toMatchObject([{ effort: 'check', file: 'src/lib/data.ts' }]);
		expect(find(v4, 'Button/cssVars.renamed/--button-default-background-color')).toMatchObject([
			{ effort: 'auto', file: 'src/app.css', line: 2, to: '--button-default-primary-background' }
		]);
		expect(find(v4, 'Button/cssVars.removed/--button-max-height')).toMatchObject([
			{ effort: 'manual', file: 'src/lib/components/StandardButton.svelte' }
		]);
	});

	test('counts icons, callbacks and color tokens', () => {
		expect(v4.icons).toEqual({ attributes: 3, data: 1, dataFiles: 1, dynamic: 0, classes: 0 });
		expect(v4.detail).toEqual({ handlers: 1, elsewhere: 1, files: 1 });
		expect(v4.tokens).toEqual({ uses: 2, overrides: 1, rgbVar: 1, files: 1 });
	});

	test('detects the app-level steps from the app', () => {
		const step = (id: string) => v4.appSteps.find((s) => s.id === id)?.needed;
		expect(step('global-default-locale')).toBe(true);
		expect(step('global-tailwind-4')).toBe(true);
		expect(step('global-tailwind-3')).toBe(false);
		expect(step('global-dark-mode')).toBe(true);
		expect(step('global-filter-converter')).toBe(true);
		expect(step('global-time-fields')).toBe(false);
	});
});

describe('analyze: app on v3 and Svelte 4', () => {
	test('asks for phase 0 and counts the v3 syntax on library components', () => {
		expect(v3.phase0).toEqual({ svelte4: true, libV3: true, legacyFiles: 1 });
		expect(v3.legacySyntax).toEqual({ on: 1, slot: 1, let: 0 });
	});

	test('maps on: directives and named slots to the v4 rules', () => {
		expect(find(v3, 'Button/events.changed/onclick')).toMatchObject([{ effort: 'auto', line: 8 }]);
		expect(find(v3, 'button-append-snippet')).toMatchObject([{ effort: 'manual', line: 8 }]);
	});

	test('names that v4 does not export are manual', () => {
		expect(find(v3, 'imports/not-in-v4/Card')).toMatchObject([{ effort: 'manual', line: 2 }]);
		expect(v3.components.Card).toMatchObject({ status: 'not-in-v4', usages: 1 });
	});
});

describe('reports', () => {
	test('the Markdown report has the summary and the sections with findings', () => {
		const report = markdownReport(v4);
		expect(report).toContain('# Migration analysis: app-v4');
		expect(report).toContain('| Automatic changes | 9 |');
		expect(report).toContain('## Wrappers');
		expect(report).toContain('| button-disabled | 1 | 1 |');
	});

	test('the summary has one row per app', () => {
		const rows = summaryTable([v4, v3]).split('\n');
		expect(rows).toHaveLength(4);
		expect(rows[3]).toContain('| app-v3 |');
		expect(rows[3]).toContain('Svelte 4 + lib v3');
	});
});

describe('literalStrings', () => {
	const node = (type: string, fields: object) => ({ type, start: 0, end: 0, ...fields });
	const literal = (value: string) => node('Literal', { value });
	const identifier = (name: string) => node('Identifier', { name });

	test('a ternary of literals is pure, a member expression is not', () => {
		const ternary = node('ConditionalExpression', {
			test: identifier('open'),
			consequent: literal('mdi-a'),
			alternate: literal('mdi-b')
		});
		const member = node('MemberExpression', { object: identifier('item'), property: identifier('icon') });
		expect(literalStrings(ternary)).toEqual({ strings: ['mdi-a', 'mdi-b'], pure: true });
		expect(literalStrings(member)).toEqual({ strings: [], pure: false });
	});
});

describe('analyze: local copies', () => {
	test('counts the usages of a local copy under its rule and fires the manual steps of that rule', () => {
		const dir = mkdtempSync(join(tmpdir(), 'migrate-analyze-'));
		try {
			const files: Record<string, string> = {
				'package.json': JSON.stringify({ dependencies: { '@likable-hair/svelte': '^4.3.1', svelte: '^5.0.0' } }),
				'svelte.config.js': "export default { kit: { alias: { '@/*': './src/lib/*' } } };\n",
				'src/lib/components/common/PageTitle.svelte': '<script lang="ts">\n\tlet { title } = $props();\n</script>\n<h1>{title}</h1>\n',
				'src/routes/+page.svelte':
					"<script lang=\"ts\">\n\timport PageTitle from '@/components/common/PageTitle.svelte';\n</script>\n\n<PageTitle title=\"Clients\" prependRoute=\"/x\" />\n"
			};
			for (const [rel, text] of Object.entries(files)) {
				mkdirSync(dirname(join(dir, rel)), { recursive: true });
				writeFileSync(join(dir, rel), text);
			}
			const analysis = analyze(dir, index);
			expect(analysis.components['local/PageTitle']).toMatchObject({ to: 'PageHeader', usages: 1 });
			expect(analysis.findings.find((f) => f.id === 'page-title-route-without-back')?.file).toBe('src/routes/+page.svelte');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

