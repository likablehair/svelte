#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { componentMarkdown, examples, findComponent, notFound, SECTIONS } from './docs.ts';
import { AGENTS, type Agent, init } from './init.ts';
import { migrateSkillDir } from './migration.ts';
import { createServer } from './server.ts';
import { appInfo, loadSpec } from './spec.ts';
import { formatIssues, validateUsage } from './validate.ts';

const USAGE = `Usage:
  svelte-mcp                 Start the MCP server (stdio) for the app in the current directory.
  svelte-mcp init [--agents claude,codex,cursor,copilot] [--command <cmd> --args "<a b>"]
                             Configure the MCP server and copy the skills for the coding agents of
                             the app (default: the agents whose folders exist, or all of them), and
                             add a managed block to AGENTS.md. Run it again after updating the library.
                             Never commits.
  svelte-mcp component <Name> [--sections props,snippets,...]
                             The specs of a component (the get_component tool), from the library
                             installed in the app.
  svelte-mcp example <Name> [<id>]
                             The examples of a component, or the source of one (get_example).
  svelte-mcp validate <file...>
                             Checks .svelte files against the specs (validate_usage).`;

const [command, ...rest] = process.argv.slice(2);

if (!command) {
	const app = appInfo(process.cwd());
	const server = createServer({ app, loaded: loadSpec(app) });
	await server.connect(new StdioServerTransport());
} else if (command === 'init') {
	const option = (name: string) => {
		const at = rest.indexOf(name);
		return at >= 0 ? rest[at + 1] : undefined;
	};
	const agents = option('--agents')?.split(',').map((a) => a.trim()) as Agent[] | undefined;
	const unknown = agents?.filter((a) => !AGENTS.includes(a));
	if (unknown?.length) {
		console.error(`Unknown agents: ${unknown.join(', ')}. Known: ${AGENTS.join(', ')}`);
		process.exit(1);
	}
	try {
		const app = appInfo(process.cwd());
		const { spec } = loadSpec(app);
		const result = init(app, spec.version, {
			agents,
			command: option('--command'),
			args: option('--args')?.split(' ').filter(Boolean),
			migrateSkill: migrateSkillDir(app.dir)
		});
		console.log(`Agents: ${result.agents.join(', ')}`);
		console.log(result.changes.length ? result.changes.map((c) => `- ${c}`).join('\n') : 'Everything is up to date.');
		for (const note of result.notes) console.log(`Note: ${note}`);
		console.log('Nothing was committed.');
	} catch (error) {
		console.error((error as Error).message);
		process.exit(1);
	}
} else if (['component', 'example', 'validate'].includes(command) && rest.length) {
	try {
		const app = appInfo(process.cwd());
		const { spec } = loadSpec(app);
		if (command === 'validate') {
			for (const file of rest) console.log(formatIssues(validateUsage(spec, readFileSync(file, 'utf8'), resolve(file)), relative(app.dir, resolve(file))));
		} else {
			const at = rest.indexOf('--sections');
			const sections = at >= 0 ? rest.splice(at, 2)[1]?.split(',').filter((s): s is (typeof SECTIONS)[number] => (SECTIONS as readonly string[]).includes(s)) : undefined;
			const component = findComponent(spec, rest[0]);
			if (!component) throw new Error(notFound(spec, rest[0]));
			console.log(command === 'component' ? componentMarkdown(component, sections) : examples(component, rest[1]));
		}
	} catch (error) {
		console.error((error as Error).message);
		process.exit(1);
	}
} else {
	console.log(USAGE);
	process.exit(command === '-h' || command === '--help' ? 0 : 1);
}
