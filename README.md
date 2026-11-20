# Likable Aurora (`@likable-hair/svelte` 5)

This repository holds the component library used by Likablehair's web apps: buttons, form fields, tables, dialogs, menus, charts and everything else an app screen is made of. Version 5, called **Aurora**, is a full rewrite for Svelte 5 with a new look, themes and dark mode.

The previous version (4.x) lives on the **`v4` branch**. It only gets small fixes, for the apps that have not moved to version 5 yet.

## What is in this repository

There are four packages, plus the documentation site:

| Package | What it is for |
|---|---|
| `@likable-hair/svelte` | **The library.** About 70 components, the themes and the styles. This is the package an app installs. |
| `@likable-hair/svelte-migrate` | **The migration tool.** Moves an app from version 4 to version 5, doing most of the work by itself. |
| `@likable-hair/svelte-mcp` | **The helper for AI coding assistants** (Claude Code, Codex, Cursor, Copilot). It gives them the exact description of every component, so they write correct code. |
| `@likable-hair/adonis-filters` | **For the AdonisJS backends.** Applies the filters sent by the tables to the database queries; it replaces the `FilterModifierApplier` class copied into every backend. Its README says how to switch. |
| Documentation site | One page per component, with live examples. Not published as a package. |

## Start here: from this repository to an app

The whole path, in order. Each step links to its section below.

