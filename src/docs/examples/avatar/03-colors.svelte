<!-- @component Colors
By default the color is one of six gradients picked from the name; `colorKey` picks it from another value, such as an id, so it does not change with the name. `color` fixes a gradient (`1` to `6`), the brand one (`primary`) or grey (`neutral`). The gradients come from the theme's `--global-color-data-*` tokens, and `--avatar-background` and `--avatar-color` change a single avatar. -->
<script lang="ts">
	import { Avatar } from '#lib';

	const people = ['Mario Rossi', 'Giulia Marini', 'Sara Bianchi', 'Luca Ferri', 'Anna Greco', 'Paolo Russo', 'Chiara Costa', 'Marco Gallo'];
</script>

<div class="demo">
	<div class="row">
		{#each people as name (name)}
			<Avatar {name} />
		{/each}
	</div>
	<div class="row">
		{#each [1, 2, 3, 4, 5, 6] as const as color (color)}
			<Avatar name="Mario Rossi" {color} />
		{/each}
		<Avatar name="Mario Rossi" color="primary" />
		<Avatar name="Mario Rossi" color="neutral" />
		<Avatar name="Mario Rossi" --avatar-background="#111827" --avatar-color="#facc15" />
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	.demo {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
