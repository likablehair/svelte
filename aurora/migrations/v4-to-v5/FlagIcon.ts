import type { ComponentMigration } from '../types.js';

export default {
	from: 'FlagIcon',
	to: 'FlagIcon',
	props: {
		defaults: [
			{
				name: 'square',
				v4: 'true',
				v5: 'false',
				keepV4: 'square',
				note: 'v4 had no `square` prop and always drew the 1:1 flag (1em wide); v5 draws the 4:3 flag (1.33em wide). Add `square` where the layout depends on the square shape: round flags (`--flag-icon-border-radius: 50%`), fixed-width columns, avatars.'
			}
		]
	},
	cssVars: {
		removed: [
			{
				name: '--flag-icon-font-size',
				note: 'Listed in the v4 docs but never read by the component: the size was and still is `--flag-icon-size`.',
				replacement: '--flag-icon-size'
			}
		]
	},
	manual: [
		{
			id: 'flag-icon-size',
			summary:
				'`--flag-icon-default-size` is `1.2em` instead of `1.2rem`, so the flag follows the font size around it; the default radius is 3px instead of 4px, and a 1px ring (`--flag-icon-box-shadow`) is drawn around every flag.',
			action:
				'Check flags inside text that is not 16px (table cells, chips, headings): set `--flag-icon-size="1.2rem"` where the v4 size must stay. Set `--flag-icon-box-shadow="none"` where the ring is unwanted, and `--flag-icon-border-radius="4px"` for the v4 corners.'
		},
		{
			id: 'flag-icon-title',
			summary: 'Without `title` the flag is `aria-hidden`.',
			action:
				'Where the flag is the only thing that tells the country (no name next to it), pass `title` with the country name, for example `countryName(code, locale)`.'
		},
		{
			id: 'flag-icon-classes',
			summary: 'The class `flag-icon` is now `aurora-flag-icon`, and `fis` is set only with `square`.',
			action:
				'Rewrite app CSS that targets `.flag-icon` or `.fis` against `.aurora-flag-icon`, or pass `class`.',
			scope: 'app'
		},
		{
			id: 'flag-icon-assets',
			summary:
				'Flags come from the `flag-icons` npm package, a dependency of the library (the v4 aliases `uk`, `el`, `xs`, `xi`, `ac`, `ta` still work); Vite inlines the smaller ones in the app CSS (about 320 KB), as v4 did.',
			action:
				"Optional: to download each flag only when it is shown, set `build: { assetsInlineLimit: (file) => (file.includes('/flag-icons/') ? false : undefined) }` in `vite.config`.",
			scope: 'app'
		}
	],
	added: [
		'`square`: the 1:1 flag.',
		'`title`: accessible name (role `img`) and tooltip.',
		'`--flag-icon-box-shadow`: the ring around the flag.'
	]
} satisfies ComponentMigration;
