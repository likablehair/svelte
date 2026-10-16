import type { ComponentMigration } from '../types.js';

export default {
	from: 'BoxList',
	to: 'BoxList',
	props: {
		toCssVar: [
			{
				name: 'gap',
				cssVar: '--box-list-gap',
				note: 'Default 12px instead of 15px.'
			}
		],
		types: [
			{
				name: 'boxes',
				v4: '{ name: string; label: string; href?: string; style?: { width?: string; maxWidth?: string; minWidth?: string } }[]',
				v5: 'BoxListItem<Data>[]',
				note: '`style` is gone (see the `box-list-grid` step). New optional fields: `description`, `icon`, `color`, `disabled`, `class`, `data`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onboxClick',
				argument: { 'detail.box': 'box' },
				type: '{ box: BoxListItem<Data>; event: MouseEvent }',
				note: 'Still called for links, before the navigation. Not called for disabled boxes.'
			}
		]
	},
	snippets: {
		parameters: [
			{
				name: 'boxSnippet',
				v4: '{ box }',
				v5: '{ box, index }',
				note: 'v4 replaced the whole box, so the snippet had to draw its own `<a>` or `<button>` (and lost `onboxClick`). v5 renders it inside the link or button of the library: drop the outer `<a>`/`<button>` from the snippet and keep only its content.'
			}
		]
	},
	manual: [
		{
			id: 'box-list-navigation',
			summary: 'Boxes that navigate with `goto` inside `onboxClick` can be links.',
			action:
				'Where `onboxClick` only maps `box.name` to a URL and calls `goto`, put the URL in `href` on each box and remove the handler: the box becomes a real link (middle click, open in a new tab, preload by SvelteKit) and a wrong name can no longer leave a box doing nothing.',
			when: { events: ['onboxClick'] }
		},
		{
			id: 'box-list-grid',
			summary:
				'The boxes are a grid of cards as wide as the column (`--box-list-min-width`, 240px, as many columns as fit, one on a phone) instead of a row of pills as wide as their text.',
			action:
				'Drop `style.width`, `style.minWidth` and `style.maxWidth` from the boxes; for narrower or wider columns set `--box-list-min-width` on the list. Wrappers that limited the width of the list can usually stay.',
			when: { props: ['boxes'] }
		},
		{
			id: 'box-list-look',
			summary:
				'New look: a card with border, optional icon tile, label 14px 600 and description under it; no arrow; focus ring instead of the blue background that stayed after a click.',
			action:
				'Usually nothing to do. To keep the v4 arrow add `appendSnippet` with `<Icon path={mdiArrowRight} />`. Remove app CSS that targeted `.box` or the v4 `:focus` colors; the parts are `.aurora-box-list-box`, `-icon`, `-label`, `-description`, styled with the `--box-list-*` variables.'
		},
		{
			id: 'box-list-local-copies',
			summary:
				'Most apps use a local copy (`$lib/components/common/BoxList.svelte`) instead of the library one, often with `icon` and a `description` shown on hover.',
			action:
				'Replace the copy with the library `BoxList` and delete it: `icon` becomes an `@mdi/js` path, `description` is kept (always visible now; for HTML use `descriptionSnippet` with `{@html box.description}`), `redirectUrl` / `url` → `href` (SvelteKit preloads links by itself), drop `expanded`, `animateOnMount` and the `type` prop. `on:box-click={(e) => ...e.detail.box}` → `onboxClick={({ box }) => ...}`, or `href` as in `box-list-navigation`. A `prepend` slot that added a custom card has no equivalent: render that card next to the list (for example in a grid that holds both).',
			scope: 'app'
		}
	],
	added: [
		'`description` per box, always visible, read as the description of the box by screen readers.',
		'`icon` per box (an `@mdi/js` path in a tile) and `color` for its tone (`primary` or a data color 1–6).',
		'`disabled` and `class` per box; `data` for app data passed back to the snippets.',
		'`onclick` per box, called before `onboxClick`; it makes a box without `href` a button.',
		'Boxes without `href` and without `onboxClick` render as plain cards (v4 drew a button that did nothing).',
		'`iconSnippet`, `labelSnippet`, `descriptionSnippet`, `prependSnippet`, `appendSnippet`.',
		'`bind:boxListElement`, `class` and native attributes (such as `aria-label`) on the list.',
		'`data-color` and `data-interactive` on each box.',
		'`--box-list-*` variables for the grid, the box and its states, the icon tile, the texts and the hover state (glow, border and shadow in the tone of the box).'
	]
} satisfies ComponentMigration;
