<!-- @component Tabs and panels
An ARIA tab list: click a tab, or focus it and use the arrow keys, Home and End, then Enter or Space. `panelId` links each tab to its panel with `aria-controls`; the panel is markup of the app. -->
<script lang="ts">
	import {
		mdiAccountOutline,
		mdiContentCut,
		mdiFileDocumentOutline,
		mdiHistory
	} from '@mdi/js';
	import { TabSwitcher, type Tab } from '#lib';

	const tabs: Tab[] = [
		{ name: 'overview', label: 'Overview', icon: mdiAccountOutline, panelId: 'client-overview' },
		{ name: 'services', label: 'Services', icon: mdiContentCut, panelId: 'client-services' },
		{ name: 'history', label: 'History', icon: mdiHistory, badge: 12, panelId: 'client-history' },
		{ name: 'documents', label: 'Documents', icon: mdiFileDocumentOutline, disabled: true }
	];
	const text: Record<string, string> = {
		overview: 'Giulia Marini, client since 2021. Prefers morning appointments.',
		services: 'Cut, color and blow-dry: usually 1 hour and 45 minutes.',
		history: '12 visits in the last year, the latest on 2 October.'
	};

	let selected = $state('overview');
	const panel = $derived(tabs.find((tab) => tab.name === selected));
</script>

<div class="client">
	<TabSwitcher {tabs} bind:selected aria-label="Client" />
	{#if panel}
		<div id={panel.panelId} role="tabpanel" aria-label={panel.label} class="panel">
			{text[panel.name]}
		</div>
	{/if}
</div>

<style>
	.client {
		display: grid;
		gap: 16px;
		width: 100%;
	}

	.panel {
		font-size: 14px;
	}
</style>
