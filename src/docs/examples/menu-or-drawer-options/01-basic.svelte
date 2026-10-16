<!-- @component Action menu
A "⋯" button opens the actions: a menu on wide screens, a bottom sheet up to 1024px. `variant: 'danger'` paints the destructive action, `divider` separates it, `disabled` turns an option off. Choosing an option closes the menu and calls `onselect`. -->
<script lang="ts">
	import {
		mdiArchiveOutline,
		mdiContentCopy,
		mdiDotsHorizontal,
		mdiPencilOutline,
		mdiTrashCanOutline
	} from '@mdi/js';
	import { Button, MenuOrDrawerOptions, type MenuOrDrawerOption } from '#lib';

	let open = $state(false);
	let activator = $state<HTMLButtonElement | HTMLAnchorElement>();
	let last = $state('none');

	const options: MenuOrDrawerOption[] = [
		{ name: 'edit', label: 'Edit', icon: mdiPencilOutline },
		{ name: 'duplicate', label: 'Duplicate', icon: mdiContentCopy },
		{ name: 'archive', label: 'Archive', icon: mdiArchiveOutline, disabled: true },
		{ name: 'delete', label: 'Delete', icon: mdiTrashCanOutline, variant: 'danger', divider: true }
	];
</script>

<Button
	buttonType="icon"
	variant="secondary"
	icon={mdiDotsHorizontal}
	aria-label="Invoice actions"
	aria-haspopup="menu"
	aria-expanded={open}
	bind:buttonElement={activator}
	onclick={() => (open = !open)}
/>
<span class="last">Last action: {last}</span>

<MenuOrDrawerOptions
	bind:open
	{activator}
	placement="bottom-start"
	aria-label="Invoice actions"
	{options}
	onselect={({ option }) => (last = option.label)}
/>

<style>
	.last {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
