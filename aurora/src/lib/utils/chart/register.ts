import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	DoughnutController,
	Filler,
	LinearScale,
	LineController,
	LineElement,
	LogarithmicScale,
	PointElement,
	Tooltip
} from 'chart.js';

let registered = false;
let zoom: Promise<void> | undefined;

export function registerCharts() {
	if (registered) return;
	registered = true;
	Chart.register(
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		DoughnutController,
		ArcElement,
		CategoryScale,
		LinearScale,
		LogarithmicScale,
		Filler,
		Tooltip
	);
}

export function registerZoom(): Promise<void> {
	zoom ??= import('chartjs-plugin-zoom').then(({ default: plugin }) => Chart.register(plugin));
	return zoom;
}
