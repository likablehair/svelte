import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MCP_PACKAGE = '@likable-hair/svelte-mcp';

interface McpModule {
	appInfo(dir: string): unknown;
	loadSpec(app: unknown): { spec: { version: string } };
	init(app: unknown, version: string, options: { migrateSkill?: string }): { changes: string[]; notes: string[] };
}

export const migrateSkill = () => {
	const dir = fileURLToPath(new URL('../skills/aurora-migrate', import.meta.url));
	return existsSync(join(dir, 'SKILL.md')) ? dir : undefined;
};

async function loadMcp(): Promise<McpModule | undefined> {
	try {
		return (await import(MCP_PACKAGE)) as McpModule;
	} catch {
		const sibling = new URL('../../mcp/src/index.ts', import.meta.url);
		return existsSync(sibling) ? ((await import(sibling.href)) as McpModule) : undefined;
	}
}

export async function setupAgents(dir: string): Promise<string[]> {
	const mcp = await loadMcp();
	if (!mcp) return [`Coding agents not configured: run \`npx ${MCP_PACKAGE} init\` in the app.`];
	const app = mcp.appInfo(dir);
	const result = mcp.init(app, mcp.loadSpec(app).spec.version, { migrateSkill: migrateSkill() });
	return [...result.changes.map((c) => `Agents: ${c}`), ...result.notes.map((n) => `Agents: ${n}`)];
}
