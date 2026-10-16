import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type AppInfo, PACKAGE, skillSource } from './spec.ts';

export const AGENTS = ['claude', 'codex', 'cursor', 'copilot'] as const;
export type Agent = (typeof AGENTS)[number];

export const SERVER_NAME = 'aurora';
export const MCP_PACKAGE = '@likable-hair/svelte-mcp';
export const DESIGN_SKILL = 'aurora-design';
export const MIGRATE_SKILL = 'aurora-migrate';
export const VERSION_FILE = 'VERSION';

const MARK_START = '<!-- aurora:start -->';
const MARK_END = '<!-- aurora:end -->';

export interface InitOptions {
	agents?: Agent[];
	command?: string;
	args?: string[];
	migrateSkill?: string;
}

export interface InitResult {
	agents: Agent[];
	changes: string[];
	notes: string[];
}

const SKILL_DIRS: Record<Agent, string> = {
	claude: '.claude/skills',
	codex: '.agents/skills',
	cursor: '.agents/skills',
	copilot: '.agents/skills'
};

export function detectAgents(dir: string): Agent[] {
	const has = (path: string) => existsSync(join(dir, path));
	const found = AGENTS.filter((agent) => {
		if (agent === 'claude') return has('.claude') || has('CLAUDE.md') || has('.mcp.json');
		if (agent === 'codex') return has('.codex');
		if (agent === 'cursor') return has('.cursor');
		return has('.vscode') || has('.github/copilot-instructions.md');
	});
	return found.length ? found : [...AGENTS];
}

function writeIfChanged(file: string, content: string, changes: string[], label: string) {
	const before = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
	if (before === content) return;
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, content);
	changes.push(`${before === undefined ? 'Created' : 'Updated'} ${label}`);
}

function mergeJson(dir: string, path: string, key: string, entry: object, changes: string[]) {
	const file = join(dir, path);
	const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
	let data: Record<string, any>;
	try {
		data = text.trim() ? JSON.parse(text) : {};
	} catch {
		throw new Error(`${path} is not valid JSON (comments are not supported): add the "${SERVER_NAME}" server by hand.`);
	}
	data[key] = { ...(data[key] ?? {}), [SERVER_NAME]: entry };
	const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '\t';
	writeIfChanged(file, JSON.stringify(data, null, indent) + '\n', changes, path);
}

const tomlString = (value: string) => JSON.stringify(value);

