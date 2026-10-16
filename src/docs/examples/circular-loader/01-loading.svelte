<!-- @component Loading
Without `value` the ring spins. `--circular-loader-size` sets the size and the thickness follows it. The ring takes the theme gradient; `--circular-loader-color` sets any color, and `currentColor` matches the text around it. Next to a text that already says what is happening, `label=""` hides the loader from screen readers. -->
<script lang="ts">
	import { CircularLoader } from '#lib';
</script>

<div class="rows">
	<div class="row">
		<CircularLoader --circular-loader-size="24px" />
		<CircularLoader />
		<CircularLoader --circular-loader-size="48px" />
		<CircularLoader --circular-loader-size="72px" />
	</div>
	<div class="row">
		<CircularLoader --circular-loader-color="var(--global-color-success)" />
		<CircularLoader --circular-loader-color="var(--global-color-warning)" />
		<span class="status">
			<CircularLoader label="" --circular-loader-size="16px" --circular-loader-color="currentColor" />
			Syncing appointments…
		</span>
	</div>
</div>

<style>
	.rows {
		display: grid;
		gap: 20px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 20px;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--global-color-text-2);
		font-size: 14px;
	}
</style>
