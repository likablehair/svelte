<!-- @component Labels
The default tooltip is a dark one-line label above the activator. Hover a button, or move to it with Tab: keyboard focus opens the tooltip right away. `children` replaces `text`, here to add a shortcut hint. -->
<script lang="ts">
	import { mdiContentCopy, mdiDeleteOutline, mdiPencilOutline } from '@mdi/js';
	import { Button, Tooltip } from '#lib';

	let copy = $state<HTMLButtonElement | HTMLAnchorElement>();
	let edit = $state<HTMLButtonElement | HTMLAnchorElement>();
	let remove = $state<HTMLButtonElement | HTMLAnchorElement>();
</script>

<div class="row">
	<Button bind:buttonElement={copy} buttonType="icon" variant="secondary" icon={mdiContentCopy} aria-label="Copy link" />
	<Tooltip activator={copy}>
		Copy link <kbd>⌘C</kbd>
	</Tooltip>

	<Button bind:buttonElement={edit} buttonType="icon" variant="secondary" icon={mdiPencilOutline} aria-label="Edit" />
	<Tooltip activator={edit} text="Edit appointment" />

	<Button bind:buttonElement={remove} buttonType="icon" variant="secondary" icon={mdiDeleteOutline} aria-label="Delete" />
	<Tooltip activator={remove} text="Delete appointment" placement="bottom" />
</div>

<style>
	.row {
		display: flex;
		gap: 8px;
	}

	kbd {
		margin-left: 4px;
		font-family: var(--global-font-family-mono);
		opacity: 0.6;
	}
</style>
