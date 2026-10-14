import type { Changed, ComponentMigration, ManualStep, Removal } from '../types.js';

export const dataNote = (bars: boolean): Changed => ({
	name: 'data',
	note: `Same shape as the chart.js \`data\`: \`{ labels, datasets }\`, and chart.js dataset keys still work. Svelte state can be passed as it is: remove \`$state.snapshot(...)\`. New library keys per series: \`color\` (any CSS color, also \`var(--…)\`; an array gives one color per ${bars ? 'bar' : 'point'}) instead of \`backgroundColor\`/\`borderColor\`, ${bars ? "`type: 'line'` with `axis: 'right'` instead of `yAxisID` and a scale of its own, " : "`axis: 'right'` instead of `yAxisID`, `area` instead of `fill`, `dashed` instead of `borderDash`, "}\`format\` for the values of that series. Keys that only repeated the old defaults are no longer needed: \`tension\`, \`fill: false\`, \`borderWidth\`, \`borderRadius\`, \`maxBarThickness\`.`
});

export const optionsNote: Changed = {
	name: 'options',
	note: 'Still chart.js options, merged over the defaults of the library (no longer mutated). The common ones are props now (`horizontal`, `stacked`, `format`, `legend`, `zoom`): see the `-options` step. Optional in v5.'
};

export const canvasAttributes: Changed = {
	name: 'width',
	native: true,
	note: 'Native attributes (`width`, `height`, `class`, `style`, `id`) go to the root `<div>`, no longer to the `<canvas>`. Size the chart with `--bar-chart-width` / `--bar-chart-height` (same names with `line-chart` and `pie-chart`).'
};

export const resetZoomRemoval: Removal = {
	name: 'resetZoom',
	note: 'While zoomed the chart shows its own "Reset zoom" icon in the top-right corner of the plot, and a double click also resets. Remove `bind:resetZoom` and the reset button of the app. To reset from code, `bind:chart` and call `chart.resetZoom()`.',
	replacement: 'bind:chart + chart.resetZoom()'
};

export const sharedSteps = (prefix: string, element: 'bar' | 'point' | 'slice'): ManualStep[] => [
	{
		id: `${prefix}-snapshot`,
		summary: '`$state.snapshot(...)` around `data` is no longer needed: the chart copies the values itself.',
		action: 'Pass the `$state` / `$derived` data directly: `data={$state.snapshot(chartData)}` → `data={chartData}`.',
		when: { props: ['data'] }
	},
	{
		id: `${prefix}-colors`,
		summary:
			'Colors follow the theme and dark mode by themselves: the code that read the v4 tokens by hand for the canvas is no longer needed.',
		action: `Look in the component for \`getComputedStyle(...).getPropertyValue('--global-color-…')\`, \`readToken\`, \`rgb(\${...})\` strings built from the v4 triplets, effects or \`if ($theme.dark)\` that exist only to recolor the chart, and \`hsl(i * N, …)\` palettes. Remove them: series without \`color\` take the data palette of the theme (\`--global-color-data-1…6\`, one series alone gets the brand gradient); where a specific color matters, write \`color: 'var(--global-color-…)'\` with the v5 token of the same role (see Color tokens in MIGRATION.md). One color per ${element}: an array in \`color\`.`
	},
	{
		id: `${prefix}-flat-props`,
		summary:
			'Props of the v3 charts (`showXTicks`, `showYTicks`, `xTickLabel`, `enableZoom`, `pointRadius`, `yMin`, …) did nothing in v4 4.2+: they ended up as attributes of the canvas.',
		action:
			'Delete them. `enableZoom` → `zoom`; `showXTicks`/`showYTicks` → nothing (ticks are visible by default); `xTickLabel`/`yTickLabel` that format numbers → `format`; `xMin`/`xMax`/`yMin`/`yMax` → `options={{ scales: { y: { min, max } } }}`; colors (`rgbTooltipColor`, …) → nothing; `horizontal` is a prop again and keeps working. Check the chart afterwards: in v4 these charts were drawn with the defaults.',
		when: {
			props: [
				'showXTicks',
				'showYTicks',
				'xTickLabel',
				'yTickLabel',
				'enableZoom',
				'pointRadius',
				'xMin',
				'xMax',
				'yMin',
				'yMax',
				'showLegend',
				'rgbTooltipColor',
				'rgbTooltipBackgroundColor',
				'tooltipLabel',
				'displayYGrid',
				'displayXGrid'
			]
		}
	},
	{
		id: `${prefix}-chart-defaults`,
		summary:
			'Global chart.js tweaks of the app (`Chart.defaults.…`, `Chart.register(...)` of an app plugin) were made for the v4 charts.',
		action:
			'Remove `Chart.defaults.resizeDelay` and plugins registered only to fix the hover of horizontal bars (`interaction.axis` follows `horizontal` now). Keep the app’s own chart.js charts, if any, as they are.',
		scope: 'app'
	}
];

