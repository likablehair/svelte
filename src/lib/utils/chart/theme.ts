import type { ChartConfiguration } from 'chart.js';

export interface ChartTheme {
	color(value: string): string;
	alpha(value: string, alpha: number): string;
	value(name: string): string;
	length(name: string): number;
	palette(index: number): string;
	hidden(key: string): boolean;
}

export interface ChartSpec {
	type: 'bar' | 'line' | 'doughnut';
	data: ChartConfiguration['data'];
	options: object;
}

export interface ChartTable {
	head: string[];
	rows: string[][];
}
