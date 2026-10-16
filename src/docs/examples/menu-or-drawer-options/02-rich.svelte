<!-- @component Descriptions, shortcuts and check marks
`description` adds a second line, `shortcut` a key hint on the right (the shortcut itself is up to the app), `checked` a check mark that turns the option into a `menuitemcheckbox`. Each option can run its own `onclick`. -->
<script lang="ts">
	import { mdiPrinterOutline, mdiShareVariantOutline, mdiStarOutline } from '@mdi/js';
	import { Button, MenuOrDrawerOptions, type MenuOrDrawerOption } from '#lib';

	let open = $state(false);
	let activator = $state<HTMLButtonElement | HTMLAnchorElement>();
	let favorite = $state(true);
	let log = $state('—');

	let options: MenuOrDrawerOption[] = $derived([
		{
			name: 'share',
			label: 'Share',
			icon: mdiShareVariantOutline,
			description: 'Send a link to the client',
			shortcut: '⌘S',
			onclick: () => (log = 'Link copied')
		},
		{
			name: 'favorite',
			label: 'Favorite',
			icon: mdiStarOutline,
			checked: favorite,
			onclick: () => (favorite = !favorite)
		},
		{
			name: 'print',
			label: 'Print',
			icon: mdiPrinterOutline,
			shortcut: '⌘P',
			onclick: () => (log = 'Printing…')
		}
	]);
</script>

<Button variant="secondary" bind:buttonElement={activator} onclick={() => (open = !open)}>
	Appointment
</Button>
<span class="log">{log} · favorite: {favorite ? 'yes' : 'no'}</span>

<MenuOrDrawerOptions bind:open {activator} placement="bottom-start" {options} />

<style>
	.log {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
