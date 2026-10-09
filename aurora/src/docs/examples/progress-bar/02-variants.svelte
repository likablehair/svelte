<!-- @component Variants and custom value
Status colors for quotas and limits. `total` sets the value that fills the bar and `valueSnippet` replaces the percentage, here with "used of total". -->
<script lang="ts">
	import { ProgressBar } from '#lib';

	const quotas = [
		{ label: 'SMS reminders', used: 380, total: 1000, variant: 'success' },
		{ label: 'Storage', used: 8.2, total: 10, variant: 'warning' },
		{ label: 'Staff seats', used: 12, total: 12, variant: 'error' }
	] as const;
</script>

<div class="stack">
	{#each quotas as quota (quota.label)}
		<ProgressBar
			value={quota.used}
			total={quota.total}
			label={quota.label}
			variant={quota.variant}
			showValue
			--progress-bar-height="6px"
		>
			{#snippet valueSnippet({ value, total })}{value} / {total}{/snippet}
		</ProgressBar>
	{/each}
</div>

<style>
	.stack {
		display: grid;
		gap: 20px;
		width: min(100%, 420px);
	}
</style>
