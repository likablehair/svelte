<!-- @component Choose a day
A calendar panel: the arrows change month, the title opens the months and then the years. `bind:selectedDate` holds the chosen day. -->
<script lang="ts">
	import { DatePicker } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePicker bind:selectedDate aria-label="Appointment day" />
	<p>{selectedDate ? selectedDate.toDateString() : 'No day chosen'}</p>
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
