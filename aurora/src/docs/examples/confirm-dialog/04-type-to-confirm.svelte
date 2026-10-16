<!-- @component Type to confirm
For actions that cannot be undone and touch a lot of data, a field in `children` and `confirmDisable` make the user type the name before the button turns on; `autofocus` moves the focus to the field. -->
<script lang="ts">
	import { mdiDatabaseRemoveOutline } from '@mdi/js';
	import { Button, ConfirmDialog, SimpleTextField } from '#lib';

	const name = 'north-salon';

	let open = $state(false);
	let typed = $state('');
</script>

<Button
	variant="danger"
	icon={mdiDatabaseRemoveOutline}
	onclick={() => {
		typed = '';
		open = true;
	}}>Delete workspace</Button
>

<ConfirmDialog
	bind:open
	title="Delete the workspace?"
	description="Clients, appointments and invoices of {name} will be deleted. This cannot be undone."
	icon={mdiDatabaseRemoveOutline}
	confirmText="Delete workspace"
	confirmDisable={typed !== name}
	onconfirm={() => new Promise((resolve) => setTimeout(resolve, 1000))}
>
	<!-- svelte-ignore a11y_autofocus -->
	<SimpleTextField label="Type {name} to confirm" bind:value={typed} autocomplete="off" autofocus />
</ConfirmDialog>
