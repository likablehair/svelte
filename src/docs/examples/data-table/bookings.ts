import { mdiCalendarOutline, mdiCashMultiple, mdiCheckCircleOutline, mdiContentCut } from '@mdi/js';
import type { DataTableLoadResult, DataTableQuery, FilterCondition, FilterField, FilterGroup } from '#lib';

export type Booking = {
	id: number;
	client: string;
	initials: string;
	service: string;
	start: Date;
	status: 'confirmed' | 'pending' | 'cancelled';
	amount: number;
	paid: boolean;
	staff: string;
};

const FIRST = ['Luca', 'Giulia', 'Sara', 'Marco', 'Anna', 'Paolo', 'Elena', 'Davide', 'Chiara', 'Matteo', 'Laura', 'Simone'];
const LAST = ['Rossi', 'Marini', 'Bianchi', 'Neri', 'Galli', 'Conti', 'Ferri', 'Greco', 'Ricci', 'Costa', 'Fontana', 'Moretti'];
const SERVICES: [string, number][] = [
	['Cut', 28],
	['Cut and beard', 42],
	['Colour', 64],
	['Balayage', 120],
	['Blow-dry', 25]
];
const STATUSES: Booking['status'][] = ['confirmed', 'confirmed', 'pending', 'confirmed', 'cancelled'];
const STAFF = ['Giulia', 'Marco', 'Irene'];

function random(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
}

const next = random(7);

export const bookings: Booking[] = Array.from({ length: 312 }, (_, index) => {
	const first = FIRST[Math.floor(next() * FIRST.length)];
	const last = LAST[Math.floor(next() * LAST.length)];
	const [service, price] = SERVICES[Math.floor(next() * SERVICES.length)];
	const day = 1 + Math.floor(index / 6);
	const start = new Date(2026, 8, day, 9 + Math.floor(next() * 9), next() < 0.5 ? 0 : 30);
	return {
		id: index + 1,
		client: `${first} ${last}`,
		initials: `${first[0]}${last[0]}`,
		service,
		start,
		status: STATUSES[Math.floor(next() * STATUSES.length)],
		amount: price + Math.floor(next() * 4) * 5,
		paid: next() < 0.7,
		staff: STAFF[Math.floor(next() * STAFF.length)]
	};
});

export const bookingFields: FilterField[] = [
	{
		name: 'status',
		label: 'Status',
		icon: mdiCheckCircleOutline,
		type: 'select',
		view: 'toggle',
		column: 'bookings.status',
		items: [
			{ value: 'confirmed', label: 'Confirmed' },
			{ value: 'pending', label: 'Pending' },
			{ value: 'cancelled', label: 'Cancelled' }
		]
	},
	{
		name: 'service',
		label: 'Service',
		icon: mdiContentCut,
		type: 'select',
		column: 'services.name',
		items: SERVICES.map(([name]) => ({ value: name, label: name }))
	},
	{ name: 'start', label: 'Date', icon: mdiCalendarOutline, type: 'date', column: 'bookings.startsAt' },
	{ name: 'amount', label: 'Amount', icon: mdiCashMultiple, type: 'number', unit: '€', column: 'bookings.amount' },
	{ name: 'paid', label: 'Paid', icon: mdiCashMultiple, type: 'bool', column: 'bookings.paid' }
];

export const searchColumns = ['clients.firstName', 'clients.lastName', 'services.name'];

type Query = Partial<Pick<DataTableQuery, 'page' | 'pageSize' | 'sort' | 'search' | 'filterValue'>>;

function matches(row: Booking, condition: FilterCondition): boolean {
	const value = row[condition.field as keyof Booking];
	const given = condition.value;
	const range = (given ?? {}) as { from?: number; to?: number };
	const values = Array.isArray(given) ? given.map((item: { value: unknown }) => item.value) : [];
	switch (condition.operator) {
		case 'in':
			return values.includes(value);
		case 'notIn':
			return !values.includes(value);
		case 'eq':
			return value === Number(given);
		case 'ne':
			return value !== Number(given);
		case 'gt':
			return Number(value) > Number(given);
		case 'gte':
			return Number(value) >= Number(given);
		case 'lt':
			return Number(value) < Number(given);
		case 'lte':
			return Number(value) <= Number(given);
		case 'between':
			return Number(value) >= (range.from ?? -Infinity) && Number(value) <= (range.to ?? Infinity);
		case 'isTrue':
			return value === true;
		case 'isFalse':
			return value === false;
		default:
			return true;
	}
}

function keep(row: Booking, group: FilterGroup): boolean {
	const results = group.items.map((node) =>
		'items' in node ? keep(row, node) : matches(row, node)
	);
	return group.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
}

export function queryBookings(query: Query, source = bookings): DataTableLoadResult<Booking> {
	const { page = 1, pageSize = 20, sort, search = '', filterValue } = query;
	const needle = search.toLowerCase();
	let rows = source.filter(
		(row) =>
			(!needle || `${row.client} ${row.service}`.toLowerCase().includes(needle)) &&
			(!filterValue || keep(row, filterValue))
	);
	if (sort) {
		const sign = sort.direction === 'asc' ? 1 : -1;
		const key = sort.key as keyof Booking;
		rows = [...rows].sort((a, b) => {
			const left = a[key];
			const right = b[key];
			if (typeof left === 'string') return sign * left.localeCompare(String(right));
			return sign * (Number(left) - Number(right));
		});
	}
	return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

export function fetchBookings(query: Query & { signal?: AbortSignal }, delay = 350): Promise<DataTableLoadResult<Booking>> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => resolve(queryBookings(query)), delay);
		query.signal?.addEventListener('abort', () => {
			clearTimeout(timer);
			reject(new DOMException('Aborted', 'AbortError'));
		});
	});
}

export const statuses = {
	confirmed: { label: 'Confirmed', variant: 'success' },
	pending: { label: 'Pending', variant: 'warning' },
	cancelled: { label: 'Cancelled', variant: 'error' }
} as const;
