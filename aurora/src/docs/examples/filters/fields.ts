import {
	mdiAccountOutline,
	mdiCalendarOutline,
	mdiCashMultiple,
	mdiCheckCircleOutline,
	mdiContentCut,
	mdiEarth,
	mdiTagOutline
} from '@mdi/js';
import type { FilterField } from '#lib';

export const fields: FilterField[] = [
	{
		name: 'client',
		label: 'Client',
		icon: mdiAccountOutline,
		type: 'string',
		columns: ['clients.firstName', 'clients.lastName'],
		words: true,
		category: 'Client'
	},
	{
		name: 'country',
		label: 'Country',
		icon: mdiEarth,
		type: 'select',
		view: 'countries',
		column: 'clients.country',
		category: 'Client'
	},
	{
		name: 'service',
		label: 'Service',
		icon: mdiContentCut,
		type: 'select',
		column: 'appointments.serviceId',
		category: 'Appointment',
		items: [
			{ value: 1, label: 'Cut' },
			{ value: 2, label: 'Color' },
			{ value: 3, label: 'Balayage' },
			{ value: 4, label: 'Blow-dry' }
		]
	},
	{
		name: 'status',
		label: 'Status',
		icon: mdiCheckCircleOutline,
		type: 'select',
		view: 'toggle',
		column: 'appointments.status',
		category: 'Appointment',
		items: [
			{ value: 'confirmed', label: 'Confirmed' },
			{ value: 'waiting', label: 'Waiting' },
			{ value: 'cancelled', label: 'Cancelled' }
		]
	},
	{
		name: 'date',
		label: 'Date',
		icon: mdiCalendarOutline,
		type: 'date',
		column: 'appointments.startsAt',
		category: 'Appointment'
	},
	{
		name: 'amount',
		label: 'Amount',
		icon: mdiCashMultiple,
		type: 'number',
		unit: '€',
		column: 'appointments.amount',
		category: 'Payment'
	},
	{
		name: 'paid',
		label: 'Paid',
		icon: mdiCashMultiple,
		type: 'bool',
		column: 'appointments.paid',
		category: 'Payment'
	},
	{
		name: 'tags',
		label: 'Tags',
		icon: mdiTagOutline,
		type: 'select',
		column: 'tagId',
		through: { key: 'clients.id', from: 'client_tags', select: 'clientId' },
		category: 'Client',
		items: [
			{ value: 1, label: 'VIP' },
			{ value: 2, label: 'Allergic' },
			{ value: 3, label: 'New' }
		]
	}
];

const ITALIAN: Record<string, string> = {
	Client: 'Cliente',
	Country: 'Paese',
	Service: 'Servizio',
	Status: 'Stato',
	Date: 'Data',
	Amount: 'Importo',
	Paid: 'Pagato',
	Tags: 'Etichette',
	Appointment: 'Appuntamento',
	Payment: 'Pagamento',
	Cut: 'Taglio',
	Color: 'Colore',
	'Blow-dry': 'Piega',
	Confirmed: 'Confermato',
	Waiting: 'In attesa',
	Cancelled: 'Annullato',
	Allergic: 'Allergico',
	New: 'Nuovo'
};

const italian = (text: string) => ITALIAN[text] ?? text;

export const italianFields: FilterField[] = fields.map((field) => ({
	...field,
	label: italian(field.label),
	category: field.category && italian(field.category),
	...(field.type === 'select' && field.items
		? { items: field.items.map((item) => ({ ...item, label: italian(String(item.label)) })) }
		: {})
})) as FilterField[];
