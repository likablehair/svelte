<!-- @component Playground: every field, operator and option
One field for each type and option (several columns and words, suggestions, case sensitivity, units and scale, column comparisons, date only, date and time, periods and relative dates, options from a list, a search, countries, toggles, a Postgres array, a relation through a subquery, JSONB keys, nullable and computed yes/no, a hidden constraint), with OR and nested groups (pick how deep with `maxDepth`, 2 by default), presets, saved filters (kept in this browser) and a pinned field. Below: the query of `filtersToBuilder`, the URL parameter of `filtersToParam` and every operator of every type. -->
<script lang="ts">
	import {
		mdiAccountOutline,
		mdiBarcode,
		mdiCalendarClock,
		mdiCalendarOutline,
		mdiCashMultiple,
		mdiCheckCircleOutline,
		mdiContentCut,
		mdiEarth,
		mdiPackageVariant,
		mdiPalette,
		mdiStar,
		mdiTagOutline,
		mdiWeight
	} from '@mdi/js';
	import {
		DEFAULT_FILTER_LABELS,
		FILTER_OPERATORS,
		Filters,
		Select,
		createFilters,
		filterCondition,
		filterGroup,
		filtersToBuilder,
		filtersToParam,
		type FilterField,
		type FilterItem,
		type FilterPreset
	} from '#lib';

	const staff: FilterItem[] = [
		{ value: 1, label: 'Giulia Marini' },
		{ value: 2, label: 'Luca Rossi' },
		{ value: 3, label: 'Sara Bianchi' },
		{ value: 4, label: 'Marta Neri' }
	];
	const products: FilterItem[] = [
		{ value: 'P-100', label: 'P-100 Nourishing shampoo' },
		{ value: 'P-140', label: 'P-140 Keratin mask' },
		{ value: 'P-220', label: 'P-220 Argan oil' }
	];

	const wait = (signal: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, 300);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		});

	const fields: FilterField[] = [
		{
			name: 'client',
			label: 'Client',
			icon: mdiAccountOutline,
			type: 'string',
			columns: ['clients.firstName', 'clients.lastName'],
			words: true,
			category: 'Text'
		},
		{
			name: 'product',
			label: 'Product',
			icon: mdiBarcode,
			type: 'string',
			column: 'products.name',
			suggestColumn: 'products.code',
			suggest: async ({ searchText, signal }) => {
				await wait(signal);
				return products.filter((item) => String(item.label).toLowerCase().includes(searchText.toLowerCase()));
			},
			category: 'Text'
		},
		{
			name: 'code',
			label: 'Code (case sensitive)',
			type: 'string',
			column: 'appointments.code',
			caseSensitive: true,
			category: 'Text'
		},
		{
			name: 'amount',
			label: 'Amount',
			icon: mdiCashMultiple,
			type: 'number',
			unit: '€',
			column: 'appointments.amount',
			compareWith: [{ column: 'appointments.deposit', label: 'Deposit' }],
			category: 'Numbers'
		},
		{
			name: 'weight',
			label: 'Weight',
			icon: mdiWeight,
			type: 'number',
			unit: 't',
			scale: 1000,
			column: 'goods.weightKg',
			category: 'Numbers'
		},
		{
			name: 'date',
			label: 'Date',
			icon: mdiCalendarOutline,
			type: 'date',
			column: 'appointments.startsAt',
			category: 'Dates'
		},
		{
			name: 'due',
			label: 'Due day (date only)',
			icon: mdiCalendarOutline,
			type: 'date',
			dateOnly: true,
			column: 'invoices.dueDate',
			category: 'Dates'
		},
		{
			name: 'delivered',
			label: 'Delivered at (date and time)',
			icon: mdiCalendarClock,
			type: 'date',
			withTime: true,
			column: 'orders.deliveredAt',
			compareWith: [{ column: 'orders.promisedAt', label: 'Promised at' }],
			category: 'Dates'
		},
		{
			name: 'service',
			label: 'Service',
			icon: mdiContentCut,
			type: 'select',
			column: 'appointments.serviceId',
			items: [
				{ value: 1, label: 'Cut' },
				{ value: 2, label: 'Color' },
				{ value: 3, label: 'Balayage' },
				{ value: 'care', label: 'Any treatment', values: [4, 5, 6] }
			],
			category: 'Options'
		},
		{
			name: 'status',
			label: 'Status',
			icon: mdiCheckCircleOutline,
			type: 'select',
			view: 'toggle',
			pinned: true,
			column: 'appointments.status',
			items: [
				{ value: 'confirmed', label: 'Confirmed' },
				{ value: 'waiting', label: 'Waiting' },
				{ value: 'cancelled', label: 'Cancelled' }
			],
			category: 'Options'
		},
		{
			name: 'staff',
			label: 'Staff (search)',
			icon: mdiAccountOutline,
			type: 'select',
			column: 'appointments.staffId',
			shortcuts: [{ value: 1, label: 'Me' }],
			searcher: async ({ searchText, signal }) => {
				await wait(signal);
				return staff.filter((item) => String(item.label).toLowerCase().includes(searchText.toLowerCase()));
			},
			category: 'Options'
		},
		{
			name: 'country',
			label: 'Country',
			icon: mdiEarth,
			type: 'select',
			view: 'countries',
			column: 'clients.country',
			category: 'Options'
		},
		{
			name: 'labels',
			label: 'Labels (Postgres array)',
			icon: mdiTagOutline,
			type: 'select',
			array: true,
			column: 'clients.labels',
			items: [
				{ value: 'vip', label: 'VIP' },
				{ value: 'allergic', label: 'Allergic' },
				{ value: 'new', label: 'New' }
			],
			category: 'Options'
		},
		{
			name: 'tags',
			label: 'Tags (relation)',
			icon: mdiTagOutline,
			type: 'select',
			column: 'tagId',
			through: { key: 'clients.id', from: 'client_tags', select: 'clientId' },
			items: [
				{ value: 1, label: 'Student' },
				{ value: 2, label: 'Bride' },
				{ value: 3, label: 'Partner' }
			],
			category: 'Options'
		},
		{
			name: 'color',
			label: 'Favourite color (JSONB)',
			icon: mdiPalette,
			type: 'select',
			json: { column: 'clients.customFields', key: 'color' },
			items: [
				{ value: 'red', label: 'Red' },
				{ value: 'blonde', label: 'Blonde' },
				{ value: 'brown', label: 'Brown' }
			],
			category: 'JSON'
		},
		{
			name: 'visits',
			label: 'Visits (JSONB number)',
			type: 'number',
			json: { column: 'clients.customFields', key: 'stats.visits', cast: 'numeric' },
			category: 'JSON'
		},
		{ name: 'paid', label: 'Paid', icon: mdiCashMultiple, type: 'bool', column: 'appointments.paid', category: 'Yes / no' },
		{
			name: 'vip',
			label: 'VIP (nullable)',
			icon: mdiStar,
			type: 'bool',
			nullable: true,
			column: 'clients.vip',
			category: 'Yes / no'
		},
		{
			name: 'lowStock',
			label: 'Low stock',
			icon: mdiPackageVariant,
			type: 'bool',
			trueLabel: 'Below minimum',
			falseLabel: 'Enough',
			whenTrue: (builder) => builder.whereColumn('products.quantity', '<', 'products.minQuantity'),
			whenFalse: (builder) => builder.whereColumn('products.quantity', '>=', 'products.minQuantity'),
			category: 'Yes / no'
		},
		{
			name: 'archived',
			label: 'Show archived',
			type: 'bool',
			operators: ['isTrue'],
			whenTrue: () => {},
			whenAbsent: (builder) => builder.where('clients.archived', '=', false),
			category: 'Yes / no'
		},
		{ name: 'salon', label: 'Salon', type: 'number', column: 'appointments.salonId', hidden: true }
	];

	const presets: FilterPreset[] = [
		{ id: 'today', label: 'Today', count: 18, conditions: [{ field: 'date', operator: 'period', value: 'today' }] },
		{ id: 'week', label: 'This week', count: 94, conditions: [{ field: 'date', operator: 'period', value: 'thisWeek' }] },
		{ id: 'unpaid', label: 'Not paid', count: 7, conditions: [{ field: 'paid', operator: 'isFalse' }] }
	];

	const now = new Date(2026, 8, 24, 10);
	let maxDepth = $state(2);

	let value = $state(
		createFilters([
			filterCondition('salon', 'eq', 12, { locked: true }),
			filterCondition('client', 'contains', 'mario rossi'),
			filterCondition('amount', 'between', { from: 50, to: 200 }),
			filterGroup('or', [
				filterCondition('date', 'inLast', { amount: 2, unit: 'weeks' }),
				filterCondition('labels', 'all', [
					{ value: 'vip', label: 'VIP' },
					{ value: 'new', label: 'New' }
				])
			])
		])
	);
	let query = $derived(JSON.stringify(filtersToBuilder(value, fields, { now }).toJson(), null, 2));
	let param = $derived(filtersToParam(value));
	let types = Object.entries(FILTER_OPERATORS);
