<!-- @component Segmented
`variant="segmented"`: a pill with a thumb that slides to the selected option, for switching views. `badge` adds a short count. -->
<script lang="ts">
	import { mdiCalendarToday } from '@mdi/js';
	import { TabSwitcher } from '#lib';

	let view = $state('day');
</script>

<div class="calendar">
	<TabSwitcher
		variant="segmented"
		aria-label="Calendar view"
		tabs={[
			{ name: 'day', label: 'Day', icon: mdiCalendarToday },
			{ name: 'week', label: 'Week' },
			{ name: 'month', label: 'Month', badge: 12 }
		]}
		bind:selected={view}
	/>
	<p>Showing the <strong>{view}</strong> view.</p>
</div>

<style>
	.calendar {
		display: grid;
		justify-items: center;
		gap: 12px;
		width: 100%;
	}

	p {
		margin: 0;
		font-size: 14px;
	}
</style>
