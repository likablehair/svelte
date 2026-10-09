# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@likable-hair/svelte`: a Svelte 5 (runes) component library used by Likablehair frontends. It is a SvelteKit project: `src/lib` is the published package (built by `svelte-package` into `dist/`), `src/routes` is the docs site that showcases every component.

The repo now holds **two separate projects**:
- the root: the current library (v4), described in the rest of this file. It is the reference for component behaviour and gets maintenance fixes only.
- `aurora/`: the from-scratch rewrite (SvelteKit 3 library template, own `package.json` and `node_modules`; run its commands from inside `aurora/`). Target look: `design/components-prototype.html`. **For any work on `aurora/`, the Aurora components, themes, tokens or the new docs, load the `redesign-aurora` skill first and keep it updated when decisions change.**

`design/AUDIT.md` lists the known bugs and weaknesses of the root library.

## Commands

- `npm run dev`: docs site on http://localhost:4000 (`npm run host` exposes it on the LAN).
- `npm run check`: svelte-check (baseline: 0 errors, ~24 `state_referenced_locally` warnings).
- `npx eslint .`: lint. `npm run lint` is currently broken: Prettier 3 ignores `--plugin-search-dir` and ~90 files are not Prettier-formatted. Use `npx prettier --check <file>` on touched files; don't reformat the whole repo in unrelated changes.
- `npm run package`: `svelte-kit sync && svelte-package && publint`, writes `dist/`.
- `npm run build`: builds the docs site, then the package. `ADAPTER=node npm run build` switches to adapter-node (output `build/`). The docs need a server runtime because search is a `+server.ts` endpoint.
- Tests: none exist. `npm test` (Playwright) and `npm run test:unit` (Vitest) fail with "No tests found"; there is no Playwright or Vitest config. `.github/workflows/test.yml` is outdated (Node 14/16) and disabled upstream.
- Release: bump `version` in `package.json` (commit usually titled "new version"), then `npm publish` (`prepublishOnly` runs `package`). The README's `npm publish ./package` is outdated.

## Architecture

### Package surface
- `package.json` `exports` contains only `"."`: anything consumers need (components, types, utils) must be re-exported from `src/lib/index.ts`. Many types (`Item`, `Filter`, `Header`, ...) and some components (LabelAndTextField, LabelAndSelect, QuickFilters, HeadersDrawer, MobileFilterEditor, SearchResults, Code, DashboardGridShaper) are internal only.
- `components/simple/` holds standalone pieces, `components/composed/` builds on them (e.g. Dropdown = Autocomplete + Button + Menu), `components/layouts/` holds app shells. Restyling a simple component propagates to every composed one that uses it.
- Some internal files import from the `$lib` barrel, which creates import cycles. Prefer direct `$lib/components/...` imports.

### Styling system (this is public API)
Three layers of CSS custom properties:
1. **Global palette** in `src/lib/css/main.css`: `--global-color-{background|contrast|grey|primary|secondary|error|warning|success}-{50..950}`. Values are **RGB triplets** (`69, 93, 201`), consumed as `rgb(var(--global-color-primary-500))` or with alpha as `rgb(var(--global-color-primary-500), .4)`. Never put hex values in these variables. Apps override through `--global-color-light-*` / `--global-color-dark-*`, which the library only reads as fallbacks, so app CSS wins regardless of load order. Dark mode comes from `prefers-color-scheme` or a `.dark` / `.light` class on `<html>` (set by `setTheme` / `toggleTheme` in `stores/theme.ts`, persisted in localStorage key `theme`). In practice `background-*` ramps are surfaces, `contrast-*` is text (both invert in dark), `grey-50` is text on primary, `primary-500` is the brand color.
2. **Component defaults**: each component imports `../../../css/main.css` plus a sibling `Component.css` declaring `:root { --component-default-*: ... }`.
3. **Instance overrides**: inside `<style>` each property reads `var(--component-prop, var(--component-default-prop))`, and consumers pass `--component-prop="..."` as Svelte style props. Naming is `--{component}[-{part}][-{state}]-{property}`, e.g. `--button-hover-background-color`.

These variable names are used by consumer apps: never rename or remove one without keeping the old name as a fallback. Style props do not reach Dialog/Drawer content, because those nodes are moved to `<body>` outside Svelte's `display: contents` wrapper. The runtime `colors` API of the `theme` store is currently broken (its subscriber wipes `colors[active]`).

### Component conventions
- Props via `$props()` with a `Props` interface; `$bindable` for two-way values; snippet props are named `*Snippet`.
- Callbacks are `on<name>` props receiving `{ detail: {...} }` (leftover from Svelte 4 events), e.g. Button `onclick({ detail: { nativeEvent } })`. Keep that shape in existing components (PeriodSelector is the exception).
- `class` is a string on single-root components and an object keyed by inner element (`{ container, input, ... }`) on multi-part ones.
- Text is localized through `locale` / `lang` props with inline it/en strings; Italian defaults are common.
- Responsive behaviour relies on the `mediaQuery` store / `MediaQuery` component (mobile is ≤1024px, e.g. `MenuOrDrawer` turns a Menu into a Drawer). The server-side default is the mobile variant.
- Overlays: `Dialog` and `Drawer` are teleported to `<body>` (`utils/teleporter.ts`); Escape is handled by the global singleton `utils/keyboarder.ts`. `Menu` stays inline, positions itself manually with `getBoundingClientRect`, and computes z-index dynamically from 50, so `overflow` ancestors can clip it.
- Icons: `<Icon name="mdi-...">` renders an MDI webfont class; the font is loaded from the jsdelivr CDN in `simple/common/materialDesign.css`. Flags use the vendored, patched copy in `src/lib/css/flag-icons`.
- Dates: native `Date` plus `simple/dates/utils.ts` for Calendar, DatePicker and PeriodSelector; luxon for DatePickerTextField, DynamicTable and table `date` columns (which expect a luxon `DateTime`).

### Tables and filters
- `SimpleTable` ← `PaginatedTable` (search, filters, selection, paginator) ← `EnhancedPaginatedTable` (column manager via HeadersDrawer). `DynamicTable` (~2900 lines) is standalone and duplicates SimpleTable/PaginatedTable logic (resize, sticky columns, selection, search → builder), so fixes often need mirroring.
- `utils/filters/builder.ts` (`FilterBuilder`) is a Knex/Lucid-style query builder serialized by `toJson()` into a `modifiers` array that the backend replays (the backend is not in this repo). `utils/filters/filters.ts` (exported twice, as `FilterConverter` and `Converter`) turns UI `Filter[]` into a builder; filter and table components emit that `builder` in their callbacks.

### Docs site
- One page per component: `src/routes/docs/components/{simple-components|composed-components|layouts}/<Name>/+page.svelte`, with live examples plus hand-written `PropsViewer` (`props`, `styleProps`), `SlotsViewer` and `EventsViewer` arrays. Update them whenever props or CSS variables change.
- `src/routes/docs/search/components.database.ts` feeds both the sidebar nav and the Orama search index; new components need an entry there.
- Docs-only styling and the Inter font live in `src/app.css`, not in the library.
