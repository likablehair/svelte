import type { Chart } from 'chart.js';

export function cssColor(root: HTMLElement, value: string) {
	const probe = document.createElement('span');
	probe.style.color = value;
	root.append(probe);
	const color = getComputedStyle(probe).color;
	probe.remove();
	return color;
}

export function rgbaOf(color: string) {
	const [r, g, b, a = '1'] = color.match(/[\d.]+/g) ?? [];
	return `rgba(${r}, ${g}, ${b}, ${Math.round(Number(a) * 1000) / 1000})`;
}

export function elementCenter(chart: Chart, datasetIndex: number, index: number) {
	const element = chart.getDatasetMeta(datasetIndex).data[index] as unknown as {
		getCenterPoint(final: boolean): { x: number; y: number };
	};
	const { x, y } = element.getCenterPoint(true);
	const rect = chart.canvas.getBoundingClientRect();
	return { x: rect.left + x, y: rect.top + y };
}

export function hover(chart: Chart, datasetIndex: number, index: number) {
	const { x, y } = elementCenter(chart, datasetIndex, index);
	chart.canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
}

export function dragAcross(chart: Chart, from: number, to: number) {
	const rect = chart.canvas.getBoundingClientRect();
	const area = chart.chartArea;
	const y = rect.top + (area.top + area.bottom) / 2;
	const at = (fraction: number) => ({
		bubbles: true,
		button: 0,
		buttons: 1,
		clientX: rect.left + area.left + (area.right - area.left) * fraction,
		clientY: y
	});
	chart.canvas.dispatchEvent(new MouseEvent('mousedown', at(from)));
	chart.canvas.dispatchEvent(new MouseEvent('mousemove', at(to)));
	chart.canvas.dispatchEvent(new MouseEvent('mouseup', at(to)));
}
