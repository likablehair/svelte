<!-- @component Choose a year
Years from `min` to `max` in a grid that scrolls to the chosen year when it appears. -->
<script lang="ts">
	import { YearSelector } from '#lib';

	let selectedYear = $state<number | undefined>(2026);
</script>

<div class="example">
	<YearSelector bind:selectedYear min={1990} max={2035} aria-label="Year" />
	<p>{selectedYear ?? 'No year chosen'}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: 300px;
		--year-selector-max-height: 170px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
