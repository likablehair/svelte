<!-- @component Label and value
`label` names the bar (also for screen readers) and `showValue` adds the percentage. Changes of `value` are animated. -->
<script lang="ts">
	import { Button, ProgressBar } from '#lib';

	let booked = $state(72);
</script>

<div class="stack">
	<ProgressBar value={booked} label="Monthly goal" showValue />
	<div class="actions">
		<Button variant="secondary" size="sm" onclick={() => (booked = Math.max(0, booked - 12))}>−12</Button>
		<Button variant="secondary" size="sm" onclick={() => (booked = Math.min(100, booked + 12))}>+12</Button>
	</div>
</div>

<style>
	.stack {
		display: grid;
		gap: 16px;
		width: min(100%, 420px);
	}

	.actions {
		display: flex;
		gap: 8px;
	}
</style>
