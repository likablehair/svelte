# @likable-hair/svelte-migrate

Tooling to move an app from `@likable-hair/svelte` v4 (or v3) to v5. It knows the migration rules, so the person (or agent) migrating an app does not have to.

## Commands

From `aurora/`, while the package is not published:

```sh
npm run migrate -- analyze <app-dir>                       # Markdown report on stdout
npm run migrate -- analyze <app-dir> --md report.md --json report.json
npm run migrate -- analyze ~/projects/*/frontend --md reports/ --summary   # one row per app
```

`analyze` is read-only: it never writes inside the app.

`setup <app-dir>` and `codemod <app-dir>` change the app (see `npm run migrate -- --help`); neither commits. After the codemod, `next <app-dir>` gives the remaining points one file at a time and `status <app-dir>` the whole list (both read-only, see below). `setup` also adds this package and `@likable-hair/svelte-mcp` to the dev dependencies and configures the coding agents of the app (MCP server, `aurora-design` and `aurora-migrate` skills, `AGENTS.md`).

## With a coding agent

The same phases are tools of the `aurora` MCP server (`@likable-hair/svelte-mcp`): `migration_analyze`, `migration_setup` (does not install), `migration_codemod`, `migration_next`, `migration_status`, `migration_rules`, available while the app is on v4 or declares this package. `skills/aurora-migrate` is the skill that takes the agent through them; `init` copies it into the app. `npm run migrate:build` builds `dist/` for publishing.

## What the report says

- **Summary**: versions, package manager, git state, whether phase 0 is needed (Svelte 4 or library v3 syntax: run `npx sv migrate svelte-5` first).
- **Automatic**: changes the codemod will make (renames, literal MDI icons, `.detail` in handlers, v4 defaults kept with an attribute).
- **To check**: mechanical with a caveat (a rename whose meaning changed, a removal with a replacement, changed types: `svelte-check` points at most of them).
- **Manual points**: steps that need judgment, by file (`file × step`).
- **General checks**: behaviour or look changes, once per component used.
- **App-level steps**: setup of the app (layers, Tailwind, fonts, locale, dark mode, toasts…) with what was detected.
- **Wrappers**: local components around a library component (`Standard*` or a root library component spreading the rest of the props). Props passed to a wrapper are checked against the wrapped component.
- **Unknown props**: names that neither v5 nor the rules know (typos, v3-only names).

## What the codemod does to wrappers

Before the other changes, every use of a `Standard*` wrapper becomes the library component it wraps; then the same happens to the `LabelAnd*` components (a `<label>` next to a field: the v5 field has its own `label`), and the props they passed on to a dissolved `Standard*` get that wrapper's mapping. What the wrapper props meant is kept (`style` → `variant`, `error` → `state`, `href`, `hint`, `title`: the recipes in `src/dissolve.ts`), and so are the layout measures (widths, margins, `display`); the wrapper's look (colors, padding, heights, radii, shadows, elements around the component) is dropped and listed under "Look dropped with the wrappers". Wrapper files nobody imports any more are deleted. Also handled: a click guard that only skips the click while `disabled` or `loading` (the v5 `Button` already does it); a `<label>` shown only when the label prop is set (`{#if label}`); a wrapper around a native `<select>` or `<textarea>`, which becomes `Select` or `Textarea`, its `{#each options}` list becoming `items` with the option keys renamed (`text` → `label`) where the options are built in the same file. A wrapper in Svelte 4 syntax, with code of its own or without a library component stays ("why kept"), and so does one that passes the component a value computed from its own names (an import, a constant, its rest props); a use that passes a prop the wrapper handled with logic (also an event on an element around the children) stays too ("Not done"), as does a use whose options come from a prop or are read elsewhere in the file.

## Remaining points (`next`, `status`)

After the codemod the strict v5 types make `svelte-check` flag every use that is still wrong. `next` runs it in the app and, for each error, finds the library component behind it (also through an app component that passes its props on) and the rule that explains it: what changed, what to write, with the rule id (`migration_rules` shows the whole rule). It also lists the points **to write** in the same file: rule steps that need code (`kind: 'edit'`) and uses the codemod skipped. The points **to look at** (steps with `kind: 'review'`: behaviour or look changed; changes done with a warning; new defaults) wait until the errors are gone. These come from the v4 code, read from git at the commit the migration branch started from (`setup` records it as `branch.<name>.migrateBase` in the local git config; otherwise the oldest reflog entry of the branch), so nothing is written in the app and the list stays right after the user commits. When no errors are left, `next` lists the points to write, file by file (they come from the v4 code, so they stay listed once done), then the points to look at **grouped by component**, each with the pages that use it, and the **pages to try**: the routes whose imports reach a changed file, with the components to look at there, and the layouts (every page under them).

## Rules

The rules live in `aurora/migrations/v4-to-v5/*.ts`. `npm run migrate:rules` compiles them, with the v4 and v5 export lists and the v5 API of every component, into `rules/v4-to-v5.json`, which the tool reads; a test fails when the JSON is out of date.
