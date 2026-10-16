<!-- @component Two months
`months={2}` shows the visible month and the next side by side, which makes long ranges easier to pick; the arrows move both. `footerSnippet` adds content under the calendar, here the length of the range. -->
<script lang="ts">
	import { DatePicker } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 21));
	let selectedDateTo = $state<Date | undefined>(new Date(2026, 9, 4));

	let nights = $derived(
		selectedDate && selectedDateTo
			? Math.round((selectedDateTo.getTime() - selectedDate.getTime()) / 86_400_000)
			: 0
	);
</script>

<DatePicker range months={2} bind:selectedDate bind:selectedDateTo aria-label="Stay">
	{#snippet footerSnippet()}
		<p class="nights">{nights ? `${nights} nights` : 'Choose the last night'}</p>
	{/snippet}
</DatePicker>

<style>
	.nights {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