1. **Install the repository.** You need Node 22.18 or later (24 is best) and pnpm (`npm install -g pnpm`: it then switches by itself to the version the repository asks for). From the root: `pnpm install`.
2. **Publish the packages**, once: the apps install them from npm, so nothing below works before this. `pnpm login`, then `pnpm release --dry-run` to see what would happen, then `pnpm release` ([Publishing](#publishing)).
3. **Use the library in an app.**
   - **A new app**: follow the eight steps of [Using the library in an app](#using-the-library-in-an-app).
   - **An app on version 4**: commit everything in the app, run the steps *analyze* and *setup* of the migration tool, then let an AI assistant do the rest ([Letting an AI assistant do the migration](#letting-an-ai-assistant-do-the-migration)). Some points it lists are for the backend, for example the dates of the period filters. Apps still on version 3 stay as they are.
4. **Try and commit.** Open the pages in light and dark mode, on desktop and phone (after a migration, the pages it lists at the end); then commit the app yourself. The tool and the assistant never commit.
5. **After a change to the library**, `pnpm release patch` publishes a new version of the packages that changed. The apps update with `npm update @likable-hair/svelte` (or `pnpm update`) and run `npx svelte-mcp init` again, so the AI assistant gets the instructions of the new version.

## Using the library in an app

The steps are for a SvelteKit app. Steps 1 to 4 prepare the app, once.

**1. Install it**

```sh
npm install @likable-hair/svelte
```

It needs Svelte 5.29 or later.

**2. Prepare the main CSS file** (for example `src/app.css`, imported by the root layout). The library keeps all its CSS in cascade layers, so the app's own CSS always wins over it. Put this line at the top of the file, and put any reset inside `@layer reset`: a reset outside layers, such as `* { margin: 0 }` or `button { padding: 0 }`, would override the components.

```css
@layer reset, theme, base, global, components, utilities;

@layer reset {
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
}
```

With **Tailwind 4**, add after the line above `@import 'tailwindcss';` and `@import '@likable-hair/svelte/tailwind.css';`. With **Tailwind 3**, put `@tailwind base;` inside `@layer reset` and add the preset `@likable-hair/svelte/tailwind-preset` to `tailwind.config.js`. The docs page *Styling* has both, in full.

**3. Set up the root layout** (`src/routes/+layout.svelte`):

```svelte
<script>
	import '../app.css';
	import '@likable-hair/svelte/base.css';
	import { appearanceScript, rememberAppearance, setDefaultLocale } from '@likable-hair/svelte';

	let { children } = $props();

	setDefaultLocale('it');
	rememberAppearance();
</script>

<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>

{@render children()}
```

- `base.css` gives the page the background, text color and font of the theme, also in dark mode. Leave it out only if the app styles `body` itself.
- `setDefaultLocale('it')` sets the language of the built-in texts (such as "Cancel" or "No results"). Without it they are in English.
- `rememberAppearance()` keeps the light or dark mode the user chose, and `appearanceScript()` applies it before the page appears, so the page does not flash in the wrong mode.

**4. Load the fonts.** The library does not download fonts: without this line in the `<head>` of `src/app.html`, the components use the system font.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap" />
```

**5. Use the components**

```svelte
<script>
	import { Button, SimpleTextField } from '@likable-hair/svelte';

	let name = $state('');
</script>

<SimpleTextField label="Name" bind:value={name} />
<Button onclick={() => save(name)}>Save</Button>
```

**6. Change the look**, if needed. Colors, corners, shadows and spacing are CSS variables. Changing one, for example `--global-color-primary`, changes every component. Each component also has its own variables, listed on its docs page.

**7. Themes and dark mode.** The default theme is Aurora. A second theme, `classic`, looks like version 4: import `@likable-hair/svelte/themes/classic.css` in the root layout and call `setTheme('classic')`. Light and dark follow the operating system. The `ModeSwitch` component lets the user pick light, dark or system.

**8. AI assistants** (optional). To let an AI assistant write pages with the library, run this once in the app:

```sh
npm install -D @likable-hair/svelte-mcp
npx svelte-mcp init
```

`init` sets up the assistants the app already uses, found from their folders (`.claude`, `.codex`, `.cursor`, `.vscode`; all four when there are none). For each one it adds:

- the `aurora` **MCP server**, which gives the assistant the exact description of every component of the installed version, and a tool to check the code it writes;
- the `aurora-design` **skill**, with instructions on how to design pages with the library;
- a block in `AGENTS.md` that points to both. If the app has a `CLAUDE.md`, `init` also adds the line `@AGENTS.md` to it: otherwise Claude Code does not read `AGENTS.md`.

Then:

- **Restart the assistant**, so it loads the server and the skill. Claude Code asks once to approve the `aurora` server: accept. Codex reads its configuration (`.codex/config.toml`) only in projects marked as trusted.
- **Commit the files `init` writes** (`.mcp.json`, `.claude/skills/`, `.agents/skills/`, `AGENTS.md`…), so everyone working on the app gets them.
- **Run `npx svelte-mcp init` again after every update of `@likable-hair/svelte`**: the skill is a copy of the installed version.

### What the components cover

- **Buttons**: buttons, links, toggle buttons, confirm and cancel pairs
- **Form fields**: text, text area, select, checkbox, switch, radio, autocomplete, file upload
- **Dates and times**: calendar, date, time, date and time, year, period picker
- **Tables**: simple table, table with pages loaded from the server, filters, search, column manager
- **Windows and menus**: dialog, confirmation dialog, side panel (drawer), menu, tooltip
- **Messages and progress**: toasts, alert banners, loaders, progress bars, empty states
- **Page structure**: sidebar layout, navigation menu, page header, tabs, global search
- **Other**: charts (bar, line, pie), dashboard, avatars, timeline, card lists

The documentation site has the full list.

## The documentation site

From the root of this repository:

```sh
pnpm install
pnpm dev --port 5180
```

Then open http://localhost:5180. You will find:

- a page for **each component**: live examples, its options, its CSS variables and its slots (snippets);
- **Tokens**: all the colors, corners, shadows and fonts of the theme;
- **Styling** and **Themes**: how to change the look, and a gallery of themes to try;
- **Page patterns**: ready-made layouts for common pages (a list, a detail page, a form, a dashboard);
- **AI agents**: how to set up the AI assistant helper in an app.

Every page also exists as plain text (Markdown), so an AI can read it too.

## Migrating an app from version 4 to version 5

Version 5 changes many component names and options. The person migrating an app **does not need to know the whole library**: the migration tool knows every change and does the mechanical part by itself.

Only apps on version 4 are migrated. Apps still on version 3 stay as they are.

The migration works on the branch you are on and keeps the changes already there: which branch to use, and whether to commit or stash first, is up to you.

The migration happens in four steps. Run them inside the app folder:

| Step | Command | What it does |
|---|---|---|
| 1. Analyze | `npx @likable-hair/svelte-migrate analyze .` | Writes a report of what will change. Touches nothing. |
| 2. Setup | `npx @likable-hair/svelte-migrate setup .` | Installs version 5, prepares styles, fonts, language, theme and the AI assistant. |
| 3. Codemod | `npx @likable-hair/svelte-migrate codemod .` | Rewrites the code automatically: new names, new icons, old local copies of components replaced by the library ones. |
| 4. Next | `npx @likable-hair/svelte-migrate next .` | Shows what is left to fix by hand, one file at a time, with an explanation for each point. Repeat until no errors are left and every point to write has been done once. |

At the end, `next` lists the **pages to try** in the browser and the things that **look or behave differently**, so you know what to check.

`status .` shows everything still open in a single list.

**The tool never commits.** You look at the changes and commit them yourself.

`MIGRATION.md` is the complete list of changes, written for people. You do not need to read it all; the tool tells you which part matters for each point.

### Letting an AI assistant do the migration

The tool does the mechanical part (steps 1 to 3). What `next` lists afterwards needs judgment, and an AI assistant such as Claude Code can do it by itself: it fixes one file at a time, runs `next` again, and stops when no errors are left and it has gone through every point to write (the ones the tool cannot verify stay listed after they are done). **What stays with you**: trying the pages it lists at the end, and committing.

1. Do steps 1 and 2 yourself (analyze and setup). Setup also gives the assistant the migration instructions and access to the tool.
2. Open the assistant in the app folder (restart it if it was already open, and in Claude Code approve the `aurora` server when asked).
3. Tell it: *"Migrate this app to @likable-hair/svelte 5 (Aurora)."*
4. When it is done, try the pages it lists and commit.

The assistant still asks you when a change of behaviour is not decided by the migration rules.

**When the migration is over**, remove `@likable-hair/svelte-migrate` from the app's dev dependencies and run `npx svelte-mcp init` again: the migration instructions go away, the ones for everyday work stay.

## Where things are

| Folder or file | What it holds |
|---|---|
| `src/lib/` | The library (components, themes, styles). This is what gets published. |
| `src/routes/`, `src/docs/` | The documentation site and its examples. |
| `migrate/` | The migration tool. |
| `migrations/v4-to-v5/` | The list of changes from version 4 to 5, one file per component, read by the migration tool. |
| `MIGRATION.md` | The same changes, written for people. |
| `mcp/` | The helper for AI coding assistants. |
| `skills/` | Instructions for AI assistants on how to design pages with the library. |
| `tests/` | Automatic tests of the components and screenshots of every example. |
| `design/` | The visual prototype the design comes from, the logo, and the list of known problems of version 4. |

## For people working on the library

The repository uses [pnpm](https://pnpm.io) (the version is in `packageManager` of `package.json`) as a workspace: the library at the root, plus `migrate/`, `mcp/` and `adonis-filters/`.

```sh
pnpm install                                   # all four packages
pnpm exec playwright install chromium firefox  # once, for the tests
pnpm dev --port 5180                           # documentation site
pnpm check                                     # type check
pnpm package                                   # build the library into dist/
pnpm test                                      # all automatic tests (slow)
pnpm test:visual                               # screenshot comparison of the examples (slow)
pnpm migrate <step> <app>                      # the migration tool, from the sources
```

The full test runs are slow and use a lot of memory: during work, run only the tests of what you changed. Decisions, process and current state of the work are in `.claude/skills/redesign-aurora/` (in Italian). `CLAUDE.md` is the starting point for an AI assistant working on this repository.

The screenshots of `pnpm test:visual` are compared with reference images taken on Linux (`tests/visual/__screenshots__/linux/`): on macOS or Windows there are no reference images yet, so that command fails there. GitHub Actions runs the type check, the builds and `pnpm test` on every push to `master` and on every pull request to it (`.github/workflows/test.yml`).

### Publishing

One command publishes the packages, after `pnpm login` and with everything committed:

```sh
pnpm release --dry-run   # checks and builds everything, publishes nothing
pnpm release             # publishes the versions written in the package.json files
pnpm release patch       # or minor, major: raises the versions of the packages changed since their last release
```

It runs the type check and the tool tests, builds `@likable-hair/svelte`, `@likable-hair/svelte-migrate`, `@likable-hair/svelte-mcp` and `@likable-hair/adonis-filters`, publishes them to npm in this order (the MCP server depends on the migration tool) and skips the ones whose version is already there. Then it writes the notes in `CHANGELOG.md` (the commit subjects since the previous release of each package), commits, tags (`v5.0.1`, `svelte-migrate@0.1.1`…), pushes and creates the GitHub releases. `--only svelte,svelte-mcp` publishes only those packages (with a version bump, also when they did not change), `--tag next` publishes under another npm dist-tag, `--otp <code>` passes the code of the npm two-factor authentication, `pnpm release --help` lists everything. The packages stay `"private": true` in the repository, so a plain `pnpm publish` refuses them: only `pnpm release` publishes.
