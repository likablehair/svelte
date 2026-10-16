import type { LocalMigration } from '../../types.js';

export default {
	from: 'ConfirmDialog',
	to: 'ConfirmDialog',
	files: ['ConfirmDialog.svelte'],
	contains: ['confirm-click'],
	summary: 'The local `ConfirmDialog` copy becomes `ConfirmDialog` of the library, with the primary action.',
	props: {
		defaults: [
			{
				name: 'variant',
				v4: 'a primary action',
				v5: "'danger'",
				keepV4: 'variant="primary"',
				behaviour: true,
				note: 'The action button of the copy was primary (blue).'
			},
			{
				name: 'title',
				v4: "'Conferma'",
				v5: 'required',
				keepV4: 'title="Conferma"',
				behaviour: true,
				note: 'Better: a question that names the action.'
			},
			{
				name: 'description',
				v4: '"Sicuro di confermare l\'operazione?"',
				v5: 'none',
				keepV4: 'description="Sicuro di confermare l\'operazione?"',
				behaviour: true
			},
			{
				name: 'closeOnConfirm',
				v4: 'false (the app closed it)',
				v5: 'true',
				keepV4: 'closeOnConfirm={false}',
				behaviour: true,
				note: 'The copy never closed on confirm. Remove it to let ConfirmDialog close by itself after `onconfirm`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'on:confirm-click',
				to: 'onconfirm',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent',
				note: 'Svelte 4 event directive of older app code.'
			},
			{
				name: 'on:cancel-click',
				to: 'oncancel',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent | KeyboardEvent',
				note: 'Called on every way of closing without confirming (Cancel, close button, Escape, backdrop).'
			}
		]
	}
} satisfies LocalMigration;
