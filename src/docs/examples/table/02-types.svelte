<!-- @component Column types
`type` formats the value with `Intl`, in the language of `locale`: `date` and `datetime` take a `Date`, an ISO string, a timestamp or a luxon `DateTime`, `number` takes the options of `Intl.NumberFormat`, `boolean` shows a check mark for true. `format` writes the text by hand. Empty values show "—", or the `empty` text of the column. -->
<script lang="ts">
	import { Table, type TableColumn } from '#lib';

	type Visit = {
		id: number;
		client: string;
		day: Date;
		booked: string;
		minutes: number;
		paid: boolean;
		notes: string | null;
	};

	const rows: Visit[] = [
		{
			id: 1,
			client: 'Luca Rossi',
			day: new Date(2026, 8, 24),
			booked: '2026-09-20T09:30:00',
			minutes: 45,
			paid: true,
			notes: 'Prefers the morning'
		},
		{
			id: 2,
			client: 'Giulia Marini',
			day: new Date(2026, 8, 25),
			booked: '2026-09-21T16:05:00',
			minutes: 120,
			paid: false,
			notes: null
		},
		{
			id: 3,
			client: 'Sara Bianchi',
			day: new Date(2026, 8, 26),
			booked: '2026-09-22T11:40:00',
			minutes: 30,
			paid: true,
			notes: ''
		}
	];

	const columns: TableColumn<Visit>[] = [
		{ key: 'client', label: 'Client' },
		{ key: 'day', label: 'Day', type: 'date', dateFormat: { weekday: 'short', day: 'numeric', month: 'short' } },
		{ key: 'booked', label: 'Booked on', type: 'datetime' },
		{ key: 'minutes', label: 'Duration', type: 'number', format: (value) => `${value} min` },
		{ key: 'paid', label: 'Paid', type: 'boolean', align: 'center' },
		{ key: 'notes', label: 'Notes', empty: 'No notes' }
	];
</script>

<Table {rows} {columns} />
