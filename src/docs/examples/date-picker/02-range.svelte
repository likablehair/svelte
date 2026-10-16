<!-- @component Range
With `range` the first click sets the start and the second the end; hovering previews the range. `min` and `max` also disable the arrows, the months and the years outside them. -->
<script lang="ts">
	import { DatePicker } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 11));
	let selectedDateTo = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<DatePicker
	range
	bind:selectedDate
	bind:selectedDateTo
	min={new Date(2026, 0, 1)}
	max={new Date(2027, 11, 31)}
	aria-label="Stay"
/>
