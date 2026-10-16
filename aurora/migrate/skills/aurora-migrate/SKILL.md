---
name: aurora-migrate
description: Migrates a Svelte app from @likable-hair/svelte v4 (or v3) to v5 "Likable Aurora", phase by phase, with the migration_* tools of the aurora MCP server. Use when the user asks to migrate, upgrade or port an app to @likable-hair/svelte 5 / Aurora, or when the app still depends on @likable-hair/svelte 4.x and the task touches the library.
---

# Migrating an app to @likable-hair/svelte v5

v5 is a rewrite: components, props, callbacks, icons, tokens and CSS changed. The rules are known to the migration tool, so you do not need to know the whole library: follow the phases, and read a component's specs only when a remaining point needs it.

Tools: the `aurora` MCP server (`migration_analyze`, `migration_setup`, `migration_codemod`, `migration_next`, `migration_status`, `migration_rules`, plus `get_component`, `get_example`, `validate_usage`). Without MCP, the same phases are commands: `npx @likable-hair/svelte-migrate analyze|setup|codemod|next|status <app-dir>`.

## Ground rules

- **Never commit.** The tool and you only change files; the user reviews and commits.
- The repository must be clean before `setup`: work happens on a new branch (default `aurora-v5`).
- Migrate the **whole app**, then test everything: v4 and v5 do not coexist.
- Ask the user before changing behaviour that the rules do not decide.

## Phases

1. **Analyze** (`migration_analyze`, read-only). Read the summary with the user: phase 0, automatic changes, things to check, manual points by file, wrappers, app-level steps.
   - **Phase 0**: if the app is on Svelte 4 or library v3, first run `npx sv migrate svelte-5` and fix the v3 syntax it reports, then analyze again.
2. **Setup** (`migration_setup`): branch, v5 and `@mdi/js` in package.json, layer order and fonts in the main CSS, `v4-compat.css` when the app uses v4 color tokens, `setDefaultLocale` for non-English apps, `setTitleTemplate` with the name of the app `<title>` (PageHeader writes the tab title), coding agents configured. Then **ask the user to run the install** (the tool does not install).
3. **Codemod** (`migration_codemod`, `dryRun` first if the user wants to see it): renames, `{ detail }` removed, MDI names to `@mdi/js`, v4 defaults kept only where behaviour would change. It also **dissolves the `Standard*` wrappers and the `LabelAnd*` components** (a label next to a field: v5 fields have `label`): every use becomes the library component, keeping what the wrapper props meant (`style` → `variant`, `error` → `state`, `href`, `hint`, `title`) and the layout measures (widths, margins); the wrapper's look (colors, padding, heights, radii, shadows, extra elements) is dropped, and wrapper files nobody imports any more are deleted. Wrappers of a native `<select>`/`<textarea>` become `Select`/`Textarea` (options renamed `text` → `label` where they are built, in the same file); a click guard on `disabled`/`loading` is dropped, since the v5 `Button` ignores those clicks. It can be run again.
   - Show the user the **Wrappers** section of the report: per wrapper, the uses dissolved, the file deleted or kept, and "Look dropped with the wrappers", which they can put back as CSS variables if they want.
4. **Remaining points**, file by file, with `migration_next` (CLI: `next`): it runs svelte-check and returns the next file to fix, each error with the rule that explains it, and the points **to write** in that file (code the tool could not change). Fix the file, call it again; `migration_status` gives the whole list. The order is components before the pages that use them: an error on an app component tag (`via`) is often fixed once, inside that component.
   - when an explanation is not enough, `migration_rules <Name>` shows the whole rule and `get_component` the v5 API;
   - **wrappers the codemod kept**: the Wrappers section says why ("why kept": Svelte 4 syntax, code of its own, no library component) and "Not done" lists the uses it skipped (`wrappers/<Name>`: a prop with logic, a value it could not map, options built in another file: rename their keys as the reason says, then run the codemod again). Dissolve them by hand with the same rule (keep the meaning and the layout, drop the look, tell the user what you dropped); keep a wrapper only if it has real logic, and say so;
   - **app components that passed props through a dissolved wrapper** (for example `LabelAndTextfield` spreading `{...rest}` into the old `StandardTextfield`): the report notes "the spread may carry …", and svelte-check flags those props where the component is used. Add them to the component and map them as the wrapper did (`error` → `state={error ? 'error' : undefined}`);
   - run `validate_usage` on every file you change.
5. **To write, then to look at**: when no errors are left, `migration_next` lists first the points **to write**, file by file: do them (they stay listed after you do them, because they are read from the v4 code: go through them once). Then the points **to look at, by component** (behaviour, look or a default changed: most need no code), each with the pages that use it, and the **pages to try**. Show that part to the user: they try the pages; the tool cannot verify look and behaviour. Write code for a point to look at only where the page relied on the old behaviour.

## What the app looks like afterwards

The Aurora theme with the prototype fonts (Geist, Bricolage Grotesque, Geist Mono); v4 color overrides of the app keep working through `v4-compat.css`. Texts follow `setDefaultLocale`. `setup` adds `@likable-hair/svelte-migrate` and `@likable-hair/svelte-mcp` to the dev dependencies: while the first is there, the app counts as being migrated (migration tools and this skill stay available after v5 is installed). When the migration is over, remove `@likable-hair/svelte-migrate` and run `npx svelte-mcp init`: it removes this skill and keeps `aurora-design` for the everyday work.
