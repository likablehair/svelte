<!-- @component Cards
`card` shows every option as a bordered box and `orientation="horizontal"` puts them side by side; they wrap when each would be narrower than `--radio-group-card-min-width`. `itemDescriptionSnippet` replaces the secondary line. -->
<script lang="ts">
	import { RadioGroup } from '#lib';

	let plan = $state<string | number>('yearly');
</script>

<div class="demo">
	<RadioGroup
		label="Plan"
		card
		orientation="horizontal"
		bind:value={plan}
		items={[
			{ value: 'monthly', label: 'Monthly', data: { price: 29, period: 'month' } },
			{ value: 'yearly', label: 'Yearly', data: { price: 290, period: 'year' } }
		]}
	>
		{#snippet itemDescriptionSnippet({ item })}
			€{item.data?.price} / {item.data?.period}
		{/snippet}
	</RadioGroup>
	<RadioGroup
		label="Delivery"
		card
		items={[
			{ value: 'standard', label: 'Standard', description: '3–5 working days, free' },
			{ value: 'express', label: 'Express', description: 'Next working day, €9' },
			{ value: 'pickup', label: 'Pick up in store', description: 'Not available in your area', disabled: true }
		]}
	/>
</div>

<style>
	.demo {
		display: grid;
		gap: 24px;
		width: 100%;
		max-width: 400px;
	}
</style>
