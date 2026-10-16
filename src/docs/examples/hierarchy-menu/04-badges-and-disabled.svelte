<!-- @component Badges, disabled options and extra content
`badge` shows a short count in a pill, `disabled` keeps an option visible but not selectable. `appendSnippet` adds content after each option, outside the link or button, so it can hold its own buttons. -->
<script lang="ts">
	import { mdiCalendarOutline, mdiEmailOutline, mdiLockOutline, mdiPlus } from '@mdi/js';
	import { Button, HierarchyMenu, type HierarchyMenuOption } from '#lib';

	const options: HierarchyMenuOption[] = [
		{ name: 'inbox', label: 'Inbox', icon: mdiEmailOutline, badge: 28 },
		{ name: 'agenda', label: 'Agenda', icon: mdiCalendarOutline, badge: 'new' },
		{ name: 'admin', label: 'Administration', icon: mdiLockOutline, disabled: true }
	];

	let selected = $state('inbox');
</script>

<div class="menu">
	<HierarchyMenu {options} bind:selected aria-label="Mail">
		{#snippet appendSnippet({ option })}
			{#if option.name === 'agenda'}
				<Button buttonType="icon" size="sm" icon={mdiPlus} aria-label="New appointment" />
			{/if}
		{/snippet}
	</HierarchyMenu>
</div>

<style>
	.menu {
		width: 260px;
		padding-left: 10px;
	}
</style>
