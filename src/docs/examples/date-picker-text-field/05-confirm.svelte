<!-- @component Two months and Apply
`months={2}` shows two months side by side in the menu (one in the mobile drawer). With `confirm` the clicks only change a draft: Apply saves it and calls `onchange`, Cancel, Escape or a click outside discard it, and with `clearable` Clear empties the field. Useful when every change starts a new search. -->
<script lang="ts">
	import { DatePickerTextField } from '#lib';

	let selectedDate = $state<Date | undefined>(new Date(2026, 8, 7));
	let selectedDateTo = $state<Date | undefined>(new Date(2026, 9, 2));
	let searches = $state(0);
</script>

<div class="example">
	<DatePickerTextField
		label="Invoices issued"
		locale="en-GB"
		range
		months={2}
		confirm
		clearable
		bind:selectedDate
		bind:selectedDateTo
		onchange={() => searches++}
	/>
	<p>Searches run: {searches}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 12px;
		width: 380px;
	}

	p {
		margin: 0;
		font-size: 14px;
	}
</style>
