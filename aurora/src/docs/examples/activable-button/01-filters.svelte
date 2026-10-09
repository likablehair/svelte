<!-- @component Filters
Every click flips `active` (here with `bind:active`) and the dot lights up; the state is announced with `aria-pressed`. `size` and the other Button props work as usual. -->
<script lang="ts">
	import { ActivableButton } from '#lib';

	let onlyActive = $state(true);
	let favorites = $state(false);
</script>

<div class="demo">
	<div class="row">
		<ActivableButton bind:active={onlyActive}>Only active</ActivableButton>
		<ActivableButton bind:active={favorites}>Favorites</ActivableButton>
		<ActivableButton size="sm" dot={false}>No dot</ActivableButton>
		<ActivableButton disabled>Disabled</ActivableButton>
	</div>
	<p>Only active: <strong>{onlyActive}</strong> · Favorites: <strong>{favorites}</strong></p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
