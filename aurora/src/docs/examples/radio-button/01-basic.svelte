<!-- @component Basic
Radios with the same `name` form a group: the arrow keys move the selection. `bind:group` with the same variable on every radio keeps the selected `value` in sync, as Svelte's `bind:group` does. -->
<script lang="ts">
	import { RadioButton } from '#lib';

	let gender = $state('female');
</script>

<div class="demo">
	<div class="row">
		<RadioButton name="gender" value="male" label="Male" bind:group={gender} />
		<RadioButton name="gender" value="female" label="Female" bind:group={gender} />
		<RadioButton name="gender" value="other" label="Other" bind:group={gender} />
	</div>
	<p>Selected: <strong>{gender}</strong></p>
	<div class="row">
		<RadioButton name="disabled" value="a" label="Disabled" disabled />
		<RadioButton name="disabled" value="b" label="Disabled and checked" checked disabled />
	</div>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 20px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
