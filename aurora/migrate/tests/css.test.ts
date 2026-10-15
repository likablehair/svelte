import { describe, expect, test } from 'vitest';
import { addV4Compat, findAppCss, fontFamilies, prepareAppCss, useLibraryFonts } from '../src/css.ts';

const LAYERS = '@layer reset, theme, base, global, components, utilities;';

describe('prepareAppCss', () => {
	test('Tailwind 4: layer order on top, library CSS after Tailwind, element rules in the reset layer', () => {
		const source = [
			"@import url('https://fonts.example/inter.css') layer(base);",
			'',
			"@import 'tailwindcss';",
			'',
			'body {\n  margin: 0;\n}',
			'',
			'hr {\n  border: none;\n}',
			'',
			'input:focus,\ninput:hover {\n  color: red;\n}',
			'',
			'.card hr {\n  margin: 0;\n}',
			'',
			':root {\n  --x: 1;\n}',
			''
		].join('\n');
		const { text, changes } = prepareAppCss(source, LAYERS);
		expect(text.startsWith(`${LAYERS}\n\n@import url(`)).toBe(true);
		expect(text).toContain("@import 'tailwindcss';\n@import '@likable-hair/svelte/tailwind.css';");
		expect(text).toContain('body {\n  margin: 0;\n}');
		expect(text).toContain('@layer reset {\n  hr {\n    border: none;\n  }\n}');
		expect(text).toContain('@layer reset {\n  input:focus,\n  input:hover {');
		expect(text).toContain('\n.card hr {');
		expect(text).toContain('\n:root {');
		expect(changes).toEqual([
			'element rules moved into @layer reset: hr, input:focus',
			"@import '@likable-hair/svelte/tailwind.css' after Tailwind",
			'cascade layer order at the top'
		]);
	});

	test('Tailwind 3: the preflight goes into the reset layer', () => {
		const { text } = prepareAppCss('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n', LAYERS);
		expect(text).toBe(`${LAYERS}\n\n@layer reset {\n\t@tailwind base;\n}\n@tailwind components;\n@tailwind utilities;\n`);
	});

	test('running it again changes nothing', () => {
		const once = prepareAppCss("@import 'tailwindcss';\nhr { border: 0 }\n", LAYERS).text;
		expect(prepareAppCss(once, LAYERS)).toEqual({ text: once, changes: [] });
		const tw3 = prepareAppCss('@tailwind base;\n', LAYERS).text;
		expect(prepareAppCss(tw3, LAYERS).changes).toEqual([]);
	});

	test('finds the stylesheet that imports Tailwind, else src/app.css', () => {
		expect(
			findAppCss([
				{ rel: 'src/lib/x.css', text: '' },
				{ rel: 'src/styles/main.css', text: "@import 'tailwindcss';" },
				{ rel: 'src/app.css', text: '' }
			])
		).toBe('src/styles/main.css');
		expect(findAppCss([{ rel: 'src/app.css', text: 'body {}' }])).toBe('src/app.css');
	});
});

describe('useLibraryFonts', () => {
	const source = [
		LAYERS,
		'',
		"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap')",
		'layer(base);',
		'',
		"@import 'tailwindcss';",
		'',
		'body {',
		'  font-family: Inter;',
		'  color: red;',
		"  font-family: Inter, -apple-system, 'Segoe UI', sans-serif;",
		'}',
		''
	].join('\n');

	test('the page takes the library font and the unused font import is replaced', () => {
		const { text, changes } = useLibraryFonts(source, () => false);
		expect(text).toContain('body {\n  font-family: var(--global-font-family);\n  color: red;\n}');
		expect(text).not.toContain('family=Inter');
		expect(text).toContain(`${LAYERS}\n\n@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque`);
		expect(text.indexOf('family=Geist')).toBeLessThan(text.indexOf("@import 'tailwindcss'"));
		expect(changes).toHaveLength(3);
	});

	test('a font still used somewhere else keeps its import', () => {
		const { text } = useLibraryFonts(source, (family) => family === 'Inter');
		expect(text).toContain('family=Inter');
		expect(text).toContain('family=Geist');
	});

	test('without a font import the library fonts go after the layer order; a second run changes nothing', () => {
		const once = useLibraryFonts(`${LAYERS}\n\nbody { margin: 0 }\n`, () => false).text;
		expect(once.startsWith(`${LAYERS}\n\n@import url('https://fonts.googleapis.com/css2?family=Bricolage`)).toBe(true);
		expect(useLibraryFonts(once, () => false)).toEqual({ text: once, changes: [] });
	});

	test('fontFamilies reads the families of a Google Fonts URL', () => {
		expect(fontFamilies('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&family=Inter&display=swap')).toEqual([
			'Open Sans',
			'Inter'
		]);
	});
});

describe('addV4Compat', () => {
	test('goes after the last @import, once', () => {
		const source = `${LAYERS}\n\n@import url('x.css');\n@import 'tailwindcss';\n@import '@likable-hair/svelte/tailwind.css';\n\nbody {}\n`;
		const { text } = addV4Compat(source);
		expect(text).toContain("@import '@likable-hair/svelte/tailwind.css';\n@import '@likable-hair/svelte/v4-compat.css';\n\nbody {}");
		expect(addV4Compat(text)).toEqual({ text, changes: [] });
	});

	test('without imports it goes after the layer order', () => {
		expect(addV4Compat(`${LAYERS}\nbody {}\n`).text).toBe(`${LAYERS}\n@import '@likable-hair/svelte/v4-compat.css';\nbody {}\n`);
	});
});
