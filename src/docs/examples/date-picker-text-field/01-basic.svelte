<!-- @component Type or choose
Type the digits (the separators come by themselves) or open the calendar: focus the field, then Arrow Down moves into the calendar and Escape closes it. Choosing a day closes it. On a phone the calendar button opens a bottom drawer instead. -->
<script lang="ts">
	import { DatePickerTextField, toISODate } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePickerTextField label="Appointment date" bind:selectedDate />
	<p>Value: {selectedDate ? toISODate(selectedDate) : 'none'}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: 340px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
