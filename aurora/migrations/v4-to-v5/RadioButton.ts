import type { ComponentMigration, EventChange } from '../types.js';

const native = (name: string, type: string): EventChange => ({
	name,
	argument: {},
	type,
	note: 'Already the native event in v4 (only its type said `() => void`): no argument rewrite. Handlers can now type and read it.'
});

const focusRing =
	'--radio-button-focus-ring-width, --radio-button-focus-ring-color, --radio-button-focus-ring-offset';

export default {
	from: 'RadioButton',
	to: 'RadioButton',
	props: {
		types: [
			{
				name: 'value',
				v4: 'string',
				v5: 'string | number',
				note: 'A number stays a number in `group`; forms send it as text.'
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
			native('onkeypress', 'KeyboardEvent'),
			native('onkeyup', 'KeyboardEvent')
		]
	},
	cssVars: {
		renamed: [
			{ from: '--radio-button-background-color', to: '--radio-button-background' },
			{
				from: '--radio-button-active-color',
				to: '--radio-button-checked-background',
				note: 'v4 used it for the checked border too; the v5 checked border is `--radio-button-checked-border-color`, transparent by default, so the background alone gives the v4 look.'
			},
			{ from: '--radio-button-active-inner-color', to: '--radio-button-dot-color' },
			{ from: '--radio-button-border-hover-color', to: '--radio-button-hover-border-color' },
			{ from: '--radio-button-default-background-color', to: '--radio-button-default-background' },
			{
				from: '--radio-button-default-active-color',
				to: '--radio-button-default-checked-background',
				note: 'The checked border has its own default, `--radio-button-default-checked-border-color` (transparent).'
			},
			{ from: '--radio-button-default-active-inner-color', to: '--radio-button-default-dot-color' },
			{
				from: '--radio-button-default-border-hover-color',
				to: '--radio-button-default-hover-border-color'
			}
		],
		removed: [
			{
				name: '--radio-button-focus-shadow',
				note: 'Keyboard focus is an outline ring on `:focus-visible` now, not a box-shadow on every focus.',
				replacement: focusRing
			},
			{
				name: '--radio-button-default-focus-shadow',
				note: 'Keyboard focus is an outline ring on `:focus-visible` now.',
				replacement:
					'--radio-button-default-focus-ring-width, --radio-button-default-focus-ring-color, --radio-button-default-focus-ring-offset'
			},
			...['--radio-button-disabled-color', '--radio-button-disabled-active-color'].map((name) => ({
				name,
				note: 'Disabled radios keep their colors and fade, text included.',
				replacement: '--radio-button-disabled-opacity'
			})),
			...['--radio-button-default-disabled-color', '--radio-button-default-disabled-active-color'].map(
				(name) => ({
					name,
					note: 'Disabled radios keep their colors and fade, text included.',
					replacement: '--radio-button-default-disabled-opacity'
				})
			)
		]
	},
	manual: [
		{
			id: 'radio-button-bind-group',
			summary:
				'`bind:checked` does not work: v4 declared `checked` bindable but passed it one way, so the binding never updated. v5 binds the group like Svelte: `bind:group` with the same variable on every radio, plus each radio `value`; `checked` is the native one-way attribute, ignored while `group` is defined.',
			action:
				'Replace `bind:checked={x}` and the `checked={plan === "a"}` + `onchange` patterns on the radios of a group with one variable bound on all of them: `<RadioButton name="plan" value="monthly" bind:group={plan} />`, and drop the handlers that only kept that variable in sync. A static `checked` without a binding still works. Radios rendered from a list are simpler as `<RadioGroup label items bind:value />`.',
			when: { props: ['checked'] }
		},
		{
			id: 'radio-button-markup',
			summary:
				'The root is a `<label class="aurora-radio-button">` that wraps the input and the text; v4 rendered the `<input>` followed by a sibling `<label for={id}>` (only with `label`), which did nothing without `id`. A click on the text now selects the radio.',
			action:
				'Rewrite app CSS that targets `input[type="radio"] + label` or relies on the two siblings, against `.aurora-radio-button`, `.aurora-radio-button-label` or the `class` object `{ container, input, label, description }`. An `id` added only to make the label clickable can go. Native attributes and `on*` handlers still reach the `<input>`.'
		},
		{
			id: 'radio-button-look',
			summary:
				'The circle is 18px instead of 21px, 10px from the label (v4: 4px) and aligned with its first line; keyboard focus shows an outline ring; disabled fades the whole radio and its text to 40%.',
			action:
				'Check dense layouts and custom alignments; adjust with `--radio-button-size`, `--radio-button-gap`, `--radio-button-disabled-opacity`, `--radio-button-focus-ring-*`.'
		}
	],
	added: [
		'`group` (bindable) with `value`, as Svelte `bind:group`.',
		'`description` + `descriptionSnippet`: secondary line, read as the accessible description.',
		'`card`: bordered box that highlights when selected.',
		'`labelSnippet`, `bind:input`, `class` object `{ container, input, label, description }`.',
		'`data-checked`, `data-disabled`, `data-card` attributes.',
		'`name` is optional (radios without it do not form a group).',
		'New `RadioGroup`: `items`, `bind:value`, `label` as legend, generated `name`, `orientation`, `card`, `required`, `hint`, `state`.'
	]
} satisfies ComponentMigration;
