import type { LocalMigration } from '../../types.js';

export default {
	from: 'BarChart',
	to: 'BarChart',
	files: ['BarChart.svelte'],
	contains: ['resetZoom'],
	excludes: ['defaultOptions'],
	summary: 'The local old copy of `BarChart` becomes `BarChart` of the library.',
	props: {
		removed: [
			{
				name: 'resetZoom',
				note: 'The chart shows a "Reset zoom" button while zoomed, and a double click resets it; from code use `bind:chart` and `chart.resetZoom()`.'
			}
		]
	},
	manual: [
		{
			id: 'bar-chart-local-look',
			kind: 'review',
			summary: 'The library BarChart applies its defaults (theme colors, rounded bars, visible ticks, zoom) under the `options` of the app.',
			action: 'Check the chart: remove from `options` what the library already does, and note that `showYTicks`/`showXTicks` of the old wrappers were swapped.'
		}
	]
} satisfies LocalMigration;
