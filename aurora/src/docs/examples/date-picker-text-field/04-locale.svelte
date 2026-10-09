<!-- @component Locale and format
`locale` sets the format, the names in the calendar and the first day of the week; `formatLabel` translates the chip. `format` sets any order and separator with `dd`, `MM` and `yyyy`. -->
<script lang="ts">
	import { DatePickerTextField } from '#lib';

	let italian = $state<Date | undefined>(new Date(2026, 8, 24));
	let iso = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePickerTextField
		label="Data appuntamento"
		locale="it"
		formatLabel="gg/mm/aaaa"
		openLabel="Scegli la data"
		bind:selectedDate={italian}
	/>
	<DatePickerTextField label="ISO format" format="yyyy-MM-dd" bind:selectedDate={iso} />
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: 340px;
	}
</style>
