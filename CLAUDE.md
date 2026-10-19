# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@likable-hair/svelte` v5 ("Aurora"): a Svelte 5 (runes) component library used by Likablehair frontends, rewritten from scratch on the SvelteKit 3 library template. `src/lib` is the published package, `src/routes` and `src/docs` are the docs site (generated from the sources, readable by LLMs). Target look: `design/components-prototype.html`.

**For any work in this repository (components, themes, tokens, docs, migration tool, MCP), load the `redesign-aurora` skill first and keep it updated when decisions change.** It holds the decisions, the process for a component, the conventions, the known traps and the current state.

Other projects in the repo:
- `migrate/`: `@likable-hair/svelte-migrate`, the v4 → v5 migration tool (`analyze`, `setup`, `codemod`, `next`, `status`). Rules in `migrations/v4-to-v5/`, compiled into `migrate/rules/v4-to-v5.json`. `migrate/v4/` is a frozen copy of the v4 files the tool and the tests read.
- `mcp/`: `@likable-hair/svelte-mcp`, the MCP server for coding agents (component specs, `validate_usage`, `migration_*` tools).
- `adonis-filters/`: `@likable-hair/adonis-filters`, prototype of the one `FilterModifierApplier` for the AdonisJS backends (applies the `FilterBuilder` JSON to Lucid queries of AdonisJS 5, 6 and 7). Its dev dependencies (Lucid, AdonisJS) are installed with the rest by `pnpm install`.
- `skills/`: the `aurora-design` agent skill shipped with the library.

The previous library (v4.3.2) lives on the **`4.x` branch**: it is the reference for component behaviour and gets maintenance fixes only, for the apps not migrated yet. Read it with `git show 4.x:src/lib/<path>` or `git worktree add ../svelte-v4 4.x`. `design/AUDIT.md` lists its known bugs.

## Commands

All from the repository root. The repository is a pnpm workspace (root, `migrate/`, `mcp/`, `adonis-filters/`; pnpm version in `packageManager` of `package.json`): one `pnpm install` installs all four.

- `pnpm dev --port 5180`: docs site (the skill assumes this port; without `--port` Vite picks its default).
- `pnpm check`: svelte-kit sync, svelte-check, then `tsc` for `migrate/`, `mcp/` and `adonis-filters/` (baseline: 0 errors, 0 warnings).
- Tests: Vitest in browser mode (Chromium and Firefox) for components, a `node` project for utilities, rules, the migration tool and the MCP; Playwright for the visual test of every docs example. Run only the tests of what you touched (see "Regola dei test" in the skill): the full `pnpm test` and `pnpm test:visual` are slow and memory-hungry.
- `pnpm package`: svelte-package, `dist/spec.json` for the MCP, publint.
- `pnpm migrate <command> <app-dir>`: the migration tool; `pnpm migrate:rules` after changing a rule, `pnpm migrate:compat` to regenerate `src/lib/css/v4-compat.css`.
- No Prettier and no ESLint in this project.

## Releases

Nothing is published from work sessions: the packages stay `"private": true` until the maintainer publishes them on npm. Publish with `pnpm publish` (or `pnpm pack`), not `npm publish`: pnpm turns the `workspace:^` dependency of `mcp/` on `migrate/` into the real version.
