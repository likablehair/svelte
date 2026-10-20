<!-- @component Grouped by day
`groupBy="day"` adds a heading before the items of each day and shows only their times. A function instead returns the heading of each item; consecutive items with the same heading share it. -->
<script lang="ts">
	import { Timeline, type TimelineItem } from '#lib';

	const items: TimelineItem[] = [
		{ title: 'Ticket opened', description: 'Printer offline', from: new Date(2026, 8, 22, 9, 12) },
		{ title: 'Assigned to Giulia', from: new Date(2026, 8, 22, 9, 40) },
		{ title: 'Technician on site', from: new Date(2026, 8, 23, 14, 0) },
		{ title: 'Spare part ordered', from: new Date(2026, 8, 23, 16, 25) },
		{ title: 'Ticket closed', description: 'Fuser replaced', from: new Date(2026, 8, 24, 11, 5) }
	];
</script>

<div class="demo">
	<Timeline {items} groupBy="day" locale="en-GB" />
</div>

<style>
	.demo {
		width: min(100%, 420px);
	}
</style>
