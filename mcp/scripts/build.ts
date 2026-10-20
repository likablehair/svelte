import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const run = (command: string, args: string[]) => execFileSync(command, args, { cwd: path('../../'), stdio: 'inherit' });

rmSync(path('../dist'), { recursive: true, force: true });
rmSync(path('../bundled'), { recursive: true, force: true });
run('node', ['scripts/build-spec.ts', 'mcp/bundled/spec.json']);
if (existsSync(path('../../skills'))) cpSync(path('../../skills'), path('../bundled/skills'), { recursive: true });
run('pnpm', ['exec', 'tsc', '-p', 'mcp']);
console.log('mcp/dist and mcp/bundled ready.');
