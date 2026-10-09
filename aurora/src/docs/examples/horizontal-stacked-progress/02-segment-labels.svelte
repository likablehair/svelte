<!-- @component Labels under the segments
`segmentLabels` writes each label and value under its segment; `minLabelPercentage` hides them on segments too narrow to hold them. `legend={false}` hides the legend, which stays readable for screen readers. Entries can be plain numbers or set their own `color`. -->
<script lang="ts">
	import { HorizontalStackedProgress } from '#lib';

	const hours = [
		{ label: 'Booked', value: 31, valueLabel: '31h' },
		{ label: 'Walk-in', value: 9, valueLabel: '9h' },
		{ label: 'Blocked', value: 2, valueLabel: '2h', color: 'var(--global-color-error)' }
	];
</script>

<div class="stack">
	<HorizontalStackedProgress
		progresses={hours}
		label="Hours this week"
		segmentLabels
		minLabelPercentage={8}
		legend={false}
	/>
	<HorizontalStackedProgress progresses={[5, 3, 2, 1]} aria-label="Ratings" --horizontal-stacked-progress-height="6px" />
</div>

<style>
	.stack {
		display: grid;
		gap: 28px;
		width: min(100%, 420px);
	}
</style>
