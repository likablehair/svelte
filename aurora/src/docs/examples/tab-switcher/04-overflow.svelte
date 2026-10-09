<!-- @component Overflow and actions
Tabs that do not fit scroll sideways, and the selected tab is scrolled into view. `appendSnippet` puts content at the end of the row, outside the tabs. -->
<script lang="ts">
	import { mdiPlus } from '@mdi/js';
	import { Button, TabSwitcher } from '#lib';

	let months = $state(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August']);
	let selected = $state('August');

	function add() {
		const next = new Date(2026, months.length, 1).toLocaleString('en', { month: 'long' });
		months.push(next);
		selected = next;
	}
</script>

<div class="narrow">
	<TabSwitcher
		aria-label="Month"
		tabs={months.map((month) => ({ name: month, label: month }))}
		bind:selected
	>
		{#snippet appendSnippet()}
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={mdiPlus}
				aria-label="Add month"
				disabled={months.length >= 12}
				onclick={add}
			/>
		{/snippet}
	</TabSwitcher>
</div>

<style>
	.narrow {
		width: 100%;
		max-width: 420px;
	}
</style>
