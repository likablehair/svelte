<!-- @component Bottom sheet with a handle
A bottom drawer has a handle: dragging it, or the title, down closes the sheet, and a short drag springs back. Escape and the backdrop close it too; `handle={false}` removes it. -->
<script lang="ts">
	import { mdiShareVariantOutline } from '@mdi/js';
	import { Button, Drawer } from '#lib';

	let open = $state(false);
</script>

<Button variant="secondary" icon={mdiShareVariantOutline} onclick={() => (open = true)}>
	Share
</Button>

<Drawer bind:open position="bottom" title="Share the appointment" --drawer-size="auto">
	<p>Anyone with the link sees the date, the time and the services of the appointment.</p>
	{#snippet actionsSnippet({ close })}
		<Button buttonType="text" variant="secondary" onclick={close}>Cancel</Button>
		<Button onclick={close}>Copy link</Button>
	{/snippet}
</Drawer>

<style>
	p {
		margin: 0 6px;
		color: var(--global-color-text-2);
	}
</style>
