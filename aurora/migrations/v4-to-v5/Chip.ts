import type { ComponentMigration } from '../types.js';

const focusRing = '--chip-focus-ring-width, --chip-focus-ring-color, --chip-focus-ring-offset';
const defaultFocusRing =
	'--chip-default-focus-ring-width, --chip-default-focus-ring-color, --chip-default-focus-ring-offset';

export default {
	from: 'Chip',
	to: 'Chip',
	props: {
		renamed: [
			{
				from: 'close',
				to: 'closable',
				note: 'No longer bindable: `bind:close={x}` → `closable={x}` (v4 never wrote it back).'
			},
			{
				from: 'buttonTabIndex',
				to: 'tabindex',
				note: 'A number only: drop `buttonTabIndex={null}` (the v4 default). It reaches the chip button (present only with `onclick`) and the close button.'
			}
		],
		inverted: [
			{
				from: 'inactive',
				to: 'selected',
				note: '`inactive={x}` → `selected={!x}`; a bare `inactive` → drop it (unselected is the default). With `onclick` the chip becomes a toggle with `aria-pressed`; the selected look is the `filled` one, like the v4 active chip. A chip without `inactive` needs the manual step `chip-default-look`.'
			}
		],
		removed: [
			{
				name: 'truncateText',
				note: 'The text always ends with an ellipsis when the chip has no room. v4 cut it at `--chip-text-max-width` (default 200px) only with `truncateText`: for the same cap set `--chip-max-width`, which limits the whole chip (padding, icon and close button included). Pass `title` to show the full text on hover.',
				replacement: '--chip-max-width="200px"'
			}
		],
		defaults: [
			{
				name: 'closeIcon',
				v4: "'mdi-close-circle'",
				v5: 'mdiClose',
				keepV4: 'closeIcon={mdiCloseCircle}',
				note: 'Circled × → plain ×. `mdiCloseCircle` comes from `@mdi/js`.'
			}
		],
		icons: ['prependIcon', 'closeIcon']
	},
	events: {
		changed: [
			{
				name: 'onclick',
				argument: { 'detail.native': '' },
				type: 'MouseEvent',
				note: 'v4 used `detail.native`, not `detail.nativeEvent`. Enter and Space now click the native `<button>` (v4 dispatched a synthetic click from `keydown`).'
			},
			{
				name: 'onclose',
				argument: { 'detail.native': '' },
				type: 'MouseEvent',
				note: 'v4 used `detail.native`. The click is no longer stopped: see `chip-close-bubbles`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--chip-min-height',
				to: '--chip-height',
				note: 'The height is fixed now (v4 grew past the minimum with the content). If the chip also sets `--chip-height`, keep that one.'
			},
			{
				from: '--chip-background-color',
				to: '--chip-background',
				note: 'On a chip with `inactive` (a toggle) it styled the active state: map it to `--chip-selected-background` instead (`chip-toggle-colors`).'
			},
			{
				from: '--chip-hover-background-color',
				to: '--chip-hover-background',
				note: 'Hover styles apply only to chips with `onclick`.'
			},
			{
				from: '--chip-text-max-width',
				to: '--chip-max-width',
				note: 'Limits the whole chip, not only the text: add the padding and icons to the v4 value.'
			},
			{ from: '--chip-inactive-background-color', to: '--chip-background' },
			{ from: '--chip-inactive-color', to: '--chip-color' },
			{ from: '--chip-inactive-border-color', to: '--chip-border-color' },
			{ from: '--chip-inactive-hover-background-color', to: '--chip-hover-background' },
			{ from: '--chip-inactive-hover-color', to: '--chip-hover-color' },
			{
				from: '--icon-size',
				to: '--chip-icon-size',
				note: 'Only when set on a Chip. It sized the close icon as well: for that one use `--chip-close-icon-size`.'
			},
			{
				from: '--chip-default-min-height',
				to: '--chip-default-height',
				note: 'Fixed height of `size="md"`; `size="sm"` reads `--chip-default-sm-height`.'
			},
			{
				from: '--chip-default-text-max-width',
				to: '--chip-default-max-width',
				note: 'Limits the whole chip; the v5 default is `100%`.'
			},
			{ from: '--chip-default-inactive-background-color', to: '--chip-default-neutral-background' },
			{ from: '--chip-default-inactive-color', to: '--chip-default-neutral-color' },
			{
				from: '--chip-default-inactive-border-color',
				to: '--chip-default-neutral-border-color',
				note: 'v4 read it without defining it.'
			}
		],
		removed: [
			{
				name: '--chip-inactive-border',
				note: 'Split in two variables.',
				replacement: '--chip-border-width + --chip-border-color'
			},
			{
				name: '--chip-default-inactive-border',
				note: 'Split in two variables.',
				replacement: '--chip-default-border-width + --chip-default-neutral-border-color'
			},
			...[
				'--chip-focus-background-color',
				'--chip-inactive-focus-background-color',
				'--chip-inactive-focus-color',
				'--chip-inactive-focus-border-color',
				'--chip-inactive-focus-box-shadow'
			].map((name) => ({
				name,
				note: 'Keyboard focus is an outline ring now, not a color change.',
				replacement: focusRing
			})),
			...[
				'--chip-default-focus-background-color',
				'--chip-default-inactive-focus-background-color',
				'--chip-default-inactive-focus-color',
				'--chip-default-inactive-focus-box-shadow',
				'--chip-default-inactive-border-focus-color'
			].map((name) => ({
				name,
				note: 'Keyboard focus is an outline ring now, not a color change.',
				replacement: defaultFocusRing
			})),
			...['--chip-cursor', '--chip-default-cursor'].map((name) => ({
				name,
				note: 'Chips with `onclick` have the pointer cursor, the others the default one: drop it, or set `cursor` with app CSS through `class`.'
			})),
			...['--chip-line-height', '--chip-default-line-height'].map((name) => ({
				name,
				note: 'The chip is one line with a fixed height: drop it, and use `--chip-height` for the height.'
			})),
			...['--chip-default-background-color', '--chip-default-color'].map((name) => ({
				name,
				note: 'v4 default of the active look (filled primary). v5 colors come from `variant` (`--chip-default-{variant}-*`) and the selected state from `--chip-default-selected-*`, which follow `filled`: override the one that matches how the app uses chips.',
				replacement: name.endsWith('color')
					? '--chip-default-selected-color or --chip-default-{variant}-color'
					: '--chip-default-selected-background or --chip-default-{variant}-background'
			})),
			...[
				'--chip-default-hover-background-color',
				'--chip-default-inactive-hover-background-color',
				'--chip-default-inactive-hover-color'
			].map((name) => ({
				name,
				note: 'v5 hover keeps the colors, strengthens the border (`--chip-default-{variant}-hover-border-color`) and lifts the chip (`--chip-default-hover-transform`). For a hover color on one chip use `--chip-hover-background` / `--chip-hover-color`.'
			}))
		],
		changed: [
			{
				name: '--chip-color',
				note: 'v4 applied it only to active chips (without `inactive`); v5 applies it in every state, and on a selected chip `--chip-selected-color` wins over it. On chips without `inactive` nothing changes; on toggle chips see `chip-toggle-colors`.'
			}
		]
	},
	manual: [
		{
			id: 'chip-default-look',
			summary:
				'A chip without `inactive` was filled primary with light text in v4; the v5 default is neutral (surface background, body text, border).',
			action:
				'Choose a `variant` by meaning: `primary` (tinted primary), `success` / `warning` / `error` for statuses, `accent`, or `filled` for the strong v4-like look (primary gradient, light text). Chips colored entirely by their own CSS variables keep them through the renames. Toggle chips get the filled look from `selected`.'
		},
		{
			id: 'chip-toggle-colors',
			summary:
				'On a toggle chip v4 `--chip-background-color`, `--chip-color` and `--chip-hover-background-color` styled only the active state; v5 `--chip-background`, `--chip-color` and `--chip-hover-background` apply in every state. In the selected state `--chip-selected-*` win over the base variables, and the hover variables win over both.',
			action:
				'On chips with `inactive` (now `selected`), put the v4 active values in `--chip-selected-background`, `--chip-selected-color`, `--chip-selected-border-color`, and the v4 `--chip-inactive-*` values in `--chip-background`, `--chip-color`, `--chip-border-color`. v5 has one `--chip-hover-background` / `--chip-hover-color` for both states: where v4 set different hover colors for active and inactive chips, keep one, or drop both (the hover keeps the state colors and lifts the chip). On chips without `inactive` the renames are enough.',
			when: {
				cssVars: [
					'--chip-background-color',
					'--chip-color',
					'--chip-hover-background-color',
					'--chip-inactive-hover-background-color',
					'--chip-inactive-hover-color'
				]
			}
		},
		{
			id: 'chip-markup',
			summary:
				'The chip is an inline-flex `<span>` that holds a native `<button>` only with `onclick`, and the close button is a sibling of it; v4 was a block-level `<div role="button" class="chip">` (`display: flex`) with the close button inside, focusable only with `buttonTabIndex`.',
			action:
				'Chips in a block container no longer take the whole row: put them in a flex container, or set `display: flex` through `class` where they must stretch. A chip meant to be clickable needs `onclick` (it is focusable and has hover only then). Rewrite app CSS that targets `.chip`, `.chip.inactive`, `.text`, `.icon-after` or `[role="button"]` against `.aurora-chip`, `[data-selected]`, `.aurora-chip-text`, `.aurora-chip-close`.'
		},
		{
			id: 'chip-size',
			summary:
				'Fixed height 26px (`size="md"`) or 22px (`size="sm"`) with 12.5px / 12px text on one line; v4 was at least 1.8rem tall, inherited the font size and wrapped long text.',
			action:
				'Use `size="sm"` in dense lists and tables; `--chip-height` and `--chip-font-size` for other sizes. Long text is cut with an ellipsis: pass `title` where the full text must be readable.'
		},
		{
			id: 'chip-close-bubbles',
			summary: 'The close click is no longer stopped: it bubbles to the ancestors of the chip.',
			action:
				'If an ancestor handles clicks (a clickable row or card, a field that opens a menu), call `event.stopPropagation()` in `onclose`. The chip `onclick` is not affected: the close button sits outside the chip button.',
			when: { events: ['onclose'] }
		},
		{
			id: 'chip-close-button-vars',
			summary:
				'The close button is no longer a library Button: `--button-*` variables set on a Chip do not reach it.',
			action:
				'Use `--chip-close-size`, `--chip-close-color`, `--chip-close-hover-color`, `--chip-close-hover-background`, `--chip-close-border-radius`, `--chip-close-icon-size`, `--chip-close-margin-end`, `--chip-close-focus-ring-offset`.',
			when: {
				cssVars: [
					'--button-hover-background-color',
					'--button-hover-color',
					'--button-height',
					'--button-width',
					'--button-min-height',
					'--button-min-width',
					'--button-border-radius',
					'--button-focus-background-color',
					'--button-focus-color',
					'--button-active-color',
					'--button-font-size'
				]
			}
		}
	],
	added: [
		'`variant` (neutral | primary | accent | success | warning | error | filled) and `size` (sm | md).',
		'`closeLabel`: accessible name of the close button (default "Remove").',
		'`prependSnippet`, and `closeSnippet` with `{ close, closeLabel }`.',
		'`bind:chipElement`, `class` and native attributes on the root `<span>`.',
		'`data-variant`, `data-size`, `data-selected`, `data-disabled` attributes.',
		'`--chip-selected-*`, `--chip-close-*`, `--chip-focus-ring-*`, `--chip-border-width`, `--chip-hover-color`, `--chip-hover-border-color`, `--chip-hover-transform`, `--chip-max-width`.'
	]
} satisfies ComponentMigration;
