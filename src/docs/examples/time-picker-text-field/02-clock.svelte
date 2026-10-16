<!-- @component 12-hour clock and locale
With the default `en` locale the clock is 12-hour: type `930p` (A and P set AM and PM) or a 24-hour time like `1430`, which becomes `02:30 PM`. The value stays `HH:mm`. `locale="it"` gives the 24-hour clock and the Italian texts, `hour12` forces either; text props such as `invalidText` win over the texts of `locale`. -->
<script lang="ts">
	import { TimePickerTextField } from '#lib';

	let value = $state<string | undefined>('14:30');
</script>

<div class="example">
	<TimePickerTextField label="Pickup time" bind:value />
	<TimePickerTextField
		label="Orario di ritiro"
		locale="it"
		invalidText="Inserisci un orario valido"
		bind:value
	/>
	<p>Value: {value ?? 'none'}</p>
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
		width: 340px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
