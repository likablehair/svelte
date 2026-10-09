<!-- @component Basic
A group from a list of items: `label` is the legend, the radios share a generated `name`, and `bind:value` holds the `value` of the selected item. Items can have an `icon`, a `description` and their own `disabled`. -->
<script lang="ts">
	import { mdiEmailOutline, mdiMessageTextOutline, mdiPhoneOutline } from '@mdi/js';
	import { RadioGroup } from '#lib';

	let contact = $state<string | number>('email');
</script>

<div class="demo">
	<RadioGroup
		label="Preferred contact"
		hint="We only use it for appointment reminders."
		bind:value={contact}
		items={[
			{ value: 'email', label: 'Email', icon: mdiEmailOutline },
			{ value: 'sms', label: 'SMS', icon: mdiMessageTextOutline },
			{ value: 'phone', label: 'Phone call', icon: mdiPhoneOutline, disabled: true }
		]}
	/>
	<RadioGroup
		label="Gender"
		orientation="horizontal"
		items={[
			{ value: 'male', label: 'Male' },
			{ value: 'female', label: 'Female' },
			{ value: 'other', label: 'Other' }
		]}
	/>
</div>

<style>
	.demo {
		display: grid;
		gap: 24px;
	}
</style>
