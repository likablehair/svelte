import type { ComponentMigration } from '../types.js';

export default {
	from: 'LinkButton',
	to: 'LinkButton',
	props: {
		icons: ['prependIcon', 'appendIcon']
	},
	events: {
		changed: [
			{ name: 'onclick', argument: { 'detail.nativeEvent': '' }, type: 'MouseEvent' },
			{
				name: 'onkeypress',
				argument: { 'detail.nativeEvent': '' },
				type: 'KeyboardEvent',
				note: 'Native `keypress` is deprecated: prefer `onkeydown` when touching the handler.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--link-button-background-color', to: '--link-button-background' },
			{ from: '--link-button-hover-background-color', to: '--link-button-hover-background' },
			{ from: '--link-button-default-background-color', to: '--link-button-default-background' },
			{
				from: '--link-button-default-hover-background-color',
				to: '--link-button-default-hover-background'
			}
		],
		removed: [
			...['--link-button-width', '--link-button-height'].map((name) => ({
				name,
				note: 'The link is inline and sized by its text. For a sized, button-like link use `<Button href="..." variant="secondary">` with `--button-width` / `--button-height`.'
			})),
			...['--link-button-default-width', '--link-button-default-height'].map((name) => ({
				name,
				note: 'v4 default with no v5 counterpart: the link is sized by its text. Drop the override.'
			}))
		]
	},
	manual: [
		{
			id: 'link-button-look',
			summary:
				'v4 drew a grey pill (a link that looks like a button); v5 is a text link with an animated gradient underline and no background.',
			action:
				'Where the pill look is wanted, replace `<LinkButton href={x}>` with `<Button href={x} variant="secondary">` (same `target`; `prependIcon` → `icon`, `appendIcon` stays). The `--link-button-*` variables (`-padding`, `-border-radius`, `-font-size`, `-gap`, ...) still apply, but their defaults changed (padding 0, transparent background, inherited font size): check usages that set only some of them.'
		},
		{
			id: 'link-button-layout',
			summary:
				'It is `inline-flex` (v4: `display: flex`, a block-level box on its own line, content centered).',
			action:
				'Where the link relied on taking its own line or on centering inside a flex column, wrap it in a block element or set the layout in app CSS.'
		},
		{
			id: 'link-button-disabled',
			summary:
				'`disabled` removes the `href`, sets `aria-disabled` and stops calling `onclick`: the link no longer navigates and is not focusable (v4 only skipped the callbacks and still navigated).',
			action: 'Check flows that relied on a disabled link still navigating.',
			when: { props: ['disabled'] }
		}
	],
	added: [
		'Every native `<a>` attribute and event is forwarded (`download`, `hreflang`, `aria-*`, `onkeydown`, ...).',
		'`rel` (defaults to `noopener noreferrer` with `target="_blank"`; v4 set `noreferrer`).',
		'`bind:linkElement`.',
		'`data-disabled` attribute.',
		'`--link-button-hover-color`, `--link-button-underline-*`, `--link-button-icon-size`, `--link-button-icon-shift`, `--link-button-duration`, `--link-button-focus-ring-*`, `--link-button-disabled-opacity`.'
	]
} satisfies ComponentMigration;
