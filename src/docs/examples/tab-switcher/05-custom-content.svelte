<!-- @component Custom content
`tabSnippet` replaces the content of every tab and receives the tab and whether it is selected; clicks, keyboard and the indicator stay the same. -->
<script lang="ts">
	import { TabSwitcher, type Tab } from '#lib';

	const status: Record<string, string> = {
		open: 'var(--global-color-success)',
		waiting: 'var(--global-color-warning)',
		closed: 'var(--global-color-text-3)'
	};
	const tabs: Tab[] = [
		{ name: 'open', label: 'Open', badge: 8 },
		{ name: 'waiting', label: 'Waiting', badge: 3 },
		{ name: 'closed', label: 'Closed', badge: 41 }
	];

	let selected = $state('open');
</script>

<TabSwitcher {tabs} bind:selected aria-label="Tickets">
	{#snippet tabSnippet({ tab, selected })}
		<span class="dot" style:background={status[tab.name]}></span>
		{tab.label}
		<span class={['count', selected && 'count-selected']}>{tab.badge}</span>
	{/snippet}
</TabSwitcher>

<style>
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.count {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		opacity: 0.6;
	}

	.count-selected {
		opacity: 1;
	}
</style>
