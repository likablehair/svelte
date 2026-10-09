<!-- @component Choose a day
`bind:selectedDate` holds the chosen day, a `Date` at local midnight. Click a day, or focus the grid and use the arrow keys, Home, End, Page Up and Page Down, then Enter. -->
<script lang="ts">
	import { Calendar } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<Calendar bind:selectedDate aria-label="Appointment day" />
	<p>{selectedDate ? selectedDate.toDateString() : 'No day chosen'}</p>
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
