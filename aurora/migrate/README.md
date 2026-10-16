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

`setup <app-dir>` and `codemod <app-dir>` change the app (see `npm run migrate -- --help`); neither commits. `setup` also adds this package and `@likable-hair/svelte-mcp` to the dev dependencies and configures the coding agents of the app (MCP server, `aurora-design` and `aurora-migrate` skills, `AGENTS.md`).

## With a coding agent

The same phases are tools of the `aurora` MCP server (`@likable-hair/svelte-mcp`): `migration_analyze`, `migration_setup` (does not install), `migration_codemod`, `migration_rules`, available while the app is on v4 or declares this package. `skills/aurora-migrate` is the skill that takes the agent through them; `init` copies it into the app. `npm run migrate:build` builds `dist/` for publishing.

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

Before the other changes, every use of a `Standard*` wrapper becomes the library component it wraps. What the wrapper props meant is kept (`style` → `variant`, `error` → `state`, `href`, `hint`, `title`: the recipes in `src/dissolve.ts`), and so are the layout measures (widths, margins, `display`); the wrapper's look (colors, padding, heights, radii, shadows, elements around the component) is dropped and listed under "Look dropped with the wrappers". Wrapper files nobody imports any more are deleted. A wrapper in Svelte 4 syntax, with code of its own or without a library component stays ("why kept"); a use that passes a prop the wrapper handled with logic stays too ("Not done").

## Rules

The rules live in `aurora/migrations/v4-to-v5/*.ts`. `npm run migrate:rules` compiles them, with the v4 and v5 export lists and the v5 API of every component, into `rules/v4-to-v5.json`, which the tool reads; a test fails when the JSON is out of date.
