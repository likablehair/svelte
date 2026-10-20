import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';
import type { specSources } from './spec-sources.ts';

const aurora = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const { module } = await runnerImport<{ specSources: typeof specSources }>(
	fileURLToPath(new URL('./spec-sources.ts', import.meta.url)),
	{ configFile: false, root: aurora, logLevel: 'silent' }
);
const spec = module.specSources(version);
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['dist/spec.json'];
for (const target of targets) {
	const file = new URL(`../${target}`, import.meta.url);
	mkdirSync(new URL('./', file), { recursive: true });
	writeFileSync(file, JSON.stringify(spec));
	console.log(`${fileURLToPath(file)}: ${spec.components.length} components, ${spec.themes.length} themes`);
}
