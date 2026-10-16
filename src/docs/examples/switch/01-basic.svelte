<!-- @component Basic
`bind:checked` keeps the state in sync and a click on the label toggles it. Two sizes: `md` and `lg`. -->
<script lang="ts">
	import { Switch } from '#lib';

	let online = $state(true);
	let holiday = $state(false);
	let large = $state(true);
</script>

<div class="list">
	<Switch label="Online booking" bind:checked={online} />
	<Switch label="Holiday mode" bind:checked={holiday} />
	<Switch label="Large" size="lg" bind:checked={large} />
	<Switch label="Disabled" disabled />
	<Switch label="Disabled and on" checked disabled />
</div>

<style>
	.list {
		display: grid;
		justify-items: start;
		gap: 14px;
	}
</style>
