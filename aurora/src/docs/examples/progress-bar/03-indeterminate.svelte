<!-- @component Indeterminate and tooltip
`indeterminate` slides a bar back and forth while the length of the work is unknown. `valueTooltip` shows the value when the pointer is over the bar; `valueTooltipLabel` replaces it with a text. -->
<script lang="ts">
	import { ProgressBar } from '#lib';
</script>

<div class="stack">
	<ProgressBar indeterminate label="Syncing calendar…" --progress-bar-height="4px" />
	<ProgressBar
		value={36}
		total={50}
		aria-label="Seats booked"
		valueTooltip
		valueTooltipLabel="36 of 50 seats booked"
	/>
</div>

<style>
	.stack {
		display: grid;
		gap: 24px;
		width: min(100%, 420px);
	}
</style>
