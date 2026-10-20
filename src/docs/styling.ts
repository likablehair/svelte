import tailwindCss from '../lib/tailwind.css?raw';
import { PACKAGE } from './markdown.js';

export interface CodeBlock {
	file?: string;
	lang: string;
	source: string;
}

export interface StylingSection {
	title: string;
	blocks: (string | CodeBlock)[];
}

export interface TailwindClass {
	group: string;
	utility: string;
	token: string;
}

export const LAYER_ORDER = '@layer reset, theme, base, global, components, utilities;';

export const STYLING_TITLE = 'CSS and Tailwind';

export const STYLING_INTRO =
	"The library keeps all its CSS in cascade layers: the app's own CSS always wins, Tailwind utilities work on components and resets do not break them. The tokens are also available as Tailwind classes.";

export const STYLING_SECTIONS: StylingSection[] = [
	{
		title: 'Cascade layers',
		blocks: [
			'Every CSS file of the library declares this order of layers. The library lives in `global`: tokens and component defaults in `global.base`, themes in `global.theme`, component rules in `global.components`.',
			{ lang: 'css', source: LAYER_ORDER },
			'Put the same line at the top of the main CSS file of the app, so the order holds whichever file the browser loads first.',
			'CSS outside layers always wins over the library, whatever its specificity: a class passed with `class` overrides the component. For colors, sizes and states prefer the CSS variables of each component (`--button-background`), which also cover hover, focus and disabled.',
			'Resets go below the library, in `@layer reset`. An unlayered rule such as `button { padding: 0 }` or `* { margin: 0 }` would override the components.',
			{
				file: 'src/app.css',
				lang: 'css',
				source: `${LAYER_ORDER}

@layer reset {
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
}`
			}
		]
	},
	{
		title: 'Tailwind 4',
		blocks: [
			'Import the library theme after Tailwind. Tailwind puts its preflight in `base` and its utilities in `utilities`, so the order above places the library between them: utilities override components, the preflight does not.',
			{
				file: 'src/app.css',
				lang: 'css',
				source: `${LAYER_ORDER}

@import 'tailwindcss';
@import '${PACKAGE}/tailwind.css';`
			},
			`The values come from \`tokens.css\`, which every component imports. If a page uses the classes before any component, import it once in the root layout: \`import '${PACKAGE}/tokens.css'\`.`,
			'Opacity modifiers work with the tokens: `bg-primary/50`.'
		]
	},
	{
		title: 'Tailwind 3',
		blocks: [
			"Tailwind 3 does not use native cascade layers, so its preflight would override the components (`button { background-color: transparent }`, `* { border-width: 0 }`). Wrap `@tailwind base` in `@layer reset`: the preflight and the app's `@layer base` blocks end up there. Utilities stay outside layers and win over the library.",
			{
				file: 'src/app.css',
				lang: 'css',
				source: `${LAYER_ORDER}

@layer reset {
	@tailwind base;
}
@tailwind components;
@tailwind utilities;`
			},
			'The classes come from a preset.',
			{
				file: 'tailwind.config.js',
				lang: 'js',
				source: `import aurora from '${PACKAGE}/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [aurora],
	content: ['./src/**/*.{html,js,svelte,ts}']
};`
			},
			'Opacity modifiers (`bg-primary/50`) do not work with the tokens in Tailwind 3: use the `-soft` colors (`bg-primary-soft`).'
		]
	}
];

export const CLASSES_TITLE = 'Classes';

export const CLASSES_INTRO =
	'Every class reads a `--global-*` token at runtime, so it follows the theme and the light/dark mode. The name is the token without `--global-` (and without `color-` for colors). Colors work with every color utility (`bg-`, `text-`, `border-`, `ring-`, `outline-`, `fill-`, `shadow-`, ...). `font-sans` is `--global-font-family`: set the app font there, so components and utilities share it.';

const GROUPS: [RegExp, string, (name: string) => string][] = [
	[/^--color-(.+)$/, 'Colors', (n) => `bg-${n}`],
	[/^--radius-(.+)$/, 'Radius', (n) => `rounded-${n}`],
	[/^--shadow-(.+)$/, 'Shadows', (n) => `shadow-${n}`],
	[/^--font-(.+)$/, 'Fonts', (n) => `font-${n}`],
	[/^--ease-(.+)$/, 'Motion', (n) => `ease-${n}`]
];

export function tailwindClasses(): TailwindClass[] {
	const classes: TailwindClass[] = [];
	for (const [, name, token] of tailwindCss.matchAll(/(--[\w-]+):\s*var\((--global-[\w-]+)\)/g)) {
		const group = GROUPS.find(([re]) => re.test(name));
		if (group) classes.push({ group: group[1], utility: group[2](name.match(group[0])![1]), token });
	}
	for (const [, utility, token] of tailwindCss.matchAll(
		/@utility ([\w-]+) \{\s*background-image: var\((--global-[\w-]+)\)/g
	)) {
		classes.push({ group: 'Gradients', utility, token });
	}
	return classes;
}

export function stylingMarkdown() {
	const lines = [`# ${STYLING_TITLE}`, '', STYLING_INTRO, ''];
	for (const section of STYLING_SECTIONS) {
		lines.push(`## ${section.title}`, '');
		for (const block of section.blocks) {
			if (typeof block === 'string') lines.push(block, '');
			else {
				if (block.file) lines.push(`\`${block.file}\`:`, '');
				lines.push('```' + block.lang, block.source, '```', '');
			}
		}
	}
	lines.push(`## ${CLASSES_TITLE}`, '', CLASSES_INTRO, '', '| Class | Token |', '| --- | --- |');
	for (const c of tailwindClasses()) lines.push(`| \`${c.utility}\` | \`${c.token}\` |`);
	lines.push('');
	return lines.join('\n');
}
