<!-- @component Limits and step
`min` and `max` disable the hours and minutes outside the range (when `min` is later than `max` the range crosses midnight), `minuteStep` sets the minutes offered. A chosen minute that is not on the step, like 08:10 here, stays in the list. -->
<script lang="ts">
	import { TimePicker } from '#lib';

	let value = $state<string | undefined>('08:10');
</script>

<div class="example">
	<TimePicker bind:value locale="en-GB" min="07:30" max="19:00" minuteStep={15} aria-label="Opening hours" />
	<p>From 07:30 to 19:00, every 15 minutes. Value: {value ?? 'none'}</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
