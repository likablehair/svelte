/** How values are written: options of `Intl.NumberFormat` (in the chart's `locale`), or a function. Axes write numbers in short form (`€1.2M`), tooltips in full. */
export type ChartFormat = Intl.NumberFormatOptions | ((value: number) => string);

/** One series of a chart: the values, one per label, and how they are drawn. Any other key of a chart.js dataset passes through unchanged (for example `borderWidth`, `pointStyle`, `order`). */
export interface ChartSeries {
	/** Name of the series, in the legend, the tooltip and the table read by screen readers. */
	label?: string;
	/** One value per label; `null` leaves a gap. */
	data: (number | null)[];
	/** Any CSS color, also `var(--…)`, `light-dark()` and `color-mix()`; an array gives one color per bar or slice. Defaults to the data palette of the theme (`--global-color-data-1…6`). */
	color?: string | string[];
	/** In a BarChart, `line` draws this series as a line over the bars. */
	type?: 'bar' | 'line';
	/** `right` puts the series on a second value axis on the right (at the top in a horizontal chart), with its own scale and format. */
	axis?: 'left' | 'right';
	/** Format of this series, instead of the chart's `format`. */
	format?: ChartFormat;
	/** Draws the line dashed, for example a comparison with the previous year. */
	dashed?: boolean;
	/** Fills the area under the line with a fading gradient. */
	area?: boolean;
	[key: string]: unknown;
}

/** The data of a chart: the labels of the categories and the series. Same shape as the `data` of chart.js. */
export interface ChartData {
	/** One label per category: months, products, countries. */
	labels: string[];
	/** The series, drawn in order. */
	datasets: ChartSeries[];
}

/** One row of the tooltip. */
export interface ChartTooltipItem {
	/** Name of the series (empty in a PieChart). */
	label: string;
	/** The value, already formatted. */
	value: string;
	/** The value as in the data. */
	raw: number | null;
	/** CSS color of the series or slice. */
	color: string;
	/** Position of the series in `datasets`. */
	datasetIndex: number;
	/** Position of the value in `data`, the same as its label in `labels`. */
	index: number;
}

/** What the tooltip shows. */
export interface ChartTooltip {
	/** The label of the category. */
	title: string;
	/** One row per series (one in a PieChart). */
	items: ChartTooltipItem[];
}

/** One entry of the legend: a series, or a slice in a PieChart. */
export interface ChartLegendItem {
	/** Stable key of the entry. */
	key: string;
	/** Name shown. */
	label: string;
	/** CSS color of the swatch (can be a gradient). */
	color: string;
	/** The series or slice is hidden. */
	hidden: boolean;
	/** Extra text after the name, for example the share of a slice. */
	detail?: string;
}

/** The value clicked in a chart. */
export interface ChartItemClick {
	/** Position of the value in `data`, the same as its label in `labels`. */
	index: number;
	/** Position of the series in `datasets`. */
	datasetIndex: number;
	/** The label of the category. */
	label: string;
	/** The value as in the data. */
	value: number | null;
	/** The native click event. */
	event: MouseEvent;
}
