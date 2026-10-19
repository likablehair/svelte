# Likable Aurora (`@likable-hair/svelte` 5)

This repository holds the component library used by Likablehair's web apps: buttons, form fields, tables, dialogs, menus, charts and everything else an app screen is made of. Version 5, called **Aurora**, is a full rewrite for Svelte 5 with a new look, themes and dark mode.

The previous version (4.x) lives on the **`4.x` branch**. It only gets small fixes, for the apps that have not moved to version 5 yet.

## What is in this repository

There are three packages, plus the documentation site:

| Package | What it is for |
|---|---|
| `@likable-hair/svelte` | **The library.** About 70 components, the themes and the styles. This is the package an app installs. |
| `@likable-hair/svelte-migrate` | **The migration tool.** Moves an app from version 4 to version 5, doing most of the work by itself. |
| `@likable-hair/svelte-mcp` | **The helper for AI coding assistants** (Claude Code, Codex, Cursor, Copilot). It gives them the exact description of every component, so they write correct code. |
| Documentation site | One page per component, with live examples. Not published as a package. |

## Using the library in an app

**1. Install it**

```sh
npm install @likable-hair/svelte
```

It needs Svelte 5.29 or later.

**2. Use the components**

```svelte
<script>
	import { Button, SimpleTextField } from '@likable-hair/svelte';

	let name = $state('');
</script>

<SimpleTextField label="Name" bind:value={name} />
<Button onclick={() => save(name)}>Save</Button>
```

**3. Choose the language** of the built-in texts (such as "Cancel" or "No results"). The default is English. For an Italian app, add this once to the main layout (`src/routes/+layout.svelte`):

```js
import { setDefaultLocale } from '@likable-hair/svelte';
setDefaultLocale('it');
```

**4. Change the look**, if needed. Colors, corners, shadows and spacing are CSS variables. Changing one, for example `--global-color-primary`, changes every component. Each component also has its own variables, listed on its docs page.

**5. Themes and dark mode.** The default theme is Aurora. A second theme, `classic`, looks like version 4. Light and dark follow the operating system. The `ModeSwitch` component lets the user pick light, dark or system.

**6. Fonts.** The library does not load fonts. The docs give the line to add to the app, which loads the fonts the design uses.

**7. AI assistants** (optional). To let an AI assistant write pages with the library, run this once in the app:

```sh
npm install -D @likable-hair/svelte-mcp
npx svelte-mcp init
```

It sets up Claude Code, Codex, Cursor or Copilot with the exact description of every component and with instructions on how to design pages with the library.

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
npm install
npx vite dev --port 5180
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

**Before starting**, the app must have no uncommitted changes. This way, every change you see afterwards comes from the migration.

The migration happens in four steps. Run them inside the app folder:

| Step | Command | What it does |
|---|---|---|
| 1. Analyze | `npx @likable-hair/svelte-migrate analyze .` | Writes a report of what will change. Touches nothing. |
| 2. Setup | `npx @likable-hair/svelte-migrate setup .` | Creates a new branch, installs version 5, prepares styles, fonts, language, theme and the AI assistant. |
| 3. Codemod | `npx @likable-hair/svelte-migrate codemod .` | Rewrites the code automatically: new names, new icons, old local copies of components replaced by the library ones. |
| 4. Next | `npx @likable-hair/svelte-migrate next .` | Shows what is left to fix by hand, one file at a time, with an explanation for each point. Repeat until no errors are left and every point to write has been done once. |

At the end, `next` lists the **pages to try** in the browser and the things that **look or behave differently**, so you know what to check.

`status .` shows everything still open in a single list.

**The tool never commits.** You look at the changes and commit them yourself.

`MIGRATION.md` is the complete list of changes, written for people. You do not need to read it all; the tool tells you which part matters for each point.

### Letting an AI assistant do the migration

The tool does the mechanical part (steps 1 to 3). What `next` lists afterwards needs judgment, and an AI assistant such as Claude Code can do it by itself: it fixes one file at a time, runs `next` again, and stops when no errors are left and it has gone through every point to write (the ones the tool cannot verify stay listed after they are done). **What stays with you**: trying the pages it lists at the end, and committing.

1. Do steps 1 and 2 yourself (analyze and setup). Setup also gives the assistant the migration instructions and access to the tool.
2. Open the assistant in the app folder.
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
