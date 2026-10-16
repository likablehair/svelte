<!-- @component States
`state` colors the border and the hint and shows an icon; with `error` the select also gets `aria-invalid`. `disabled` is the native attribute. -->
<script lang="ts">
	import { Select, type Item } from '#lib';

	const plans: Item[] = [
		{ value: 'monthly', label: 'Monthly' },
		{ value: 'yearly', label: 'Yearly' }
	];
</script>

<div class="demo">
	<Select label="Plan" placeholder="Choose a plan" items={plans} state="error" hint="Choose a plan to continue" />
	<Select label="Plan" items={plans} value="yearly" state="success" hint="Two months free" />
	<Select label="Plan" items={plans} value="monthly" disabled />
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}
</style>
