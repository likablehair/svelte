<!-- @component Action menu
A button opens the menu below it. It closes on outside click, on Escape (focus goes back to the button) and when an action is chosen. -->
<script lang="ts">
	import {
		mdiArchiveOutline,
		mdiContentCopy,
		mdiDotsHorizontal,
		mdiPencilOutline,
		mdiTrashCanOutline
	} from '@mdi/js';
	import { Button, Icon, Menu } from '#lib';

	let open = $state(false);
	let activator = $state<HTMLButtonElement>();
	let last = $state('none');

	const actions = [
		{ label: 'Edit', icon: mdiPencilOutline },
		{ label: 'Duplicate', icon: mdiContentCopy },
		{ label: 'Archive', icon: mdiArchiveOutline }
	];

	function choose(label: string) {
		last = label;
		open = false;
	}
</script>

<Button
	variant="secondary"
	icon={mdiDotsHorizontal}
	aria-haspopup="menu"
	aria-expanded={open}
	bind:buttonElement={activator}
	onclick={() => (open = !open)}
>
	Actions
</Button>
<span class="last">Last action: {last}</span>

<Menu bind:open {activator} role="menu" aria-label="Actions" --menu-min-width="200px">
	{#each actions as action (action.label)}
		<button class="item" role="menuitem" onclick={() => choose(action.label)}>
			<Icon path={action.icon} />{action.label}
		</button>
	{/each}
	<hr />
	<button class="item danger" role="menuitem" onclick={() => choose('Delete')}>
		<Icon path={mdiTrashCanOutline} />Delete
	</button>
</Menu>

<style>
	.last {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 10px;
		border: 0;
		border-radius: var(--global-radius-sm);
		background: none;
		color: var(--global-color-text-2);
		font: inherit;
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		--icon-size: 17px;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--global-color-surface-2);
		color: var(--global-color-text);
		outline: none;
	}

	.item.danger {
		color: var(--global-color-error);
	}

	.item.danger:hover,
	.item.danger:focus-visible {
		background: var(--global-color-error-soft);
	}

	hr {
		height: 1px;
		margin: 4px 6px;
		border: 0;
		background: var(--global-color-border);
	}
</style>
