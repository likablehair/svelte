<!-- @component Mobile drawer
On screens up to 1024px wide (try it in a narrow window) focusing the field does not open anything: the field stays typable, and the calendar button opens the panel in a bottom drawer titled `drawerTitle`, with the time below the calendar. `mobileDrawer={false}` keeps the menu, `closeOnSelect={false}` keeps the panel open after a choice. -->
<script lang="ts">
	import { DateTimePickerTextField } from '#lib';

	let value = $state<Date | undefined>(new Date(2026, 8, 25, 19, 0));
</script>

<div class="example">
	<DateTimePickerTextField label="Dinner" locale="en-GB" drawerTitle="Dinner date and time" bind:value />
	<DateTimePickerTextField
		label="Reminder"
		locale="en-GB"
		closeOnSelect={false}
		mobileDrawer={false}
		value={new Date(2026, 8, 25, 7, 45)}
	/>
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: min(100%, 360px);
	}
</style>
