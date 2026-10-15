import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { ruleSources } from '../scripts/sources.ts';
import { compileRules, exportNames, serializeRules } from '../src/compile.ts';
import { indexRules } from '../src/rules.ts';

const sources = ruleSources();
const compiled = compileRules(sources);

describe('compiled rules', () => {
	test('rules/v4-to-v5.json is up to date with migrations/v4-to-v5 (run `npm run migrate:rules`)', () => {
		const file = readFileSync(new URL('../rules/v4-to-v5.json', import.meta.url), 'utf8');
		expect(file === serializeRules(compiled)).toBe(true);
	});

	test('one rule per v4 export name', () => {
		const names = compiled.components.map((c) => c.from);
		expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
	});

	test('every v4 component has a rule or a global export entry', () => {
		const index = indexRules(compiled);
		const missing = compiled.v4.components.filter((name) => !index.byV4.has(name) && !index.exportChanges.has(name));
		expect(missing).toEqual([]);
	});

	test('the v5 API of every rule target is included', () => {
		const missing = compiled.components.filter((c) => !compiled.v5.components[c.to]).map((c) => c.to);
		expect(missing).toEqual([]);
	});

	test('export names are read from named, type and renamed exports', () => {
		expect(
			exportNames(
				"export { default as Button } from './Button.svelte';\nexport type { Item, Header as Column } from './types';\nexport { a, type B } from './x';"
			)
		).toEqual(['Button', 'Item', 'Column', 'a', 'B']);
	});
});
