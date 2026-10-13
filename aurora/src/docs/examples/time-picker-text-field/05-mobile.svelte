<!-- @component Mobile drawer
On screens up to 1024px wide (try it in a narrow window) focusing the field does not open anything: the field stays typable with the keyboard, and the clock button opens the panel in a bottom drawer titled `drawerTitle`. `mobileDrawer={false}` keeps the menu, `closeOnSelect={false}` keeps the panel open after a choice. -->
<script lang="ts">
	import { TimePickerTextField } from '#lib';

	let value = $state<string | undefined>('19:00');
</script>

<div class="example">
	<TimePickerTextField label="Dinner" locale="en-GB" drawerTitle="Dinner time" bind:value />
	<TimePickerTextField label="Reminder" locale="en-GB" closeOnSelect={false} mobileDrawer={false} value="07:45" />
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: 340px;
	}
</style>
