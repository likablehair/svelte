<!-- @component Limits and step
`min` and `max` limit the panel and the typed time: a time outside them, or one that does not exist, shows `invalidText` and the form refuses it. `minuteStep` sets the minutes of the panel; any minute can still be typed. -->
<script lang="ts">
	import { TimePickerTextField } from '#lib';

	let value = $state<string | undefined>('12:15');
</script>

<div class="example">
	<TimePickerTextField
		label="Delivery slot"
		locale="en-GB"
		min="08:00"
		max="20:00"
		minuteStep={15}
		hint="Between 08:00 and 20:00"
		bind:value
	/>
	<TimePickerTextField
		label="Night shift start"
		locale="en-GB"
		min="22:00"
		max="06:00"
		minuteStep={30}
		value="23:00"
		hint="From 22:00 to 06:00, across midnight"
	/>
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: 340px;
	}
</style>
