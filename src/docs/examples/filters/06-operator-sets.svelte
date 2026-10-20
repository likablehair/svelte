<!-- @component Fewer operators for simple apps
`operatorSet` decides how many operators the fields offer: `basic` (the essential ones), `standard` (default) or `all`. `typeOperators` sets an own list for a type, and a field's `operators` wins over both (a list, or a set name). With one operator the card shows no choice at all. -->
<script lang="ts">
	import { Filters, createFilters } from '#lib';
	import { fields } from './fields.js';

	let value = $state(createFilters());
</script>

<Filters
	{fields}
	bind:value
	operatorSet="basic"
	typeOperators={{ date: ['is', 'period'] }}
/>
