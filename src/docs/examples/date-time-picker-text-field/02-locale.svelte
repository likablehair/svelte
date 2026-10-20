<!-- @component Locale and clock
With the default `en` locale the date is MM/dd/yyyy and the clock is 12-hour: type `092420260230p` (A and P set AM and PM) or a 24-hour time like `14:30`, which becomes `02:30 PM`. `locale="it"` gives dd/MM/yyyy, the 24-hour clock and the Italian texts (the chip reads `gg/mm/aaaa hh:mm`); `format` and `hour12` force either part, and text props such as `openLabel` win over the texts of `locale`. -->
<script lang="ts">
	import { DateTimePickerTextField } from '#lib';

	let value = $state<Date | undefined>(new Date(2026, 8, 24, 14, 30));
</script>

<div class="example">
	<DateTimePickerTextField label="Pickup" bind:value />
	<DateTimePickerTextField
		label="Ritiro"
		locale="it"
		openLabel="Scegli quando ritirare"
		bind:value
	/>
	<DateTimePickerTextField label="ISO date, 24-hour clock" format="yyyy-MM-dd" hour12={false} bind:value />
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: min(100%, 360px);
	}
</style>
