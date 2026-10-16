<!-- @component Many points and zoom
A day measured every minute: 1,440 points. Drag across the chart to zoom on a stretch of time, hold Ctrl and drag to move; the "Reset zoom" button brings back the whole day. `zoom={false}` turns zooming off. -->
<script lang="ts">
	import { LineChart } from '#lib';

	const labels = Array.from({ length: 1440 }, (_, i) => `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`);
	const values = labels.map((_, i) => {
		const hour = i / 60;
		const day = Math.max(0, Math.sin(((hour - 6) / 16) * Math.PI));
		return Math.round(30 + day * 170 + Math.sin(i / 40) * 10 + Math.cos(i / 97) * 6);
	});
	const data = { labels, datasets: [{ label: 'Requests', data: values }] };
</script>

<LineChart {data} label="Requests per minute" />
