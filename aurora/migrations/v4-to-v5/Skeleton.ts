import type { ComponentMigration } from '../types.js';

const unsized = 'Removed: use `class` or `style` on the Skeleton, which forwards them to its root `<div>`.';

export default {
	from: 'Skeleton',
	to: 'Skeleton',
	cssVars: {
		renamed: [
			{ from: '--skeleton-card-width', to: '--skeleton-width' },
			{ from: '--skeleton-card-height', to: '--skeleton-height' },
			{ from: '--skeleton-card-min-height', to: '--skeleton-min-height' },
			{ from: '--skeleton-card-background', to: '--skeleton-background' },
			{ from: '--skeleton-animation-color', to: '--skeleton-highlight-color' },
			{ from: '--skeleton-default-card-width', to: '--skeleton-default-width' },
			{
				from: '--skeleton-default-card-height',
				to: '--skeleton-default-height',
				note: 'Only `--skeleton-height` also sets the minimum height: for a default below 1em set `--skeleton-default-min-height` too.'
			},
			{ from: '--skeleton-default-card-min-height', to: '--skeleton-default-min-height' },
			{ from: '--skeleton-default-card-background', to: '--skeleton-default-background' },
			{ from: '--skeleton-default-animation-color', to: '--skeleton-default-highlight-color' }
		],
		removed: [
			{ name: '--skeleton-card-max-width', note: unsized },
			{ name: '--skeleton-card-max-height', note: unsized },
			{ name: '--skeleton-card-min-width', note: unsized },
			{
				name: '--skeleton-card-padding',
				note: 'Removed. In v4 the padding added to the size (content-box); the v5 skeleton is border-box and empty. Delete it and add the padding to `--skeleton-width` / `--skeleton-height` if the size must stay.'
			},
			...[
				'--skeleton-default-card-max-width',
				'--skeleton-default-card-max-height',
				'--skeleton-default-card-min-width',
				'--skeleton-default-card-padding'
			].map((name) => ({
				name,
				note: 'v4 default with no v5 counterpart (v4 never defined it). Delete the override.'
			}))
		]
	},
	manual: [
		{
			id: 'skeleton-look',
			summary:
				'No shadow (v4: `0 10px 100px`), radius 4px (v4: 5px), a softer shimmer in sync across all skeletons that stops with reduced motion, and a `min-height` of 1em when no `--skeleton-height` is set (v4: 0px tall in a parent without height).',
			action:
				'Pass `--skeleton-border-radius="5px"` where the v4 radius matters. A skeleton without `--skeleton-height` that must collapse to 0 needs `--skeleton-min-height="0px"`. Text placeholders built from several thin rects can become `shape="text"` with `lines`.'
		},
		{
			id: 'skeleton-aria',
			summary: 'The skeleton is `aria-hidden`: screen readers skip it.',
			action:
				'Where a region shows skeletons while it loads, set `aria-busy="true"` on that region until the content arrives.'
		}
	],
	added: [
		'`shape` (`rect` | `circle` | `text`) and `lines` for text placeholders.',
		'`class` and native attributes on the root `<div>`, `data-shape`.',
		'`--skeleton-size`, `--skeleton-border-radius`, `--skeleton-duration`, `--skeleton-line-height`, `--skeleton-line-gap`, `--skeleton-last-line-width`.'
	]
} satisfies ComponentMigration;