export function mergeCodexToml(text: string, command: string, args: string[]) {
	const table = [
		`[mcp_servers.${SERVER_NAME}]`,
		`command = ${tomlString(command)}`,
		`args = [${args.map(tomlString).join(', ')}]`
	].join('\n');
	const header = new RegExp(`^\\[mcp_servers\\.${SERVER_NAME}\\]\\s*$`, 'm');
	const match = header.exec(text);
	if (!match) return `${text.trimEnd()}${text.trim() ? '\n\n' : ''}${table}\n`;
	const rest = text.slice(match.index + match[0].length);
	const next = rest.search(/^\[/m);
	const end = next < 0 ? text.length : match.index + match[0].length + next;
	return `${text.slice(0, match.index)}${table}\n${next < 0 ? '' : '\n'}${text.slice(end)}`.replace(/\n{3,}/g, '\n\n');
}

export function agentsBlock(hasMigration: boolean) {
	return [
		MARK_START,
		`## ${PACKAGE}`,
		'',
		`This app uses the ${PACKAGE} component library (Likable Aurora). For any UI work:`,
		'',
		`- Follow the \`${DESIGN_SKILL}\` skill (in \`.agents/skills/\` or \`.claude/skills/\`).`,
		`- Get component props, snippets, CSS variables, examples, tokens and themes from the \`${SERVER_NAME}\` MCP server (\`${MCP_PACKAGE}\`), not from memory; check new code with its \`validate_usage\` tool.`,
		'- Use the library components directly and style them only through their CSS variables and the `--global-*` tokens. A local wrapper only for a feature the library lacks, reused across the app; repeated UI goes in an app component, not in one page.',
		...(hasMigration
			? ['', `The app is being migrated from ${PACKAGE} v4 to v5: follow the \`${MIGRATE_SKILL}\` skill and the \`migration_*\` tools. When it is over, remove \`@likable-hair/svelte-migrate\` from the dev dependencies and run init again.`]
			: []),
		'',
		`Kept up to date by \`npx ${MCP_PACKAGE} init\`: edit outside these markers.`,
		MARK_END
	].join('\n');
}

export function mergeAgentsMd(text: string, block: string) {
	const start = text.indexOf(MARK_START);
	const end = text.indexOf(MARK_END);
	if (start >= 0 && end > start) return text.slice(0, start) + block + text.slice(end + MARK_END.length);
	return `${text.trimEnd()}${text.trim() ? '\n\n' : ''}${block}\n`;
}

function copySkill(source: string, target: string, version: string, changes: string[], label: string) {
	const stamp = join(target, VERSION_FILE);
	const same =
		existsSync(stamp) &&
		readFileSync(stamp, 'utf8').trim() === version &&
		readFileSync(join(target, 'SKILL.md'), 'utf8') === readFileSync(join(source, 'SKILL.md'), 'utf8');
	if (same) return;
	const existed = existsSync(target);
	rmSync(target, { recursive: true, force: true });
	cpSync(source, target, { recursive: true });
	writeFileSync(stamp, `${version}\n`);
	changes.push(`${existed ? 'Updated' : 'Added'} skill ${label}`);
}

export function init(app: AppInfo, specVersion: string, options: InitOptions = {}): InitResult {
	const dir = app.dir;
	const agents = options.agents?.length ? options.agents : detectAgents(dir);
	const command = options.command ?? 'npx';
	const args = options.args ?? ['-y', MCP_PACKAGE];
	const changes: string[] = [];
	const notes: string[] = [];

	if (agents.includes('claude')) mergeJson(dir, '.mcp.json', 'mcpServers', { type: 'stdio', command, args }, changes);
	if (agents.includes('cursor')) mergeJson(dir, '.cursor/mcp.json', 'mcpServers', { command, args }, changes);
	if (agents.includes('copilot')) mergeJson(dir, '.vscode/mcp.json', 'servers', { type: 'stdio', command, args }, changes);
	if (agents.includes('codex')) {
		const file = join(dir, '.codex/config.toml');
		const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
		writeIfChanged(file, mergeCodexToml(text, command, args), changes, '.codex/config.toml');
		notes.push('Codex reads .codex/config.toml only in trusted projects.');
	}

	const skills: [string, string | undefined][] = [[DESIGN_SKILL, skillSource(app, DESIGN_SKILL)]];
	if (app.migrating) skills.push([MIGRATE_SKILL, options.migrateSkill]);
	for (const skillDir of new Set(agents.map((agent) => SKILL_DIRS[agent]))) {
		for (const [name, source] of skills) {
			if (!source || !existsSync(join(source, 'SKILL.md'))) {
				notes.push(`Skill ${name} not found: skipped.`);
				continue;
			}
			copySkill(source, join(dir, skillDir, name), specVersion, changes, `${skillDir}/${name}`);
		}
	}

	if (!app.migrating) {
		for (const skillDir of new Set(Object.values(SKILL_DIRS))) {
			const target = join(dir, skillDir, MIGRATE_SKILL);
			if (!existsSync(target)) continue;
			rmSync(target, { recursive: true, force: true });
			changes.push(`Removed skill ${skillDir}/${MIGRATE_SKILL} (the migration is over)`);
		}
	}

	const agentsFile = join(dir, 'AGENTS.md');
	const current = existsSync(agentsFile) ? readFileSync(agentsFile, 'utf8') : '';
	writeIfChanged(agentsFile, mergeAgentsMd(current, agentsBlock(app.migrating)), changes, 'AGENTS.md');

	return { agents, changes, notes: [...new Set(notes)] };
}

export function installedSkillVersion(dir: string) {
	for (const base of new Set(Object.values(SKILL_DIRS))) {
		const stamp = join(dir, base, DESIGN_SKILL, VERSION_FILE);
		if (existsSync(stamp)) return readFileSync(stamp, 'utf8').trim();
	}
	return undefined;
}
