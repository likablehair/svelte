<!-- @component Views and locale
`view` decides what the panel shows and can be bound: here it starts on the months. `locale` translates names and title and sets the first day of the week. -->
<script lang="ts">
	import { DatePicker } from '#lib';

	let view = $state<'day' | 'month' | 'year'>('month');
	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePicker locale="it" bind:view bind:selectedDate aria-label="Data" />
	<p>View: {view}</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
