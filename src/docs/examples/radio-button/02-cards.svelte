<!-- @component Cards
`card` shows the radio as a bordered box that highlights when selected, and `description` adds a secondary line, read as the description of the radio. The layout of the cards is up to the app. -->
<script lang="ts">
	import { RadioButton } from '#lib';

	let plan = $state('monthly');
</script>

<div class="plans">
	<RadioButton
		name="plan"
		value="monthly"
		label="Monthly"
		description="€29 / month"
		card
		bind:group={plan}
	/>
	<RadioButton
		name="plan"
		value="yearly"
		label="Yearly"
		description="€290 / year"
		card
		bind:group={plan}
	/>
</div>

<style>
	.plans {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
		width: 100%;
		max-width: 400px;
	}
</style>
