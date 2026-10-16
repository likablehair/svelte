<!-- @component Always wide, with a custom menu
`expandOn="none"` with `sidebarExpanded` keeps the sidebar always wide, with no button. `menuSnippet` replaces the menu drawn from `options`: here two `HierarchyMenu` under their own headings. `--sidebar-layout-*` variables change sizes and colors for one instance. -->
<script lang="ts">
	import { mdiArchiveOutline, mdiInboxOutline, mdiSendOutline, mdiTagOutline } from '@mdi/js';
	import { HierarchyMenu, SidebarLayout, type HierarchyMenuOption } from '#lib';

	const mail: HierarchyMenuOption[] = [
		{ name: 'inbox', label: 'Inbox', icon: mdiInboxOutline, badge: 4 },
		{ name: 'sent', label: 'Sent', icon: mdiSendOutline },
		{ name: 'archive', label: 'Archive', icon: mdiArchiveOutline }
	];
	const labels: HierarchyMenuOption[] = [
		{ name: 'clients', label: 'Clients', icon: mdiTagOutline },
		{ name: 'suppliers', label: 'Suppliers', icon: mdiTagOutline }
	];

	let selected = $state('inbox');
</script>

<SidebarLayout expandOn="none" sidebarExpanded --sidebar-layout-sidebar-expanded-width="15rem">
	{#snippet menuSnippet()}
		<h2>Mail</h2>
		<HierarchyMenu options={mail} bind:selected aria-label="Mail" />
		<h2>Labels</h2>
		<HierarchyMenu options={labels} bind:selected aria-label="Labels" />
	{/snippet}

	<p>Selected: <code>{selected}</code></p>
</SidebarLayout>

<style>
	h2 {
		margin: 16px 0 6px;
		padding-left: 13px;
		color: var(--global-color-text-3);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
	}
</style>
