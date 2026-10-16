<!-- @component Form
A `<form method="dialog">` closes the dialog when it is submitted, after its own `onsubmit` and only if the fields are valid. The submit button sits in the footer and points to the form with the `form` attribute. `autofocus` picks the field that gets focus on open. -->
<script lang="ts">
	import { mdiPlus } from '@mdi/js';
	import { Button, Dialog, SimpleTextField } from '#lib';

	let open = $state(false);
	let name = $state('');
	let duration = $state('60');
	let created = $state<string[]>([]);
</script>

<Button icon={mdiPlus} onclick={() => (open = true)}>New service</Button>
<span class="result">Created: {created.join(', ') || 'none'}</span>

<Dialog bind:open title="New service" closable --dialog-max-width="400px">
	<form
		id="service-form"
		method="dialog"
		onsubmit={() => {
			created.push(name);
			name = '';
		}}
	>
		<!-- svelte-ignore a11y_autofocus -->
		<SimpleTextField label="Name" bind:value={name} required autofocus />
		<SimpleTextField label="Duration (min)" type="number" bind:value={duration} />
	</form>
	{#snippet actionsSnippet({ close })}
		<Button buttonType="text" variant="secondary" onclick={close}>Cancel</Button>
		<Button type="submit" form="service-form">Create service</Button>
	{/snippet}
</Dialog>

<style>
	.result {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	form {
		display: grid;
		gap: 12px;
	}
</style>