export const optionsStep = (prefix: string, extra: string): ManualStep => ({
	id: `${prefix}-options`,
	summary: 'Most `options` the apps pass are props or defaults now; what is left stays in `options`.',
	action: `Move and delete, then keep in \`options\` only what is left: \`maintainAspectRatio: false\` → delete (the chart fills \`--${prefix}-height\`, 16rem; write \`--${prefix}-height="100%"\` to fill a widget that has a height); \`scales.*.ticks.display: true\` → delete (visible by default); \`ticks.callback: (v, i) => labels[i]\` → delete; tick and tooltip callbacks that only format numbers (\`toLocaleString\`, \`Intl.NumberFormat\`, \`€\`, \`%\`) → \`format\` (options of \`Intl.NumberFormat\`: axes get the short form by themselves) or the series \`format\`; \`plugins.legend.display: false\` → delete (\`legend="auto"\` shows it only with two or more series) or \`legend={false}\`; \`plugins.legend.position\` → \`legend="top|bottom|right"\`; \`interaction: { intersect: false }\` → delete; \`plugins.zoom\` → delete, or \`zoom={false}\` to turn zooming off; \`plugins.tooltip.callbacks.label\` returning \`"label: value"\` → the tooltip shows the series name by itself, so return only the value, or use \`tooltipSnippet\`. ${extra}`,
	when: { props: ['options'] }
});

export default {
	from: 'BarChart',
	to: 'BarChart',
	props: {
		changed: [dataNote(true), optionsNote, canvasAttributes],
		removed: [resetZoomRemoval]
	},
	manual: [
		...sharedSteps('bar-chart', 'bar'),
		optionsStep(
			'bar-chart',
			"`indexAxis: 'y'` → `horizontal`; `scales.x.stacked` / `scales.y.stacked: true` → `stacked`; a dataset with `type: 'line'` and `yAxisID: 'share'` plus `scales.share` → `type: 'line', axis: 'right', format` on the series and no scale."
		),
		{
			id: 'bar-chart-one-series-per-bar',
			summary:
				'The trick of one dataset per bar (each with a single value and `stacked: true`) to get one color per bar is no longer needed.',
			action:
				'Use one series with all the values and an array in `color` (one color per bar); remove `stacked` if it was there only for the trick. The tooltip and the hidden table then show one row per category.',
			when: { props: ['data'] }
		},
		{
			id: 'bar-chart-horizontal-rows',
			summary:
				'Horizontal charts grow with the rows by themselves (`--bar-chart-row-height`, 2.5rem = 40px): the wrappers sized `labels.length * 40px` are no longer needed.',
			action:
				'With `horizontal`, remove the `<div style="height: {labels.length * 40}px">` around the chart and its scroll container. To keep a fixed height with the rows scrolling inside, set `--bar-chart-height`.',
			when: { props: ['options'] }
		},
		{
			id: 'bar-chart-look',
			summary:
				'v5 draws the charts like the design prototype: ticks on both axes (v4 hid them), legend below and only with two or more series (v4 always on top), HTML tooltip card, thicker rounded bars, dashed grid.',
			action:
				'Open the screen and compare: where the app relied on the hidden ticks (very small charts, sparklines), pass `options={{ scales: { x: { ticks: { display: false } }, y: { ticks: { display: false } } } }}`.'
		}
	],
	added: [
		'`horizontal`, `stacked`, `format`, `legend`, `zoom` (props for the common options).',
		'`label` names the chart for screen readers, which also read a hidden table of the values.',
		'`onitemclick({ index, datasetIndex, label, value, event })` on a bar.',
		'`tooltipSnippet`, `legendSnippet`.',
		'`locale`, `resetZoomLabel`.',
		'`chart` (the chart.js instance) and `barChartElement` are bindable.',
		'CSS variables `--bar-chart-*` for size, grid, ticks, bars, legend and tooltip.'
	]
} satisfies ComponentMigration;
