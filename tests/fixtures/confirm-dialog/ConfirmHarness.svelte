<script lang="ts">
	import ConfirmDialog from '#lib/components/composed/dialogs/ConfirmDialog.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		withField?: boolean;
		wrapperStyle?: string;
		[key: string]: unknown;
	}

	let {
		open = $bindable(false),
		title = 'Delete?',
		withField = false,
		wrapperStyle,
		...rest
	}: Props = $props();
</script>

<button type="button" onclick={() => (open = true)}>Open</button>
<output data-testid="state">{open ? 'open' : 'closed'}</output>
<div style={wrapperStyle}>
	{#if withField}
		<ConfirmDialog bind:open {title} {...rest}><input aria-label="Name" /></ConfirmDialog>
	{:else}
		<ConfirmDialog bind:open {title} {...rest} />
	{/if}
</div>
