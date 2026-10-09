<script lang="ts">
	import RadioButton from '#lib/components/simple/forms/RadioButton.svelte';

	let plan = $state<string | number | undefined>('monthly');
</script>

<RadioButton name="plan" value="monthly" label="Monthly" bind:group={plan} />
<RadioButton name="plan" value="quarterly" label="Quarterly" disabled bind:group={plan} />
<RadioButton name="plan" value="yearly" label="Yearly" bind:group={plan} />
<output>{plan}</output>
<button type="button" onclick={() => (plan = 'yearly')}>Choose yearly</button>
<button type="button" onclick={() => (plan = undefined)}>Clear</button>
