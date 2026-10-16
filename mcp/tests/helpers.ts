import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { specSources } from '../../scripts/spec-sources.ts';
import { createServer } from '../src/server.ts';
import { appInfo } from '../src/spec.ts';
import type { Spec } from '../src/types.ts';

export const spec = specSources('5.0.0') as unknown as Spec;

export function tempApp(version: string) {
	const dir = mkdtempSync(join(tmpdir(), 'aurora-mcp-'));
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'app', dependencies: { '@likable-hair/svelte': version } }));
	return dir;
}

export async function connect(dir: string) {
	const app = appInfo(dir);
	const server = createServer({ app, loaded: { spec, source: 'bundled', path: 'test' } });
	const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: 'test', version: '1.0.0' });
	await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
	return client;
}

export async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
	const result = await client.callTool({ name, arguments: args });
	const content = result.content as { type: string; text: string }[];
	return { text: content.map((c) => c.text).join('\n'), isError: !!result.isError };
}
