<!-- @component AND, OR and nested groups
`allowOr` lets the user switch the conditions to OR (on the second row), `maxDepth` allows groups: every filter is a box with "Add nested filter", which turns it into a group (OR under AND when `allowOr` is on) or adds a row to it, and the root has one "Add filter". Turn them on only when the backend applies OR groups correctly. -->
<script lang="ts">
	import { Filters, createFilters, filterCondition, filterGroup } from '#lib';
	import { fields } from './fields.js';

	let value = $state(
		createFilters([
			filterCondition('date', 'period', 'thisMonth'),
			filterGroup('or', [
				filterCondition('status', 'in', [{ value: 'waiting', label: 'Waiting' }]),
				filterCondition('paid', 'isFalse')
			])
		])
	);
</script>

<Filters {fields} bind:value allowOr maxDepth={1} />