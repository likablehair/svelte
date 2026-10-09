import type { ComponentMigration } from '../types.js';

export default {
	from: 'Button',
	to: 'Button',
	props: {
		icons: ['icon'],
		types: [
			{ name: 'type', v4: "'button' | 'submit'", v5: "'button' | 'submit' | 'reset'" },
			{
				name: 'buttonElement',
				v4: 'HTMLElement',
				v5: 'HTMLButtonElement | HTMLAnchorElement',
				note: 'An `<a>` with `href`, a `<button>` otherwise.'
			}
		]
	},
	events: {
		changed: [
			{ name: 'onclick', argument: { 'detail.nativeEvent': '' }, type: 'MouseEvent' },
			{ name: 'onkeydown', argument: { 'detail.nativeEvent': '' }, type: 'KeyboardEvent' },
			{ name: 'onkeypress', argument: { 'detail.nativeEvent': '' }, type: 'KeyboardEvent' }
		]
	},
	cssVars: {
		renamed: [
			{ from: '--button-background-color', to: '--button-background' },
			{ from: '--button-hover-background-color', to: '--button-hover-background' },
			{ from: '--button-default-background-color', to: '--button-default-primary-background' },
			{ from: '--button-default-color', to: '--button-default-primary-color' },
			{
				from: '--button-default-hover-background-color',
				to: '--button-default-primary-hover-background'
			},
			{
				from: '--button-default-text-hover-background-color',
				to: '--button-default-primary-text-hover-background'
			},
			{ from: '--button-default-box-shadow', to: '--button-default-primary-box-shadow' },
			{ from: '--button-default-hover-box-shadow', to: '--button-default-primary-hover-box-shadow' },
			{ from: '--button-default-text-color', to: '--button-default-primary-text-color' },
			{ from: '--icon-size', to: '--button-icon-size', note: 'Only when set on a Button.' }
		],
		removed: [
			{
				name: '--button-border',
				note: 'Split in two variables.',
				replacement: '--button-border-width + --button-border-color'
			},
			{
				name: '--button-default-border',
				note: 'Split in two variables.',
				replacement: '--button-default-border-width + --button-default-primary-border-color'
			},
			{
				name: '--button-focus-background-color',
				note: 'Focus is a ring now, not a background change.',
				replacement: '--button-focus-ring-color'
			},
			{
				name: '--button-focus-color',
				note: 'Focus is a ring now, not a color change.',
				replacement: '--button-focus-ring-color'
			},
			{
				name: '--button-focus-box-shadow',
				note: 'Focus is an outline ring now.',
				replacement: '--button-focus-ring-width, --button-focus-ring-color, --button-focus-ring-offset'
			},
			{
				name: '--button-active-background-color',
				note: 'The pressed state is a transform now.',
				replacement: '--button-active-transform'
			},
			{
				name: '--button-active-color',
				note: 'The pressed state is a transform now.',
				replacement: '--button-active-transform'
			},
			{
				name: '--button-active-box-shadow',
				note: 'The pressed state is a transform now.',
				replacement: '--button-active-transform'
			},
			{
				name: '--button-disabled-background-color',
				note: 'Disabled buttons keep their colors and fade.',
				replacement: '--button-disabled-opacity, --button-disabled-filter'
			},
			{
				name: '--button-disabled-color',
				note: 'Disabled buttons keep their colors and fade.',
				replacement: '--button-disabled-opacity, --button-disabled-filter'
			},
			...[
				'--button-max-height',
				'--button-min-height',
				'--button-box-sizing',
				'--button-text-align',
				'--button-cursor',
				'--button-display',
				'--button-justify-content',
				'--button-align-items'
			].map((name) => ({
				name,
				note: 'Removed: the height is fixed per `size` (border-box) and the layout is not configurable. Use `class` with app CSS if really needed.'
			})),
			...[
				'--button-default-focus-background-color',
				'--button-default-focus-color',
				'--button-default-focus-box-shadow',
				'--button-default-active-background-color',
				'--button-default-active-color',
				'--button-default-active-box-shadow',
				'--button-default-disabled-background-color',
				'--button-default-disabled-color',
				'--button-default-icon-color',
				'--button-default-icon-active-color',
				'--button-default-icon-focus-color',
				'--button-default-icon-border-radius',
				'--button-default-text-background-color',
				'--button-default-text-active-background-color',
				'--button-default-text-active-color',
				'--button-default-text-focus-background-color',
				'--button-default-text-focus-color',
				'--button-default-text-hover-color',
				'--button-default-text-font-weight',
				'--button-default-hover-color',
				'--button-default-max-height',
				'--button-default-min-height',
				'--button-default-max-width',
				'--button-default-min-width',
				'--button-default-box-sizing',
				'--button-default-text-align',
				'--button-default-cursor',
				'--button-default-display',
				'--button-default-justify-content',
				'--button-default-align-items'
			].map((name) => ({
				name,
				note: 'v4 default with no v5 counterpart. Defaults are per variant and size now (`--button-default-{variant}-*`, `--button-default-{size}-*`): pick the matching one, or drop the override.'
			}))
		]
	},
	manual: [
		{
			id: 'button-loading',
			summary:
				'`loading` disables the button and swaps only the icon for a 16px spinner; v4 replaced the whole content with a 30px loader and stayed clickable.',
			action:
				'Check that the button does not need to stay clickable while loading. `--circular-loader-*` on a Button no longer applies: use `--button-icon-size`, `--button-spinner-border-width` or `loadingSnippet`.',
			when: { props: ['loading'] }
		},
		{
			id: 'button-disabled',
			summary:
				'`disabled` now reaches the native `<button>`: it is not focusable, fires no callbacks and does not submit forms.',
			action:
				'v4 ignored `disabled` on the element. Check flows that relied on clicking or focusing a disabled button (for example to show a validation message).',
			when: { props: ['disabled'] }
		},
		{
			id: 'button-text-shape',
			summary:
				'`buttonType="text"` is no longer uppercase and takes its color from `variant` (primary by default).',
			action:
				'Add `variant="secondary"` where a text button should use the body text color; add `text-transform: uppercase` in app CSS where uppercase was wanted.',
			when: { props: ['buttonType'] }
		},
		{
			id: 'button-icon-shape',
			summary:
				'`buttonType="icon"` is a rounded square in the `variant` colors instead of a transparent circle.',
			action:
				'For the v4 look use `variant="secondary"` and `--button-border-radius="9999px"`; a clickable icon that should look like plain text is `buttonType="text"` with `icon`.',
			when: { props: ['buttonType'] }
		},
		{
			id: 'button-append-snippet',
			summary:
				'`appendSnippet` sits after the text in the flow (pushed to the end) instead of absolutely positioned over it.',
			action: 'Remove app CSS that made room for the absolutely positioned content.',
			when: { snippets: ['appendSnippet'] }
		},
		{
			id: 'button-fixed-height',
			summary:
				'Height is fixed by `size` (28/34/40px, border-box) and the label does not wrap.',
			action:
				'Buttons with multi-line labels or a custom `--button-height` measured without the border need a check; use `size` or `--button-height`.'
		}
	],
	added: [
		'`variant` (primary | secondary | danger | gradient) and `size` (sm | md | lg).',
		'`href` renders an `<a>` with the same look, with `target`, `rel`, `download`.',
		'`appendIcon`, `iconSnippet`, `loadingSnippet`.',
		'`data-variant`, `data-size`, `data-shape`, `data-loading` attributes.'
	]
} satisfies ComponentMigration;
