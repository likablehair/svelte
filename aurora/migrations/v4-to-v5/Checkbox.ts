import type { ComponentMigration } from '../types.js';

const disabled = 'Disabled checkboxes keep their colors and fade, text included.';

export default {
	from: 'Checkbox',
	to: 'Checkbox',
	props: {
		renamed: [
			{
				from: 'value',
				to: 'checked',
				note: '`bind:value` → `bind:checked`. `value` is now the native form value: a leftover `value={true}` compiles and leaves the box unchecked.'
			}
		],
		types: [
			{
				name: 'class',
				v4: 'string (on the `<input>`)',
				v5: '{ container?: string; input?: string; label?: string }',
				note: '`class="x"` → `class={{ input: "x" }}`; layout classes (margins, alignment) go on `container`, the root `<label>`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { 'detail.nativeEvent': '', 'detail.shiftKeyPressed': null },
				type: 'Event',
				note: '`detail.shiftKeyPressed` has no counterpart on the change event: see `checkbox-shift-key`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--checkbox-background-color', to: '--checkbox-background' },
			{ from: '--checkbox-default-background-color', to: '--checkbox-default-background' },
			{
				from: '--checkbox-active-color',
				to: '--checkbox-checked-background',
				note: 'v4 used it for the checked border too; the v5 checked border is `--checkbox-checked-border-color`, transparent by default, so the background alone gives the v4 look.'
			},
			{
				from: '--checkbox-default-active-color',
				to: '--checkbox-default-checked-background',
				note: 'The checked border has its own default, `--checkbox-default-checked-border-color` (transparent).'
			},
			{ from: '--checkbox-active-inner-color', to: '--checkbox-mark-color' },
			{ from: '--checkbox-default-active-inner-color', to: '--checkbox-default-mark-color' },
			{ from: '--checkbox-border-hover-color', to: '--checkbox-hover-border-color' },
			{ from: '--checkbox-default-border-hover-color', to: '--checkbox-default-hover-border-color' }
		],
		removed: [
			{
				name: '--checkbox-focus-shadow',
				note: 'Keyboard focus is an outline ring on `:focus-visible`, not a box-shadow on every focus: `2px rgb(...)` → `--checkbox-focus-ring-width="2px"` + `--checkbox-focus-ring-color="rgb(...)"`.',
				replacement: '--checkbox-focus-ring-width, --checkbox-focus-ring-color, --checkbox-focus-ring-offset'
			},
			{
				name: '--checkbox-default-focus-shadow',
				note: 'Keyboard focus is an outline ring on `:focus-visible`.',
				replacement:
					'--checkbox-default-focus-ring-width, --checkbox-default-focus-ring-color, --checkbox-default-focus-ring-offset'
			},
			...['--checkbox-disabled-color', '--checkbox-disabled-active-color'].map((name) => ({
				name,
				note: disabled,
				replacement: '--checkbox-disabled-opacity'
			})),
			...['--checkbox-default-disabled-color', '--checkbox-default-disabled-active-color'].map(
				(name) => ({ name, note: disabled, replacement: '--checkbox-default-disabled-opacity' })
			),
			{
				name: '--checkbox-default-disabled-inner-color',
				note: 'Declared in v4 but never read: drop it.'
			}
		]
	},
	manual: [
		{
			id: 'checkbox-shift-key',
			summary:
				'`onchange` no longer reports `shiftKeyPressed`; v4 tracked Shift with two global `window` listeners per checkbox.',
			action:
				'Where a handler reads `detail.shiftKeyPressed` (range selection), move that logic to `onclick` and read `event.shiftKey`. It is true for a Shift+click on the box and, in Chromium, for Shift+Space and a Shift+click on the label text; in Firefox Shift+Space gives `false` and a Shift+click on the label text does not toggle the box.',
			when: { events: ['onchange'] }
		},
		{
			id: 'checkbox-label-root',
			summary:
				'The root is a `<label class="aurora-checkbox">` around the input (native attributes and `on*` still reach the input); the text next to the box belongs in `label` or `labelSnippet`.',
			action:
				'Replace `<label><Checkbox /> Text</label>` or `<Checkbox id="x" /><label for="x">Text</label>` with `<Checkbox label="Text" />` (`labelSnippet` for links or rich text): a label around the component nests two labels. App CSS that targeted `input[type="checkbox"]` as the root moves to `class.container` / `class.input`.'
		},
		{
			id: 'checkbox-look',
			summary:
				'The box is 18px instead of 21px with a 1.5px border, keyboard focus shows an outline ring, and disabled fades the whole control and its text to 40%.',
			action:
				'Check dense layouts and alignment; adjust with `--checkbox-size`, `--checkbox-border-width`, `--checkbox-focus-ring-*`, `--checkbox-disabled-opacity`.'
		}
	],
	added: [
		'`indeterminate` (bindable): partial state, cleared by a click.',
		'`label` + `labelSnippet`: text next to the box, clickable.',
		'`bind:input`, `class` object `{ container, input, label }`.',
		'`data-checked`, `data-indeterminate`, `data-disabled` attributes.'
	]
} satisfies ComponentMigration;