</script>

<div class="example">
	<div class="depth">
		<Select
			label="maxDepth"
			items={[0, 1, 2, 3].map((depth) => ({ value: depth, label: String(depth) }))}
			bind:value={maxDepth}
		/>
	</div>
	<Filters {fields} bind:value {presets} allowOr {maxDepth} operatorSet="all" savedKey="aurora-docs-playground" />
	<details open>
		<summary>Query (<code>filtersToBuilder(value, fields).toJson()</code>)</summary>
		<pre>{query}</pre>
	</details>
	<details>
		<summary>URL parameter (<code>filtersToParam(value)</code>)</summary>
		<pre>{param}</pre>
	</details>
	<details>
		<summary>Every operator of every type</summary>
		<table>
			<thead><tr><th>Type</th><th>Operator</th><th>Label</th><th>Input</th></tr></thead>
			<tbody>
				{#each types as [type, list] (type)}
					{#each list as operator (operator.name)}
						<tr>
							<td>{type}</td>
							<td><code>{operator.name}</code></td>
							<td>{DEFAULT_FILTER_LABELS.operators[operator.name] ?? ''}</td>
							<td>{operator.input}</td>
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>
	</details>
</div>

<style>
	.example {
		display: grid;
		gap: 14px;
	}

	.depth {
		width: 120px;
	}

	details {
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-md);
		padding: 8px 12px;
		background: var(--global-color-surface);
	}

	summary {
		color: var(--global-color-text-2);
		font-size: 13px;
		cursor: pointer;
	}

	pre {
		max-height: 260px;
		margin: 10px 0 0;
		overflow: auto;
		color: var(--global-color-text-2);
		font-size: 11.5px;
		white-space: pre-wrap;
		word-break: break-all;
	}

	table {
		width: 100%;
		margin-top: 10px;
		border-collapse: collapse;
		font-size: 12.5px;
	}

	th,
	td {
		padding: 4px 8px;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
		text-align: start;
	}

	th {
		color: var(--global-color-text-3);
		font-weight: 600;
	}
</style>
