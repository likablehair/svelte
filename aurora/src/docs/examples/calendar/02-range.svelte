<!-- @component Range and limits
With `range` the first click sets `selectedDate` and the second `selectedDateTo`; hovering previews the range. `min`, `max` and `isDateDisabled` (here: Sundays, the salon is closed) decide which days can be chosen. -->
<script lang="ts">
	import { Calendar } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 8));
	let selectedDateTo = $state<Date | undefined>(new Date(2026, 8, 19));

	const format = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
	const label = $derived(
		selectedDate && selectedDateTo
			? `${format.format(selectedDate)} – ${format.format(selectedDateTo)}`
			: selectedDate
				? `From ${format.format(selectedDate)}, choose the last day`
				: 'Choose the first day'
	);
</script>

<div class="example">
	<Calendar
		range
		bind:selectedDate
		bind:selectedDateTo
		min={new Date(2026, 8, 3)}
		max={new Date(2026, 10, 30)}
		isDateDisabled={(date) => date.getDay() === 0}
		aria-label="Holiday"
	/>
	<p>{label}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: 280px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
