import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';
import { compileRules, serializeRules } from '../src/compile.ts';
import type { ruleSources } from './sources.ts';

const aurora = fileURLToPath(new URL('../../', import.meta.url));
const { module } = await runnerImport<{ ruleSources: typeof ruleSources }>(
	fileURLToPath(new URL('./sources.ts', import.meta.url)),
	{ configFile: false, root: aurora, logLevel: 'silent' }
);
const rules = compileRules(module.ruleSources());
const target = new URL('../rules/v4-to-v5.json', import.meta.url);
writeFileSync(target, serializeRules(rules));
console.log(
	`${fileURLToPath(target)}: ${rules.components.length} component rules, ${Object.keys(rules.v5.components).length} v5 components`
);
