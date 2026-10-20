<!-- @component Solid and gradient
A native `<hr>` with 10px above and below. `variant="gradient"` uses the theme gradient faded at both ends. -->
<script lang="ts">
	import { Divider } from '#lib';
</script>

<div class="card">
	<p>Cut and blow-dry · 45′</p>
	<Divider />
	<p>Color · 1h 30′</p>
	<Divider variant="gradient" />
	<p>Total · €95</p>
</div>

<style>
	.card {
		width: 100%;
		max-width: 360px;
		font-size: 14px;
	}

	p {
		margin: 0;
	}
</style>
