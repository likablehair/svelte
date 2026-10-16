<!-- @component Settings list
`onchange` receives the native event: `event.currentTarget.checked` is the new value. `labelSnippet` adds a description under the title, and a class on the container moves the switch to the right. -->
<script lang="ts">
	import { Switch } from '#lib';

	let settings = $state([
		{ key: 'sms', title: 'SMS reminders', description: 'Sent 24 hours before the appointment.', on: true },
		{ key: 'email', title: 'Email receipts', description: 'A copy of every payment.', on: false },
		{ key: 'reviews', title: 'Review requests', description: 'Asked the day after the visit.', on: true }
	]);
	let log = $state('');
</script>

<div class="settings">
	{#each settings as setting (setting.key)}
		<Switch
			class={{ container: 'setting' }}
			name={setting.key}
			bind:checked={setting.on}
			onchange={(event) => (log = `${setting.title}: ${event.currentTarget.checked ? 'on' : 'off'}`)}
		>
			{#snippet labelSnippet()}
				<span class="title">{setting.title}</span>
				<span class="description">{setting.description}</span>
			{/snippet}
		</Switch>
	{/each}
	<p>{log || 'Toggle a setting.'}</p>
</div>

<style>
	.settings {
		display: grid;
		gap: 16px;
		max-width: 380px;
	}

	.settings :global(.setting) {
		display: flex;
		flex-direction: row-reverse;
		justify-content: space-between;
	}

	.title,
	.description {
		display: block;
	}

	.description {
		font-size: 12.5px;
		opacity: 0.7;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
