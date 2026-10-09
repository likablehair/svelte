<!-- @component Locale and marks
`locale` sets the names and the first day of the week through `Intl` (Italian weeks start on Monday). `dayAppendSnippet` adds a mark in the corner of the days with appointments. -->
<script lang="ts">
	import { Calendar, toISODate } from '#lib';

	const busy = new Set(['2026-09-03', '2026-09-11', '2026-09-17', '2026-09-29']);

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<Calendar locale="it" weekdayFormat="narrow" bind:selectedDate aria-label="Giorno">
		{#snippet dayAppendSnippet({ date, outside })}
			{#if !outside && busy.has(toISODate(date))}
				<span class="mark"></span>
			{/if}
		{/snippet}
	</Calendar>
</div>

<style>
	.mark {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--global-color-warning);
	}

	.example {
		width: 280px;
	}
</style>
