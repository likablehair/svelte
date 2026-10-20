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
		title: 'Using the skills',
		blocks: [
			'The agent loads a skill by itself when the task matches it (UI work for `aurora-design`, migrating the app for `aurora-migrate`). In Claude Code a skill is also a slash command, and the prompts of the server are slash commands too:',
			{
				lang: 'text',
				source: `/aurora-design               the design skill
/aurora-migrate              the migration skill (apps being migrated)
/mcp__aurora__design-page    the design-page prompt of the server
/mcp__aurora__create-theme   the create-theme prompt
/mcp__aurora__migrate-app    the migrate-app prompt (apps being migrated)`
			}
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
		title: 'Monorepos',
		blocks: [
			'`init` writes the files next to the `package.json` of the app, and the server reads the library of the folder it starts in. When the agent runs in a parent folder (the root of a monorepo with the app in `frontend/`), it does not read the configuration in `frontend/`, and a server started at the root does not find the library of the app.',
			'Run `init` in the app folder anyway, then link its skills into the root. Claude Code finds the skills of a subfolder only after it has worked on a file there, and never as slash commands; a link in the `.claude/skills` of the root makes them available from the start, and `init` keeps updating them:',
			{
				lang: 'sh',
				source: 'mkdir -p .claude/skills\nln -s ../../frontend/.claude/skills/aurora-design .claude/skills/aurora-design\nln -s ../../frontend/.claude/skills/aurora-migrate .claude/skills/aurora-migrate   # apps being migrated'
			},
			'Then add the server to the configuration of the root, started in the app folder. Claude Code (`.mcp.json` of the root):',
			{
				lang: 'json',
				source: JSON.stringify({ mcpServers: { aurora: { type: 'stdio', command: 'sh', args: ['-c', `cd frontend && npx -y ${MCP_PACKAGE}`] } } }, null, 2)
			},
			'The other agents take the same `command` and `args` in their file at the root. With more apps on the library, add one server per app, each with its own name (`aurora-admin`, `aurora-shop`).'
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
			{ lang: 'sh', source: `npm i -D @likable-hair/svelte-migrate ${MCP_PACKAGE}\nnpx svelte-mcp init` },
			'This sets up only the agents (server, `aurora-design` and `aurora-migrate`) and leaves the app as it is. `init` copies the migration skill from the `node_modules` of the app: in a workspace that hoists the packages to the root (npm or Yarn workspaces) it does not find it and prints `Skill aurora-migrate not found: skipped`; copy `node_modules/@likable-hair/svelte-migrate/skills/aurora-migrate` of the root into `.claude/skills/` (or `.agents/skills/`) of the app by hand.',
			'`setup` of the migration (`npx @likable-hair/svelte-migrate setup <app-dir>`) also adds both packages to the dev dependencies and runs `init` itself, but it starts the migration: new branch, v5 in `package.json`, install, changes to the CSS and the root layout. Nothing is ever committed. The app counts as being migrated while `@likable-hair/svelte-migrate` is among its dependencies, so the tools stay available after v5 is installed. When the migration is over, remove it and run `npx svelte-mcp init` again: the migration skill goes away.'
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
