import type {
	ComponentMigration,
	EventChange,
	Removal,
	Rename,
	SnippetChange
} from '../types.js';

const native = (name: string, type: string): EventChange => ({
	name,
	argument: {},
	type,
	note: 'Already the native event in v4: no argument rewrite.'
});

const range = (name: string): Removal => ({
	name,
	note: 'Range mode is gone: render two SimpleTextFields side by side, each with its own `label`, `value`, `placeholder`, `name`, `id` and `bind:input`. See `simple-text-field-range`.'
});

const prefixOnly = (suffix: string, note?: string): Rename[] => [
	{ from: `--simple-textfield-${suffix}`, to: `--simple-text-field-${suffix}`, note },
	{ from: `--simple-textfield-default-${suffix}`, to: `--simple-text-field-default-${suffix}`, note }
];

const removedVar = (suffix: string, note: string, replacement?: string): Removal[] => [
	{ name: `--simple-textfield-${suffix}`, note, replacement },
	{
		name: `--simple-textfield-default-${suffix}`,
		note,
		replacement: replacement?.replaceAll('--simple-text-field-', '--simple-text-field-default-')
	}
];

const iconSnippet = (name: string, icon: string): SnippetChange => ({
	name,
	v4: `{ ${icon}: string | undefined; iconSize: string }`,
	v5: `{ ${icon}: string | undefined }`,
	note: `\`iconSize\` is gone: an \`<Icon>\` inside the snippet already gets the field icon size (\`--simple-text-field-icon-size\`). \`${icon}\` is an SVG path: \`<Icon name={${icon}}>\` → \`<Icon path={${icon}}>\`.`
});

