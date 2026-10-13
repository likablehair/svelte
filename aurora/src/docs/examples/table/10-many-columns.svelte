<!-- @component Many columns in cards
With many columns a card shows the title and a few fields, and the others behind "Show more fields". `cardColumns` picks the fields that stay visible, here the contact details, the last visit and the status; without it the card shows the first 4 columns after the title. In cards a false yes/no reads "No". -->
<script lang="ts">
	import { mdiDotsVertical, mdiPencilOutline } from '@mdi/js';
	import { Button, Chip, Table, type TableColumn } from '#lib';

	type Client = {
		id: number;
		code: string;
		name: string;
		email: string;
		phone: string;
		city: string;
		province: string;
		country: string;
		vat: string | null;
		fiscalCode: string;
		created: Date;
		lastVisit: Date;
		visits: number;
		spent: number;
		ticket: number;
		points: number;
		newsletter: boolean;
		marketing: boolean;
		status: 'Active' | 'New';
		operator: string;
		notes: string | null;
	};

	const rows: Client[] = [
		{
			id: 1,
			code: 'CL-00231',
			name: 'Luca Rossi',
			email: 'luca.rossi@example.com',
			phone: '+39 333 123 4567',
			city: 'Milan',
			province: 'MI',
			country: 'Italy',
			vat: 'IT01234567890',
			fiscalCode: 'RSSLCU85M01F205X',
			created: new Date(2024, 2, 14),
			lastVisit: new Date(2026, 8, 24, 9, 30),
			visits: 37,
			spent: 1842.5,
			ticket: 49.8,
			points: 1240,
			newsletter: true,
			marketing: false,
			status: 'Active',
			operator: 'Giulia',
			notes: 'Prefers mornings'
		},
		{
			id: 2,
			code: 'CL-00232',
			name: 'Giulia Marini',
			email: 'giulia.marini@example.com',
			phone: '+39 347 765 4321',
			city: 'Turin',
			province: 'TO',
			country: 'Italy',
			vat: null,
			fiscalCode: 'MRNGLI90A41L219K',
			created: new Date(2025, 10, 2),
			lastVisit: new Date(2026, 8, 20, 16),
			visits: 8,
			spent: 960,
			ticket: 120,
			points: 310,
			newsletter: false,
			marketing: true,
			status: 'New',
			operator: 'Luca',
			notes: null
		}
	];

	const euro: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR' };

	const columns: TableColumn<Client>[] = [
		{ key: 'name', label: 'Client', sortable: true },
		{ key: 'code', label: 'Code' },
		{ key: 'email', label: 'Email' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'city', label: 'City', sortable: true },
		{ key: 'province', label: 'Province' },
		{ key: 'country', label: 'Country' },
		{ key: 'vat', label: 'VAT number' },
		{ key: 'fiscalCode', label: 'Fiscal code' },
		{ key: 'created', label: 'Client since', type: 'date', sortable: true },
		{ key: 'lastVisit', label: 'Last visit', type: 'datetime', sortable: true },
		{ key: 'visits', label: 'Visits', type: 'number', sortable: true },
		{ key: 'spent', label: 'Total spent', type: 'number', numberFormat: euro },
		{ key: 'ticket', label: 'Average ticket', type: 'number', numberFormat: euro },
		{ key: 'points', label: 'Loyalty points', type: 'number' },
		{ key: 'newsletter', label: 'Newsletter', type: 'boolean' },
		{ key: 'marketing', label: 'Marketing consent', type: 'boolean' },
		{ key: 'status', label: 'Status', cell: status },
		{ key: 'operator', label: 'Operator' },
		{ key: 'notes', label: 'Notes' }
	];
</script>

{#snippet status({ value }: { value: Client['status'] })}
	<Chip size="sm" variant={value === 'Active' ? 'success' : 'primary'}>{value}</Chip>
{/snippet}

{#snippet actions({ row }: { row: Client })}
	<Button buttonType="icon" variant="secondary" size="sm" icon={mdiPencilOutline} aria-label="Edit {row.name}" />
	<Button buttonType="icon" variant="secondary" size="sm" icon={mdiDotsVertical} aria-label="More for {row.name}" />
{/snippet}

<div class="phone">
	<Table
		{rows}
		{columns}
		selectable="multiple"
		actionsSnippet={actions}
		cardColumns={['email', 'phone', 'lastVisit', 'status']}
	/>
</div>

<style>
	.phone {
		width: 100%;
		max-width: 360px;
	}
</style>
