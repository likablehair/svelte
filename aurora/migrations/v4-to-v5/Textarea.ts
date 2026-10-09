import type { ComponentMigration, EventChange, Removal } from '../types.js';

const native = (name: string, type: string): EventChange => ({
	name,
	argument: {},
	type,
	note: 'A native attribute of the `<textarea>` in v4 too: no argument rewrite.'
});

const both = (suffix: string, note: string, replacement?: string): Removal[] => [
	{ name: `--textarea-${suffix}`, note, replacement },
	{
		name: `--textarea-default-${suffix}`,
		note,
		replacement: replacement?.replace(/--textarea-/g, '--textarea-default-')
	}
];

export default {
	from: 'Textarea',
	to: 'Textarea',
	props: {
		defaults: [
			{
				name: 'rows',
				v4: 'undefined (native default: 2)',
				v5: '3',
				keepV4: 'rows={2}',
				note: 'The field also grows by dragging (`resize: vertical`), see `textarea-resize`.'
			}
		],
		types: [
			{
				name: 'value',
				v4: 'string | string[] | number | null',
				v5: 'string | null',
				note: 'Bind a string: numbers and arrays no longer type-check (`String(x)`).'
			}
		]
	},
	events: {
		changed: [
			native('oninput', 'Event'),
			native('onchange', 'Event'),
			native('onfocus', 'FocusEvent'),
			native('onblur', 'FocusEvent'),
			native('onkeydown', 'KeyboardEvent'),
			native('onkeyup', 'KeyboardEvent'),
			native('onkeypress', 'KeyboardEvent')
		]
	},
	cssVars: {
		renamed: [
			{ from: '--textarea-background-color', to: '--textarea-background' },
			{ from: '--textarea-default-background-color', to: '--textarea-default-background' },
			{
				from: '--textarea-label-margin',
				to: '--textarea-gap',
				note: 'v4 was a margin around the inline label (`0 0 10px 4px`, the vertical part had no effect); v5 is the gap between label, field and hint: keep only the bottom value.'
			},
			{
				from: '--textarea-default-label-margin',
				to: '--textarea-default-gap',
				note: 'v5 is the gap between label, field and hint: keep only the bottom value.'
			}
		],
		removed: [
			...both(
				'border',
				'Split in two and moved to the wrapper: `1px solid red` → `--textarea-border-width="1px"` + `--textarea-border-color="red"`.',
				'--textarea-border-width + --textarea-border-color'
			),
			...both(
				'focus-box-shadow',
				'Focus is a border color plus a ring on the wrapper (v4 had no visible default).',
				'--textarea-focus-ring-width, --textarea-focus-ring-color, --textarea-focus-border-color'
			),
			...both(
				'margin',
				'Removed (v4 default `0 0 5px`): put the margin on `class.container` or in the parent layout.'
			),
			...both('transition', 'Transitions follow the global `--global-duration` and `--global-ease` tokens.')
		],
		changed: ['--textarea-height', '--textarea-default-height'].map((name) => ({
			name,
			note: 'It sets the height of the `<textarea>` inside the bordered wrapper (v4: the whole box) and defaults to `auto` (v4: `100%`). Subtract the wrapper padding (9px top and bottom) and border from v4 values (`130px` → about `110px`) or accept the taller field. Where the v4 `100%` filled a parent of fixed height, size the field with `rows` or a height in px; `autoGrow` lets it follow the content.'
		}))
	},
	manual: [
		{
			id: 'textarea-wrapper',
			summary:
				'Border, background, padding, radius and shadow are on a wrapper (`.aurora-textarea-control`, `class.field`) around a transparent `<textarea>`; the field is bordered like the other inputs (v4: filled grey, no border) and shows a focus ring.',
			action:
				'Move app CSS that styled the box through `class.textarea` (border, background, padding, radius, shadow) to `class.field`; keep only text styles on `class.textarea`. Rules on `textarea:focus` belong on `.aurora-textarea-control:focus-within`.',
			when: { props: ['class'] }
		},
		{
			id: 'textarea-resize',
			summary: 'The user can drag the field taller (`resize: vertical`); v4 used `resize: none`.',
			action:
				'Set `--textarea-resize="none"` where the size must stay fixed, or use `autoGrow` where the field should follow the content.'
		}
	],
	added: [
		'`hint` + `hintSnippet` and `state` (`error` | `success`) + `stateIconSnippet`, as SimpleTextField.',
		'`counter` (+ `counterSnippet`): character count below the field, against `maxlength` when set.',
		'`autoGrow`: grows with the content between `rows` lines and `--textarea-max-height`.',
		'`labelSnippet`, `bind:textarea`, `class.field`, `class.hint`, `class.counter`.',
		'`data-state`, `data-disabled`, `data-readonly`, `data-auto-grow` attributes.',
		'`--textarea-*` variables for placeholder, hover, focus, error, success, disabled, counter, `min-height` and `max-height`.'
	]
} satisfies ComponentMigration;
