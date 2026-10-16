<script lang="ts">
	import type { Component } from 'svelte';
	import Dialog from '#lib/components/simple/dialogs/Dialog.svelte';

	interface Props {
		component?: Component<any>;
		open?: boolean;
		withForm?: boolean;
		wrapperStyle?: string;
		[key: string]: unknown;
	}

	let {
		component: Modal = Dialog,
		open = $bindable(false),
		withForm = false,
		wrapperStyle,
		...rest
	}: Props = $props();
</script>

<button type="button" onclick={() => (open = true)}>Open</button>
<button type="button">Page button</button>
<output data-testid="state">{open ? 'open' : 'closed'}</output>
<div data-testid="wrapper" style={wrapperStyle}>
	<Modal bind:open {...rest}>
		<input aria-label="Name" />
		{#if withForm}
			<form method="dialog"><button>Send</button></form>
		{/if}
		<button type="button">Inside</button>
	</Modal>
</div>
