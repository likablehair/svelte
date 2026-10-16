import type { LocalMigration } from '../../types.js';

export const boxListItems = [
	{
		prop: 'boxes',
		keys: [
			{ from: 'redirectUrl', to: 'href' },
			{ from: 'url', to: 'href' }
		],
		drop: ['expanded', 'style'],
		note: 'Each box is a `BoxListItem`: `name`, `label`, `description` (plain text, always visible), `icon` (an `@mdi/js` path), `href`, `onclick`, `color`, `disabled`.'
	}
];

export const boxListManual = [
	{
		id: 'box-list-local-description',
		summary: 'The description is always visible and plain text; in the expandable copies it slid in on hover and was HTML (`{@html}`).',
		action: 'Rewrite descriptions that contained HTML as plain text, or render them with `descriptionSnippet`.'
	},
	{
		id: 'box-list-local-look',
		summary: 'Cards of the library in a grid that fills the width (`--box-list-min-width` each), instead of the 260px cards or the wrapping row of the copies.',
		action: 'Remove app CSS aimed at the classes of the copy; the gap is `--box-list-gap`.'
	}
];

export default {
	from: 'BoxList',
	to: 'BoxList',
	files: ['BoxList.svelte'],
	contains: ['boxes'],
	excludes: ['animateOnMount'],
	summary: 'The local `BoxList` copy becomes `BoxList` of the library.',
	exports: [{ from: 'Box', to: 'BoxListItem' }],
	props: {
		toCssVar: [{ name: 'gap', cssVar: '--box-list-gap' }],
		removed: [{ name: 'type', note: 'A box with `href` is a link, one with `onclick` or `onboxClick` a button.', drop: true }]
	},
	events: {
		changed: [
			{
				name: 'on:box-click',
				to: 'onboxClick',
				argument: { detail: '' },
				type: '{ box: BoxListItem; event: MouseEvent }',
				note: 'Svelte 4 event directive of older app code: `event.detail.box` becomes `event.box`.'
			}
		]
	},
	snippets: {
		renamed: [{ from: 'prepend', to: 'prependSnippet', note: 'Content before the icon and the texts of each box; a whole custom box goes next to the list.' }]
	},
	items: boxListItems,
	manual: boxListManual
} satisfies LocalMigration;
