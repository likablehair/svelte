<!-- @component Type or choose
Type the digits (the separators, the space and the colon come by themselves) or open the panel: focus the field, then Arrow Down moves into the calendar, choosing a day with Enter moves to the hours and Escape closes it. A day keeps the time already chosen; choosing the minutes closes the panel. On a phone the calendar button opens a bottom drawer instead. -->
<script lang="ts">
	import { DateTimePickerTextField, toISODateTime } from '#lib';

	let value = $state<Date | undefined>(new Date(2026, 8, 24, 9, 30));
</script>

<div class="example">
	<DateTimePickerTextField label="Appointment" locale="en-GB" bind:value />
	<p>Value: {value ? toISODateTime(value) : 'none'}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: min(100%, 360px);
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