export default {
	from: 'SimpleTextField',
	to: 'SimpleTextField',
	props: {
		removed: [
			range('range'),
			range('valueTo'),
			range('placeholderTo'),
			range('idTo'),
			range('nameTo'),
			range('inputTo'),
			range('betweenLabel')
		],
		toCssVar: [
			{
				name: 'iconSize',
				cssVar: '--simple-text-field-icon-size',
				note: 'v4 default 12pt (16px), v5 18px. `--icon-size` set on the field no longer reaches its icons.'
			}
		],
		icons: ['prependIcon', 'prependInnerIcon', 'appendInnerIcon', 'appendIcon'],
		types: [
			{
				name: 'input',
				v4: 'HTMLElement',
				v5: 'HTMLInputElement',
				note: 'The variable used with `bind:input` must accept an `HTMLInputElement`.'
			}
		]
	},
	events: {
		changed: [
			native('onchange', 'Event'),
			native('oninput', 'Event'),
			native('onfocus', 'FocusEvent'),
			native('onblur', 'FocusEvent'),
			native('onkeydown', 'KeyboardEvent'),
			native('onkeyup', 'KeyboardEvent'),
			native('onkeypress', 'KeyboardEvent')
		]
	},
	snippets: {
		parameters: [
			iconSnippet('prependSnippet', 'prependIcon'),
			iconSnippet('prependInnerSnippet', 'prependInnerIcon'),
			iconSnippet('appendInnerSnippet', 'appendInnerIcon'),
			iconSnippet('appendSnippet', 'appendIcon')
		]
	},
	cssVars: {
		renamed: [
			...prefixOnly('width', 'v4 default 280px, v5 100% of the container.'),
			...prefixOnly('max-width'),
			...prefixOnly('outer-gap'),
			...prefixOnly('inner-gap'),
			...prefixOnly(
				'padding',
				'The height is fixed by `--simple-text-field-height` (border-box), so vertical padding no longer makes the field taller: keep only the horizontal part (`0.65rem 1rem` → `0 1rem`). v5 default `0 12px`.'
			),
			...prefixOnly(
				'height',
				'v4 had no default (the padding gave about 38px plus the content); v5 is 36px including the border.'
			),
			...prefixOnly('border-radius'),
			...prefixOnly('box-shadow'),
			...prefixOnly('font-size'),
			...prefixOnly('font-weight'),
			...prefixOnly('color'),
			...prefixOnly('hint-font-size'),
			...prefixOnly('hint-color'),
			{ from: '--simple-textfield-background-color', to: '--simple-text-field-background' },
			{
				from: '--simple-textfield-default-background-color',
				to: '--simple-text-field-default-background'
			},
			{
				from: '--simple-textfield-margin-bottom',
				to: '--simple-text-field-gap',
				note: 'v4 spaced the field row from the hint row; v5 spaces label, field and hint.'
			},
			{
				from: '--simple-textfield-default-margin-bottom',
				to: '--simple-text-field-default-gap',
				note: 'v4 spaced the field row from the hint row; v5 spaces label, field and hint.'
			}
		],
		removed: [
			...removedVar(
				'border',
				'Split in two: `1px solid red` → `--simple-text-field-border-width="1px"` + `--simple-text-field-border-color="red"`; `none` → border width `0`.',
				'--simple-text-field-border-width + --simple-text-field-border-color'
			),
			...removedVar(
				'focus-box-shadow',
				'Focus is a border color plus a ring.',
				'--simple-text-field-focus-ring-width, --simple-text-field-focus-ring-color, --simple-text-field-focus-border-color'
			),
			...removedVar(
				'focus-background-color',
				'Focus no longer changes the background. Drop it, or style `.aurora-text-field-control:focus-within` in app CSS.'
			),
			...removedVar(
				'margin-left',
				'Removed: put the margin on `class.container` or in the parent layout.'
			),
			...removedVar(
				'hint-margin-left',
				'The hint is aligned with the field. Use `class.hint` with app CSS if an indent is needed.'
			),
			...removedVar(
				'transition',
				'Transitions follow the global `--global-duration` and `--global-ease` tokens.'
			),
			...removedVar('range-text-align', 'Range mode is gone.')
		]
	},
	manual: [
		{
			id: 'simple-text-field-range',
			summary:
				'Range mode (`range` with `valueTo`, `placeholderTo`, `idTo`, `nameTo`, `inputTo`, `betweenLabel`) is removed.',
			action:
				'Replace the field with two SimpleTextFields in a flex row, each with its own `label` (or `aria-label`), `bind:value` (the v4 `value` and `valueTo`), `placeholder`, `name`, `id` and `bind:input`; put the `betweenLabel` text between them if still wanted. Callbacks fired by both v4 inputs must be passed to both fields. Date ranges: keep the v4 DatePickerTextField until it is ported.',
			when: {
				props: ['range', 'valueTo', 'placeholderTo', 'idTo', 'nameTo', 'inputTo', 'betweenLabel']
			}
		},
		{
			id: 'simple-text-field-look',
			summary:
				'The field is 36px high (border-box) with a border and a visible focus ring, and fills its container; v4 was 280px wide, filled grey and borderless.',
			action:
				'Set `--simple-text-field-width="280px"` where the v4 width mattered (fields in a row, toolbars). Fields made taller with vertical padding need `--simple-text-field-height`. App CSS that targeted `.textfield`, `.textfield-container`, `.row` or `.hint` must use the `class` object or the `aurora-text-field-*` classes.'
		},
		{
			id: 'simple-text-field-hint-snippet',
			summary:
				'`hintSnippet` renders inside the hint element (`.aurora-text-field-hint`, the target of `aria-describedby`) instead of replacing the whole hint row; `class.hint` goes on that element, which exists only with `hint` or `hintSnippet` (v4: an always present row).',
			action:
				'Remove wrappers in the snippet that rebuilt the v4 row (`.row`, `.hint`) and their margins. Space reserved through `class.hint` for a message that is not there yet must move to the container.',
			when: { snippets: ['hintSnippet'], props: ['class'] }
		},
		{
			id: 'simple-text-field-calendar-icon',
			summary:
				'Date and time fields show the native picker icon; v4 made it transparent but still clickable.',
			action:
				'Remove a calendar or clock `appendInnerIcon` drawn over the invisible native icon, or the field shows two icons.',
			when: { props: ['type'] }
		}
	],
	added: [
		'`label` (linked to the input) and `labelSnippet`.',
		'`state` (`error` | `success`): colors the field and the hint, shows an icon; `stateIconSnippet` replaces it.',
		'`class.label`.',
		'`type` also accepts `email`, `tel`, `search`, `url`.',
		'`data-state`, `data-disabled`, `data-readonly` attributes.',
		'`--simple-text-field-*` variables for label, placeholder, icons, hover, focus, error, success and disabled.'
	]
} satisfies ComponentMigration;
