import type { LocalMigration } from '../../types.js';

export default {
	from: 'Divider',
	to: 'Divider',
	files: ['Divider.svelte'],
	contains: ['weight'],
	summary: 'The local `Divider` copy becomes `Divider` of the library: its props become CSS variables.',
	props: {
		toCssVar: [
			{
				name: 'color',
				cssVar: '--divider-color',
				note: 'v4 values are RGB triplets wrapped in `rgb(var(...))`: they keep working through `v4-compat.css`; a missing closing parenthesis is added.'
			},
			{ name: 'weight', cssVar: '--divider-weight' },
			{ name: 'radius', cssVar: '--divider-radius' },
			{ name: 'marginTop', cssVar: '--divider-margin-top' },
			{ name: 'marginBottom', cssVar: '--divider-margin-bottom' },
			{ name: 'marginLeft', cssVar: '--divider-margin-left' },
			{ name: 'marginRight', cssVar: '--divider-margin-right' }
		]
	},
	manual: [
		{
			id: 'divider-visible',
			summary:
				'In most copies the default color pointed to a CSS variable that no app defines, so a `<Divider />` without `color` drew an invisible 10px spacer; the library one draws a line.',
			action:
				'Where a Divider without `color` was meant only as space, replace it with a margin or `gap` in the layout (decided: they become lines).'
		},
		{
			id: 'divider-side-inset',
			summary: 'The copies had 5px side margins; the library line spans the whole width.',
			action: 'Where the inset mattered, set `--divider-margin-left="5px"` and `--divider-margin-right="5px"`.'
		}
	]
} satisfies LocalMigration;
