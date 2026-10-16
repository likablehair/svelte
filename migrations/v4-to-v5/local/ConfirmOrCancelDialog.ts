import type { LocalMigration } from '../../types.js';

export default {
	from: 'ConfirmOrCancelDialog',
	to: 'ConfirmDialog',
	files: ['ConfirmOrCancelDialog.svelte'],
	summary: 'The local `ConfirmOrCancelDialog` copy becomes `ConfirmDialog` of the library.',
	props: {
		renamed: [
			{ from: 'confirm', to: 'onconfirm', note: 'Called on confirm; a returned Promise shows the spinner until it settles.' },
			{
				from: 'cancel',
				to: 'oncancel',
				note: 'Called on every way of closing without confirming (Cancel, close button, Escape, backdrop); the copies called it only from Cancel.'
			},
			{ from: 'disableConfirm', to: 'confirmDisable' },
			{ from: 'confirmLabel', to: 'confirmText' },
			{ from: 'cancelLabel', to: 'cancelText' },
			{
				from: 'confirmButtonStyle',
				to: 'variant',
				note: '`danger` stays red; any other style becomes `primary`, whose button says "Conferma" unless `confirmText` is set.'
			},
			{
				from: 'confirmStyle',
				to: 'variant',
				note: '`danger` stays red; any other style becomes `primary`, whose button says "Conferma" unless `confirmText` is set.'
			}
		],
		values: [
			{
				name: 'variant',
				values: { danger: 'danger', error: 'danger', primary: 'primary', secondary: 'primary', static: 'primary', default: 'primary' }
			}
		],
		bind: [
			{
				name: 'open',
				note: 'With `open={x}` the app did not learn that Escape or the backdrop closed the dialog, so it could not open again.'
			}
		],
		toCssVar: [{ name: 'maxWidth', cssVar: '--confirm-dialog-max-width' }],
		removed: [
			{ name: 'minWidth', note: 'It had no visible effect.', drop: true },
			{ name: 'hideHeader', note: 'It had no visible effect.', drop: true },
			{
				name: 'cancelButtonStyle',
				note: 'The Cancel button is always neutral: remove `cancelButtonStyle="secondary"`; for another look use `actionsSnippet({ confirm, cancel, loading })`.'
			}
		],
		defaults: [
			{
				name: 'closeOnConfirm',
				v4: 'false (the app closed it)',
				v5: 'true',
				keepV4: 'closeOnConfirm={false}',
				behaviour: true,
				note: 'The copies never closed on confirm, the app set `open = false`. Remove it, with the manual `loading` and `open = false`, to let ConfirmDialog close by itself after `onconfirm`.'
			},
			{
				name: 'title',
				v4: "'Sei sicuro?'",
				v5: 'required',
				keepV4: 'title="Sei sicuro?"',
				behaviour: true,
				note: 'Better: a question that names the thing, such as "Eliminare Mario Rossi?".'
			}
		]
	},
	snippets: {
		removed: [
			{
				name: 'buttonSnippet',
				note: 'Use `actionsSnippet({ confirm, cancel, loading })`: `confirm()` and `cancel()` run the same logic as the default buttons.'
			}
		]
	},
	manual: [
		{
			id: 'confirm-or-cancel-dialog-cancel',
			kind: 'review',
			summary: '`oncancel` now runs on Escape, the close button and the backdrop too, not only on Cancel.',
			action: 'Check cancel handlers that do more than closing (cleanup, refusing a pending request): they now run in those cases too. A handler that only sets `open = false` can be removed when `open` is bound.',
			when: { props: ['cancel'] }
		},
		{
			id: 'confirm-or-cancel-dialog-children',
			kind: 'review',
			summary: 'Content passed as children is shown under the description; in the copies it replaced it.',
			action: 'Remove `description` where children are passed and the description was not visible.'
		}
	]
} satisfies LocalMigration;
