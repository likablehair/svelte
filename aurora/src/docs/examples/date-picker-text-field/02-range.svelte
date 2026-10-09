<!-- @component Range
With `range` the field has a start and an end input, and the calendar picks the start with the first click and the end with the second, then closes. -->
<script lang="ts">
	import { DatePickerTextField } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 11));
	let selectedDateTo = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePickerTextField
		label="Report period"
		locale="en-GB"
		range
		clearable
		bind:selectedDate
		bind:selectedDateTo
	/>
</div>

<style>
	.example {
		width: 380px;
	}
</style>
