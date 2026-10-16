<!-- @component Arrange
With `editing` the empty spaces become "Add widget" buttons that open the catalog with the sizes that fit there; widgets are dragged to free cells (onto one of the same size they swap places), resized with the handle in their corner among their `sizes`, removed with the X. From the keyboard, the handle next to the remove button moves with the arrow keys, resizes with Shift and the arrow keys, removes with Delete. `onchange` reports each change; `hasEmptySlots` is used here to save only dashboards without holes. -->
<script lang="ts">
	import {
		mdiAccountGroupOutline,
		mdiCalendarCheckOutline,
		mdiCashMultiple,
		mdiChartBar,
		mdiStarOutline
	} from '@mdi/js';
	import { Button, DashboardShaper, type DashboardCatalogItem, type DashboardWidget } from '#lib';

	type Name = 'revenue' | 'clients' | 'appointments' | 'rating' | 'monthly';

	const catalog: DashboardCatalogItem<Name>[] = [
		{
			name: 'revenue',
			title: 'Revenue',
			description: 'Takings of the day',
			icon: mdiCashMultiple,
			sizes: [
				{ width: 1, height: 1 },
				{ width: 2, height: 1 },
				{ width: 2, height: 2 }
			]
		},
		{
			name: 'clients',
			title: 'Clients',
			description: 'Clients seen today',
			icon: mdiAccountGroupOutline,
			sizes: [
				{ width: 1, height: 1 },
				{ width: 2, height: 1 }
			]
		},
		{
			name: 'appointments',
			title: 'Appointments',
			description: 'Booked for the rest of the day',
			icon: mdiCalendarCheckOutline,
			sizes: [{ width: 1, height: 1 }]
		},
		{
			name: 'rating',
			title: 'Rating',
			description: 'Average of the reviews',
			icon: mdiStarOutline,
			sizes: [{ width: 1, height: 1 }]
		},
		{
			name: 'monthly',
			title: 'Revenue per month',
			description: 'Last twelve months',
			icon: mdiChartBar,
			sizes: [
				{ width: 2, height: 2 },
				{ width: 4, height: 2 }
			]
		}
	];

	let widgets = $state<DashboardWidget<unknown, Name>[]>([
		{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 },
		{ id: 2, name: 'clients', left: 3, top: 1, width: 1, height: 1 },
		{ id: 3, name: 'monthly', left: 1, top: 2, width: 2, height: 2 },
		{ id: 4, name: 'rating', left: 4, top: 2, width: 1, height: 1 }
	]);
	let editing = $state(true);
	let hasEmptySlots = $state(false);
	let last = $state('No changes yet');
</script>

<div class="stack">
	<div class="toolbar">
		<Button variant={editing ? 'primary' : 'secondary'} size="sm" onclick={() => (editing = !editing)}>
			{editing ? 'Done' : 'Edit layout'}
		</Button>
		<Button buttonType="text" size="sm" disabled={hasEmptySlots || !widgets.length}>Save</Button>
		<span class="note">{hasEmptySlots ? 'Fill the holes to save' : 'Ready to save'}</span>
	</div>

	<DashboardShaper
		bind:widgets
		bind:editing
		bind:hasEmptySlots
		{catalog}
		columns={4}
		onchange={({ added, removed, changed }) =>
			(last = `${added.length} added, ${removed.length} removed, ${changed.length} moved or resized`)}
		--dashboard-shaper-row-height="96px"
	>
		{#snippet widgetSnippet({ item })}
			<div class="card"><small>{item?.title}</small><b>—</b></div>
		{/snippet}
	</DashboardShaper>

	<code>{last}</code>
</div>

<style>
	.stack {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 12px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.note {
		color: var(--global-color-text-3);
		font-size: 13px;
	}

	.card {
		display: flex;
		height: 100%;
		box-sizing: border-box;
		flex-direction: column;
		justify-content: space-between;
		padding: 14px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	small {
		color: var(--global-color-text-3);
		font-size: 12px;
	}

	b {
		font-family: var(--global-font-family-display);
		font-size: 24px;
	}
</style>
