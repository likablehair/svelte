<!-- @component Panel
`PeriodSelector` is the panel of `PeriodPicker` on its own, for a page or a side panel: every click changes the value at once and calls `onchange` with the days it covers. -->
<script lang="ts">
	import { PeriodSelector, type TimespanSettings } from '#lib';

	let timespanSettings = $state<TimespanSettings>({
		method: 'picker',
		values: { from: new Date(2026, 8, 10), to: new Date(2026, 8, 23) }
	});
	let days = $state('');
</script>

<div class="demo">
	<div class="panel">
		<PeriodSelector
			bind:timespanSettings
			onchange={({ from, to }) => (days = [from?.toDateString(), to?.toDateString()].join(' → '))}
		/>
	</div>
	<p>{days || 'Pick a period'}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	.panel {
		max-width: 100%;
		overflow: hidden;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-pop);
	}

	p {
		margin: 0;
		font-size: 12px;
	}
</style>
