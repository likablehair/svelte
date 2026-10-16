import { PACKAGE } from './markdown.js';
import type { StylingSection } from './styling.js';

export const MCP_PACKAGE = '@likable-hair/svelte-mcp';

export const AGENTS_TITLE = 'AI agents';

export const AGENTS_INTRO = `Coding agents (Claude Code, Codex, Cursor, Copilot) get the exact specs of the installed version from an MCP server, and a skill that tells them how to design pages with the library. One command sets both up in an app.`;

const server = { command: 'npx', args: ['-y', MCP_PACKAGE] };

export const AGENTS_SECTIONS: StylingSection[] = [
	{
		title: 'What you get',
		blocks: [
			`The \`aurora\` MCP server (\`${MCP_PACKAGE}\`): props, snippets, events, CSS variables and examples of every component, the tokens, the themes (also the gallery ones, which are not in the package), the page patterns, a docs search and \`validate_usage\`, which checks a \`.svelte\` file against the specs. It reads \`${PACKAGE}/spec.json\` from the app's \`node_modules\`, so the agent sees the version the app uses, not the latest.`,
			`The \`aurora-design\` skill: how to design a page with the library (pick a pattern, read the specs, use only library components and tokens, check the result). It ships inside \`${PACKAGE}\`, with the same version as the specs.`,
			'A block in `AGENTS.md` that points every agent to the skill and the server, also the agents that do not read skills.'
		]
	},
	{
		title: 'Install',
		blocks: [
			'In the root of the app:',
			{ lang: 'sh', source: `npm i -D ${MCP_PACKAGE}\nnpx svelte-mcp init` },
			'`init` finds the agents the app already uses from their folders (all four when there are none; `--agents claude,cursor` to choose) and, for each one, adds the server to its configuration and copies the skill. It merges with the existing files, can be run again and never commits.',
			{
				lang: 'text',
				source: `.mcp.json                    Claude Code: server
.claude/skills/aurora-design Claude Code: skill
.cursor/mcp.json             Cursor: server
.vscode/mcp.json             Copilot (VS Code): server
.codex/config.toml           Codex: server (trusted projects only)
.agents/skills/aurora-design Codex, Cursor, Copilot: skill
AGENTS.md                    block between <!-- aurora:start --> and <!-- aurora:end -->`
			},
			'Restart the agent, or reload its MCP servers, after the first `init`.'
		]
	},
	{
		title: 'Configure by hand',
		blocks: [
			'The server is a local stdio process started in the app folder. Claude Code (`.mcp.json`) and Cursor (`.cursor/mcp.json`):',
			{ lang: 'json', source: JSON.stringify({ mcpServers: { aurora: server } }, null, 2) },
			'Copilot in VS Code (`.vscode/mcp.json`):',
			{ lang: 'json', source: JSON.stringify({ servers: { aurora: { type: 'stdio', ...server } } }, null, 2) },
			'Codex (`.codex/config.toml`, or `~/.codex/config.toml` for every project):',
			{ lang: 'toml', source: `[mcp_servers.aurora]\ncommand = "npx"\nargs = ["-y", "${MCP_PACKAGE}"]` }
		]
	},
	{
		title: 'Tools',
		blocks: [
			{
				lang: 'text',
				source: `list_components     every component, by category, one line each
get_component       full specs of one component, or only some sections
get_example         the examples of a component, and their source
get_pattern         the page patterns, and their source
search_docs         components, props, events, snippets, types, CSS variables, tokens by words
get_tokens          the --global-* tokens with light and dark values
list_themes         default, package and gallery themes
get_theme           CSS of a theme and how to install and activate it
get_styling_guide   cascade layers, overrides, Tailwind
validate_usage      checks a .svelte file or code against the specs`
			},
			'Prompts, where the agent supports them: `design-page` (build a page following the skill) and `create-theme` (a theme from a brand color or a mood, tokens only).',
			'`validate_usage` finds unknown props, snippets and CSS variables, binds on props that are not bindable, `on:` directives and `{ detail }` in callbacks (v4 habits), components that do not exist in this version and hardcoded colors. It does not replace `svelte-check`.'
		]
	},
	{
		title: 'After updating the library',
		blocks: [
			`The specs follow the installed version by themselves. The skill is a copy: run \`npx svelte-mcp init\` again after updating \`${PACKAGE}\`. The server tells the agent when the copy is older than the library.`
		]
	},
	{
		title: 'Migrating from v4',
		blocks: [
			`In an app still on ${PACKAGE} 4.x, or being migrated, the server adds the \`migration_analyze\`, \`migration_setup\`, \`migration_codemod\`, \`migration_next\`, \`migration_status\` and \`migration_rules\` tools and the \`migrate-app\` prompt, and \`init\` adds the \`aurora-migrate\` skill, which takes the agent through the phases. The specs it shows are those of v5, the target. The tools need the migration package (\`setup\` adds it):`,
			{ lang: 'sh', source: 'npm i -D @likable-hair/svelte-migrate' },
			'`setup` of the migration adds both packages to the dev dependencies and runs `init` itself; nothing is ever committed. The app counts as being migrated while `@likable-hair/svelte-migrate` is among its dependencies, so the tools stay available after v5 is installed. When the migration is over, remove it and run `npx svelte-mcp init` again: the migration skill goes away.'
		]
	}
];

export function agentsMarkdown() {
	const lines = [`# ${AGENTS_TITLE}`, '', AGENTS_INTRO, ''];
	for (const section of AGENTS_SECTIONS) {
		lines.push(`## ${section.title}`, '');
		for (const block of section.blocks) {
			if (typeof block === 'string') lines.push(block, '');
			else lines.push('```' + block.lang, block.source, '```', '');
		}
	}
	return lines.join('\n');
}
