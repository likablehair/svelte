<!-- @component States and forms
With `name` the value is submitted as the local `yyyy-MM-ddTHH:mm` (empty without a value), `required` reaches the input and `clearable` adds a button that empties it. `state` and `hint` show a validation message; `disabled` and `readonly` lock the field. -->
<script lang="ts">
	import { Button, DateTimePickerTextField } from '#lib';

	let submitted = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		submitted = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form onsubmit={submit}>
	<DateTimePickerTextField
		label="Starts"
		name="starts"
		locale="en-GB"
		value={new Date(2026, 8, 24, 9, 0)}
		required
		clearable
	/>
	<DateTimePickerTextField label="Ends" name="ends" locale="en-GB" state="error" hint="The end must be after the start" />
	<DateTimePickerTextField label="Published" locale="en-GB" value={new Date(2026, 8, 1, 8, 0)} state="success" hint="Saved" />
	<DateTimePickerTextField label="Created" locale="en-GB" value={new Date(2026, 7, 31, 17, 45)} disabled />
	<DateTimePickerTextField label="Updated" locale="en-GB" value={new Date(2026, 8, 23, 11, 5)} readonly />
	<Button type="submit">Save event</Button>
	<p>{submitted ? `Submitted: ${submitted}` : 'Nothing submitted yet'}</p>
</form>

<style>
	form {
		display: grid;
		justify-items: start;
		gap: 14px;
		width: min(100%, 360px);
	}

	form > :global(.aurora-date-time-picker-text-field) {
		justify-self: stretch;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
		overflow-wrap: anywhere;
	}
</style>
