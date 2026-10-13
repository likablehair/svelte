<!-- @component Pinned fields, presets and actions
`pinned` keeps a field in the bar even without a condition; `presets` are chips that add ready-made conditions; `actionsSnippet` puts the page actions on the right. A `hidden` field with a `locked` condition is a fixed constraint the user does not see. -->
<script lang="ts">
	import { mdiPlus } from '@mdi/js';
	import { Button, Filters, createFilters, filterCondition, type FilterField, type FilterPreset } from '#lib';
	import { fields as base } from './fields.js';

	const fields: FilterField[] = [
		...base.map((field) => (field.name === 'status' ? { ...field, pinned: true } : field)),
		{ name: 'tenant', label: 'Salon', type: 'number', column: 'appointments.salonId', hidden: true }
	];

	const presets: FilterPreset[] = [
		{ id: 'today', label: 'Today', count: 18, conditions: [{ field: 'date', operator: 'period', value: 'today' }] },
		{ id: 'week', label: 'This week', count: 94, conditions: [{ field: 'date', operator: 'period', value: 'thisWeek' }] },
		{ id: 'unpaid', label: 'Not paid', count: 7, conditions: [{ field: 'paid', operator: 'isFalse' }] }
	];

	let value = $state(createFilters([filterCondition('tenant', 'eq', 12, { locked: true })]));
</script>

<Filters {fields} {presets} bind:value>
	{#snippet actionsSnippet()}
		<Button size="sm" icon={mdiPlus}>New appointment</Button>
	{/snippet}
</Filters>