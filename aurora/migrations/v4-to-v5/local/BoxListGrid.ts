import type { LocalMigration } from '../../types.js';
import { boxListItems, boxListManual } from './BoxList.js';

export default {
	from: 'BoxListGrid',
	to: 'BoxList',
	files: ['BoxList.svelte'],
	contains: ['boxes', 'animateOnMount'],
	summary: 'The local animated `BoxList` copy becomes `BoxList` of the library.',
	exports: [{ from: 'Box', to: 'BoxListItem' }],
	props: {
		toCssVar: [{ name: 'gap', cssVar: '--box-list-gap' }],
		removed: [{ name: 'animateOnMount', note: 'The cards appear without the staggered animation, as every usage asked.', drop: true }]
	},
	events: {
		changed: [
			{
				name: 'onboxClick',
				argument: { detail: '' },
				type: '{ box: BoxListItem; event: MouseEvent }',
				note: '`event.detail.box` becomes `event.box`.'
			}
		]
	},
	items: boxListItems,
	manual: boxListManual
} satisfies LocalMigration;
