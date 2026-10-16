<!-- @component In a form
`name` sends the listed files with the form and `required` blocks the submission while the list is empty, as with a native file input; resetting the form empties the list. Here the form data is printed instead of being sent. -->
<script lang="ts">
	import { Button, FileInputList } from '#lib';

	let sent = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		sent = data
			.getAll('attachments')
			.map((value) => (value instanceof File ? value.name : value))
			.join(', ');
	}
</script>

<form class="demo" onsubmit={submit} onreset={() => (sent = '')}>
	<FileInputList label="Attachments" name="attachments" required />
	<div class="actions">
		<Button type="reset" buttonType="text">Reset</Button>
		<Button type="submit">Send</Button>
	</div>
	{#if sent}<p>Sent: {sent}</p>{/if}
</form>

<style>
	.demo {
		display: grid;
		gap: 12px;
		width: 100%;
		max-width: 420px;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
