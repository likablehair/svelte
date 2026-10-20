<!-- @component In a form
`name` submits the selected `value` and `required` blocks the submission until an option is selected, as with native radios. `state` and `hint` show the error; `disabled` disables the whole group. Here the form data is printed instead of being sent. -->
<script lang="ts">
	import { Button, RadioGroup } from '#lib';

	let payment = $state<string | number>();
	let submitted = $state(false);
	let sent = $state('');

	function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		sent = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
	}
</script>

<form class="demo" onsubmit={submit} oninvalidcapture={() => (submitted = true)}>
	<RadioGroup
		label="Payment method"
		name="payment"
		required
		bind:value={payment}
		state={submitted && payment === undefined ? 'error' : undefined}
		hint={submitted && payment === undefined ? 'Choose a payment method' : undefined}
		items={[
			{ value: 'card', label: 'Credit card' },
			{ value: 'transfer', label: 'Bank transfer' },
			{ value: 'cash', label: 'Cash at the salon' }
		]}
	/>
	<RadioGroup
		label="Invoice"
		disabled
		value="email"
		items={[
			{ value: 'email', label: 'By email' },
			{ value: 'paper', label: 'On paper' }
		]}
	/>
	<div class="actions">
		<Button type="submit">Pay</Button>
		{#if sent}<code>{sent}</code>{/if}
	</div>
</form>

<style>
	.demo {
		display: grid;
		gap: 20px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
