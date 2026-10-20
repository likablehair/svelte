<!-- @component Errors
When the request fails, `event.preventDefault()` keeps the dialog open, so the user can try again or cancel; `children` shows the error under the description. A Promise that rejects keeps it open too, and the error goes on to the console. -->
<script lang="ts">
	import { mdiArchiveOutline } from '@mdi/js';
	import { AlertBanner, Button, ConfirmDialog } from '#lib';

	let open = $state(false);
	let error = $state<string>();
	let attempts = 0;

	async function archive(event: MouseEvent) {
		error = undefined;
		await new Promise((resolve) => setTimeout(resolve, 800));
		if (++attempts % 2 === 1) {
			event.preventDefault();
			error = 'The server did not answer. Try again.';
		}
	}
</script>

<Button
	variant="secondary"
	icon={mdiArchiveOutline}
	onclick={() => {
		error = undefined;
		open = true;
	}}>Archive project</Button
>

<ConfirmDialog
	bind:open
	variant="primary"
	title="Archive the project?"
	description="It leaves the dashboard; you can restore it from the archive."
	icon={mdiArchiveOutline}
	confirmText="Archive"
	onconfirm={archive}
>
	{#if error}
		<AlertBanner variant="error" description={error} />
	{/if}
</ConfirmDialog>
