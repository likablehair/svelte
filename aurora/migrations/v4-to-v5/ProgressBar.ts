import type { ComponentMigration } from '../types.js';

const tooltip = (name: string, replacement: string) => ({
	name,
	note: 'The tooltip is the v5 `Tooltip`, rendered inside the ProgressBar: set its variable on the ProgressBar and it reaches the tooltip.',
	replacement
});

const tooltipDefault = (name: string, instance: string) => ({
	name,
	note: `The tooltip is the v5 \`Tooltip\`. To restyle the tooltips of progress bars set \`${instance}\` on them; \`${instance.replace('--tooltip-', '--tooltip-default-')}\` would change every tooltip of the app.`
});

export default {
	from: 'ProgressBar',
	to: 'ProgressBar',
	props: {
		changed: [
			{
				name: 'valueTooltipLabel',
				note: 'While `valueTooltip` is set it is also the `aria-valuetext` of the bar (an `aria-valuetext` passed by the app wins): make it a text that reads well as the value ("36 of 50 seats"). A label of `0` or an empty string is now shown as is (v4 fell back to `value`).'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--progress-bar-background-color', to: '--progress-bar-background' },
			{
				from: '--progress-bar-highlight-color',
				to: '--progress-bar-fill-background',
				note: 'Any color or gradient. For status colors prefer `variant` (success, warning, error).'
			},
			{ from: '--progress-bar-default-background-color', to: '--progress-bar-default-background' },
			{
				from: '--progress-bar-default-highlight-color',
				to: '--progress-bar-default-fill-background',
				note: 'Only the `primary` variant; the others read `--progress-bar-default-{success,warning,error}-fill-background`.'
			}
		],
		removed: [
			tooltip('--progress-bar-tooltip-background-color', '--tooltip-background'),
			tooltip('--progress-bar-tooltip-border-radius', '--tooltip-border-radius'),
			tooltip('--progress-bar-tooltip-padding', '--tooltip-padding'),
			tooltipDefault('--progress-bar-default-tooltip-background-color', '--tooltip-background'),
			tooltipDefault('--progress-bar-default-tooltip-border-radius', '--tooltip-border-radius'),
			tooltipDefault('--progress-bar-default-tooltip-padding', '--tooltip-padding')
		]
	},
	manual: [
		{
			id: 'progress-bar-look',
			summary:
				'An 8px pill track with the theme gradient, a glow and a moving shimmer; v4 was 5px tall, radius 2px, flat primary.',
			action:
				'Pass `--progress-bar-height="5px"` (and `--progress-bar-border-radius="2px"`) where the v4 size matters, `--progress-bar-fill-background` for a flat color, `variant` for status colors.'
		},
		{
			id: 'progress-bar-accessible-name',
			summary:
				'The root is a `role="progressbar"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`; v4 had no role, so it needs an accessible name now.',
			action:
				'Pass `label` (a visible text above the bar, which also names it) or `aria-label`; when a visible text next to the bar already describes it, point `aria-labelledby` at it.'
		},
		{
			id: 'progress-bar-tooltip',
			summary:
				'`valueTooltip` opens the v5 `Tooltip` (dark label) above the whole bar after 400 ms; v4 showed a light card below the filled part, unreachable at value 0.',
			action:
				'Check screens that relied on the tooltip position or look (restyle with `--tooltip-*` on the ProgressBar).',
			when: { props: ['valueTooltip'] }
		}
	],
	added: [
		'`label` and `labelSnippet({ label })`: a text above the bar that names it.',
		'`showValue` and `valueSnippet({ value, total, percent })`: the percentage on the right.',
		'`indeterminate`: a bar that slides back and forth.',
		'`variant` (primary | success | warning | error).',
		'`class` and native attributes, `data-variant`, `data-indeterminate`.',
		'`--progress-bar-gap`, `-fill-box-shadow`, `-shimmer-*`, `-indeterminate-*`, `-duration`, `-label-*`, `-value-*`.'
	]
} satisfies ComponentMigration;
