<!-- @component One menu for many rows
A single menu serves every row: the clicked button becomes the `activator` and the row goes in `data`, so the options are built once and `onselect` knows which row they apply to. -->
<script lang="ts">
	import { mdiDotsVertical, mdiEyeOutline, mdiTrashCanOutline } from '@mdi/js';
	import { Button, MenuOrDrawerOptions, type MenuOrDrawerOption } from '#lib';

	type Client = { id: number; name: string };

	let clients = $state<Client[]>([
		{ id: 1, name: 'Luca Rossi' },
		{ id: 2, name: 'Sara Bianchi' },
		{ id: 3, name: 'Marco Ferri' }
	]);
	let open = $state(false);
	let activator = $state<HTMLElement>();
	let current = $state<Client>();
	let viewed = $state('—');

	let options: MenuOrDrawerOption<Client>[] = $derived([
		{ name: 'view', label: 'View', icon: mdiEyeOutline, data: current },
		{ name: 'delete', label: 'Delete', icon: mdiTrashCanOutline, variant: 'danger', data: current }
	]);

	function toggle(event: MouseEvent, client: Client) {
		const button = event.currentTarget as HTMLElement;
		open = !(open && activator === button);
		activator = button;
		current = client;
	}

	function choose({ option }: { option: MenuOrDrawerOption<Client> }) {
		const client = option.data!;
		if (option.name === 'view') viewed = client.name;
		else clients = clients.filter((item) => item.id !== client.id);
	}
</script>

<ul class="rows">
	{#each clients as client (client.id)}
		<li>
			<span>{client.name}</span>
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={mdiDotsVertical}
				aria-label="Actions for {client.name}"
				aria-haspopup="menu"
				aria-expanded={open && current === client}
				onclick={(event) => toggle(event, client)}
			/>
		</li>
	{/each}
</ul>
<span class="viewed">Viewed: {viewed}</span>

<MenuOrDrawerOptions
	bind:open
	{activator}
	placement="bottom-end"
	aria-label="Actions for {current?.name}"
	{options}
	onselect={choose}
/>

<style>
	.rows {
		display: grid;
		gap: 4px;
		width: min(100%, 320px);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 6px 6px 12px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-md);
		font-size: 14px;
	}

	.viewed {
		color: var(--global-color-text-3);
		font-size: 13px;
	}
</style>
