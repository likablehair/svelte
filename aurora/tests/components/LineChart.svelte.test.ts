import type { Chart } from 'chart.js';
import { flushSync } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import LineChart from '#lib/components/simple/charts/LineChart.svelte';
import type { ChartData, ChartItemClick } from '#lib/utils/chart/types.js';
import { cssColor, dragAcross, elementCenter, hover, rgbaOf } from '../charts.js';

const year: ChartData = {
	labels: ['Jan', 'Feb', 'Mar', 'Apr'],
	datasets: [
		{ label: '2026', data: [10, 30, 20, 40], area: true },
		{ label: '2025', data: [8, 22, 18, 30], dashed: true, color: 'var(--global-color-text-3)' }
	]
};

type LineSet = {
	borderColor: unknown;
	fill: unknown;
	borderDash: number[];
	pointRadius: number;
	yAxisID: string;
	tension: number;
};

async function renderChart(props: Record<string, unknown>) {
	const box: { chart?: Chart } = {};
	const screen = await render(LineChart, {
		...(props as unknown as ComponentProps<typeof LineChart>),
		get chart() {
			return box.chart;
		},
		set chart(value: Chart | undefined) {
			box.chart = value;
		}
	});
	await expect.poll(() => box.chart).toBeDefined();
	const chart = () => box.chart!;
	return {
		screen,
		chart,
		root: screen.container.querySelector<HTMLElement>('.aurora-line-chart')!,
		set: (i: number) => chart().data.datasets[i] as unknown as LineSet
	};
}

describe('LineChart', () => {
	test('root with class and native attributes, canvas named by label, hidden table', async () => {
		const { screen, root } = await renderChart({ data: year, label: 'Revenue', class: 'app-chart', id: 'rev' });
		expect(root).toHaveClass('aurora-chart', 'aurora-line-chart', 'app-chart');
		expect(root).toHaveAttribute('id', 'rev');
		await expect.element(screen.getByRole('img', { name: 'Revenue' })).toBeInTheDocument();
		const table = screen.getByRole('table', { name: 'Revenue' });
		await expect.element(table.getByRole('columnheader', { name: '2025' })).toBeInTheDocument();
		await expect.element(table.getByRole('row', { name: 'Apr 40 30' })).toBeInTheDocument();
	});

	test('the only series without color gets the gradient and the glow; area fills below, dashed draws dashes', async () => {
		const { chart, set, root } = await renderChart({ data: year });
		expect(typeof set(0).borderColor).toBe('function');
		expect(set(0).fill).toBe('start');
		expect(set(0).tension).toBeGreaterThan(0);
		expect(set(0).pointRadius).toBe(0);
		expect(set(1).borderColor).toBe(rgbaOf(cssColor(root, 'var(--global-color-text-3)')));
		expect(set(1).borderDash).toEqual([6, 5]);
		expect(set(1).fill).toBe(false);
		const plugins = chart().options.plugins as unknown as Record<string, { index?: number; blur?: number; color?: string }>;
		expect(plugins.auroraGlow.index).toBe(0);
		expect(plugins.auroraGlow.blur).toBeGreaterThan(0);
		expect(plugins.auroraCrosshair.color).toMatch(/^rgba/);
	});

	test('series without color take the data palette when there are several', async () => {
		const { set, root, chart } = await renderChart({
			data: { labels: ['A', 'B'], datasets: [{ label: 'X', data: [1, 2] }, { label: 'Y', data: [2, 3] }] }
		});
		expect(set(0).borderColor).toBe(rgbaOf(cssColor(root, 'var(--global-color-data-1)')));
		expect(set(1).borderColor).toBe(rgbaOf(cssColor(root, 'var(--global-color-data-2)')));
		expect((chart().options.plugins as unknown as Record<string, { index: number }>).auroraGlow.index).toBe(-1);
	});

	test('axis right adds a second value axis', async () => {
		const { set, chart } = await renderChart({
			data: { labels: ['A', 'B'], datasets: [{ label: 'X', data: [1, 2] }, { label: 'Y', data: [20, 30], axis: 'right' }] }
		});
		expect(set(1).yAxisID).toBe('y1');
		expect((chart().options.scales as Record<string, { position: string }>).y1.position).toBe('right');
	});

	test('the tooltip lists every series of the hovered label, written with format', async () => {
		const { chart, root } = await renderChart({ data: year, format: { style: 'currency', currency: 'EUR' } });
		await expect
			.poll(() => {
				hover(chart(), 0, 3);
				return root.querySelector('.aurora-chart-tooltip-title')?.textContent;
			})
			.toBe('Apr');
		expect([...root.querySelectorAll('.aurora-chart-tooltip-value')].map((v) => v.textContent)).toEqual(['€40.00', '€30.00']);
	});

	test('legend hides a series on click', async () => {
		const { screen, chart } = await renderChart({ data: year });
		await screen.getByRole('button', { name: '2025' }).click();
		await expect.poll(() => chart().isDatasetVisible(1)).toBe(false);
	});

	test('onitemclick receives the clicked point', async () => {
		const onitemclick = vi.fn<(item: ChartItemClick) => void>();
		const { chart } = await renderChart({ data: year, onitemclick });
		const { x, y } = elementCenter(chart(), 0, 2);
		chart().canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
		await expect.poll(() => onitemclick.mock.calls[0]?.[0]).toMatchObject({ index: 2, datasetIndex: 0, label: 'Mar', value: 20 });
	});

	test('dragging zooms on the horizontal axis and "Reset zoom" brings back the whole chart', async () => {
		const { screen, chart } = await renderChart({ data: year });
		await expect.poll(() => typeof chart().resetZoom).toBe('function');
		dragAcross(chart(), 0.1, 0.7);
		const reset = screen.getByRole('button', { name: 'Reset zoom' });
		await expect.element(reset).toBeInTheDocument();
		await reset.click();
		await expect.element(reset).not.toBeInTheDocument();
		expect(chart().isZoomedOrPanned()).toBe(false);
	});

	test('a long series of 1,440 points updates without recreating the chart', async () => {
		const data = $state<ChartData>({ labels: [], datasets: [{ label: 'Requests', data: [] }] });
		const { chart } = await renderChart({ data });
		const first = chart();
		data.labels = Array.from({ length: 1440 }, (_, i) => String(i));
		data.datasets[0].data = data.labels.map((_, i) => Math.sin(i / 50) * 100);
		flushSync();
		await expect.poll(() => chart().data.datasets[0].data.length).toBe(1440);
		expect(chart()).toBe(first);
	});

	test('CSS variables per instance reach the canvas', async () => {
		const { chart, set } = await renderChart({
			data: { labels: ['A', 'B'], datasets: [{ label: 'X', data: [1, 2], color: 'red' }] },
			style: '--line-chart-line-width: 5px; --line-chart-crosshair-color: rgb(1, 2, 3); --line-chart-height: 200px'
		});
		expect((set(0) as unknown as { borderWidth: number }).borderWidth).toBe(5);
		expect((chart().options.plugins as unknown as Record<string, { color: string }>).auroraCrosshair.color).toBe('rgb(1, 2, 3)');
		expect(chart().canvas.parentElement!.parentElement!.getBoundingClientRect().height).toBe(200);
	});
});
