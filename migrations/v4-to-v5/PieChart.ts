import type { ComponentMigration } from '../types.js';
import { inertProps, optionsNote, sharedSteps } from './BarChart.js';

export default {
	from: 'PieChart',
	to: 'PieChart',
	props: {
		changed: [
			{
				name: 'data',
				note: 'Same shape as the chart.js `data`: `{ labels, datasets: [{ data }] }`. Svelte state can be passed as it is: remove `$state.snapshot(...)`. Slice colors: `color` with an array of CSS colors (also `var(--…)`) instead of `backgroundColor`; without it the slices take the data palette of the theme.'
			},
			optionsNote,
			{
				name: 'width',
				native: true,
				note: 'Native attributes go to the root `<div>`, no longer to the `<canvas>`. Size the chart with `--pie-chart-width` / `--pie-chart-height` (14rem).'
			}
		],
		removed: inertProps,
		defaults: [
			{
				name: 'donut',
				v4: 'false (a full pie)',
				v5: 'true',
				keepV4: 'donut={false}',
				note: 'v5 draws a donut with the total of the visible slices in the middle, like the design prototype.'
			}
		]
	},
	manual: [
		...sharedSteps('pie-chart', 'slice'),
		{
			id: 'pie-chart-options',
			kind: 'edit',
			summary: 'Most `options` the apps pass are props or defaults now.',
			action:
				'`cutout: "75%"` (a donut made by hand) → delete, donut is the default; for that exact hole, `--pie-chart-cutout="75%"`. `maintainAspectRatio: false` → delete. `plugins.legend.display: false` → `legend={false}`; `plugins.legend.position` → `legend="top|bottom|right"` (default: on the right, below when narrow). Tooltip callbacks that format numbers → `format`. A total drawn by the app in the middle (an absolutely positioned element over the canvas) → the built-in total with `centerLabel`, or `centerSnippet`. Click handlers in `options.onClick` with `getElementsAtEventForMode` → `onitemclick`.',
			when: { props: ['options'] }
		},
		{
			id: 'pie-chart-look',
			kind: 'review',
			summary:
				'v5 draws a donut with the total in the middle and the legend on the right with the share of every slice (v4: a full pie with the chart.js legend on top).',
			action: 'Open the screen and compare. Pass `donut={false}` where a full pie is wanted, `showTotal={false}` to leave the middle empty.'
		}
	],
	added: [
		'`donut`, `showTotal`, `centerLabel`, `centerSnippet` for the middle of the donut.',
		'`format`, `legend` (with the share of every slice; a click hides it and recounts the total).',
		'`label` names the chart for screen readers, which also read a hidden table of values and shares.',
		'`onitemclick({ index, datasetIndex, label, value, event })` on a slice.',
		'`tooltipSnippet`, `legendSnippet`, `locale`.',
		'`pieChartElement` is bindable.',
		'CSS variables `--pie-chart-*` for size, hole, slices, center, legend and tooltip.'
	]
} satisfies ComponentMigration;
