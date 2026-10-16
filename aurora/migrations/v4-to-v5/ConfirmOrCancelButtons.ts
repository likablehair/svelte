import type { ComponentMigration } from '../types.js';

export default {
	from: 'ConfirmOrCancelButtons',
	to: 'ConfirmOrCancelButtons',
	props: {
		toCssVar: [
			{
				name: 'marginTop',
				cssVar: '--confirm-or-cancel-buttons-margin-top',
				note: 'No margin by default (v4: 20px), like every v5 component. `marginTop="x"` → `--confirm-or-cancel-buttons-margin-top="x"`; to keep the v4 space on every instance see `confirm-or-cancel-buttons-spacing`. Inside the `actionsSnippet` of a Dialog or a Drawer the margin is always 0.'
			}
		],
		defaults: [
			{
				name: 'cancelText',
				v4: "'Annulla'",
				v5: "'Cancel', 'Annulla' with the it locale",
				keepV4: 'locale="it"',
				note: 'The texts follow `locale`, else `setDefaultLocale`, else English. Italian apps call `setDefaultLocale("it")` in the root layout (step `global-default-locale`); `cancelText="Annulla"` also works.'
			},
			{
				name: 'confirmText',
				v4: "'Salva'",
				v5: "'Save', 'Salva' with the it locale",
				keepV4: 'locale="it"',
				note: 'See `cancelText`.'
			}
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
			id: 'confirm-or-cancel-buttons-spacing',
			summary:
				'v4 put 20px of space above the buttons (215 of 231 uses relied on it); v5 has none, like every component, so forms built without `gap` would lose the space before their buttons.',
			action:
				'Add once to the global app CSS: `:root { --confirm-or-cancel-buttons-default-margin-top: 20px; }` (inside `@layer global.base` is not needed: unlayered app CSS wins). New forms laid out with `gap` should not use it.',
			scope: 'app'
		},
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
		'`locale` (BCP 47): language of the default texts, Italian with `it`, English otherwise; without it the one of `setDefaultLocale` (step `global-default-locale`), else `en`. Text props win over it.',
		'`children`: content at the start of the row (e.g. "Unsaved changes").',
		'`direction`: `auto` (default, stacks under 480px), `row` (never stacks), `column` (always stacked, confirm on top at full width).',
		'`class` object: `container`, `content`, `actions`, `cancel`, `confirm`; native attributes on the root.',
		'`data-loading` attribute.',
		'`--confirm-or-cancel-buttons-gap`, `-actions-gap`, `-content-gap`, `-content-color`, `-content-font-size`.'
	]
} satisfies ComponentMigration;
