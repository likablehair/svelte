import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { detectAgents, init, installedSkillVersion, mergeAgentsMd, mergeCodexToml } from '../src/init.ts';
import { appInfo } from '../src/spec.ts';
import { tempApp } from './helpers.ts';

function skill(dir: string, name: string, body = 'Body') {
	const path = join(dir, name);
	mkdirSync(path, { recursive: true });
	writeFileSync(join(path, 'SKILL.md'), `---\nname: ${name}\ndescription: test\n---\n${body}\n`);
	return path;
}

function appWithLibrary(version: string) {
	const dir = tempApp(`^${version}`);
	const library = join(dir, 'node_modules/@likable-hair/svelte');
	mkdirSync(library, { recursive: true });
	writeFileSync(join(library, 'package.json'), JSON.stringify({ name: '@likable-hair/svelte', version }));
	skill(join(library, 'skills'), 'aurora-design');
	return dir;
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8');

describe('init', () => {
	test('configures every agent when none is detected', () => {
		const dir = appWithLibrary('5.1.0');
		const result = init(appInfo(dir), '5.1.0');
		expect(result.agents).toEqual(['claude', 'codex', 'cursor', 'copilot']);
		expect(JSON.parse(read(dir, '.mcp.json')).mcpServers.aurora).toEqual({
			type: 'stdio',
			command: 'npx',
			args: ['-y', '@likable-hair/svelte-mcp']
		});
		expect(JSON.parse(read(dir, '.cursor/mcp.json')).mcpServers.aurora.command).toBe('npx');
		expect(JSON.parse(read(dir, '.vscode/mcp.json')).servers.aurora.type).toBe('stdio');
		expect(read(dir, '.codex/config.toml')).toContain('[mcp_servers.aurora]');
		expect(existsSync(join(dir, '.claude/skills/aurora-design/SKILL.md'))).toBe(true);
		expect(existsSync(join(dir, '.agents/skills/aurora-design/SKILL.md'))).toBe(true);
		expect(installedSkillVersion(dir)).toBe('5.1.0');
		expect(read(dir, 'AGENTS.md')).toContain('<!-- aurora:start -->');
		expect(read(dir, 'AGENTS.md')).not.toContain('aurora-migrate');
	});

	test('keeps existing configuration and is idempotent', () => {
		const dir = appWithLibrary('5.1.0');
		writeFileSync(join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'x' } } }, null, 2));
		writeFileSync(join(dir, 'AGENTS.md'), '# Rules\n\nMine.\n');
		init(appInfo(dir), '5.1.0', { agents: ['claude'] });
		const config = JSON.parse(read(dir, '.mcp.json'));
		expect(Object.keys(config.mcpServers)).toEqual(['other', 'aurora']);
		expect(read(dir, 'AGENTS.md')).toMatch(/^# Rules\n\nMine\.\n\n<!-- aurora:start -->/);
		expect(existsSync(join(dir, '.agents'))).toBe(false);
		expect(init(appInfo(dir), '5.1.0', { agents: ['claude'] }).changes).toEqual([]);
	});

	test('updates the skill when the library changes', () => {
		const dir = appWithLibrary('5.1.0');
		init(appInfo(dir), '5.1.0', { agents: ['codex'] });
		skill(join(dir, 'node_modules/@likable-hair/svelte/skills'), 'aurora-design', 'New body');
		const result = init(appInfo(dir), '5.2.0', { agents: ['codex'] });
		expect(result.changes).toContain('Updated skill .agents/skills/aurora-design');
		expect(read(dir, '.agents/skills/aurora-design/SKILL.md')).toContain('New body');
		expect(installedSkillVersion(dir)).toBe('5.2.0');
	});

	test('adds the migration skill on a v4 app', () => {
		const dir = appWithLibrary('4.3.2');
		const migrate = skill(join(dir, 'tools'), 'aurora-migrate');
		init(appInfo(dir), '5.0.0', { agents: ['claude'], migrateSkill: migrate });
		expect(existsSync(join(dir, '.claude/skills/aurora-migrate/SKILL.md'))).toBe(true);
		expect(read(dir, 'AGENTS.md')).toContain('aurora-migrate');
	});

	test('keeps the app in migration while it declares the migration tool', () => {
		const dir = appWithLibrary('5.0.0');
		writeFileSync(
			join(dir, 'package.json'),
			JSON.stringify({ dependencies: { '@likable-hair/svelte': '^5.0.0' }, devDependencies: { '@likable-hair/svelte-migrate': '^0.1.0' } })
		);
		const app = appInfo(dir);
		expect(app.migrating).toBe(true);
		init(app, '5.0.0', { agents: ['claude'], migrateSkill: skill(join(dir, 'tools'), 'aurora-migrate') });
		expect(existsSync(join(dir, '.claude/skills/aurora-migrate/SKILL.md'))).toBe(true);
	});

	test('removes the migration skill once the app is on v5', () => {
		const dir = appWithLibrary('5.0.0');
		skill(join(dir, '.claude/skills'), 'aurora-migrate');
		const result = init(appInfo(dir), '5.0.0', { agents: ['claude'] });
		expect(result.changes).toContain('Removed skill .claude/skills/aurora-migrate (the migration is over)');
		expect(existsSync(join(dir, '.claude/skills/aurora-migrate'))).toBe(false);
	});

	test('detects agents from their folders', () => {
		const dir = tempApp('^5.0.0');
		mkdirSync(join(dir, '.cursor'));
		writeFileSync(join(dir, 'CLAUDE.md'), '');
		expect(detectAgents(dir)).toEqual(['claude', 'cursor']);
	});

	test('merges the Codex table and the AGENTS.md block in place', () => {
		const toml = '[model]\nname = "x"\n\n[mcp_servers.aurora]\ncommand = "old"\n\n[mcp_servers.other]\ncommand = "y"\n';
		const merged = mergeCodexToml(toml, 'npx', ['-y', 'pkg']);
		expect(merged).toBe('[model]\nname = "x"\n\n[mcp_servers.aurora]\ncommand = "npx"\nargs = ["-y", "pkg"]\n\n[mcp_servers.other]\ncommand = "y"\n');
		const md = mergeAgentsMd('A\n<!-- aurora:start -->\nold\n<!-- aurora:end -->\nB\n', 'NEW');
		expect(md).toBe('A\nNEW\nB\n');
	});
});
