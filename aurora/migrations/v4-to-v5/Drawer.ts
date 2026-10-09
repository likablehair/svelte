import type { ComponentMigration } from '../types.js';

export default {
	from: 'Drawer',
	to: 'Drawer',
	props: {
		inverted: [
			{
				from: 'closeOnClickOutside',
				to: 'persistent',
				note: '`persistent` also blocks Escape (v4 closed on Escape anyway). The v4 default `true` is the v5 default: drop `closeOnClickOutside` and `closeOnClickOutside={true}`; `closeOnClickOutside={false}` → `persistent`.'
			}
		],
		removed: [
			{
				name: 'overlay',
				note: 'The drawer is always modal with a backdrop (v4 forced `overlay` to `true` at every opening anyway). Remove the prop and any `bind:overlay`. For an invisible backdrop: `--drawer-backdrop-background="transparent" --drawer-backdrop-filter="none"`.'
			},
			{
				name: 'items',
				note: 'No fallback navigation any more: render the list in `children` (app markup, or `<Navigator {items} vertical {onitemClick} />` once Navigator is ported).',
				replacement: 'children'
			},
			{
				name: 'teleportedUid',
				note: 'It only served the teleport, which is gone (the drawer stays where it is written): remove it.'
			},
			{
				name: '_overlayOpacity',
				note: 'Fold the opacity into the backdrop color: `_overlayBackgroundColor="#262626" _overlayOpacity="50%"` → `--drawer-backdrop-background="rgb(38 38 38 / 50%)"`.',
				replacement: '--drawer-backdrop-background'
			},
			{
				name: '_overlaySpeed',
				note: 'The backdrop fades with the panel: one duration for both.',
				replacement: '--drawer-duration'
			}
		],
		toCssVar: [
			{
				name: '_space',
				cssVar: '--drawer-size',
				note: 'Width for `left` / `right`, height for `top` / `bottom`; default 20rem as before, capped by `--drawer-max-size` (100%).'
			},
			{
				name: '_openingSpeed',
				cssVar: '--drawer-duration',
				note: 'A CSS time; the easing is `--drawer-easing`.'
			},
			{ name: '_backgroundColor', cssVar: '--drawer-background' },
			{ name: '_color', cssVar: '--drawer-color' },
			{
				name: '_overflow',
				cssVar: '--drawer-overflow',
				note: 'It now applies to the scrolling body, not to the whole panel.'
			},
			{ name: '_borderRadius', cssVar: '--drawer-border-radius' },
			{ name: '_margin', cssVar: '--drawer-margin' },
			{
				name: '_overlayBackgroundColor',
				cssVar: '--drawer-backdrop-background',
				note: 'The variable takes the final translucent color: combine it with `_overlayOpacity` (v4 default 50%). v4 default look: `rgb(38 38 38 / 50%)`; the v5 default is `--global-color-overlay` with an 8px blur (`--drawer-backdrop-filter`).'
			}
		],
		types: [
			{
				name: 'position',
				v4: "'left' | 'top' | 'right' | 'bottom' (bindable)",
				v5: "'left' | 'right' | 'top' | 'bottom'",
				note: 'No longer bindable: replace `bind:position={x}` with `position={x}` (the drawer never changed it).'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclose',
				argument: {},
				type: 'Event',
				note: 'v4 called it with no argument, on Escape and on the overlay only. v5 passes the event that closed the drawer (`KeyboardEvent`, `MouseEvent`, `SubmitEvent`) and also calls it for the close button, `close` from snippets and `<form method="dialog">`. As before, it is not called when the app sets `open` to false.'
			}
		],
		removed: [
			{
				name: 'onitemClick',
				note: 'It went with `items`: handle clicks in the navigation rendered in `children`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--drawer-space', to: '--drawer-size' },
			{ from: '--drawer-opening-speed', to: '--drawer-duration' },
			{
				from: '--drawer-background-color',
				to: '--drawer-background',
				note: 'v4 declared it on `:root` as the global default: an app override on `:root` (or a theme) becomes `--drawer-default-background`.'
			},
			{ from: '--drawer-overlay-background-color', to: '--drawer-backdrop-background' },
			{ from: '--drawer-default-space', to: '--drawer-default-size' },
			{ from: '--drawer-default-opening-speed', to: '--drawer-default-duration' },
			{
				from: '--drawer-default-background-color',
				to: '--drawer-default-background',
				note: 'v4 read it but never declared it.'
			},
			{
				from: '--drawer-default-overlay-background-color',
				to: '--drawer-default-backdrop-background'
			}
		],
		removed: [
			{
				name: '--drawer-overlay-opacity',
				note: 'Put the opacity in the backdrop color.',
				replacement: '--drawer-backdrop-background'
			},
			{
				name: '--drawer-default-overlay-opacity',
				note: 'Put the opacity in the backdrop color.',
				replacement: '--drawer-default-backdrop-background'
			},
			{
				name: '--drawer-overlay-speed',
				note: 'The backdrop fades with the panel.',
				replacement: '--drawer-duration'
			},
			{
				name: '--drawer-default-overlay-speed',
				note: 'The backdrop fades with the panel.',
				replacement: '--drawer-default-duration'
			},
			{
				name: '--drawer-z-index',
				note: 'The drawer is on the top layer and needs no z-index: remove the variable and any z-index logic around drawers.'
			},
			{
				name: '--drawer-default-z-index',
				note: 'The drawer is on the top layer and needs no z-index.'
			}
		],
		changed: ['--drawer-overflow', '--drawer-default-overflow'].map((name) => ({
			name,
			note: 'It now applies to the scrolling body between header and footer, not to the whole panel.'
		}))
	},
	manual: [
		{
			id: 'drawer-panel',
			summary:
				'`children` sits in a scrolling body inside a panel with padding (18px 12px), an inner border and a shadow; v4 put it straight in the bare panel.',
			action:
				'Where the app styled its own panel inside the drawer, remove the duplicate styles or pass `--drawer-padding="0" --drawer-border-width="0" --drawer-box-shadow="none"`. App headers with a title and a close button can become `title` and `closable`, app footers `actionsSnippet` (pinned at the bottom while the body scrolls).',
			when: { snippets: ['children'] }
		},
		{
			id: 'drawer-modal',
			summary:
				'The drawer is a modal `<dialog>`: the page behind is inert and does not scroll, focus moves inside and returns to the opener; v4 left the page focusable and scrollable.',
			action:
				'Check flows that kept using the page while a drawer was open (keyboard shortcuts, scrolling, opening a second drawer from the page). Pass `title` or `aria-label`: the drawer needs an accessible name. Remove app code that focused the content after opening.'
		},
		{
			id: 'drawer-content-lifecycle',
			summary:
				'The content mounts at every opening and unmounts after closing; v4 mounted it once and kept it in the DOM, off screen.',
			action:
				'In the content, look for `onMount` / `$effect` that load data or register listeners (they now run at every opening), `bind:this` refs read while the drawer is closed (now `undefined`), and state that must survive closing (move it to the parent). App tests that queried the hidden content must open the drawer first.',
			when: { snippets: ['children'] }
		}
	],
	added: [
		'`title` / `titleSnippet` (also the accessible name), `closable` with `closeLabel` / `closeSnippet`, `actionsSnippet` as a footer pinned at the bottom.',
		'`children` and every snippet receive `{ close }`; a `<form method="dialog">` inside closes it.',
		'`bind:drawerElement`, `class` object (`drawer`, `backdrop`, `panel`, `header`, `title`, `body`, `actions`), native attributes on the `<dialog>`, `data-position` and `data-closing`.',
		'New `--drawer-*` variables: `--drawer-max-size`, `--drawer-padding`, `--drawer-border-width`, `--drawer-border-color`, `--drawer-box-shadow`, `--drawer-backdrop-filter`, `--drawer-easing`, header, title, body and actions.'
	]
} satisfies ComponentMigration;
