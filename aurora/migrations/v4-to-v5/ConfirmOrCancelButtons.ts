import type { ComponentMigration } from '../types.js';

export default {
	from: 'ConfirmOrCancelButtons',
	to: 'ConfirmOrCancelButtons',
	props: {
		removed: [
			{
				name: 'marginTop',
				note: 'No margin any more: the app layout decides the space. Replace `marginTop="x"` with a margin or `gap` in the parent, or `class={{ container: "..." }}` with an app class that sets `margin-top: x`. `marginTop="0px"` / `"0"` is simply dropped.'
			}
		],
		defaults: [
			{ name: 'cancelText', v4: "'Annulla'", v5: "'Cancel'", keepV4: 'cancelText="Annulla"' },
			{ name: 'confirmText', v4: "'Salva'", v5: "'Save'", keepV4: 'confirmText="Salva"' }
		]
	},
	events: {
		changed: [
			{ name: 'onconfirmClick', argument: { 'detail.nativeEvent': '' }, type: 'MouseEvent' },
			{
				name: 'oncancelClick',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent | KeyboardEvent'
			},
			{
				name: 'on:confirm-click',
				to: 'onconfirmClick',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent',
				note: 'Svelte 4 event directive of older app code.'
			},
			{
				name: 'on:cancel-click',
				to: 'oncancelClick',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent | KeyboardEvent',
				note: 'Svelte 4 event directive of older app code.'
			}
		]
	},
	snippets: {
		parameters: [
			{
				name: 'cancelButtonSnippet',
				v4: '{ loading, handleCancel, cancelText }',
				v5: '{ loading, handleCancel, cancelText, cancelDisable }',
				note: '`handleCancel(event)` still takes the native event and now does nothing while `cancelDisable`; disable the custom button with `cancelDisable`.'
			},
			{
				name: 'confirmButtonSnippet',
				v4: '{ loading, handleConfirm, confirmText, confirmDisable }',
				v5: '{ loading, handleConfirm, confirmText, confirmDisable }',
				note: '`handleConfirm` took Button\'s `{ detail: { nativeEvent } }` event; it takes the native `MouseEvent` now. `onclick={handleConfirm}` on a library Button keeps working; a call that wraps the event (`handleConfirm({ detail: { nativeEvent: e } })`) becomes `handleConfirm(e)`. It does nothing while `loading` or `confirmDisable`.'
			}
		]
	},
	manual: [
		{
			id: 'confirm-or-cancel-buttons-margin',
			summary: 'The 20px top margin that v4 added by default is gone.',
			action:
				'Where the buttons sit under form fields and relied on that space, add it in the layout: `gap` on the parent, a margin on a wrapper, or `class={{ container: "..." }}` with `margin-top: 20px` in app CSS.'
		},
		{
			id: 'confirm-or-cancel-buttons-layout',
			summary:
				'The buttons stack (confirm on top, full width) when their own container is narrower than 480px, not when the viewport is under 769px. The root is a size container, so it shrinks to zero width inside a flex row with automatic width.',
			action:
				'If the component is a child of a `display: flex` row (a footer, a toolbar), give it a width: `class={{ container: "..." }}` with `flex: 1` or `width: 100%`, or wrap it in a block element. Check narrow drawers and dialogs on desktop, where the buttons now stack.'
		},
		{
			id: 'confirm-or-cancel-buttons-cancel-button',
			summary:
				'Cancel is a text Button (primary text color, focus ring, disabled look with `cancelDisable`) instead of an unstyled `<button>` that inherited the text color.',
			action:
				'App CSS that targeted the v4 internals (`.text-button`, `.link-button-container`, `.button-container`) no longer applies: use `class={{ cancel, confirm, actions, container }}` or `--button-*` on those classes.',
			scope: 'app'
		},
		{
			id: 'confirm-or-cancel-buttons-loading',
			summary:
				'While `loading` the confirm button is disabled and `onconfirmClick` is not called (v4 kept it clickable and called it).',
			action: 'Check flows that expected a second click on the confirm button while loading.',
			when: { props: ['loading'] }
		}
	],
	added: [
		'`confirmIcon`, `cancelIcon` (SVG paths), `confirmVariant` (Button `variant`, e.g. `danger`).',
		'`confirmType="submit"` submits the surrounding form, with its validation.',
		'`children`: content at the start of the row (e.g. "Unsaved changes").',
		'`class` object: `container`, `content`, `actions`, `cancel`, `confirm`; native attributes on the root.',
		'`data-loading` attribute.',
		'`--confirm-or-cancel-buttons-gap`, `-actions-gap`, `-content-gap`, `-content-color`, `-content-font-size`.'
	]
} satisfies ComponentMigration;
