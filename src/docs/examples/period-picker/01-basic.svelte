<!-- @component Basic
The field shows the name of the period and its dates. A preset applies at once; a custom range or a relative period is applied with Apply. The arrows move the period back and forth by its length. -->
<script lang="ts">
	import { PeriodPicker, type TimespanSettings } from '#lib';

	let timespanSettings = $state<TimespanSettings>({ method: 'quick', values: 'this-month' });
	let days = $state('');
</script>

<div class="demo">
	<PeriodPicker
		bind:timespanSettings
		onchange={({ from, to }) => (days = [from?.toDateString(), to?.toDateString()].join(' → '))}
	/>
	<pre>{JSON.stringify(timespanSettings)}</pre>
	{#if days}<p>{days}</p>{/if}
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	pre,
	p {
		margin: 0;
		font-size: 12px;
	}
</style>
