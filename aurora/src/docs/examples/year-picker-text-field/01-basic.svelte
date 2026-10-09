<!-- @component Type or choose a year
Type four digits or pick the year in the grid, which opens on the chosen year. `min` and `max` limit both. -->
<script lang="ts">
	import { YearPickerTextField } from '#lib';

	let selectedYear = $state<number | undefined>(2026);
</script>

<div class="example">
	<YearPickerTextField
		label="Model year"
		min={1990}
		max={2030}
		clearable
		hint="From 1990 to 2030"
		bind:selectedYear
	/>
</div>

<style>
	.example {
		width: 340px;
	}
</style>
