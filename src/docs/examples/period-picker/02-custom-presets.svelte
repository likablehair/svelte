<!-- @component Presets of the app
`quickSelectOptions` replaces the presets; those the library does not know need a `range`, which returns their first and last day. Remember that the backend must understand the saved values too. Texts and dates follow `locale`. -->
<script lang="ts">
	import { PeriodPicker, type PeriodPreset, type TimespanSettings } from '#lib';

	type Preset = 'yesterday' | 'last-7-days' | 'last-30-days' | 'this-month';

	const day = (now: Date, offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);

	const presets: PeriodPreset<Preset>[] = [
		{ value: 'yesterday', label: 'Ieri', range: (now) => [day(now, -1), day(now, -1)] },
		{ value: 'last-7-days', label: 'Ultimi 7 giorni', range: (now) => [day(now, -6), day(now, 0)] },
		{ value: 'last-30-days', label: 'Ultimi 30 giorni', range: (now) => [day(now, -29), day(now, 0)] },
		{ value: 'this-month', label: 'Questo mese' }
	];

	let timespanSettings = $state<TimespanSettings<Preset>>({ method: 'quick', values: 'last-7-days' });
</script>

<PeriodPicker bind:timespanSettings quickSelectOptions={presets} locale="it" />
