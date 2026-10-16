# Themes and dark mode

- **Aurora** is the default theme: nothing to import. Light and dark follow the system; `setMode('light' | 'dark' | 'system')` forces one, `toggleMode()` switches, `rememberAppearance()` + `appearanceScript()` in the root layout remember the choice without a flash. Let the user choose with `ModeSwitch` (light, system, dark), never with a custom toggle or a cookie endpoint.
- **Themes in the package** (`list_themes`): `import '@likable-hair/svelte/themes/<name>.css'` once, then `setTheme('<name>')` or `<html data-theme="<name>">`.
- **Gallery themes** are not in the package: `get_theme <name>` returns the CSS to save in the app (for example `src/lib/themes/<name>.css`), import it once and activate it the same way.
- **A new theme**: a CSS file that starts with the library layer line and redefines only `--global-*` tokens under `:root[data-theme='<name>']` inside `@layer global.theme`. Use `light-dark(<light>, <dark>)` for colors. Derived tokens (`-strong`, `-soft`, `-glow`, focus ring, fills) follow the base colors by themselves. Never put component rules or layout in a theme. The `create-theme` prompt gives the full token list and an example.
- **Per-app brand without a theme**: set `--global-color-primary` (and maybe `--global-color-accent`) in the app CSS; everything derived follows.
- Fonts are tokens too (`--global-font-family`, `-display`, `-mono`); the app loads the font files itself.
