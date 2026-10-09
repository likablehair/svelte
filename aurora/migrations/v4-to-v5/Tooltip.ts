import type { ComponentMigration } from '../types.js';

export default {
	from: 'ToolTip',
	to: 'Tooltip',
	props: {
		renamed: [{ from: 'menuOpen', to: 'open', note: 'Still bindable.' }],
		removed: [
			{
				name: 'menuProps',
				note: '`menuProps={{ anchor }}` → `placement` (values in `props.values`); `menuProps._activatorGap` → `offset` (v5 default 10, arrow included). Every other Menu prop (`_width`, `_minWidth`, `_maxHeight`, `_top`, `_left`, `stayInViewport`, `flipOnOverflow`, `closeOnClickOutside`, animations) has no equivalent: drop it. The width is `--tooltip-max-width` (280px, 240px with `variant="rich"`); the tooltip always flips and stays in the viewport.',
				replacement: 'placement, offset'
			}
		],
		defaults: [
			{
				name: 'placement',
				v4: "'bottom-center'",
				v5: "'top'",
				keepV4: 'placement="bottom"',
				note: 'v4 set `anchor="bottom-center"` on the inner Menu unless `menuProps.anchor` overrode it: add `keepV4` only where `menuProps` had no `anchor`.'
			},
			{
				name: 'appearTimeout',
				v4: 'undefined',
				v5: '400',
				keepV4: 'appearTimeout={0}',
				note: 'v4 opened on the first `mouseenter` when it was omitted. Keyboard focus opens the tooltip right away in any case.'
			}
		],
		values: [
			{
				name: 'placement',
				values: {
					'bottom-center': 'bottom',
					'up-center': 'top',
					'left-center': 'left',
					'right-center': 'right',
					bottom: 'bottom-start',
					up: 'top-start',
					left: 'left-start',
					right: 'right-start'
				},
				note: 'The v4 value is `menuProps.anchor`: move it to `placement` and convert it.'
			}
		]
	},
	manual: [
		{
			id: 'tooltip-surface',
			summary:
				'The tooltip draws its own surface and arrow (a dark one-line label, or a card with `variant="rich"`); v4 was an empty Menu and the apps drew the card in `children`.',
			action:
				'Remove the wrapper inside the tooltip that sets background, color, padding, radius or shadow. Plain text → `text="..."`; a bold line plus text → `variant="rich"` with `title` and `text`; keep `children` only for custom markup, without the card styles. Colors and sizes go in `--tooltip-*` variables.',
			when: { snippets: ['children'] }
		},
		{
			id: 'tooltip-interaction',
			summary:
				'The tooltip also opens on keyboard focus, closes on Escape, on a click on the activator and on blur, and stays open while the pointer is over it; it is `role="tooltip"` and never interactive.',
			action:
				'Remove app code that opened or closed the tooltip on focus, blur or click by hand. Tooltips whose content has links, buttons or inputs must become a Menu (or a Dialog): the tooltip closes before they can be used.'
		},
		{
			id: 'tooltip-controlled-open',
			summary:
				'`open` (v4 `menuOpen`) can still be driven from code, but the tooltip now closes itself on Escape, click, blur and pointer leave.',
			action:
				'Where the app sets `menuOpen` from code (to show a hint), use `bind:open` so the app sees when the tooltip closes, and do not rely on it staying open until the app closes it.',
			when: { props: ['menuOpen'] }
		},
		{
			id: 'tooltip-always-in-dom',
			summary:
				"The tooltip element is always in the DOM (a hidden popover) and adds its id to the activator's `aria-describedby`; v4 rendered nothing while closed.",
			action:
				'App tests or code that checked whether the tooltip exists must check `:popover-open` (or visibility) instead. Keep the activator mounted while the tooltip is: its `aria-describedby` is managed by the tooltip.'
		}
	],
	added: [
		'`text` for plain tooltips, `title` and `titleSnippet` for a bold first line.',
		'`variant` (plain | rich), exposed as `data-variant`; the current side as `data-side`.',
		'`offset`, and `placement` with `-start` / `-end` variants on every side.',
		'`bind:tooltipElement`, `class` and native attributes on the tooltip element.',
		'`--tooltip-*` CSS variables (background, color, padding, radius, shadow, max width, font, arrow size, duration).'
	]
} satisfies ComponentMigration;
