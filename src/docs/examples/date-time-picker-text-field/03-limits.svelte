<!-- @component Limits and step
`min` and `max` are instants: they limit the days of the calendar and, on their own day, the hours and minutes, and a typed date and time outside them shows `invalidText`. Choosing a day moves the time inside the limits. `isDateDisabled` turns days off and `minuteStep` sets the minutes of the panel; any minute can still be typed. -->
<script lang="ts">
	import { DateTimePickerTextField } from '#lib';

	let value = $state<Date | undefined>(new Date(2026, 8, 24, 12, 15));
</script>

<div class="example">
	<DateTimePickerTextField
		label="Delivery"
		locale="en-GB"
		min={new Date(2026, 8, 22, 8, 30)}
		max={new Date(2026, 9, 9, 18, 0)}
		isDateDisabled={(date) => date.getDay() === 0}
		minuteStep={15}
		hint="From 22/09 08:30 to 09/10 18:00, closed on Sundays"
		bind:value
	/>
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: min(100%, 360px);
	}
</style>
