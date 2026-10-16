import type { LocalMigration } from '../../types.js';

export default {
	from: 'BoxMenu',
	to: 'BoxList',
	files: ['BoxMenu.svelte'],
	summary: 'The local `BoxMenu` copy becomes `BoxList` of the library.',
	exports: [{ from: 'BoxItem', to: 'BoxListItem' }],
	props: {
		renamed: [{ from: 'items', to: 'boxes' }]
	},
	items: [
		{
			prop: 'items',
			keys: [{ from: 'onClick', to: 'onclick' }],
			note: 'Each item is a `BoxListItem`: `name`, `label`, `description`, `icon` (an `@mdi/js` path), `href`, `onclick`.'
		}
	],
	manual: [
		{
			id: 'box-menu-look',
			kind: 'review',
			summary:
				'Cards of the library: icon tile in the brand tone, label and description always visible, a grid that fills the width (`--box-list-min-width` each).',
			action: 'Remove app CSS aimed at the classes of the copy; `color` on an item gives its icon another tone.'
		}
	]
} satisfies LocalMigration;
