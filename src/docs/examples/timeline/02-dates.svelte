<!-- @component Dates and ranges
`from` and `to` take a `Date`, an ISO string or a timestamp. Dates follow `locale`: day, short month and year, plus the time when it is not midnight; with `to` the timeline shows a range. `dateFormat` takes `Intl.DateTimeFormat` options for a different format. -->
<script lang="ts">
	import { Timeline, type TimelineItem } from '#lib';

	const items: TimelineItem[] = [
		{ title: 'Contratto firmato', from: new Date(2026, 8, 1) },
		{ title: 'Sopralluogo', from: '2026-09-07T15:00:00' },
		{ title: 'Lavori', from: new Date(2026, 8, 14), to: new Date(2026, 8, 25) },
		{ title: 'Collaudo', from: new Date(2026, 9, 2, 9, 0), to: new Date(2026, 9, 2, 12, 30) }
	];
</script>

<div class="columns">
	<Timeline {items} locale="it" />
	<Timeline {items} locale="en-US" dateFormat={{ weekday: 'short', day: 'numeric', month: 'long' }} />
</div>

<style>
	.columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 32px;
		width: min(100%, 640px);
	}
</style>
