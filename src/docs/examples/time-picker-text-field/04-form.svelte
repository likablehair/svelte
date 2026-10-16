<!-- @component States and forms
With `name` the time is submitted as `HH:mm` (empty without a time), `required` reaches the input and `clearable` adds a button that empties it. `state` and `hint` show a validation message; `disabled` and `readonly` lock the field. -->
<script lang="ts">
	import { Button, TimePickerTextField } from '#lib';

	let submitted = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		submitted = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form onsubmit={submit}>
	<TimePickerTextField label="Opening" name="opening" locale="en-GB" value="08:30" required clearable />
	<TimePickerTextField label="Closing" name="closing" locale="en-GB" state="error" hint="Closing must be after opening" />
	<TimePickerTextField label="Break" locale="en-GB" value="13:00" state="success" hint="Saved" />
	<TimePickerTextField label="Check-in" locale="en-GB" value="15:00" disabled />
	<TimePickerTextField label="Check-out" locale="en-GB" value="11:00" readonly />
	<Button type="submit">Save hours</Button>
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
