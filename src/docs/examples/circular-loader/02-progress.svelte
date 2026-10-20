<!-- @component Progress
With `value` the ring fills up to `value / total` and the change is animated. The content in the middle comes from `children`, which receives the percentage. -->
<script lang="ts">
	import { Button, CircularLoader } from '#lib';

	let uploaded = $state(18);
</script>

<div class="row">
	<CircularLoader value={72} label="Monthly goal" --circular-loader-size="72px">
		{#snippet children({ percent })}{Math.round(percent)}%{/snippet}
	</CircularLoader>
	<CircularLoader value={uploaded} total={24} label="Uploaded photos" --circular-loader-size="72px">
		{#snippet children({ value, total })}{value}/{total}{/snippet}
	</CircularLoader>
	<CircularLoader value={uploaded} total={24} label="Uploaded photos" />
	<div class="actions">
		<Button variant="secondary" size="sm" onclick={() => (uploaded = Math.max(0, uploaded - 4))}>−4</Button>
		<Button variant="secondary" size="sm" onclick={() => (uploaded = Math.min(24, uploaded + 4))}>+4</Button>
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 24px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}
</style>
