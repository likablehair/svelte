import type { Chart } from 'chart.js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import PieChart from '#lib/components/simple/charts/PieChart.svelte';
import type { ChartData, ChartItemClick } from '#lib/utils/chart/types.js';
import { cssColor, elementCenter, hover, rgbaOf } from '../charts.js';

const services: ChartData = {
	labels: ['Color', 'Cut', 'Treatments', 'Retail'],
	datasets: [{ label: 'Services', data: [500, 300, 150, 50] }]
};

async function renderChart(props: Record<string, unknown>) {
	const box: { chart?: Chart } = {};
	const screen = await render(PieChart, {
		...(props as unknown as ComponentProps<typeof PieChart>),
		get chart() {
			return box.chart;
		},
		set chart(value: Chart | undefined) {
			box.chart = value;
		}
	});
	await expect.poll(() => box.chart).toBeDefined();
	return {
		screen,
		chart: () => box.chart!,
		root: screen.container.querySelector<HTMLElement>('.aurora-pie-chart')!
	};
}

const total = (root: HTMLElement) => root.querySelector('.aurora-pie-chart-total')?.textContent;

describe('PieChart', () => {
	test('a donut by default, with the total in the middle and centerLabel below', async () => {
		const { chart, root } = await renderChart({ data: services, centerLabel: 'services' });
		expect((chart().options as { cutout: unknown }).cutout).toBe('72%');
		expect(total(root)).toBe('1,000');
		expect(root.querySelector('.aurora-pie-chart-center-label')?.textContent).toBe('services');
	});

	test('donut={false} draws a full pie without the center', async () => {
		const { chart, root } = await renderChart({ data: services, donut: false });
		expect((chart().options as { cutout: unknown }).cutout).toBe(0);
		expect(root.querySelector('.aurora-chart-overlay')).toBeNull();
	});

	test('showTotal={false} hides the total; centerSnippet replaces the middle', async () => {
		const hidden = await renderChart({ data: services, showTotal: false });
		expect(hidden.root.querySelector('.aurora-chart-overlay')).toBeNull();
		hidden.screen.unmount();
		const centerSnippet = createRawSnippet((center: () => { total: number; formatted: string }) => ({
			render: () => `<b class="custom">${center().total}|${center().formatted}</b>`
		}));
		const { root } = await renderChart({ data: services, centerSnippet, format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } });
		expect(root.querySelector('.custom')?.textContent).toBe('1000|€1,000');
	});

	test('slices take the data palette in order; color takes an array of CSS colors', async () => {
		const palette = await renderChart({ data: services });
		const colors = palette.chart().data.datasets[0].backgroundColor as string[];
		expect(colors[0]).toBe(rgbaOf(cssColor(palette.root, 'var(--global-color-data-1)')));
		expect(colors[3]).toBe(rgbaOf(cssColor(palette.root, 'var(--global-color-data-4)')));
		palette.screen.unmount();
		const { chart, root } = await renderChart({
			data: { labels: ['Paid', 'Late'], datasets: [{ data: [3, 1], color: ['var(--global-color-success)', 'red'] }] }
		});
		expect(chart().data.datasets[0].backgroundColor).toEqual([rgbaOf(cssColor(root, 'var(--global-color-success)')), 'red']);
	});

	test('the legend sits on the right with the share of every slice; a click hides the slice and recounts', async () => {
		const { screen, chart, root } = await renderChart({ data: services });
		expect(root).toHaveAttribute('data-legend', 'right');
		const cut = screen.getByRole('button', { name: 'Cut 30%' });
		await expect.element(cut).toHaveAttribute('aria-pressed', 'true');
		await screen.getByRole('button', { name: 'Color 50%' }).click();
		await expect.poll(() => chart().getDataVisibility(0)).toBe(false);
		await expect.poll(() => total(root)).toBe('500');
		await expect.element(screen.getByRole('button', { name: 'Cut 60%' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Color', pressed: false })).toBeInTheDocument();
	});

	test('a narrow chart moves the legend below', async () => {
		const { root } = await renderChart({ data: services, style: '--pie-chart-width: 300px' });
		await expect.poll(() => root.getAttribute('data-legend')).toBe('bottom');
	});

	test('the tooltip shows the slice, its value and its share', async () => {
		const { chart, root } = await renderChart({ data: services, format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } });
		await expect
			.poll(() => {
				hover(chart(), 0, 1);
				return root.querySelector('.aurora-chart-tooltip-title')?.textContent;
			})
			.toBe('Cut');
		expect(root.querySelector('.aurora-chart-tooltip-value')?.textContent).toBe('€300 · 30%');
	});

	test('onitemclick receives the clicked slice', async () => {
		const onitemclick = vi.fn<(item: ChartItemClick) => void>();
		const { chart } = await renderChart({ data: services, onitemclick });
		const { x, y } = elementCenter(chart(), 0, 1);
		chart().canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
		await expect.poll(() => onitemclick.mock.calls[0]?.[0]).toMatchObject({ index: 1, datasetIndex: 0, label: 'Cut', value: 300 });
	});

	test('the hidden table has values and shares for screen readers', async () => {
		const { screen } = await renderChart({ data: services, label: 'Services by type' });
		await expect.element(screen.getByRole('img', { name: 'Services by type' })).toBeInTheDocument();
		const table = screen.getByRole('table', { name: 'Services by type' });
		await expect.element(table.getByRole('row', { name: 'Treatments 150 15%' })).toBeInTheDocument();
	});

	test('no zoom on a pie', async () => {
		const { chart } = await renderChart({ data: services });
		const plugins = chart().options.plugins as { zoom: { zoom: { drag: { enabled: boolean } } } };
		expect(plugins.zoom.zoom.drag.enabled).toBe(false);
	});
});
