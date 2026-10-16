<!-- @component In the top bar
The usual place: on the right of the app bar, next to the user. `size="sm"` fits a crowded bar. -->
<script lang="ts">
	import { Avatar, ModeSwitch } from '#lib';
</script>

<header class="bar">
	<b>Bookings</b>
	<div class="end">
		<ModeSwitch size="sm" />
		<Avatar name="Giulia Rossi" size="sm" />
	</div>
</header>

<style>
	.bar {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		width: min(100%, 560px);
		height: 56px;
		padding: 0 16px;
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
	}

	.end {
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
