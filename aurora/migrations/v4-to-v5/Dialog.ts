import type { ComponentMigration } from '../types.js';

export default {
	from: 'Dialog',
	to: 'Dialog',
	props: {
		removed: [
			{
				name: 'transition',
				note: "The entrance is set with CSS variables on the surface; exit plays the same movement backwards. `'fly-up'` (v4 default): `--dialog-transition-y=\"20px\" --dialog-transition-scale=\"1\"`; `'fly-down'`: `--dialog-transition-y=\"-20px\" --dialog-transition-scale=\"1\"`; `'scale'`: `--dialog-transition-y=\"0px\" --dialog-transition-scale=\"0.7\"`; `'fade'`: `--dialog-transition-y=\"0px\" --dialog-transition-scale=\"1\"`; `'fly-horizontal'`: `--dialog-transition-x=\"-20px\" --dialog-transition-y=\"0px\" --dialog-transition-scale=\"1\"` (it now leaves from the side it came from). Without the prop the v5 default is a 16px rise with a 0.96 scale, close to `'fly-up'`.",
				replacement: '--dialog-transition-x, --dialog-transition-y, --dialog-transition-scale'
			},
			{
				name: '_overlayOpacity',
				note: 'Fold the opacity into the backdrop color: `_overlayColor="#282828" _overlayOpacity="30%"` → `--dialog-backdrop-background="rgb(40 40 40 / 30%)"` (or `color-mix(in oklab, <color> 30%, transparent)`).',
				replacement: '--dialog-backdrop-background'
			}
		],
		toCssVar: [
			{
				name: '_overlayColor',
				cssVar: '--dialog-backdrop-background',
				note: 'The variable takes the final translucent color: combine it with `_overlayOpacity` (v4 default 30%). v4 default look: `rgb(40 40 40 / 30%)`; the v5 default is `--global-color-overlay`.'
			},
			{
				name: '_overlayBackdropFilter',
				cssVar: '--dialog-backdrop-filter',
				note: 'The v5 default blurs 8px: pass `none` where the v4 dialog had no filter and the blur is unwanted.'
			},
			{
				name: '_transitionTimingFunction',
				cssVar: '--dialog-easing',
				note: 'Used by both the entrance and the exit.'
			},
			{
				name: '_transitionDuration',
				cssVar: '--dialog-duration',
				note: 'A CSS time (`0.5s`, `500ms`). v4 default 0.5s, v5 default 0.4s (`--global-duration-slow`).'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--dialog-transition-duration',
				to: '--dialog-duration',
				note: 'v4 overwrote it inline from `_transitionDuration`; the app value now applies.'
			},
			{
				from: '--dialog-transition-timing-function',
				to: '--dialog-easing',
				note: 'v4 overwrote it inline from `_transitionTimingFunction`; the app value now applies.'
			}
		],
		removed: [
			{
				name: '--dialog-overlay-opacity',
				note: 'Put the opacity in the backdrop color.',
				replacement: '--dialog-backdrop-background'
			},
			{
				name: '--dialog-z-index',
				note: 'The dialog is on the top layer and needs no z-index: remove the variable and any z-index logic around dialogs.'
			}
		]
	},
	manual: [
		{
			id: 'dialog-surface',
			summary:
				'`children` sits inside a styled surface (background, border, radius, shadow, 20px padding, max width 440px) over a blurred backdrop; v4 rendered it bare, centered on a flat overlay.',
			action:
				'Where the app drew its own card in `children`, remove the card styles or pass `--dialog-padding="0" --dialog-background="transparent" --dialog-border-width="0" --dialog-box-shadow="none" --dialog-width="auto" --dialog-max-width="none"`. Content wider than 440px needs `--dialog-max-width`. App headers with a title and a close button can become `title` and `closable`, app footers `actionsSnippet`.',
			when: { snippets: ['children'] }
		},
		{
			id: 'dialog-persistent-escape',
			summary:
				'`persistent` now also blocks Escape; v4 closed every open dialog on Escape, persistent or not.',
			action:
				'Make sure every persistent dialog has a visible way to close: `closable`, a button that sets `open = false` or calls `close` from a snippet, or a `<form method="dialog">`.',
			when: { props: ['persistent'] }
		},
		{
			id: 'dialog-content-lifecycle',
			summary:
				'The content mounts at every opening and unmounts after closing; v4 mounted it once and kept it, hidden, in the DOM.',
			action:
				'In the content, look for `onMount` / `$effect` that load data or register listeners (they now run at every opening), `bind:this` refs read while the dialog is closed (now `undefined`), and form values that must survive closing (move them to the parent). App tests that queried the hidden content must open the dialog first.',
			when: { snippets: ['children'] }
		},
		{
			id: 'dialog-accessible-name',
			summary:
				'The dialog is a real `<dialog>` with `role="dialog"` and focus management; it needs an accessible name (v4 had no ARIA).',
			action:
				'Pass `title` (shown in the header and used as the name) or `aria-label` / `aria-labelledby` when the content has its own heading. Remove app code that focused the first field after opening (often with `setTimeout`): the first focusable element, or the one with `autofocus`, gets the focus, and the focus goes back to the opener on close.'
		},
		{
			id: 'dialog-side-snippets',
			summary:
				'`topRightSnippet` sits 16px from the top right corner and `centerLeftSnippet` / `centerRightSnippet` are centered vertically 16px from the screen edges (`--dialog-inset`); v4 put the top right content at the very corner.',
			action:
				'Remove app margins or positioning that compensated the v4 placement, or set `--dialog-inset`. Each snippet receives `{ close }`: a close button in it can call `close` (which also calls `onclose`).',
			when: { snippets: ['topRightSnippet', 'centerLeftSnippet', 'centerRightSnippet'] }
		}
	],
	added: [
		'`title` / `titleSnippet` (also the accessible name), `closable` with `closeLabel` / `closeSnippet`, `actionsSnippet` as footer.',
		'`onclose(event)` when the dialog closes itself (Escape, backdrop, close button, `close`, `<form method="dialog">`).',
		'Every snippet receives `{ close }`.',
		'A `<form method="dialog">` inside closes it after a valid submit.',
		'`bind:dialogElement`, `class` object (`dialog`, `backdrop`, `surface`, `header`, `title`, `body`, `actions`), native attributes on the `<dialog>`, `data-closing` while closing.',
		'About 37 `--dialog-*` variables (surface, header, title, body, actions, backdrop, transition).'
	]
} satisfies ComponentMigration;
