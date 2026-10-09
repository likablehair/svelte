# Migrating from v4 to v5

Version 5 of `@likable-hair/svelte` is a rewrite. This file lists everything that can break, or look different, in an app that moves from the latest 4.x to 5.0: removed or renamed props, changed types and defaults, callbacks, snippets, CSS variables and behaviour. New optional features get one line per component, since they break nothing.

It is updated together with every ported component. Components that v5 does not have yet are listed in [Not available yet](#not-available-yet).

Contents:

- [Checklist](#checklist)
- [Global changes](#global-changes)
- [Components](#components): [ActivableButton](#activablebutton), [AlertBanner](#alertbanner), [AsyncAutocomplete](#asyncautocomplete), [Autocomplete](#autocomplete), [Button](#button), [Checkbox](#checkbox), [Chip](#chip), [CircularLoader](#circularloader), [ConfirmOrCancelButtons](#confirmorcancelbuttons), [CountriesAutocomplete](#countriesautocomplete), [Dialog](#dialog), [Divider](#divider), [Drawer](#drawer), [Dropdown](#dropdown), [FlagIcon](#flagicon), [HorizontalStackedProgress](#horizontalstackedprogress), [Icon](#icon), [LinkButton](#linkbutton), [Menu](#menu), [NoData](#nodata), [ProgressBar](#progressbar), [RadioButton](#radiobutton), [Select](#select), [SimpleTextField](#simpletextfield), [Skeleton](#skeleton), [Switch](#switch), [TabSwitcher](#tabswitcher), [Textarea](#textarea), [Toaster](#toaster), [Tooltip](#tooltip)
- [Not available yet](#not-available-yet)

## Checklist

1. Use Svelte 5.29 or later.
2. Add the cascade layer line to the app CSS and move resets into `@layer reset` ([CSS layers](#css-layers-and-app-css)).
3. Replace every v4 color token (`--global-color-primary-500`, `rgb(var(...))`) with the v5 tokens ([Tokens](#color-tokens)).
4. Replace `.dark` / `.light` and `setTheme('dark')` with `setMode('dark')` and `[data-mode]` ([Dark mode](#dark-mode-and-themes)).
5. Replace MDI class names (`"mdi-plus"`) with SVG paths from `@mdi/js` (`mdiPlus`) in every icon prop ([Icons](#icons)).
6. Remove `.detail` from callbacks ([Callbacks](#callbacks)).
7. Install the packages the app imports directly but used to get through v4 (`luxon`, `lodash`, `date-fns`, ...).
8. Go through the [component sections](#components) for each component the app uses.

## Global changes

### Package

- **Runtime dependencies**: v4 had 16 (`chart.js`, `date-fns`, `luxon`, `lodash`, `imask`, `sortablejs`, `svelte-dnd-action`, ...). v5 has only `flag-icons`. Declare in the app's `package.json` every package the app imports itself.
- **Svelte**: the peer range is still `^5.0.0`, but the components need **5.29 or later** (`{@attach}`).
- **`@mdi/js`**: add it to the app if it uses MDI icons. v5 only has it as a dev dependency.
- **Exports**: `@likable-hair/svelte/package.json` is no longer exported. New: `./tokens.css`, `./base.css`, `./themes/*.css`, `./tailwind.css`, `./tailwind-preset`.
- **CSS side effects**: v4 components imported `main.css` (the v4 palette) and Icon loaded the MDI webfont from the jsdelivr CDN, making `.mdi` classes global. v5 components import `tokens.css`; nothing is loaded from a CDN. `base.css` (page background, text, font, `accent-color`, `::selection`) and the themes are opt-in imports.
- **Browsers**: v5 relies on `light-dark()`, `color-mix()`, `:has()`, `popover`, `<dialog>.showModal()` and `@layer`: Chrome/Edge 123+, Firefox 125+, Safari 17.5+.
- **Language**: every default text is English (`closeLabel`, `noResultsText`, ...). v4 often defaulted to Italian or had `lang` props; pass the texts as props.
- **Ids** come from `$props.id()` (stable with SSR) instead of random ids.

### CSS layers and app CSS

All library CSS lives in cascade layers: tokens and `--{component}-default-*` in `global.base`, themes in `global.theme`, component rules in `global.components`.

- **Add the layer order at the top of the app's main CSS**:

  ```css
  @layer reset, theme, base, global, components, utilities;
  ```

  A theme file of the app must use the full form, `@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;`.
- **Unlayered app CSS now always wins over the components**, whatever its specificity. In v4 the scoped component rules usually won.
  - `class="..."` and `:global(...)` overrides work without `!important`.
  - Global element rules (`button { ... }`, `input`, `select`, `label`, `dialog`, `h2`, `* { margin: 0 }`) now restyle the inside of the components: move resets into `@layer reset { ... }`.
- **Tailwind 3**: wrap `@tailwind base;` in `@layer reset { ... }`, otherwise the preflight removes Button backgrounds and component borders. Add `presets: [aurora]` from `@likable-hair/svelte/tailwind-preset` (ESM: use `import`).
- **Tailwind 4**: put the layer line before `@import 'tailwindcss'`, then `@import '@likable-hair/svelte/tailwind.css'`. The preset and `tailwind.css` redefine `rounded-{xs,sm,md,lg,xl}`, `shadow-{sm,md,lg}`, `font-sans` and `font-mono`.
- **Overrides of tokens and defaults** must be unlayered (or in a layer above `global`). An override in Tailwind 3's `@layer base`, which ends up inside `reset`, loses.
- **Internal class names changed**. v4 used generic scoped classes (`.button`, `.chip`, `.textfield`, `.hint`, `.row`, `.overlay`, `.selection-container`, `._teleported`, `[data-dialog]`). v5 uses `aurora-{component}` and `aurora-{component}-{part}` classes, and exposes state as `data-*` attributes (`.aurora-button[data-variant='primary']`). App CSS that targeted v4 internals stops matching.

### Color tokens

v4 tokens (`--global-color-{background|contrast|grey|primary|secondary|error|warning|success}-{50..950}`, RGB triplets used as `rgb(var(--x))`) and their overrides (`--global-color-light-*`, `--global-color-dark-*`) **do not exist in v5**. Nothing reads them: overrides stop working, and app CSS that uses them gets an undefined variable (transparent backgrounds, inherited colors). v5 never reuses a v4 name, so leftovers are dead rather than wrong.

v5 tokens are full colors with a light and a dark value (`light-dark()`). Use `var(--global-color-x)`, not `rgb(var(...))`; for transparency, `color-mix(in oklab, var(--global-color-x) 40%, transparent)` (Tailwind 4: `bg-primary/40`).

The mapping is by role, not by step number:

| v4 | Typical role | v5 |
|---|---|---|
| `background-50` | page | `--global-color-bg` |
| `background-100` | panels, drawers, tooltips | `--global-color-surface-solid` (opaque) or `--global-color-surface`; page bands `--global-color-bg-2` |
| `background-200` | subtle fills, hover | `--global-color-surface-2` |
| `background-300` | selected fills; borders | fills `--global-color-surface-3`, borders `--global-color-border` |
| `background-400`, `-500` | separators, input borders | `--global-color-border-strong` |
| `contrast-900`, `-950` | main text | `--global-color-text` |
| `contrast-700`, `-800` | secondary text | `--global-color-text-2` |
| `contrast-500`, `-600` | muted text, placeholders | `--global-color-text-3` |
| `contrast-50` ... `-300` | borders, dividers, light shadows | `--global-color-border`, `--global-color-border-strong`, `--global-shadow-*` |
| `primary-500` | brand | `--global-color-primary`; filled backgrounds `--global-fill-primary` |
| `primary-600`, `-700` | hover or pressed | `--global-color-primary-strong` |
| `primary-50` ... `-400`, `primary-500` at 20% | tints, selection | `--global-color-primary-soft` |
| `primary-500` at 40% | glows, rings | `--global-color-primary-glow`, `--global-focus-ring-color` |
| `grey-50` on primary | text and icons on primary | `--global-color-on-primary` |
| `grey-900` | overlay | `--global-color-overlay` (+ `--global-overlay-blur`) |
| `secondary-*` | accent | `--global-color-accent`, `--global-color-accent-soft` |
| `error-*`, `warning-*`, `success-*` | states | `--global-color-{error,warning,success}`, `-soft`, `--global-color-on-{error,warning,success}`, `--global-fill-error` |
| chart colors | data series | `--global-color-data-1` ... `-6` |

The `classic` theme (`@likable-hair/svelte/themes/classic.css`) reproduces the v4 colors on the v5 tokens.

Derived tokens (`-strong`, `-soft`, `-glow`, focus ring, fills) follow the base color, but only when it is overridden on `<html>`.

### Dark mode and themes

| | v4 | v5 |
|---|---|---|
| Light/dark | `.dark` / `.light` class on `<html>`, or the OS | `color-scheme`: follows the OS by default, `data-mode="light" \| "dark"` on `<html>` forces it |
| Set it | `setTheme('dark')`, `toggleTheme()` | `setMode('light' \| 'dark' \| 'system')` |
| "Theme" | light or dark | a named design theme: `setTheme('classic')` sets `data-theme` |
| Read it | `theme` store (`$theme.dark`) | `getMode()`, `getTheme()` (not reactive) |
| Persistence | automatic, `localStorage.theme`, on import | none: the app stores the choice and restores it, ideally with an inline script in `app.html` that sets `data-mode` / `data-theme` before the first paint |

- `setTheme('dark')` still type-checks in v5 but activates a theme called "dark", which does not exist. Use `setMode('dark')`.
- `toggleTheme()` → `setMode(isDark ? 'light' : 'dark')`, where `isDark` is `getMode() === 'dark'`, or `getMode() === 'system'` and `matchMedia('(prefers-color-scheme: dark)').matches`.
- The functions use `document`: call them in the browser (`onMount`, event handlers).
- `setTheme` and `setMode` pause CSS transitions during the switch (attribute `data-switching` on `<html>`), so the colors change at once instead of animating every component.
- **The `.dark` / `.light` classes do nothing in v5.** Tailwind `darkMode: 'class'` no longer follows the library; for Tailwind 3 use `darkMode: ['variant', ['&:is([data-mode="dark"] *)', '@media (prefers-color-scheme: dark) { &:not([data-mode="light"] *) }']]`, for Tailwind 4 an `@custom-variant dark` with the same two branches.
- **v5 sets `color-scheme: light dark` on `<html>`**: on a dark OS, scrollbars, native controls and the default page colors turn dark even if the app never styled for dark. An app without dark mode sets `data-mode="light"` on `<html>`.
- An unlayered app rule that sets `color-scheme` on `:root` freezes the mode, and `setMode` stops working.

### Icons

- `<Icon name="mdi-plus">` → `<Icon path={mdiPlus}>`, with `import { mdiPlus } from '@mdi/js'` (same icon set, camelCase names).
- **Every icon prop takes an SVG path** on a 24×24 viewBox: Button `icon` / `appendIcon`, SimpleTextField `prependIcon` / `prependInnerIcon` / `appendInnerIcon` / `appendIcon`, Chip `prependIcon` / `closeIcon`, Autocomplete and Dropdown `icon`, `Item.icon`. These props are typed `string`, so an old `"mdi-..."` value type-checks and silently draws nothing.
- The global `.mdi` classes are gone: app markup with `class="mdi mdi-..."` needs `@mdi/font` loaded by the app.
- Icon is no longer clickable: see [Icon](#icon).

### Callbacks

v4 wrapped callback data in `{ detail: {...} }`. v5 passes native events for element events and plain objects for composite data.

- `onclick({ detail: { nativeEvent } })` → `onclick(event)`: `e.detail.nativeEvent` → `e`.
- `onchange({ detail: { select, unselect, selection } })` → `onchange({ select, unselect, selection })`: `e.detail.x` → `e.x`.
- `MouseEvent.detail` is a number: leftover `e.detail.nativeEvent` is `undefined` at runtime and a type error with TypeScript.

### Fonts

The library does not load fonts, as in v4, but the tokens now name them: `--global-font-family` (Geist), `--global-font-family-display` (Bricolage Grotesque), `--global-font-family-mono` (Geist Mono), all with a `system-ui` fallback. They are used by Dialog and Drawer titles, the CountriesAutocomplete dialing code and, with `base.css`, the page. Either load those fonts or set the tokens to the app's fonts in an unlayered `:root`.

### Overlays

- **Top layer instead of teleport and z-index.** Dialog and Drawer are native `<dialog>` elements opened with `showModal()`, Menu is a `popover`. They stay where they are written in the markup and are drawn above everything, whatever its z-index. App elements (toasts, chat widgets, third-party popups appended to `<body>`) cannot be stacked above an open Dialog or Drawer.
- **The page is inert while a Dialog or Drawer is open**: elements outside it cannot be clicked or focused.
- **They inherit from where they are written**: style props now reach the content (in v4 they were lost), and so do fonts, colors and custom properties of the ancestors. DOM events from the content bubble through those ancestors, and a Dialog written inside a `<form>` joins that form.
- **Dialog and Drawer content is unmounted when closed**: its local state resets at every opening and must live in the parent.
- **Escape closes only the topmost overlay or menu** and calls `preventDefault()`. App-level Escape handlers should check `event.defaultPrevented`.
- **Scroll lock** is CSS only (`html:has(.aurora-dialog:modal) { overflow: hidden }`); an unlayered app rule on `html { overflow }` defeats it. v4 wrote `body.style.overflow`.
- Menus dispatch an `aurora:menu-open` event on `document`.

### Responsive

The `mediaQuery` store and the `MediaQuery` component are not in v5: use `MediaQuery` from `svelte/reactivity`. Components switch to their mobile variant at 1024px as before, but the **server now renders the desktop variant** (v4 rendered the mobile one).

## Components

### ActivableButton

- `buttonProps` removed: Button props go directly on ActivableButton (`buttonProps={{ disabled }}` → `disabled`). `variant` and `buttonType` are not accepted.
- `onclick` receives the native event (no `detail`). As in v4, the click flips `active` before `onclick` runs.
- The state is announced with `aria-pressed`.
- Look: neutral surface with a border when off, primary tint when on (v4: transparent text button, filled primary when on). Buttons with text and no icon show a state dot: `dot={false}` hides it.
- Icon-only buttons take `icon={mdiFormatBold}` and an `aria-label` instead of an `<Icon>` child, and are square like an icon-only Button.
- `--button-*` color variables passed to it are ignored: use the `--activable-button-*` ones. Layout variables (`--button-padding`, `--button-height`, ...) still work.

| v4 | v5 |
|---|---|
| `--activable-button-deactive-background-color`, `-deactive-color` | `--activable-button-background`, `--activable-button-color` |
| `--activable-button-active-background-color`, `-active-color` | `--activable-button-active-background`, `--activable-button-active-color` |
| `--activable-button-hover-deactive-background-color` | `--activable-button-hover-background` (+ `-hover-color`, `-hover-border-color`) |
| `--activable-button-hover-active-background-color`, `-hover-active-color` | `--activable-button-active-hover-background`, `--activable-button-active-hover-color` |
| `--activable-button-active-{active,deactive}-*`, `--activable-button-focus-*` | removed (pressed and focus states come from Button) |

New, optional: `dot`, `dotSnippet`, `--activable-button-border-color` / `-active-border-color`, `--activable-button-dot-*`, `data-active`.

### AlertBanner

- Look: a tinted banner with a border and a colored icon box, in four variants (v4: a white card with a shadow and a colored strip on the left). Pick the color with `variant` (`info` \| `success` \| `warning` \| `error`, default `info`).
- `--alert-banner-color` (the strip color) has no equivalent and is ignored: use `variant`, or `--alert-banner-background`, `--alert-banner-border-color`, `--alert-banner-icon-background`, `--alert-banner-icon-color` for a custom color. The v4 default (`--my-var-blue`) was an undefined variable.
- **No clickable banner**: `disabled` and `--alert-banner-cursor` are removed. `onclick` and `onkeypress` are no longer props: they still type-check and work as native attributes of the root `<div>` (no role, not focusable, so keyboards cannot trigger them) and receive the native event. Put a `Button` or `LinkButton` in `appendSnippet` instead.
- `contentSnippet({ title, description })` → `children` (no parameters: use your own variables).
- `titleSnippet` and `descriptionSnippet` are rendered even without `title` / `description` (v4: only when the prop was set).
- `appendSnippet({ disabled })` → `appendSnippet()` without parameters.
- `class.border` removed (no strip); `class` keys are now `container`, `icon`, `body`, `title`, `description`.
- It has `role="alert"` (warning, error) or `role="status"` (info, success), so screen readers announce it when it appears (v4: `role="presentation"`). Pass `role` to change it.
- Title 14px / 600 (v4: 1.2rem / 700), description 13px.

| v4 | v5 |
|---|---|
| `--alert-banner-color` | removed: `variant` or the color variables above |
| `--alert-banner-border-width` (strip width, default `.7rem`) | same name, now the border around the banner: delete v4 values |
| `--alert-banner-padding-top`, `-right`, `-bottom`, `-left` | `--alert-banner-padding` (shorthand) |
| `--alert-banner-cursor` | removed |

Unchanged: `--alert-banner-width`, `-border-radius`, `-box-shadow` (default now none). Defaults: `--alert-banner-default-padding-top`, `-right`, `-bottom`, `-left` → `--alert-banner-default-padding`; `--alert-banner-default-border-width` now sets the border (v4: `.7rem` strip); `--alert-banner-default-color` and `-default-cursor` removed.

New, optional: `variant`, `icon`, `iconSnippet`, `closable`, `closeLabel`, `closeSnippet`, `onclose`, native attributes, `data-variant`, `--alert-banner-gap`, `-icon-*`, `-title-*`, `-description-*`, `-close-*`, `-focus-ring-*`.

### AsyncAutocomplete

Everything in [Autocomplete](#autocomplete) applies, since AsyncAutocomplete forwards its props.

- `searcher({ searchText })` → `searcher({ searchText, signal })`. The text is trimmed, and a newer search aborts the older one through `signal`: pass it to `fetch`. Responses that arrive late are ignored.
- `items` is no longer overwritten by the results. It now means **suggestions shown below `searchThreshold`**, filtered locally; without them the list says "Type at least N characters". v4 kept showing the last results, unfiltered.
- `search` (boolean command) → method `search()` through `bind:this`. It uses the current text and ignores the threshold.
- `searching` now works and is bindable (`bind:searching`): it is `true` while a search waits for the debounce or runs, that is once the trimmed text reaches `searchThreshold` with the list open (and after `search()`).
- `closeOnSelect` defaults to `!multiple` (v4: `false`): a single selection now closes the list.
- `searchFunction` is no longer accepted: the server filters.
- A magnifier icon is shown at the start of the field by default; `icon=""` removes it.
- Searches run only while the list is open. Opening it with enough text searches at once; reopening with the same text reuses the last results.
- A failed search shows an error row ("Couldn't load results") and calls `onerror(error)`. In v4 it was an unhandled rejection.
- The `Item` type is no longer re-exported from this component: import it from the package root.

New, optional: `thresholdText`, `errorText`, `onerror`, `errorSnippet({ error, search })`, `searchThreshold={0}` (load on open), `--async-autocomplete-skeleton-*`.

### Autocomplete

**Props**

| v4 | v5 |
|---|---|
| `menuOpened` | `open` (bindable, no default) |
| `emptySearchTextOnMenuClose` | `clearSearchOnClose` |
| `menuAnchor` | `placement`, see the [Menu value mapping](#menu); default `'bottom-center'` → `'bottom-start'` |
| `width`, `maxWidth` | `--autocomplete-width` (now `100%`), `--autocomplete-max-width` |
| `minWidth` (`200px`), `height` | removed: `class.container` or app CSS; the field height is `--autocomplete-min-height` |
| `menuWidth` | removed: the list is as wide as the field; adjust with `--menu-min-width` / `--menu-max-width` |
| `menuMaxHeight` | `--autocomplete-menu-max-height` |
| `menuBoxShadow`, `menuBorderRadius` | `--menu-box-shadow`, `--menu-border-radius` |
| `menuStayInViewport`, `menuFlipOnOverflow` | removed: always on |
| `adaptInputWidth` | removed: the input always fills the space (`--autocomplete-input-min-width`) |
| `openingId` | removed: opening a menu closes the others |

`width` and `height` still type-check (they are `<input>` attributes) but no longer size the component.

**Types and behaviour**

- `Item.icon` is an SVG path. `Item` is exported from the package root and its `Data` defaults to `unknown` (was `any`).
- Values are compared with `===` only (v4 mixed `==` and `===`): `{ value: 1 }` and `{ value: '1' }` are different options.
- Duplicate `value`s in `items` or `values` throw an error (keyed lists).
- `closeOnSelect={true}` now also works with `multiple`.
- The default search ignores accents and matches `label ?? value`. `searchFunction` receives a `string` (not `string | undefined`).
- `searchText` keeps its initial value and becomes `''` (not `undefined`) when the list closes.
- `disabled` really disables the input; with `mandatory` the last chip has no remove button.
- It is an ARIA combobox and the focus stays in the input: options are no longer tab stops. Arrows open the list; while typing, the **first match is highlighted and Enter picks it**; Enter on a highlighted option **no longer submits the form**; Backspace on an empty field removes the last value; Escape closes the list and keeps the focus.
- `mobileDrawer`: the bottom drawer contains its own search field and a title (`drawerTitle ?? label`); the page input becomes read-only. v4 showed only the list.

**Callbacks**

- `onchange({ detail: { select, unselect, selection } })` → `onchange({ select, unselect, selection })`. With single selection, replacing a value now reports the old one in `unselect`.
- `onfocus` and `onblur` are the native input events (`FocusEvent`). `onclose` now fires on every close, not only for the mobile drawer.
- If an `onkeydown` handler calls `preventDefault()`, Autocomplete skips its own key handling.

**Snippets**

- `menuSnippet` removed: use `itemSnippet`, `loadingSnippet`, `emptySnippet` and `--menu-*`.
- `itemSnippet` (now `{ item, index, selected, highlighted }`) replaces the **content** of an option, not the option: click handling, role and highlight stay.
- `itemLabelSnippet` replaces only the label; the icon and check mark stay (use `itemIconSnippet`).
- `hintSnippet` renders inside the hint element (`aria-describedby`).
- `selectionContainerSnippet` receives `attributes` (combobox ARIA), to spread on the custom trigger.

**`class`**: `{ activator, menu, simpleTextfield, hint }` → `{ container, label, field, input, chip, menu, option, hint }` (`activator` → `container` or `field`).

**CSS variables**

| v4 | v5 |
|---|---|
| `--autocomplete-background-color` | `--autocomplete-background` |
| `--autocomplete-border` | `--autocomplete-border-width` + `--autocomplete-border-color` |
| `--autocomplete-focus-border` | `--autocomplete-focus-border-color` |
| `--autocomplete-focus-box-shadow` | `--autocomplete-focus-ring-width` + `--autocomplete-focus-ring-color` |
| `--autocomplete-selected-item-background-color`, `-color` | `--autocomplete-option-selected-background`, `-color` |
| `--autocomplete-focused-item-*`, `--autocomplete-hover-item-*` | `--autocomplete-option-highlighted-background`, `-color` |
| `--autocomplete-input-margin-left` | `--autocomplete-input-padding` |
| `--autocomplete-input-width` | `--autocomplete-input-min-width` |
| `--autocomplete-options-max-width`, `--autocomplete-hint-margin-left` | removed |

The `-default-*` names follow the same renames (`--autocomplete-default-background-color` → `--autocomplete-default-background`, ...). Unchanged: `--autocomplete-border-radius`, `--autocomplete-padding`, `--autocomplete-min-height` (2rem → 36px), `--autocomplete-hint-font-size`, `--autocomplete-hint-color`. Chips inside follow the [Chip](#chip) variables.

Internal classes: `.selection-container` → `.aurora-autocomplete-field`, `.selection-item` → `.aurora-autocomplete-option`, `.focused` → `[data-highlighted]`, `.selected` → `[data-selected]`.

New, optional: `label`, `state`, `name`, `id`, `icon`, `loading`, `drawerSearch`, `drawerTitle`, texts (`loadingText`, `noResultsText`, `removeLabel`, `closeLabel`), `bind:input`, snippets `labelSnippet`, `stateIconSnippet`, `iconSnippet`, `chipIconSnippet`, `itemIconSnippet`, `itemAppendSnippet`, `loadingSnippet`, `emptySnippet`, `data-*` state attributes.

### Button

- `icon`: SVG path. `buttonElement` is an `HTMLButtonElement`.
- Callbacks are native: `onclick(event)`, `onkeydown(event)`, `onkeypress(event)`. They do not fire while `disabled` or `loading`, also with `href`.
- **`disabled` is now native**: a disabled button is not focusable and does not submit forms (v4 never passed it to the `<button>`).
- **`loading`** disables the button and replaces only the icon with a 16px spinner (or adds it before the text); the text stays. v4 swapped all the content for a 30px loader and stayed clickable.
- `children` and `icon` render together; an icon without text gives a square icon-only button.
- `appendSnippet` sits after the text in the flow, pushed to the end, instead of over the text.
- Look: fixed heights (`size`: 28/34/40px), 1px border, `box-sizing: border-box`, labels do not wrap.
  - `buttonType="text"`: no uppercase, color from `variant` (primary by default; `variant="secondary"` for body text).
  - `buttonType="icon"`: rounded square in the `variant` colors instead of a circle (`--button-border-radius: 9999px` for a circle).
  - Focus ring on `:focus-visible` instead of a background change.

**CSS variables**

| v4 | v5 |
|---|---|
| `--button-background-color` | `--button-background` |
| `--button-hover-background-color` | `--button-hover-background` |
| `--button-border` | `--button-border-width` + `--button-border-color` |
| `--button-focus-background-color`, `-focus-color`, `-focus-box-shadow` | `--button-focus-ring-width`, `-color`, `-offset` |
| `--button-active-background-color`, `-active-color`, `-active-box-shadow` | `--button-active-transform` |
| `--button-disabled-background-color`, `-disabled-color` | `--button-disabled-opacity`, `--button-disabled-filter` |
| `--icon-size` on a Button | `--button-icon-size` |
| `--circular-loader-*` | `--button-icon-size`, `--button-spinner-border-width`, or `loadingSnippet` |
| `--button-max-height`, `-min-height`, `-box-sizing`, `-text-align`, `-cursor`, `-display`, `-justify-content`, `-align-items` | removed |

Unchanged: `--button-width`, `-min-width`, `-max-width`, `-height` (now border-box), `-padding` (ignored on icon-only buttons), `-color`, `-hover-color`, `-border-radius`, `-box-shadow`, `-hover-box-shadow`, `-font-size`, `-font-weight`.

Defaults are now per variant and size: `--button-default-background-color` → `--button-default-primary-background`, `--button-default-color` → `--button-default-primary-color`, `--button-default-hover-background-color` → `--button-default-primary-hover-background`, `--button-default-text-hover-background-color` → `--button-default-primary-text-hover-background`, `--button-default-box-shadow` → `--button-default-primary-box-shadow` (likewise for `secondary`, `danger`, `gradient`); `--button-default-padding`, `-border-radius`, `-height`, `-font-size` are the `md` values (`-sm-*`, `-lg-*` for the others). The v4 focus, active, disabled and icon defaults are removed.

New, optional: `variant`, `size`, `appendIcon`, `iconSnippet`, `loadingSnippet`, `href` (renders an `<a>`; with `target`, `rel`, `download`), `data-variant` / `data-size` / `data-shape` / `data-loading`.

### Checkbox

- `value` → `checked` (`bind:value` → `bind:checked`). `value` is now the native form value: `value={true}` compiles but leaves the box unchecked.
- `onchange({ detail: { shiftKeyPressed, nativeEvent } })` → native `onchange(event)`. For Shift+click use `onclick(event)` and `event.shiftKey`: true for a Shift+click on the box and, in Chromium, for Shift+Space and a Shift+click on the label text (Firefox reports Shift+Space without Shift and does not toggle on a Shift+click on the text). The two global `window` listeners per checkbox are gone.
- `class`: string → `{ container, input, label }` (`class="x"` → `class={{ input: 'x' }}`).
- The root is a `<label>` around the input (attributes still go to the input). Do not wrap it in another `<label>`: use `label` or `labelSnippet`.
- Size 21px → 18px; focus ring on `:focus-visible`; disabled is opacity .4 on the whole label.

| v4 | v5 |
|---|---|
| `--checkbox-background-color` | `--checkbox-background` |
| `--checkbox-active-color` | `--checkbox-checked-background` + `--checkbox-checked-border-color` |
| `--checkbox-active-inner-color` | `--checkbox-mark-color` |
| `--checkbox-border-hover-color` | `--checkbox-hover-border-color` |
| `--checkbox-focus-shadow` | `--checkbox-focus-ring-width` + `-color` + `-offset` |
| `--checkbox-disabled-color`, `-disabled-active-color` | `--checkbox-disabled-opacity` |

Unchanged: `--checkbox-border-color`. Defaults follow the same renames (`--checkbox-default-active-color` → `--checkbox-default-checked-background`, ...). `--checkbox-default-disabled-inner-color` was declared in v4 but never read: delete it.

New, optional: `indeterminate` (bindable), `label`, `labelSnippet`, `bind:input`.

### Chip

- `inactive` → `selected={!inactive}`. The default look is neutral (v4: filled primary); for the v4 look use `selected` or `variant="filled"`.
- `close` → `closable` (no longer bindable), `buttonTabIndex` → `tabindex` (a number, not `null`).
- `truncateText` removed: text always ends with an ellipsis when there is no room (`--chip-max-width`).
- `closeIcon` default: circled × → plain ×; pass `mdiCloseCircle` for the v4 icon. `prependIcon`, `closeIcon`: SVG paths.
- `onclick({ detail: { native } })` → `onclick(event)`; `onclose({ detail: { native } })` → `onclose(event)`. The remove click is no longer stopped: it bubbles.
- Markup: a `<span>` that contains a `<button>` only when `onclick` is set (otherwise not focusable, no hover), plus a sibling remove `<button>`. v4 was a `<div role="button">` with the remove button inside. `display: inline-flex` instead of `flex`.
- Size: 26px (md) / 22px (sm), 12.5px font, single line.
- Toggle chips: in the selected state `--chip-selected-*` win over `--chip-background`, `--chip-color`, `--chip-border-color` and `--chip-box-shadow`; `--chip-hover-*` win over both and are the same for both states (v4 had separate hover colors for active and inactive chips: keep one).

| v4 | v5 |
|---|---|
| `--chip-background-color` | `--chip-background` (for toggle chips: `--chip-selected-background`) |
| `--chip-color` | same name, now applies in every state (for toggle chips: `--chip-selected-color`) |
| `--chip-hover-background-color` | `--chip-hover-background` |
| `--chip-inactive-background-color`, `-inactive-color`, `-inactive-border-color` | `--chip-background`, `--chip-color`, `--chip-border-color` |
| `--chip-inactive-border` | `--chip-border-width` + `--chip-border-color` |
| `--chip-inactive-hover-background-color`, `-inactive-hover-color` | `--chip-hover-background`, `--chip-hover-color` |
| `--chip-focus-background-color`, `--chip-inactive-focus-*` | `--chip-focus-ring-width`, `-color`, `-offset` |
| `--chip-min-height` | `--chip-height` |
| `--chip-text-max-width` | `--chip-max-width` (whole chip) |
| `--button-*` for the remove button | `--chip-close-*` |
| `--icon-size` on a Chip | `--chip-icon-size`, `--chip-close-icon-size` |
| `--chip-cursor`, `--chip-line-height` | removed |

Unchanged: `--chip-height`, `-padding`, `-gap`, `-border-radius`, `-font-size`, `-font-weight`. Defaults: `--chip-default-background-color` / `-color` → `--chip-default-selected-*` or `--chip-default-{variant}-*`; `--chip-default-inactive-background-color`, `-inactive-color`, `-inactive-border-color` → `--chip-default-neutral-background`, `-neutral-color`, `-neutral-border-color`. The hover and focus defaults (`--chip-default-hover-background-color`, `--chip-default-inactive-hover-*`, `--chip-default-inactive-focus-*`, ...) have no counterpart: delete them.

New, optional: `variant`, `size`, `selected`, `closeLabel`, `bind:chipElement`, `class` and native attributes, `prependSnippet`, `closeSnippet`.

### CircularLoader

- Look: a ring with a fading tail in the theme gradient (v4: a Material-style arc). Default size 32px (v4: 30px); the thickness is 10% of the size.
- **Color**: in v4 `--circular-loader-color` had no effect (it overwrote `width`) and the loader always took the text color (`currentColor`). In v5 the default is the theme gradient. Where the loader sits on a colored background (inside a primary button, on a filled banner), pass `--circular-loader-color="currentColor"`.
- `loading` removed: with `false` it hid the arc but kept the space. Use `{#if}` to remove the loader, or `visibility: hidden` on a wrapper to keep the space.
- It is a `role="progressbar"` named "Loading" by default (v4 had no role). Next to a text that already says it, pass `label=""` to hide it from screen readers.
- `class` is now on a `<span>` (v4: on the `<svg>`).

| v4 | v5 |
|---|---|
| `--circular-loader-height` | `--circular-loader-size` (always square) |
| `--circular-loader-width` | removed: it had no effect in v4, delete it |
| `--circular-loader-color` | same name, now works (any color or gradient) |

New, optional: `value` and `total` (progress ring), `children` in the middle, `label`, native attributes, `data-indeterminate`, `--circular-loader-thickness`, `--circular-loader-track-color`, `--circular-loader-duration`, `--circular-loader-value-duration`, `--circular-loader-content-*`. New component: `DotsLoader` (three dots that light up in turn).

### ConfirmOrCancelButtons

- **Default texts are English**: "Annulla" / "Salva" → "Cancel" / "Save". Apps that relied on the Italian defaults must pass `cancelText` and `confirmText`.
- **No top margin**: `marginTop` (default 20px) is removed. Add the spacing in the app layout, or with `class={{ container: '...' }}`.
- `onconfirmClick({ detail: { nativeEvent } })` → `onconfirmClick(event)`, same for `oncancelClick`. Svelte 4 apps using `on:confirm-click` / `on:cancel-click` switch to these props.
- In `cancelButtonSnippet` and `confirmButtonSnippet`, `handleCancel` and `handleConfirm` take the native event (v4: `handleConfirm` took Button's `{ detail }` event). `cancelButtonSnippet` also receives `cancelDisable`.
- `cancelDisable` now really disables the cancel button (v4: it only skipped the callback). `onconfirmClick` is not called while `loading`.
- The cancel button is a text Button (v4: an unstyled `<button>`).
- Stacking: the buttons stack at full width, confirm on top, when their container is narrower than 480px (v4: when the viewport was under 769px). In a wide container on a phone they stay in a row; in a narrow drawer on desktop they stack.
- The root is a size container (`container-type: inline-size`): in a flex row with automatic width it collapses to zero width. Give it a width (`flex: 1` or `width: 100%` through `class.container`) or put it in a block.

New, optional: `confirmIcon`, `cancelIcon`, `confirmVariant`, `confirmType`, `children` (content at the start of the row), `class` object, CSS variables `--confirm-or-cancel-buttons-*`, `data-loading`.

### CountriesAutocomplete

Everything in [Autocomplete](#autocomplete) applies.

- `autocompleteProps={{ ... }}` → pass the Autocomplete props directly on the component (in v4 callbacks inside it were silently lost).
- `bind:selected` → `bind:values`. `class.flagIcon` → `class.flag`.
- **Names** come from the browser (`Intl.DisplayNames`) in `locale`, default `'en'`, and the list is **sorted by name** (v4: by code). In English 48 of the 249 names differ from v4 (for example "Czech Republic" → "Czechia").
- Values can be set with the code alone (`[{ value: 'IT' }]`); labels are filled in with the name in `locale`, also in `onchange` and in the bound `values`, replacing a custom label of the value.
- Search ignores accents, also matches the ISO code ("us" → United States) and ranks the results: names that start with the text, then the code, then names with a word that starts with it, then the rest.
- Flags are 4:3 instead of square. `--countries-autocomplete-flag-icon-size`, used in the v4 docs, never existed: use `--flag-icon-size`.
- Country utilities:

  | v4 | v5 |
  |---|---|
  | `countriesList` (`{ alpha2, name }[]`) | `countryCodes` + `countryName(code, locale)` |
  | `countriesOptions` (`{ value, label }[]`, by code) | `countryItems(locale, codes?)` (`Item<CountryData>[]`, by name, with `data.dialCode`) |
  | `getCountryInfoByAlpha2(code)` | `countryName(code, locale)`: any case; an unknown code returns the code itself instead of `undefined` |

New, optional: `locale`, `dialCode`, `class.dialCode`, `dialCode(code)`, `CountryData`, `--countries-autocomplete-dial-code-*`.

### Dialog

- `transition` → CSS variables `--dialog-transition-x`, `-y`, `-scale`. `'fly-up'`: `--dialog-transition-y="20px" --dialog-transition-scale="1"`; `'fly-down'`: `-y="-20px" -scale="1"`; `'scale'`: `-y="0px" -scale="0.7"`; `'fade'`: `-y="0px" -scale="1"`; `'fly-horizontal'`: `-x="-20px" -y="0px" -scale="1"` (it now leaves from the side it came from).
- `_overlayColor` + `_overlayOpacity` → `--dialog-backdrop-background` (v4 look: `rgb(40 40 40 / 30%)`); `_overlayBackdropFilter` → `--dialog-backdrop-filter` (v5 default blurs 8px: `none` for the v4 look); `_transitionDuration` → `--dialog-duration` (a time in `s` or `ms`); `_transitionTimingFunction` → `--dialog-easing`.
- `--dialog-transition-duration` → `--dialog-duration`, `--dialog-transition-timing-function` → `--dialog-easing` (v4 overwrote both inline from the props; app values now apply).
- `--dialog-overlay-opacity`, `--dialog-z-index` and `data-dialog` are gone.
- **`children` sits inside a styled surface** (card background, border, radius, shadow, 20px padding, max width 440px) with a scrolling body. An app that drew its own card gets a double card: `--dialog-padding="0" --dialog-background="transparent" --dialog-border-width="0" --dialog-box-shadow="none" --dialog-width="auto" --dialog-max-width="none"` for the v4 behaviour.
- `persistent` now also blocks Escape (v4 blocked only the backdrop click).
- `topRightSnippet`, `centerLeftSnippet`, `centerRightSnippet` sit 16px (`--dialog-inset`) from the screen edges, and every snippet receives `{ close }`.
- Opening moves the focus inside (first focusable element, or `autofocus`), Tab stays inside, and the focus returns on close.
- See also [Overlays](#overlays): unmounted when closed, inert page, events bubbling, no z-index.

New, optional: `title`, `titleSnippet`, `closable`, `closeLabel`, `closeSnippet`, `actionsSnippet`, `onclose(event)`, `bind:dialogElement`, `class` object, `<form method="dialog">` support, about 37 `--dialog-*` variables.

### Divider

- It is a native `<hr>` with class `aurora-divider` (v4: an empty `<div>`); screen readers announce it as a separator. App CSS that targeted the v4 `div` must target `.aurora-divider` or use `class`.
- **Margins**: 10px above and below as in v4, but **no 5px on the sides**: the line spans the whole container. Set `--divider-margin-left` / `--divider-margin-right` where the inset mattered.
- Look: 1px `--global-color-border-strong` (v4: `background-500`), round ends (`--global-radius-full`, v4: 0.5px).
- Most apps use their own copy, `$lib/components/common/Divider.svelte` (props `color`, `weight`, `marginTop`, ...): it is app code and keeps working. To switch to the library, turn the props into the variables below.

| v4 | v5 |
|---|---|
| `--divider-color`, `-weight`, `-radius`, `-margin-top`, `-margin-bottom`, `-margin-left`, `-margin-right` | same names (`--divider-color` takes a gradient too) |
| `--divider-default-margin-top`, `-margin-bottom` | `--divider-default-spacing` |
| `--divider-default-margin-left`, `-margin-right` | removed (no side margin) |

New, optional: `variant` (solid \| gradient), `orientation` (horizontal \| vertical), `label` and `children` (text in the middle of the line), `bind:dividerElement`, `class` and native attributes, `data-variant`, `data-orientation`, `--divider-spacing`, `--divider-vertical-min-height`, `--divider-gap`, `--divider-label-*`.

### Drawer

- `closeOnClickOutside` (default `true`) → `persistent` (default `false`), inverted: `closeOnClickOutside={false}` → `persistent`. It now also blocks Escape.
- `overlay` removed: the drawer is always modal; for an invisible backdrop `--drawer-backdrop-background="transparent" --drawer-backdrop-filter="none"`.
- `items` and `onitemClick` removed (no fallback Navigator): put the navigation in `children`.
- `teleportedUid` removed. `position` is no longer bindable.
- `onclose()` → `onclose(event)`; it also fires for the X, `close` from snippets and `<form method="dialog">`.
- `children` sits in a scrolling body inside a panel with padding, inner border and shadow: `--drawer-padding="0" --drawer-border-width="0" --drawer-box-shadow="none"` for the v4 look.
- v4 was not modal and did not lock the scroll; v5 makes the page inert and locks it.

| v4 | v5 |
|---|---|
| `_space`, `--drawer-space` | `--drawer-size` (default 20rem; capped by `--drawer-max-size`) |
| `_openingSpeed`, `--drawer-opening-speed` | `--drawer-duration` (+ `--drawer-easing`) |
| `_backgroundColor`, `--drawer-background-color` (also the v4 global default) | `--drawer-background` |
| `_color`, `_borderRadius`, `_margin`, `_overflow` | `--drawer-color`, `--drawer-border-radius`, `--drawer-margin`, `--drawer-overflow` (now on the body) |
| `_overlayBackgroundColor`, `--drawer-overlay-background-color` | `--drawer-backdrop-background` (v4 look: `rgb(38 38 38 / 50%)`) |
| `_overlayOpacity`, `_overlaySpeed`, `--drawer-overlay-opacity`, `--drawer-overlay-speed`, `--drawer-z-index` | removed |

Defaults: `--drawer-default-space` → `--drawer-default-size`, `--drawer-default-opening-speed` → `--drawer-default-duration`, `--drawer-default-overlay-background-color` → `--drawer-default-backdrop-background`, `--drawer-default-background-color` (read by v4, never declared) → `--drawer-default-background`; `--drawer-default-overlay-speed`, `-overlay-opacity` and `-z-index` removed.

New, optional: `title`, `titleSnippet`, `closable`, `closeLabel`, `closeSnippet`, `actionsSnippet` (fixed footer), `bind:drawerElement`, `class` object, `data-position`.

### Dropdown

- `menuOpened` → `open`; `menuAnchor` → `placement` (default `bottom-start`, so a menu wider than the button is left-aligned).
- `lang` is no longer a prop: texts are props in English (`placeholder` default `'Select'`, `selectionText` for "N selected"). It still type-checks as the native `lang` attribute of the button, which would mark the English texts as Italian: delete it.
- `searchText`, `maxVisibleChips` (no effect in v4) and `openingId` removed.
- `width`, `minWidth` → `--dropdown-width` (default `fit-content`), `--dropdown-min-width`, `--dropdown-max-width`; `height` → `size` or `--button-height`; `menuWidth` → the list matches the button, at least `--dropdown-menu-min-width` (220px).
- `values` defaults to `undefined` (v4: `[]`). `icon`: SVG path.
- `onchange` loses `detail` (see [Autocomplete](#autocomplete)).
- **`labelSnippet` changed meaning**: v4 replaced the whole button content; v5 `labelSnippet({ label })` renders the prefix label. For the selection text use `valueSnippet({ values, text, placeholder })`; `iconSnippet`, `chevronSnippet` and `clearSnippet` replace the other parts. `handleCloseClick` is gone: clear with `values = []`.
- `disabled` is native and hides the clear button (in v4 the list still opened and the X still cleared).
- Clicking the button opens **and closes** the list; Backspace never removes values; the chevron hides only while the clear button shows.
- The trigger is a `Button` (`variant="secondary"`, `size="md"` by default): pass `--button-*` to the Dropdown.

| v4 | v5 |
|---|---|
| `--dropdown-button-padding`, `-color`, `-border-radius`, `-height` | `--button-padding`, `--button-color`, `--button-border-radius`, `--button-height` |
| `--dropdown-button-background-color` | `--button-background` |
| `--dropdown-button-border` | `--button-border-width` + `--button-border-color` |
| `--dropdown-button-hover-color` | `--button-hover-background` and `--button-hover-color` |
| `--dropdown-button-focus-color`, `-focus-box-shadow` | `--button-focus-ring-*` |
| `--dropdown-button-active-color`, `-active-box-shadow`, `-box-sizing` | removed |

New, optional: `label` (prefix inside the button), `name`, `closeOnSelect`, `variant`, `size`, `selectionText`, `clearLabel`, `closeLabel`, `noResultsText`, `bind:buttonElement`, `class` object, snippets listed above, `--dropdown-*` variables.

### FlagIcon

- **Flags are 4:3 by default**; add `square` for the v4 look (the width changes from 1em to 1.33em).
- `--flag-icon-default-size`: `1.2rem` → `1.2em` (it follows the surrounding font size). `--flag-icon-default-border-radius`: 4px → 3px. A 1px ring is drawn around every flag (`--flag-icon-box-shadow`).
- Without `title` the flag is hidden from screen readers.
- Class `flag-icon` → `aurora-flag-icon`; `fis` only with `square`.
- Flags come from the `flag-icons` npm package. The v4 aliases still work (`uk`, `el`, `xs`, `xi`, `ac`, `ta`). With Vite the smaller flags are inlined in the CSS (about 320 KB); to download each flag only when shown: `build: { assetsInlineLimit: (file) => (file.includes('/flag-icons/') ? false : undefined) }`.

`--flag-icon-font-size`, listed in the v4 docs, had no effect: delete it (the size is `--flag-icon-size`).

New, optional: `square`, `title`, `--flag-icon-box-shadow`.

### HorizontalStackedProgress

- Look: one 12px bar of separate segments with rounded corners and a 3px gap, a hover highlight, and the legend in a row below (v4: one 5px `ProgressBar` per segment with a 4px gap, labels under the segments, no legend).
- **Defaults changed**: labels under the segments are off and the legend is on (v4: the opposite). For the v4 look pass `segmentLabels legend={false}`.
- Default colors come from the data palette `--global-color-data-1…6` (v4: shades of primary). An entry's `color` is any CSS color, as before.
- `progresses` and the `ProgressItem` type unchanged (`ProgressItem` is now exported).
- New `total`: the segments take `value / total` of the bar and the rest stays empty. Without it they fill the bar, as in v4.
- The tooltip of a segment now shows `label: value` (v4: the value only), on the v5 `Tooltip`.
- Screen readers read the legend as a list; with `legend={false}` it stays in the page, visually hidden. The root is a `role="group"` named by `label`.

| v4 | v5 |
|---|---|
| `labelVisible` (default `true`) | `segmentLabels` (default `false`) |
| `labelTextVisible`, `labelValueVisible` | `segmentLabelSnippet({ item, percentage })` |
| `legendVisible` (default `false`) | `legend` (default `true`) |
| `legendTextVisible`, `legendValueVisible` | `legendItemSnippet({ item, percentage })` |
| `hideLabelUnderPercentage` | `minLabelPercentage` |
| `tooltipVisible` | `valueTooltip` |
| `--progress-bar-height` passed to it | `--horizontal-stacked-progress-height` |
| `--horizontal-stacked-progress-dot-height`, `-dot-width`, `-dot-min-width` | `--horizontal-stacked-progress-dot-size` |
| `--horizontal-stacked-progress-label-gap` | `--horizontal-stacked-progress-segment-label-gap` |
| `--horizontal-stacked-progress-label-font-size`, `-label-font-weight` (text under a segment) | `--horizontal-stacked-progress-segment-label-font-size`, `-segment-label-font-weight`. The `-label-*` names now style the header label |
| `--horizontal-stacked-progress-value-font-size` (value under a segment and in the legend) | `--horizontal-stacked-progress-segment-value-font-size` (the legend follows `-legend-font-size`). The `-value-font-size` name now styles the header value |
| `--horizontal-stacked-progress-value-font-weight` | `--horizontal-stacked-progress-segment-value-font-weight` and `-legend-value-font-weight` |

Unchanged: `--horizontal-stacked-progress-width`, `-gap`, `-legend-margin-top`.

New, optional: `total`, `label`, `labelSnippet`, `showValue`, `valueSnippet`, `class` and native attributes, `--horizontal-stacked-progress-rest-background`, `-segment-border-radius`, `-hover-*`, `-legend-*`, `-dot-border-radius`.

### Icon

- `name` (MDI class) → `path` (SVG path, e.g. `mdiCake` from `@mdi/js`). MDI helper classes (`mdi-spin`, `mdi-rotate-*`, `mdi-18px`) do nothing.
- **Not clickable**: `onclick` and `tabindex` are removed. A clickable icon is `<Button buttonType="text" icon={mdiX} aria-label="..." onclick={...} />`.
- It renders an `<svg class="aurora-icon">` (decorative unless `title` is set) instead of `<span role="button" class="icon mdi ...">`. As in v4, it takes only its props (`path`, `title`, `class`): no `id`, `style` or other attributes.

| v4 | v5 |
|---|---|
| `--icon-size` | same; now width and height of the `<svg>` (default `1em`) |
| `--icon-color` | same; now `fill` (default `currentColor`) |
| `--icon-hover-color`, `--icon-active-color`, `--icon-cursor`, `--icon-pointer-events`, `--icon-container-height`, `--icon-container-width` | removed: style the Button |
| `--icon-height`, `--icon-width` (listed in the v4 docs) | removed: they had no effect in v4, delete them |

New, optional: `title`.

### LinkButton

- **Different look**: v4 drew a grey pill (a link that looks like a button); v5 is an inline text link with an animated underline. For the v4 look use `<Button href="..." variant="secondary">`.
- `disabled` now really disables the link (no `href`, `aria-disabled`, `onclick` not called); in v4 it only skipped the callbacks and the link still navigated.
- `onclick({ detail: { nativeEvent } })` → native `onclick(event)`, same for `onkeypress`. Every `<a>` attribute is passed through (`download`, `rel`, `aria-*`, ...).
- With `target="_blank"`, `rel` defaults to `noopener noreferrer` (v4: `noreferrer`).
- It is `inline-flex` (v4: `flex`, full row): it sits inside text.
- Icon props are SVG paths.

| v4 | v5 |
|---|---|
| `--link-button-background-color`, `-hover-background-color` | `--link-button-background`, `--link-button-hover-background` (default transparent) |
| `--link-button-width`, `-height` | removed (use `Button` with `href` for a sized link) |

Unchanged: `--link-button-color`, `-font-size`, `-font-weight`, `-line-height`, `-padding`, `-border-radius`, `-gap`.

New, optional: `rel`, `bind:linkElement`, `--link-button-hover-color`, `--link-button-underline-*`, `--link-button-icon-*`, focus ring and disabled variables, `data-disabled`.

### Menu

| v4 | v5 |
|---|---|
| `anchor` | `placement` |
| `_activatorGap` | `offset` (default 5 → 6) |
| `_width`, `_height`, `_maxHeight`, `_minWidth`, `_overflow`, `_boxShadow`, `_borderRadius` | `--menu-width`, `--menu-height`, `--menu-max-height`, `--menu-min-width`, `--menu-overflow`, `--menu-box-shadow`, `--menu-border-radius` |
| `_top`, `_left` | a virtual activator: `activator={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }}` (viewport coordinates) |
| `_offsetTop`, `_offsetLeft` | `offset`, or a shifted virtual activator |
| `refreshPosition`, `flipOnOverflow`, `stayInViewport` | removed: the menu follows the activator, flips and stays in the viewport by itself |
| `inAnimation`, `outAnimation` (+ configs) | `--menu-duration`, `--menu-transition-distance`, `--menu-transition-scale` |
| `openingId` | removed: opening a menu closes the others, except nested ones and those with `closeOnClickOutside={false}` |
| `_width = activator.offsetWidth` | `matchActivatorWidth` |

`placement` values: `bottom` → `bottom-start`, `bottom-center` → `bottom`, `up` → `top-start`, `up-center` → `top`, `left` → `left-start`, `left-center` → `left`, `right` → `right-start`, `right-center` → `right`. Careful: `"bottom"`, `"left"` and `"right"` still type-check but now mean centered.

- `closeOnClickOutside` defaults to `true` (v4: `false`); Escape always closes the menu. Use `bind:open`, since the menu closes itself.
- It is a `popover` on the top layer with `position: fixed`: never clipped by `overflow`, no z-index. A submenu must be rendered inside the parent menu's `children`, otherwise opening it closes the parent.
- It has a default surface (padding, background, border, radius, shadow, blur). Content that draws its own card: `--menu-padding="0" --menu-background="transparent" --menu-border-width="0" --menu-box-shadow="none" --menu-backdrop-filter="none"`.
- Nothing is rendered while closed (v4 kept a hidden element), and the element loses `role="presentation"`, `data-menu` and the inline z-index.

New, optional: `-start`/`-end` placements, `matchActivatorWidth`, virtual activator, `class` and native attributes, `data-side`.

### NoData

- Look: the default (`size="md"`) is a framed icon with dashed rings, a title in the display font and an optional description and actions. `size="sm"` is close to the v4 look (icon and text only), for tables, lists and cards.
- `noItemsText` → `title`; `iconName` (MDI class) → `icon` (SVG path, default `mdiDatabaseOffOutline`).
- `lang` is no longer a prop: the default title is "No data available". It still type-checks as the native `lang` attribute of the root, which would mark the English title as Italian: delete it, and pass `title` for other languages (v4 `lang="it"`: "Nessun dato disponibile").
- `class` is now on the root (v4: on the text).
- Text is readable: v4 dimmed the whole block to 50% and the text again to 50% (25% in total).
- `--no-data-height` still sets the height (default `auto`, v4: 200px), but the space now comes from `--no-data-min-height` (200px, `sm`: 120px), which wins over a smaller height: for a v4 height below that, set `--no-data-min-height` too (the same value or `0`). The same goes for `--no-data-default-height` and `--no-data-default-min-height`.

Unchanged: `--no-data-gap`.

New, optional: `description`, `size`, `children` (actions), `titleSnippet`, `descriptionSnippet`, `iconSnippet`, native attributes, `data-size`, `--no-data-min-height`, `-padding`, `-max-width`, `-icon-*`, `-ring-color`, `-title-*`, `-description-*`, `-actions-gap`.

### ProgressBar

- Look: an 8px pill track with the theme gradient, a glow and a moving shimmer (v4: 5px, radius 2px, flat primary). Pass `--progress-bar-height="5px"` for the v4 height.
- `value` and `total` unchanged; the fill and `aria-valuenow` are clamped to `0…total` (v4 relied on `max-width: 100%`), while `valueSnippet` and the tooltip still get the raw `value`.
- `valueTooltip` and `valueTooltipLabel` unchanged, now on the v5 `Tooltip`: it opens above the whole bar (v4: below the filled part) after 400 ms. While `valueTooltip` is set, `valueTooltipLabel` is also the `aria-valuetext` (an `aria-valuetext` passed by the app wins). A `valueTooltipLabel` of `0` or `''` is now shown as is (v4 fell back to `value`).
- It is a `role="progressbar"` with `aria-valuenow` (v4 had no role): give it a `label` or an `aria-label`.

| v4 | v5 |
|---|---|
| `--progress-bar-background-color` | `--progress-bar-background` |
| `--progress-bar-highlight-color` | `--progress-bar-fill-background` (any color or gradient) |
| `--progress-bar-tooltip-background-color`, `-tooltip-border-radius`, `-tooltip-padding` | `--tooltip-background`, `--tooltip-border-radius`, `--tooltip-padding` passed to the ProgressBar |

Unchanged: `--progress-bar-height`, `-width`, `-border-radius`. Defaults follow the same renames.

New, optional: `label`, `labelSnippet`, `showValue`, `valueSnippet`, `indeterminate`, `variant`, `class` and native attributes, `data-variant`, `data-indeterminate`, `--progress-bar-gap`, `-fill-box-shadow`, `-shimmer-*`, `-indeterminate-*`, `-duration`, `-label-*`, `-value-*`.

### RadioButton

- `bind:checked` → `bind:group` with the same variable on every radio of the group, plus each radio's own `value` (`<RadioButton bind:group={plan} value="monthly" />`). In v4 `checked` was declared bindable but passed one way, so the binding never updated. `checked` is now only the native attribute, used while `group` is `undefined`.
- To render a group from a list, use the new `RadioGroup` (`items`, `bind:value`, `label` as legend, generated `name`) instead of a wrapper of your own.
- `value` accepts `string | number`; `name` is optional (radios without it do not form a group).
- The root is a `<label>` around the input, so the text selects the radio without an `id` (in v4 `<label for={id}>` did nothing when `id` was missing). Attributes and events go to the input (now every native attribute, not only the v4 list). The callbacks receive the native event as in v4, but are now typed with it (v4 typed them `() => void`).
- New `class` object: `{ container, input, label, description }`.
- Size 21px → 18px; focus ring on `:focus-visible`; disabled is opacity .4 on the whole label.

| v4 | v5 |
|---|---|
| `--radio-button-background-color` | `--radio-button-background` |
| `--radio-button-active-color` | `--radio-button-checked-background` + `--radio-button-checked-border-color` |
| `--radio-button-active-inner-color` | `--radio-button-dot-color` |
| `--radio-button-border-hover-color` | `--radio-button-hover-border-color` |
| `--radio-button-focus-shadow` | `--radio-button-focus-ring-width` + `-color` + `-offset` |
| `--radio-button-disabled-color`, `-disabled-active-color` | `--radio-button-disabled-opacity` |

Unchanged: `--radio-button-border-color`. Defaults follow the same renames (`--radio-button-default-active-color` → `--radio-button-default-checked-background`, ...).

New, optional: `group` (bindable), `description`, `descriptionSnippet`, `card`, `labelSnippet`, `bind:input`, `data-checked` / `data-disabled` / `data-card`. New component: `RadioGroup`.

### Select

- `options` → `items`, and each `{ value, text, icon }` → `Item` `{ value, label, icon, data }` (`text` → `label`, `icon` an SVG path). `items` is optional.
- `optionAttributes` removed: `class.option` for classes, `itemSnippet` for content; per-option attributes (`disabled`, `title`) have no equivalent.
- `multiple` removed: use Dropdown or Autocomplete.
- `class`: string (which replaced the internal class) → `{ container, label, field, select, option, hint }`.
- `placeholder` now works: a hidden option, and `value` stays `undefined` until the user picks one. In v4 it did nothing and `value` was the first option.
- `Item.value` must be a string or a number, and unique. An item with value `''` is read as "no choice": picking it sets the bound `value` to `undefined`.
- The root is a `<div>`; attributes still go to the `<select>`. The font size is 14px (v4: inherited). The native arrow is replaced by the library chevron. In Chrome/Edge 135+ and Safari 27+ the list is a styled popup with icons and a check mark; Firefox shows the native list.

| v4 | v5 |
|---|---|
| `--select-background-color` | `--select-background` |
| `--select-padding-left`, `--select-padding-right` | `--select-padding-x` |
| `--select-border` | `--select-border-width` + `--select-border-color` |
| `--selecr-active-border-color` (and the documented `--select-active-border-color`) | `--select-focus-border-color` |
| `--option-color` | `--select-option-color` |
| `--option-background-color`, `--option-border-color` | removed: `--select-picker-background`, `--select-option-highlighted-background`, `--select-option-selected-background` (styled popup only) |

Unchanged: `--select-height`, `--select-width`, `--select-color`, `--select-border-radius`. Defaults follow the same renames.

New, optional: `label`, `hint`, `state`, `bind:select`, snippets `labelSnippet`, `hintSnippet`, `stateIconSnippet`, `chevronSnippet`, `itemSnippet`, `checkSnippet`, `--select-picker-*`, `--select-option-*`.

### SimpleTextField

- **Range mode removed**: `range`, `valueTo`, `placeholderTo`, `idTo`, `nameTo`, `inputTo`, `betweenLabel`. Use two fields with their own labels; date ranges will be handled by DatePickerTextField.
- `iconSize` removed: `--simple-text-field-icon-size` (`--icon-size` no longer reaches the icons).
- Icon props are SVG paths; the icon snippets lose the `iconSize` parameter.
- Default width 280px → 100% of the container. The input always gets an `id`. `input` is an `HTMLInputElement`.
- An `aria-describedby` passed by the app is merged with the hint id, and its `aria-invalid` is kept (`state="error"` also sets it).
- `hintSnippet` renders inside the hint element; `class.hint` goes on that element, which exists only with a hint.
- Look: 36px high with a border (v4: filled grey, no border), visible focus, visible native date/time picker icon.
- **CSS prefix renamed**: `--simple-textfield-*` → `--simple-text-field-*` (defaults too).

| v4 | v5 |
|---|---|
| `--simple-textfield-background-color` | `--simple-text-field-background` |
| `--simple-textfield-border` | `--simple-text-field-border-width` + `--simple-text-field-border-color` |
| `--simple-textfield-focus-box-shadow` | `--simple-text-field-focus-ring-width` + `-ring-color`, `--simple-text-field-focus-border-color` |
| `--simple-textfield-margin-bottom` | `--simple-text-field-gap` (between label, field and hint) |
| `--simple-textfield-focus-background-color`, `-margin-left`, `-hint-margin-left`, `-transition`, `-range-text-align` | removed |

The others only change prefix: `width`, `max-width`, `outer-gap`, `inner-gap`, `padding`, `height`, `border-radius`, `box-shadow`, `font-size`, `font-weight`, `color`, `hint-font-size`, `hint-color`.

New, optional: `label`, `state`, `labelSnippet`, `stateIconSnippet`, `class.label`, `type` `email` / `tel` / `search` / `url`, `data-state` / `data-disabled` / `data-readonly`.

### Skeleton

- Look: a soft shimmer in sync across all skeletons on the page, radius 4px, no shadow (v4: radius 5px and a large `0 10px 100px` shadow). The shimmer stops with reduced motion.
- Without `--skeleton-height`, a `min-height` of `1em` keeps it visible in a parent without height (v4: 0px tall, invisible). An explicit `--skeleton-height` also sets the minimum, so heights below 1em work; a `--skeleton-default-height` below 1em needs `--skeleton-default-min-height` too.
- It is `aria-hidden`; mark the region that is loading with `aria-busy="true"`.

| v4 | v5 |
|---|---|
| `--skeleton-card-width`, `-card-height` | `--skeleton-width`, `--skeleton-height` |
| `--skeleton-card-min-height` | `--skeleton-min-height` |
| `--skeleton-card-background` | `--skeleton-background` |
| `--skeleton-animation-color` | `--skeleton-highlight-color` |
| `--skeleton-card-max-width`, `-card-max-height`, `-card-min-width`, `-card-padding` | removed: use `class` or `style` |

Defaults follow the same renames (`--skeleton-default-card-*` → `--skeleton-default-*`).

New, optional: `shape` (`rect` \| `circle` \| `text`), `lines`, `class` and native attributes, `data-shape`, `--skeleton-size`, `--skeleton-border-radius`, `--skeleton-duration`, `--skeleton-line-*`, `--skeleton-last-line-width`.

### Switch

- `value` → `checked` (`bind:value` → `bind:checked`); `value={true}` only sets the native attribute.
- `onchange({ detail: { nativeEvent, value } })` → native `onchange(event)`: `e.detail.value` → `e.currentTarget.checked`.
- It is now a focusable `<input role="switch">` (a new tab stop, Space toggles it). App CSS on `.toggle-switch*` stops matching.
- Size 42×22 → 36×20 (`size="lg"`: 46×26), with a border; disabled is opacity .4.

| v4 | v5 |
|---|---|
| `--switch-inactive-background-color` | `--switch-background` |
| `--switch-inactive-box-shadow` | `--switch-box-shadow` (the border is `--switch-border-color` / `-width`) |
| `--switch-active-background-color` | `--switch-checked-background` |
| `--switch-active-box-shadow` | `--switch-checked-box-shadow`, `--switch-checked-border-color` |
| `--switch-handle-width` | `--switch-thumb-size` |
| `--switch-handle-color` | `--switch-thumb-color` and `--switch-checked-thumb-color` |
| `--switch-disabled-*` (6 variables) | `--switch-disabled-opacity` |
| `--switch-translate-x` | same name, but computed by default: remove v4 values |
| `--switch-label-width` (set by v4 HeadersDrawer) | never existed in v4: delete it; the text is `label` |

Unchanged: `--switch-width`, `--switch-height` (now the track). Defaults follow the same renames; `--switch-default-translate-x` is removed (the travel is computed).

New, optional: `size`, `label`, `labelSnippet`, `bind:input`, `class` object, native attributes.

### TabSwitcher

- `ontabClick({ detail: { tab, nativeEvent } })` → `ontabClick({ tab, nativeEvent })`: drop `.detail`. Enter and Space on a focused tab call it too. `ontabKeypress` removed (v4 never called it).
- **Tabs that switch page**: give each tab an `href` instead of calling `goto()` in `ontabClick`. With `href` the switcher is a `<nav>` of links with `aria-current="page"` (middle click, new tab, SvelteKit preloading). Keep `selected` derived from the route; do not keep the `goto` as well.
- Without `href` it is an ARIA tab list: arrows, Home and End move the focus, Enter and Space select, only one tab is in the Tab order. Pass `aria-label`; give tabs a `panelId` when their content is in the same page (`role="tabpanel"` on it).
- `Tab.icon` is an SVG path. The `Tab` type is exported: import it instead of declaring it.
- `mandatory` selects the first enabled tab in the first render (v4: after mount, so server-rendered pages showed no selection), and again when the tabs arrive later.
- `class`: `tabs` → `tab`, `bookmark` → `indicator` (v4 ignored it), `guide` removed; `container` and `selected` unchanged.
- Look: muted 14px tabs without side padding, the selected one in body text color with a gradient underline that slides between tabs (v4: inherited font size, selected tab in primary, 8px padding). `--tab-switcher-selected-color="var(--global-color-primary)"` restores the v4 color. `variant="segmented"` is the pill look.
- Only the tabs scroll; `appendSnippet` stays at the end of the row. Tabs show a focus ring (v4: `outline: none`).
- Markup: `.tabs-container`, `.tab-label`, `.selected-tab`, `.horizontal-guide` → `.aurora-tab-switcher`, `.aurora-tab-switcher-tab`, `[data-selected]`, `.aurora-tab-switcher-indicator`; the line is a box shadow of the root.

| v4 | v5 |
|---|---|
| `--tab-switcher-bookmark-color` | `--tab-switcher-indicator-background` (gradients allowed) |
| `--tab-switcher-selected-color` | same name; default body text (v4: primary-400) |
| `--tab-switcher-gap` | same name; underline tabs lost 8px of side padding, add 16px to keep the v4 spacing |
| `--tab-switcher-guide-color` | same name, drawn at full opacity (v4: 20%) |
| `--tab-switcher-width` | same name |
| `--tab-switcher-default-bookmark-color`, `-default-selected-color`, `-default-gap` | `--tab-switcher-default-underline-indicator-background`, `-underline-selected-color`, `-underline-gap` (and the `-segmented-` ones) |

New, optional: `variant`, Tab `badge` / `href` / `disabled` / `panelId`, `tabSnippet`, `aria-label` / `aria-labelledby` on the tab list, `bind:tabSwitcherElement`, native attributes, `data-variant`, `data-selected`, every other `--tab-switcher-*` variable.

### Textarea

- The `id` is generated with `$props.id()` (stable across server and client) instead of a random cuid.
- Look: bordered field like the other inputs (v4: filled grey, no border), visible focus, 3 rows by default (`rows`; native default 2), resizable vertically (v4: `resize: none`; `--textarea-resize: none` restores it).
- Border, background, padding and shadow are on a wrapper around the `<textarea>`, as in SimpleTextField. `--textarea-height` sets the height of the text area only (v4: the whole box), so `--textarea-height: 130px` is now about 20px taller; its default is `auto` (v4: `100%`).
- `value` is `string | null`. `class` keeps `container`, `label`, `textarea` and adds `field`, `hint`, `counter`.

| v4 | v5 |
|---|---|
| `--textarea-background-color` | `--textarea-background` |
| `--textarea-border` | `--textarea-border-width` + `--textarea-border-color` |
| `--textarea-focus-box-shadow` | `--textarea-focus-ring-width` + `-ring-color`, `--textarea-focus-border-color` |
| `--textarea-label-margin` | `--textarea-gap` (between label, field and hint) |
| `--textarea-margin`, `--textarea-transition` | removed |

The others keep their name: `padding`, `height`, `width`, `border-radius`, `box-shadow`, `font-family`, `font-size`, `font-weight`, `color`, `resize`, `label-font-size`, `label-font-weight`, `label-color`.

New, optional: `hint`, `state`, `counter`, `autoGrow`, `labelSnippet`, `stateIconSnippet`, `hintSnippet`, `counterSnippet`, `bind:textarea`, `data-state` / `data-disabled` / `data-readonly`.

### Toaster

New in v5: v4 had no toasts, and most apps have their own `Toaster.svelte` copied from the melt-ui demo (`addToast`, `addErrorToast`, `addSuccessToast`, `addWarningToast`, `addInfoToast`, `removeToast` with `{ data: { title, description, ... } }`). The v5 functions have the same names but take the options directly: `addErrorToast({ title, description })`, or a string as the title.

To move without touching the call sites, turn the app's `Toaster.svelte` into an adapter:

```svelte
<script module lang="ts">
	import * as toasts from '@likable-hair/svelte';

	type Data = {
		title: string;
		description?: string;
		closeDelay?: number;
		showLoading?: boolean;
		action?: { label: string; handler: () => void };
	};

	const options = ({ data }: { data: Data }) => ({
		title: data.title,
		description: data.description,
		duration: data.closeDelay,
		loading: data.showLoading,
		action: data.action && { label: data.action.label, onclick: data.action.handler }
	});

	export const addErrorToast = (props: { data: Data }) => toasts.addErrorToast(options(props));
	export const addSuccessToast = (props: { data: Data }) => toasts.addSuccessToast(options(props));
	export const addWarningToast = (props: { data: Data }) => toasts.addWarningToast(options(props));
	export const addInfoToast = (props: { data: Data }) => toasts.addInfoToast(options(props));
	export const removeToast = toasts.removeToast;
</script>

<script lang="ts">
	import { Toaster } from '@likable-hair/svelte';
</script>

<Toaster />
```

Differences from the melt-ui copies:

- `add*` return the id (a number), not an object: `addToast(...).id` → `addToast(...)`.
- The variant comes from the function or `variant`, never from a CSS color (`color: 'info'`, `'green'`, ... are gone).
- `duration` (ms) replaces `closeDelay`, and it works: `0` keeps the toast open (several copies turned `0` into 3000 or ignored the value). Default 5000 (the copies used 3000).
- `loading` replaces `showLoading`; `updateToast(id, { variant: 'success', title, loading: false })` turns it into a result instead of removing it and adding a new one. `progress` shows a determinate bar.
- A click on `action` closes the toast, unless its `onclick` calls `event.preventDefault()` (the copies left it open).
- Position: bottom right on desktop, full width on screens up to 640px (the copies: top right on mobile). Pass `position` to change it.
- At most 5 toasts (`limit`); an identical toast still visible restarts its timer instead of stacking.
- Errors and warnings are announced right away, the others politely (the copies used `role="alert"` for all); the close button has an accessible name.
- While a `Dialog` or `Drawer` is open the toasts show inside it and stay clickable.

### Tooltip

- **Renamed**: `ToolTip` → `Tooltip` (`import { Tooltip } from '@likable-hair/svelte'`).
- It has its own surface: a dark one-line label (`variant="plain"`) or a card (`variant="rich"`). In v4 it was an empty Menu and every app drew its card inside (`<div style:background-color=... style:padding=...>`): remove that wrapper and pass `text`, or keep only the content in `children`.
- `menuProps` removed. `menuProps={{ anchor }}` → `placement`: `bottom-center` → `bottom`, `right-center` → `right`, `up-center` → `top`, `left-center` → `left`. `menuProps._activatorGap` → `offset` (default 10px, arrow included). Other Menu props (`_minWidth`, `_left`, `stayInViewport`, ...) have no equivalent: use `--tooltip-max-width` and app CSS; the tooltip always stays in the viewport.
- Default placement `bottom-center` → `top`. Pass `placement="bottom"` for the v4 position.
- `appearTimeout` default `0` → `400` ms. Keyboard focus opens it right away; hovering the next activator just after one closed also opens right away.
- `menuOpen` → `open`. `activator` is still bindable but no longer needs `bind:`.
- Behaviour: it also opens on keyboard focus, stays open while the pointer is over it, closes on Escape and on click, and adds its id to the activator's `aria-describedby` (v4: hover only, no ARIA). On touch screens a tap on the activator toggles it.
- Markup: the tooltip element is always in the DOM (hidden while closed), so screen readers can read the description.

New, optional: `text`, `title`, `titleSnippet`, `variant`, `offset`, `bind:tooltipElement`, `class` and native attributes, `data-side`, `data-variant`, every `--tooltip-*` variable.

## Not available yet

These v4 exports have no v5 version yet. Keep v4 for screens that need them, or wait for the port.

- **Components**: MediaQuery (use `svelte/reactivity`), MenuOrDrawer, MenuOrDrawerOptions, QuickActions, VerticalDraggableList, InfiniteScroll, CollapsibleDivider, Calendar, DatePicker, MonthSelector, YearSelector, DatePickerTextField, YearPickerTextField, PeriodSelector, PeriodPicker, FileInput, FileInputList, VerticalSwitch, VerticalTextSwitch, IconsDropdown, AvatarDropdown, ToggleList, BoxList, ColorInvertedSelector, SelectableMenuList, SelectableVerticalList, SidebarMenuList, HierarchyMenu, SimpleTable, Paginator, PaginatedTable, EnhancedPaginatedTable, DynamicTable, Filters, DynamicFilters, FilterEditor, GlobalSearchTextField, SearchBar, Avatar, DescriptiveAvatar, Breadcrumb, HeaderMenu, Navigator, LineChart, BarChart, PieChart, SimpleTimeLine, DashboardShaper, CollapsibleSideBarLayout, StableDividedSideBarLayout, UnstableDividedSideBarLayout.
- **Utilities**: `scrollAtCenter`, `FilterBuilder`, `FilterConverter` / `Converter`, `FilterValidator`.
- **Stores**: `mediaQuery`, `theme`, `toggleTheme` (see [Dark mode](#dark-mode-and-themes)), `debounce`.
