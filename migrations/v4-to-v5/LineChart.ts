import type { ComponentMigration } from '../types.js';
import { canvasAttributes, dataNote, inertProps, optionsNote, optionsStep, resetZoomRemoval, sharedSteps } from './BarChart.js';

export default {
	from: 'LineChart',
	to: 'LineChart',
	props: {
		changed: [dataNote(false), optionsNote, canvasAttributes],
		removed: [resetZoomRemoval, ...inertProps]
	},
	manual: [
		...sharedSteps('line-chart', 'point'),
		optionsStep(
			'line-chart',
			'`scales.y.stacked: true` → `stacked`; a second axis (`yAxisID` plus a scale with `position: "right"`) → `axis: "right"` and `format` on the series; `elements.point.radius` → delete (points appear on hover); `elements.line.borderWidth` → `--line-chart-line-width`.'
		),
		{
			id: 'line-chart-look',
			kind: 'review',
			summary:
				'v5 draws the lines like the design prototype: smooth curves, points only on hover with a vertical guide, ticks on both axes (v4 hid them), legend below and only with two or more series, HTML tooltip card; one series alone gets the brand gradient and a glow.',
			action:
				'Open the screen and compare. For straight segments pass `tension: 0` on the series; to show the points, `pointRadius: 3`; to hide the ticks, `options={{ scales: { x: { ticks: { display: false } }, y: { ticks: { display: false } } } }}`.'
		}
	],
	added: [
		'`stacked`, `format`, `legend`, `zoom` (props for the common options); series keys `area`, `dashed`, `axis`, `format`, `color`.',
		'`label` names the chart for screen readers, which also read a hidden table of the values.',
		'`onitemclick({ index, datasetIndex, label, value, event })` on a point.',
		'`tooltipSnippet`, `legendSnippet`.',
		'`locale`, `resetZoomLabel`.',
		'`chart` (the chart.js instance) and `lineChartElement` are bindable.',
		'CSS variables `--line-chart-*` for size, grid, ticks, line, glow, gradient, legend and tooltip.'
	]
} satisfies ComponentMigration;
