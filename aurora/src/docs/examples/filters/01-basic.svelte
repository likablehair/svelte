<!-- @component Add filters one at a time
"Add filter" lists the fields, then the card asks for the operator and the value; each condition becomes a pill (click to edit, × to remove). The "Filters" button opens every condition in rows. Below, the query that `onchange` receives (`builder.toJson()`). -->
<script lang="ts">
	import { Filters, createFilters, filterCondition, type FilterBuilder } from '#lib';
	import { fields } from './fields.js';

	let value = $state(
		createFilters([
			filterCondition('service', 'in', [{ value: 3, label: 'Balayage' }]),
			filterCondition('amount', 'gte', 50)
		])
	);
	let query = $state<FilterBuilder>();
</script>

<div class="example">
	<Filters {fields} bind:value onchange={(change) => (query = change.builder)} />
	<pre>{JSON.stringify(query?.toJson() ?? 'Change a filter to see the query', null, 2)}</pre>
</div>

<style>
	.example {
		display: grid;
		gap: 16px;
	}

	pre {
		max-height: 220px;
		margin: 0;
		overflow: auto;
		padding: 12px;
		border-radius: var(--global-radius-md);
		background: var(--global-color-surface-2);
		color: var(--global-color-text-2);
		font-size: 11.5px;
	}
</style>
