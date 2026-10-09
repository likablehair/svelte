import type { ComponentMigration } from '../types.js';

export default {
	from: 'Divider',
	to: 'Divider',
	cssVars: {
		removed: [
			...['--divider-default-margin-top', '--divider-default-margin-bottom'].map((name) => ({
				name,
				note: 'One default for both sides across the line now (10px, like v4 above and below).',
				replacement: '--divider-default-spacing'
			})),
			...['--divider-default-margin-left', '--divider-default-margin-right'].map((name) => ({
				name,
				note: 'v5 has no side margin by default (v4: 5px). To bring it back on one divider set `--divider-margin-left` / `--divider-margin-right`; for every divider use app CSS on `.aurora-divider`.'
			}))
		],
		changed: [
			{
				name: '--divider-margin-left',
				note: 'Still the left margin, but the default is 0 instead of 5px. On a vertical divider it defaults to `--divider-spacing` (10px).'
			},
			{
				name: '--divider-margin-right',
				note: 'Still the right margin, but the default is 0 instead of 5px. On a vertical divider it defaults to `--divider-spacing` (10px).'
			},
			{
				name: '--divider-color',
				note: 'Paints the line as a CSS `background`, so it takes a gradient too, and it wins over `variant="gradient"`. v4 values are RGB triplets wrapped in `rgb(var(...))`: rewrite them with the v5 tokens (`global-color-tokens`).'
			},
			{
				name: '--divider-default-color',
				note: 'Default changed from `rgb(var(--global-color-background-500))` to `var(--global-color-border-strong)`.'
			},
			{
				name: '--divider-radius',
				note: 'Default changed from 0.5px to `var(--global-radius-full)` (round ends on thick lines).'
			},
			{
				name: '--divider-default-radius',
				note: 'Default changed from 0.5px to `var(--global-radius-full)`.'
			}
		]
	},
	manual: [
		{
			id: 'divider-markup',
			summary:
				'The divider is a native `<hr>` (a separator for screen readers) with class `aurora-divider`; v4 was an empty `<div>` styled inline.',
			action:
				'App CSS that targeted the v4 `div` (for example `.parent > div`) must target `.aurora-divider` or pass `class`. In a flex row a horizontal divider has no width of its own: give it `flex: 1` through `class`, or use `orientation="vertical"` if it separates items of the row.'
		},
		{
			id: 'divider-side-margin',
			summary: 'The 5px left and right margins of v4 are gone: the line now spans the whole container.',
			action:
				'Usually nothing to do. Where the inset mattered, set `--divider-margin-left="5px"` and `--divider-margin-right="5px"` on that divider.'
		},
		{
			id: 'divider-local-copies',
			summary:
				'Most apps import their own `$lib/components/common/Divider.svelte` (props `color`, `weight`, `radius`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`), not the library one.',
			action:
				'Those copies are app code and keep working. To switch a usage to the library, import `Divider` from `@likable-hair/svelte` and turn the props into CSS variables: `color` → `--divider-color`, `weight` → `--divider-weight`, `radius` → `--divider-radius`, `marginTop` → `--divider-margin-top` (same for the other sides); the copy defaults to 5px on the sides like v4, the library to 0. Delete the copy when nothing imports it.',
			scope: 'app'
		}
	],
	added: [
		'`variant` (solid | gradient) and `orientation` (horizontal | vertical, with `aria-orientation`).',
		'`label` and `children`: text in the middle of the line, read by screen readers.',
		'`bind:dividerElement`, `class` and native attributes on the root.',
		'`data-variant` and `data-orientation` attributes.',
		'`--divider-spacing`, `--divider-vertical-min-height`, `--divider-gap` and `--divider-label-*` (color, font family, size, weight, letter spacing, text transform).'
	]
} satisfies ComponentMigration;
