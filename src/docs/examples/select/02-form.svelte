<!-- @component In a form
`name` submits the selected `value` and `required` blocks the submission while the placeholder is shown, as with a native select. Here the form data is printed instead of being sent. -->
<script lang="ts">
	import { Button, Select } from '#lib';

	let sent = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		sent = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form class="demo" onsubmit={submit}>
	<Select
		label="Payment method"
		name="payment"
		placeholder="Choose…"
		required
		items={[
			{ value: 'card', label: 'Card' },
			{ value: 'cash', label: 'Cash' },
			{ value: 'voucher', label: 'Gift voucher' }
		]}
	/>
	<Button type="submit">Send</Button>
	{#if sent}<p>Sent: <code>{sent}</code></p>{/if}
</form>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
		width: 100%;
		max-width: 340px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
