<!-- @component Detail page
The page of one record: a `PageHeader` with the link back to the list, the `Avatar`, the name, a status `Chip` and the actions, an `AlertBanner` for what needs attention, then a `TabSwitcher` with the sections. Each section is a card made with the surface tokens; facts are a description list and the history a `Timeline`. -->
<script lang="ts">
	import { mdiCalendarPlus, mdiPencilOutline } from '@mdi/js';
	import { AlertBanner, Avatar, Button, Chip, PageHeader, TabSwitcher, Timeline, type TimelineItem } from '#lib';

	const client = {
		name: 'Giulia Marini',
		since: new Date(2023, 2, 14),
		email: 'giulia.marini@example.com',
		phone: '+39 333 123 4567',
		stylist: 'Irene',
		visits: 27,
		spent: 1840,
		balance: 64
	};

	const tabs = [
		{ name: 'overview', label: 'Overview' },
		{ name: 'bookings', label: 'Bookings', badge: 3 },
		{ name: 'notes', label: 'Notes' }
	];
	let selected = $state('overview');

	const history: TimelineItem[] = [
		{ title: 'Colour', description: 'Booked online', from: new Date(2026, 9, 2, 11, 0), status: 'upcoming' },
		{ title: 'Balayage', description: 'With Irene · €120', from: new Date(2026, 8, 20, 15, 0), status: 'done' },
		{ title: 'Cut and blow-dry', description: 'With Marco · €53', from: new Date(2026, 7, 29, 10, 30), status: 'done' }
	];

	const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });
	const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
</script>

<main class="page">
	<PageHeader title={client.name} backHref="#clients" backLabel="Clients">
		{#snippet prependSnippet()}
			<Avatar name={client.name} size="xl" />
		{/snippet}
		{#snippet subtitleSnippet()}
			<span class="since">Client since {date.format(client.since)} <Chip size="sm" variant="success">Active</Chip></span>
		{/snippet}
		{#snippet actionsSnippet()}
			<Button variant="secondary" icon={mdiPencilOutline}>Edit</Button>
			<Button icon={mdiCalendarPlus}>New booking</Button>
		{/snippet}
	</PageHeader>

	<AlertBanner
		variant="warning"
		title="Unpaid balance"
		description="{money.format(client.balance)} from the last visit is still to be paid."
	/>

	<TabSwitcher {tabs} bind:selected aria-label="Client sections" />

	{#if selected === 'overview'}
		<div class="grid">
			<section class="card">
				<h2>Contacts</h2>
				<dl>
					<dt>Email</dt>
					<dd>{client.email}</dd>
					<dt>Phone</dt>
					<dd>{client.phone}</dd>
					<dt>Stylist</dt>
					<dd>{client.stylist}</dd>
				</dl>
			</section>
			<section class="card">
				<h2>Numbers</h2>
				<dl>
					<dt>Visits</dt>
					<dd>{client.visits}</dd>
					<dt>Spent</dt>
					<dd>{money.format(client.spent)}</dd>
				</dl>
			</section>
			<section class="card wide">
				<h2>History</h2>
				<Timeline items={history} locale="en" />
			</section>
		</div>
	{:else}
		<section class="card">
			<p class="empty">The {selected} of {client.name} go here.</p>
		</section>
	{/if}
</main>

<style>
	.page {
		display: grid;
		gap: 1.25rem;
		padding: 1.5rem;
	}

	.since {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1rem;
	}

	.card {
		padding: 1.25rem;
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
		box-shadow: var(--global-shadow-sm);
	}

	.wide {
		grid-column: 1 / -1;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 0.95rem;
		color: var(--global-color-text);
	}

	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5rem 1.5rem;
		margin: 0;
	}

	dt {
		color: var(--global-color-text-3);
	}

	dd {
		margin: 0;
		color: var(--global-color-text);
	}

	.empty {
		margin: 0;
		color: var(--global-color-text-3);
	}
</style>
