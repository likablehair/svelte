<!-- @component Choose a time
Hours and minutes in two columns that scroll to the chosen time when they appear. The value is a 24-hour `HH:mm` string; with the default `en` locale the clock is 12-hour and a third column chooses AM or PM. -->
<script lang="ts">
	import { TimePicker } from '#lib';

	let value = $state<string | undefined>('14:30');
</script>

<div class="example">
	<TimePicker bind:value aria-label="Start time" />
	<p>Value: {value ?? 'none'}</p>
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
