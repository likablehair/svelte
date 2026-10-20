<!-- @component Two months
`months={2}` shows two months side by side, handy for ranges across the end of a month. On screens up to 768px wide the panel shows one month anyway. -->
<script lang="ts">
	import { PeriodSelector, type TimespanSettings } from '#lib';

	let timespanSettings = $state<TimespanSettings>({
		method: 'picker',
		values: { from: new Date(2026, 7, 24), to: new Date(2026, 8, 6) }
	});
</script>

<div class="panel">
	<PeriodSelector bind:timespanSettings months={2} />
</div>

<style>
	.panel {
		width: fit-content;
		max-width: 100%;
		overflow: hidden;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-pop);
	}
</style>
