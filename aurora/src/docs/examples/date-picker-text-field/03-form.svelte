<!-- @component Limits and forms
`min`, `max` and `isDateDisabled` limit the calendar and the typed date: an invalid or unfinished date shows `invalidText` and the form refuses it. With `name` the date is submitted as `yyyy-MM-dd`. -->
<script lang="ts">
	import { Button, DatePickerTextField } from '#lib';

	let submitted = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		submitted = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form onsubmit={submit}>
	<DatePickerTextField
		label="Booking"
		name="booking"
		locale="en-GB"
		required
		clearable
		min={new Date(2026, 8, 1)}
		max={new Date(2026, 11, 31)}
		isDateDisabled={(date) => date.getDay() === 0}
		hint="September to December, closed on Sundays"
	/>
	<DatePickerTextField label="Birth date" locale="en-GB" state="error" hint="Required for the loyalty card" />
	<Button type="submit">Book</Button>
	<p>{submitted ? `Submitted: ${submitted}` : 'Nothing submitted yet'}</p>
</form>

<style>
	form {
		display: grid;
		justify-items: start;
		gap: 14px;
		width: 340px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
