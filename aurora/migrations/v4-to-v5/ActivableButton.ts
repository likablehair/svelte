import type { ComponentMigration } from '../types.js';

export default {
	from: 'ActivableButton',
	to: 'ActivableButton',
	props: {
		removed: [
			{
				name: 'buttonProps',
				note: 'Spread its keys as direct props on ActivableButton: `buttonProps={{ disabled, loading: saving }}` → `disabled loading={saving}`. Drop `variant` and `buttonType` (not accepted: the look is fixed), and apply the Button rules to the rest (`icon` takes an SVG path, ...). An `onclick` inside `buttonProps` replaced the toggle in v4 (`active` never flipped): move it to the `onclick` prop and check that flipping `active` is wanted.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclick',
				argument: { 'detail.nativeEvent': '' },
				type: 'MouseEvent',
				note: 'As in v4, `active` is already flipped when `onclick` runs.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--activable-button-deactive-background-color', to: '--activable-button-background' },
			{ from: '--activable-button-deactive-color', to: '--activable-button-color' },
			{
				from: '--activable-button-active-background-color',
				to: '--activable-button-active-background'
			},
			{
				from: '--activable-button-hover-deactive-background-color',
				to: '--activable-button-hover-background'
			},
			{
				from: '--activable-button-hover-active-background-color',
				to: '--activable-button-active-hover-background'
			},
			{
				from: '--activable-button-hover-active-color',
				to: '--activable-button-active-hover-color'
			}
		],
		removed: [
			...[
				'--activable-button-active-active-background-color',
				'--activable-button-active-deactive-background-color',
				'--activable-button-active-active-color'
			].map((name) => ({
				name,
				note: 'The pressed state while clicking comes from Button (a transform). Drop the override.',
				replacement: '--button-active-transform'
			})),
			...[
				'--activable-button-focus-active-background-color',
				'--activable-button-focus-deactive-background-color',
				'--activable-button-focus-active-color'
			].map((name) => ({
				name,
				note: 'Focus is a ring from Button now, not a color change. Drop the override.',
				replacement: '--button-focus-ring-color'
			}))
		]
	},
	manual: [
		{
			id: 'activable-button-look',
			summary:
				'Off it is a neutral surface with a border, on a primary tint with primary text and border (v4: a transparent uppercase text button, filled primary when on). `--button-*` color variables passed to it are ignored.',
			action:
				'Replace `--button-*` color overrides on ActivableButton with `--activable-button-*` (`-background`, `-color`, `-border-color`, `-hover-*`, `-active-*`, `-active-hover-*`); layout ones (`--button-padding`, `--button-height`, ...) still work. For the v4 filled look set `--activable-button-active-background="var(--global-color-primary)"`, `--activable-button-active-color="var(--global-color-on-primary)"` and `--activable-button-active-border-color="transparent"`.'
		},
		{
			id: 'activable-button-dot',
			summary:
				'A button with text and no `icon` shows a state dot before the text; icon-only buttons take `icon` instead of an `<Icon>` child.',
			action:
				'Where the children are only `<Icon name="mdi-...">`, remove the child, pass `icon={mdi...}` (SVG path) and an `aria-label`, which gives a square icon-only button: otherwise the dot shows next to the icon and the button has no accessible name. Pass `dot={false}` where a text button should not show the dot.'
		},
		{
			id: 'activable-button-append-snippet',
			summary:
				'`appendSnippet` sits after the text in the flow (Button rule) instead of absolutely positioned over it.',
			action: 'Remove app CSS that made room for the absolutely positioned content.',
			when: { snippets: ['appendSnippet'] }
		}
	],
	added: [
		'Every Button prop directly on the component (`icon`, `size`, `loading`, `disabled`, `type`, `href`, native attributes, ...).',
		'`aria-pressed` and `data-active` follow `active`.',
		'`dot`, `dotSnippet({ active })`.',
		'`--activable-button-border-color`, `-hover-color`, `-hover-border-color`, `-active-border-color`, `-active-hover-border-color`, `--activable-button-dot-size`, `-dot-color`, `-active-dot-color`, `-active-dot-box-shadow`.'
	]
} satisfies ComponentMigration;
