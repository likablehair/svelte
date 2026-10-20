import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { spec, tempApp } from './helpers.ts';

const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const dir = tempApp('^5.0.0');
mkdirSync(join(dir, 'node_modules/@likable-hair/svelte/dist'), { recursive: true });
writeFileSync(join(dir, 'node_modules/@likable-hair/svelte/package.json'), JSON.stringify({ version: '5.0.0' }));
writeFileSync(join(dir, 'node_modules/@likable-hair/svelte/dist/spec.json'), JSON.stringify(spec));
writeFileSync(join(dir, 'Page.svelte'), '<script>\n\timport { Button } from "@likable-hair/svelte"\n</script>\n\n<Button colour="red">Save</Button>\n');
const run = (...args: string[]) => execFileSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8' });

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('svelte-mcp commands for agents without MCP', () => {
	test('component prints the specs of the installed library, only the sections asked for', () => {
		const out = run('component', 'Button', '--sections', 'props');
		expect(out).toContain('# Button');
		expect(out).toContain('## Props');
		expect(out).not.toContain('## CSS variables');
	});

	test('example lists the examples, validate checks a file', () => {
		expect(run('example', 'Button')).toContain('Examples of Button');
		expect(run('validate', 'Page.svelte')).toContain('colour');
	});
});
