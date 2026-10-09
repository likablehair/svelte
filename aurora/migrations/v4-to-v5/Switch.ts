import type { ComponentMigration } from '../types.js';

const disabled = [
	'disabled-inactive-box-shadow',
	'disabled-inactive-background-color',
	'disabled-inactive-handle-color',
	'disabled-active-box-shadow',
	'disabled-active-background-color',
	'disabled-active-handle-color'
];

const disabledNote = 'Disabled switches keep their colors and fade, text included.';

export default {
	from: 'Switch',
	to: 'Switch',
	props: {
		renamed: [
			{
				from: 'value',
				to: 'checked',
				note: '`bind:value` → `bind:checked`. `value` is now the native form value: a leftover `value={true}` only sets the attribute.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { 'detail.nativeEvent': '', 'detail.value': 'currentTarget.checked' },
				type: 'Event & { currentTarget: EventTarget & HTMLInputElement }',
				note: 'Read `currentTarget` before any `await` (it is null once the handler returns); `bind:checked` is often simpler.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--switch-inactive-background-color', to: '--switch-background' },
			{
				from: '--switch-default-inactive-background-color',
				to: '--switch-default-background'
			},
			{
				from: '--switch-inactive-box-shadow',
				to: '--switch-box-shadow',
				note: 'v4 drew the track outline with an inset shadow (`inset 0 0 0 2px ...`); v5 has a real border: move that color to `--switch-border-color` (and `--switch-border-width`) and keep only real shadows here.'
			},
			{
				from: '--switch-default-inactive-box-shadow',
				to: '--switch-default-box-shadow',
				note: 'The outline is `--switch-default-border-color` now.'
			},
			{ from: '--switch-active-background-color', to: '--switch-checked-background' },
			{
				from: '--switch-default-active-background-color',
				to: '--switch-default-checked-background'
			},
			{
				from: '--switch-active-box-shadow',
				to: '--switch-checked-box-shadow',
				note: 'An inset outline belongs in `--switch-checked-border-color` now.'
			},
			{
				from: '--switch-default-active-box-shadow',
				to: '--switch-default-checked-box-shadow',
				note: 'The outline is `--switch-default-checked-border-color` now.'
			},
			{ from: '--switch-handle-width', to: '--switch-thumb-size', note: 'Width and height of the thumb.' },
			{
				from: '--switch-default-handle-width',
				to: '--switch-default-thumb-size',
				note: 'Size `md` only; `size="lg"` reads `--switch-default-lg-thumb-size`.'
			},
			{
				from: '--switch-handle-color',
				to: '--switch-thumb-color',
				note: 'Off state only: also set `--switch-checked-thumb-color` (v4 used one color for both).'
			},
			{
				from: '--switch-default-handle-color',
				to: '--switch-default-thumb-color',
				note: 'Also set `--switch-default-checked-thumb-color`.'
			}
		],
		removed: [
			...disabled.map((suffix) => ({
				name: `--switch-${suffix}`,
				note: disabledNote,
				replacement: '--switch-disabled-opacity'
			})),
			...disabled.map((suffix) => ({
				name: `--switch-default-${suffix}`,
				note: disabledNote,
				replacement: '--switch-default-disabled-opacity'
			})),
			{
				name: '--switch-default-translate-x',
				note: 'The travel is computed from the track (width − height) for every size; `--switch-translate-x` still overrides it per instance. Drop the override.'
			},
			{
				name: '--switch-label-width',
				note: 'Never existed (v4 HeadersDrawer set it with no effect): drop it. The text next to the switch is `label` / `labelSnippet`.'
			}
		],
		changed: [
			{
				name: '--switch-translate-x',
				note: 'Computed by default from the track (width − height, mirrored in RTL); the v4 default was a fixed 20px for a 42px track. Remove v4 values: they misplace the thumb on the 36px and 46px tracks. Keep one only for a thumb that is not centred.'
			}
		]
	},
	manual: [
		{
			id: 'switch-focusable',
			summary:
				'The switch is a focusable `<input type="checkbox" role="switch">` inside `<label class="aurora-switch">` (v4 hid the input with `display: none`): it is a new tab stop and Space toggles it.',
			action:
				'Rewrite app CSS on `.toggle-switch`, `.toggle-switch-background` or `.toggle-switch-handle` with the v5 variables or `class={{ container, input, label }}`. Where the switch sits in a row that is itself focusable, check that the extra tab stop is wanted.'
		},
		{
			id: 'switch-label',
			summary:
				'`label` (or `labelSnippet`) renders the text inside the root label: a click on it toggles the switch and screen readers read it as its name.',
			action:
				'Move text placed next to the v4 switch (a sibling span, a wrapping element) into `label`; a switch without visible text needs `aria-label`.'
		},
		{
			id: 'switch-look',
			summary:
				'The track is 36×20 instead of 42×22 (`size="lg"`: 46×26) with a 1px border, the thumb 16px (lg 22px); disabled fades the whole switch and its text to 40% instead of using grey colors.',
			action:
				'For the v4 size set `--switch-width="42px"` and `--switch-height="22px"`, or use `size="lg"`; adjust the disabled look with `--switch-disabled-opacity`.'
		}
	],
	added: [
		'`size` (`md` | `lg`).',
		'`label` + `labelSnippet`: text next to the switch, clickable.',
		'Native attributes (`name`, `value`, `id`, `required`, `aria-*`, `on*`) on the input; `bind:input`; `class` object `{ container, input, label }`.',
		'`data-checked`, `data-size`, `data-disabled` attributes.',
		'`--switch-border-*`, `--switch-hover-border-color`, `--switch-checked-thumb-color`, `--switch-focus-ring-*`, `--switch-label-*` variables.'
	]
} satisfies ComponentMigration;
