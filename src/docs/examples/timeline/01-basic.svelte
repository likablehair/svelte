<!-- @component Progress
`status` marks each item as done, current or upcoming: done markers are filled, the current one pulses and is announced with `aria-current="step"`, upcoming ones stay empty. `time` shows a free label instead of the dates. -->
<script lang="ts">
	import { Timeline, type TimelineItem } from '#lib';

	const items: TimelineItem[] = [
		{
			title: 'Check-in',
			description: 'The client arrived at the salon',
			from: new Date(2026, 8, 24, 9, 30),
			status: 'done'
		},
		{
			title: 'Color applied',
			description: '6.3 with 20 vol. developer',
			from: new Date(2026, 8, 24, 9, 40),
			status: 'done'
		},
		{ title: 'Processing', description: '12 minutes left', time: 'Now', status: 'current' },
		{ title: 'Blow-dry and payment', from: new Date(2026, 8, 24, 10, 30), status: 'upcoming' }
	];
</script>

<div class="demo">
	<Timeline {items} />
</div>

<style>
	.demo {
		width: min(100%, 420px);
	}
</style>
