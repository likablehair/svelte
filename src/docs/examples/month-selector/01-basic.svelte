<!-- @component Choose a month
The twelve months of `year`. The current month has a border; with `min` and `max` the months outside them cannot be chosen. -->
<script lang="ts">
	import { MonthSelector } from '#lib';

	let selectedMonth = $state<number | undefined>(8);
</script>

<div class="example">
	<MonthSelector
		bind:selectedMonth
		year={2026}
		max={new Date(2026, 10, 30)}
		aria-label="Billing month"
	/>
</div>

<style>
	.example {
		width: 270px;
	}
</style>
