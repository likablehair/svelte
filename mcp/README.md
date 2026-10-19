# @likable-hair/svelte-mcp

MCP server and `init` command that give coding agents (Claude Code, Codex, Cursor, Copilot) the exact specs of `@likable-hair/svelte` and the skills to use it. User documentation: the "AI agents" page of the docs (`src/docs/agents.ts`).

- `src/server.ts`: the tools and prompts. The specs come from `dist/spec.json` of the library installed in the app (`src/spec.ts`), or from `bundled/spec.json` when the app has none (v4 apps).
- `src/validate.ts`: `validate_usage`, a check of `.svelte` code against the specs with `svelte/compiler`.
- `src/init.ts`: writes the MCP configuration of each agent, copies the skills, keeps a block in `AGENTS.md`.
- `src/migration.ts`: loads `@likable-hair/svelte-migrate` on demand for the `migration_*` tools, registered while the app is on v4 or declares that package.

From the root of the library repository:

```sh
pnpm mcp                          # run the server from source for the current directory
pnpm mcp:build                    # dist/ and bundled/ (spec.json and the aurora-design skill)
pnpm exec vitest run --project node mcp/tests
pnpm dlx @modelcontextprotocol/inspector node mcp/dist/cli.js   # try the tools by hand
```
