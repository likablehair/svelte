import {
	mdiAccountOutline,
	mdiCalendarOutline,
	mdiCashMultiple,
	mdiCheckCircleOutline,
	mdiContentCut,
	mdiEarth,
	mdiNoteTextOutline,
	mdiTagOutline
} from '@mdi/js';
import type { FilterField, FilterItem } from '#lib';

export const SERVICES: FilterItem[] = [
	{ value: 1, label: 'Cut' },
	{ value: 2, label: 'Color' },
	{ value: 3, label: 'Balayage' },
	{ value: 4, label: 'Blow-dry' }
];

export const STATUSES: FilterItem[] = [
	{ value: 'confirmed', label: 'Confirmed' },
	{ value: 'waiting', label: 'Waiting' },
	{ value: 'cancelled', label: 'Cancelled' }
];

export const STAFF: FilterItem[] = [
	{ value: 10, label: 'Giulia Marini' },
	{ value: 11, label: 'Marco Rossi' },
	{ value: 12, label: 'Martina Galli' }
];

export const ICONS = {
	client: mdiAccountOutline,
	date: mdiCalendarOutline,
	amount: mdiCashMultiple,
	status: mdiCheckCircleOutline,
	service: mdiContentCut,
	country: mdiEarth,
	notes: mdiNoteTextOutline,
	tags: mdiTagOutline
};

export const fields: FilterField[] = [
	{
		name: 'client',
		label: 'Client',
		icon: ICONS.client,
		type: 'string',
		columns: ['clients.firstName', 'clients.lastName'],
		words: true,
		placeholder: 'Name or surname',
		category: 'Client'
	},
	{
		name: 'country',
		label: 'Country',
		icon: ICONS.country,
		type: 'select',
		view: 'countries',
		column: 'clients.country',
		category: 'Client'
	},
	{
		name: 'tags',
		label: 'Tags',
		icon: ICONS.tags,
		type: 'select',
		column: 'tagId',
		through: { key: 'clients.id', from: 'client_tags', select: 'clientId' },
		category: 'Client',
		items: [
			{ value: 1, label: 'VIP' },
			{ value: 2, label: 'Allergic' }
		]
	},
	{
		name: 'service',
		label: 'Service',
		icon: ICONS.service,
		type: 'select',
		column: 'appointments.serviceId',
		category: 'Appointment',
		items: SERVICES
	},
	{
		name: 'status',
		label: 'Status',
		icon: ICONS.status,
		type: 'select',
		view: 'toggle',
		column: 'appointments.status',
		category: 'Appointment',
		items: STATUSES
	},
	{
		name: 'date',
		label: 'Date',
		icon: ICONS.date,
		type: 'date',
		column: 'appointments.startsAt',
		category: 'Appointment'
	},
	{
		name: 'amount',
		label: 'Amount',
		icon: ICONS.amount,
		type: 'number',
		unit: '€',
		step: 0.5,
		column: 'appointments.amount',
		category: 'Payment'
	},
	{
		name: 'paid',
		label: 'Paid',
		type: 'bool',
		column: 'appointments.paid',
		category: 'Payment'
	},
	{ name: 'tenant', label: 'Salon', type: 'number', column: 'appointments.salonId', hidden: true }
];

export function fieldOf(name: string): FilterField {
	const field = fields.find((candidate) => candidate.name === name);
	if (!field) throw new Error(`No field ${name}`);
	return field;
}

export const few: FilterField[] = ['client', 'service', 'date', 'amount', 'paid'].map(fieldOf);
