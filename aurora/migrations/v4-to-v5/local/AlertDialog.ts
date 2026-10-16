import type { LocalMigration } from '../../types.js';

export default {
	from: 'AlertDialog',
	to: 'ConfirmDialog',
	files: ['AlertDialog.svelte'],
	contains: ['alertText'],
	summary: 'The local `AlertDialog` copy becomes `ConfirmDialog` of the library, with the primary action.',
	props: {
		renamed: [
			{ from: 'alertText', to: 'description', note: 'Line breaks are kept.' },
			{ from: 'onConfirmClick', to: 'onconfirm' },
			{
				from: 'onCancelClick',
				to: 'oncancel',
				note: 'Called on every way of closing without confirming (Cancel, close button, Escape, backdrop).'
			}
		],
		bind: [
			{
				name: 'open',
				note: 'With `open={x}` the app did not learn that Escape or the backdrop closed the dialog, so it could not open again.'
			}
		],
		removed: [
			{ name: 'shwoConfirmOrCancel', note: 'The buttons are always there; `actionsSnippet` changes them.', drop: true },
			{ name: '_overlayOpacity', note: 'Use `--dialog-backdrop-background`.' },
			{
				name: 'class',
				note: 'Width classes (`max-w-[500px]`) become `--confirm-dialog-max-width="500px"`; `class` takes an object of classes per part (`{ dialog, … }`).'
			}
		],
		defaults: [
			{
				name: 'variant',
				v4: 'a primary action',
				v5: "'danger'",
				keepV4: 'variant="primary"',
				behaviour: true,
				note: 'The action button of the copies was primary (blue); without `confirmText` it says "Conferma" / "Confirm".'
			},
			{
				name: 'closeOnConfirm',
				v4: 'false (the app closed it)',
				v5: 'true',
				keepV4: 'closeOnConfirm={false}',
				behaviour: true,
				note: 'The copies never closed on confirm, the app set `open = false`. Remove it to let ConfirmDialog close by itself after `onconfirm`.'
			}
		]
	},
	events: {
		changed: [
			{ name: 'onconfirmClick', to: 'onconfirm', argument: { 'detail.nativeEvent': '' }, type: 'MouseEvent' },
			{
				name: 'oncancelClick',
				to: 'oncancel',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent | KeyboardEvent',
				note: 'Called on every way of closing without confirming (Cancel, close button, Escape, backdrop).'
			},
			{
				name: 'on:confirm-click',
				to: 'onconfirm',
				argument: { 'detail.nativeEvent.detail.nativeEvent': '', 'detail.nativeEvent': '' },
				type: 'MouseEvent',
				note: 'Svelte 4 event directive of older app code.'
			},
			{
				name: 'on:cancel-click',
				to: 'oncancel',
				argument: { 'detail.nativeEvent.detail.nativeEvent': '', 'detail.nativeEvent': '' },
				type: 'MouseEvent | KeyboardEvent',
				note: 'Svelte 4 event directive of older app code.'
			}
		]
	},
	snippets: {
		renamed: [{ from: 'bodySnippet', to: 'children', note: 'Shown under the description.' }]
	},
	manual: [
		{
			id: 'alert-dialog-look',
			summary:
				'Aurora look: icon in a 40px tinted box, question in the display font, buttons in a row at the end, Cancel neutral (the red Cancel of some copies is gone).',
			action: 'Nothing to do unless the page relied on the old size: `--confirm-dialog-max-width` changes the width.'
		}
	]
} satisfies LocalMigration;
