<!-- @component Alternate sides
`alternate` places the items on both sides of the line, with the dates on the other side. Below 640px of width the timeline falls back to one column. -->
<script lang="ts">
	import { Timeline, type TimelineItem } from '#lib';

	const items: TimelineItem[] = [
		{ title: 'Founded', description: 'Two chairs in a garage', from: new Date(2018, 2, 1) },
		{ title: 'First salon', description: 'Via Roma, Turin', from: new Date(2019, 4, 15) },
		{ title: 'Online booking', description: '40% of appointments in the first year', from: new Date(2021, 0, 10) },
		{ title: 'Third salon', description: 'Milan, Porta Nuova', from: new Date(2024, 8, 2) }
	];
</script>

<Timeline {items} alternate locale="en-GB" dateFormat={{ month: 'long', year: 'numeric' }} />
