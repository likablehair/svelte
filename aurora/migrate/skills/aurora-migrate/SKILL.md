---
name: aurora-migrate
description: Migrates a Svelte app from @likable-hair/svelte v4 (or v3) to v5 "Likable Aurora", phase by phase, with the migration_* tools of the aurora MCP server. Use when the user asks to migrate, upgrade or port an app to @likable-hair/svelte 5 / Aurora, or when the app still depends on @likable-hair/svelte 4.x and the task touches the library.
---

# Migrating an app to @likable-hair/svelte v5

v5 is a rewrite: components, props, callbacks, icons, tokens and CSS changed. The rules are known to the migration tool, so you do not need to know the whole library: follow the phases, and read a component's specs only when a remaining point needs it.

Tools: the `aurora` MCP server (`migration_analyze`, `migration_setup`, `migration_codemod`, `migration_rules`, plus `get_component`, `get_example`, `validate_usage`). Without MCP, the same phases are commands: `npx @likable-hair/svelte-migrate analyze|setup|codemod <app-dir>`.

## Ground rules

- **Never commit.** The tool and you only change files; the user reviews and commits.
- The repository must be clean before `setup`: work happens on a new branch (default `aurora-v5`).
- Migrate the **whole app**, then test everything: v4 and v5 do not coexist.
- Ask the user before changing behaviour that the rules do not decide.

## Phases

1. **Analyze** (`migration_analyze`, read-only). Read the summary with the user: phase 0, automatic changes, things to check, manual points by file, wrappers, app-level steps.
   - **Phase 0**: if the app is on Svelte 4 or library v3, first run `npx sv migrate svelte-5` and fix the v3 syntax it reports, then analyze again.
2. **Setup** (`migration_setup`): branch, v5 and `@mdi/js` in package.json, layer order and fonts in the main CSS, `v4-compat.css` when the app uses v4 color tokens, `setDefaultLocale` for non-English apps, coding agents configured. Then **ask the user to run the install** (the tool does not install).
3. **Codemod** (`migration_codemod`, `dryRun` first if the user wants to see it): renames, `{ detail }` removed, MDI names to `@mdi/js`, v4 defaults kept only where behaviour would change. It can be run again.
4. **Remaining points**, file by file, from the codemod report and `npx svelte-check`:
   - for each component, `migration_rules <Name>` tells what changed and the manual steps; `get_component` gives the v5 API;
   - **dissolve the `Standard*` wrappers**: every use becomes the library component. Keep the meaning (`style` → `variant`, `error` → `state`, …) and the layout measures (width, margins); drop colors, padding, heights, radii and shadows (the app takes the Aurora look) and list what you dropped for the user. Keep a wrapper only if it has real logic, and say so;
   - run `validate_usage` on every file you change.
5. **Check**: `npx svelte-check` with no errors, then the user tries the pages listed under "to look at" in the reports (look and behaviour changes the tool cannot verify).

## What the app looks like afterwards

The Aurora theme with the prototype fonts (Geist, Bricolage Grotesque, Geist Mono); v4 color overrides of the app keep working through `v4-compat.css`. Texts follow `setDefaultLocale`. `setup` adds `@likable-hair/svelte-migrate` and `@likable-hair/svelte-mcp` to the dev dependencies: while the first is there, the app counts as being migrated (migration tools and this skill stay available after v5 is installed). When the migration is over, remove `@likable-hair/svelte-migrate` and run `npx svelte-mcp init`: it removes this skill and keeps `aurora-design` for the everyday work.
