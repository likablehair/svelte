<!-- @component Locale and format
`locale` sets the format, the names in the calendar, the first day of the week and the texts: with `it` the chip reads `gg/mm/aaaa` and the buttons and the error are in Italian (`setDefaultLocale('it')` in the root layout does it for the whole app). Text props such as `invalidText` win over it. `format` sets any order and separator with `dd`, `MM` and `yyyy`. -->
<script lang="ts">
	import { DatePickerTextField } from '#lib';

	let italian = $state<Date | undefined>(new Date(2026, 8, 24));
	let iso = $state<Date | undefined>(new Date(2026, 8, 24));
</script>

<div class="example">
	<DatePickerTextField
		label="Data appuntamento"
		locale="it"
		invalidText="Data non valida"
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
