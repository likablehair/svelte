<!-- @component Edit one condition
The card on its own: the operators of the field side by side (up to four), then the input of the value. Every change calls `onchange`; here the condition is shown below as JSON, the shape stored in the `Filters` tree. -->
<script lang="ts">
	import { mdiCashMultiple } from '@mdi/js';
	import { FilterEditor, filterCondition, type FilterField } from '#lib';

	const field: FilterField = {
		name: 'amount',
		label: 'Amount',
		icon: mdiCashMultiple,
		type: 'number',
		unit: '€',
		operators: ['gte', 'lte', 'eq', 'between']
	};

	let condition = $state(filterCondition('amount', 'gte', 50));
</script>

<div class="example">
	<div class="card">
		<FilterEditor {field} bind:condition />
	</div>
	<pre>{JSON.stringify({ operator: condition.operator, value: condition.value })}</pre>
</div>

<style>
	.example {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	.card {
		border: var(--global-border-width) solid var(--global-color-border-strong);
		border-radius: var(--global-radius-xl);
		background: var(--global-color-surface-pop);
		box-shadow: var(--global-shadow-lg);
	}

	pre {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 12px;
	}
</style>
