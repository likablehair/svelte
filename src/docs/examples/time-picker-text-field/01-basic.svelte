<!-- @component Type or choose
Type the digits (the colon comes by itself) or open the panel: focus the field, then Arrow Down moves into the hours, Arrow Right to the minutes and Escape closes it. Choosing the minutes closes it. On a phone the clock button opens a bottom drawer instead. -->
<script lang="ts">
	import { TimePickerTextField } from '#lib';

	let value = $state<string | undefined>('09:30');
</script>

<div class="example">
	<TimePickerTextField label="Appointment time" locale="en-GB" bind:value />
	<p>Value: {value ?? 'none'}</p>
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
