<!-- @component In a narrow form
In a space narrower than 480px the buttons stack at full width, confirm on top, whatever the size of the screen. `confirmType="submit"` submits the form, so its validation runs first. -->
<script lang="ts">
	import { ConfirmOrCancelButtons, SimpleTextField } from '#lib';

	let sent = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		sent = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form class="panel" onsubmit={submit}>
	<SimpleTextField label="Customer name" name="name" required />
	<ConfirmOrCancelButtons confirmType="submit" oncancelClick={() => (sent = '')} />
	{#if sent}<code>{sent}</code>{/if}
</form>

<style>
	.panel {
		display: grid;
		gap: 20px;
		width: 100%;
		max-width: 320px;
		padding: 16px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
	}
</style>
