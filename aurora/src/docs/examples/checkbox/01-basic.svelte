<!-- @component Basic
`bind:checked` keeps the state in sync. A click on the label toggles the box; `labelSnippet` takes any content, such as a link. -->
<script lang="ts">
	import { Checkbox } from '#lib';

	let reminders = $state(true);
	let newsletter = $state(false);
	let terms = $state(false);
</script>

<div class="list">
	<Checkbox label="Send SMS reminders" bind:checked={reminders} />
	<Checkbox label="Monthly newsletter" bind:checked={newsletter} />
	<Checkbox bind:checked={terms} name="terms" required>
		{#snippet labelSnippet()}
			I accept the <a href="#terms">terms of service</a>
		{/snippet}
	</Checkbox>
	<Checkbox label="Disabled" disabled />
	<Checkbox label="Disabled and checked" checked disabled />
</div>

<style>
	.list {
		display: grid;
		justify-items: start;
		gap: 12px;
	}
</style>
