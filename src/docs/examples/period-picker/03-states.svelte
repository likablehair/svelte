<!-- @component Values and states
A custom range, a relative period, an open range (from a day on), no value with its placeholder, `shiftable={false}` without the arrows, and `disabled`. -->
<script lang="ts">
	import { PeriodPicker, type TimespanSettings } from '#lib';

	let custom = $state<TimespanSettings>({
		method: 'picker',
		values: { from: new Date(2026, 8, 10), to: new Date(2026, 8, 23) }
	});
	let rolling = $state<TimespanSettings>({
		method: 'rolling',
		values: { numberOfUnits: 3, measurementUnit: 'months', direction: 'last' }
	});
	let open = $state<TimespanSettings>({ method: 'picker', values: { from: new Date(2026, 8, 1) } });
	let empty = $state<TimespanSettings>();
	let fixed = $state<TimespanSettings>({ method: 'quick', values: 'this-year' });
	let off = $state<TimespanSettings>({ method: 'quick', values: 'total' });
</script>

<div class="demo">
	<PeriodPicker bind:timespanSettings={custom} />
	<PeriodPicker bind:timespanSettings={rolling} />
	<PeriodPicker bind:timespanSettings={open} />
	<PeriodPicker bind:timespanSettings={empty} />
	<PeriodPicker bind:timespanSettings={fixed} shiftable={false} />
	<PeriodPicker bind:timespanSettings={off} disabled />
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}
</style>
