# @likable-hair/svelte 5 (Aurora)

From-scratch rewrite of Likablehair's Svelte component library. Visual reference: `../design/components-prototype.html`. The rest of the repository holds the current library (v4), which remains the reference for component behavior.

- `src/lib` is the published library. `src/docs` and `src/routes` are the documentation site (generated from the source) and are not published.
- `package.json` has `"private": true` until the library is ready, to prevent an accidental `npm publish` over the package the apps use.
- `tests/components` holds a Vitest browser-mode test per component (Chromium and Firefox), `tests/visual` a Playwright screenshot of every docs example in the Aurora and classic themes, light and dark.
- `migrations/v4-to-v5` holds the v4 → v5 migration rules as data, one file per component plus `global.ts`, typed by `migrations/types.ts`. `MIGRATION.md` is the human version.

```sh
npm install
npm run dev        # documentation site
npm run check      # type check
npm run package    # build the library into dist/
npm run test       # component tests and migration rule checks
npm run test:visual            # screenshot comparison of the docs examples
npm run test:visual:update     # accept new screenshots after an intended change
```

The first time, install the test browsers with `npx playwright install chromium firefox`.
