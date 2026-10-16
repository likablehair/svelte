<!-- @component At the bottom of a sidebar
A row with a visible label, in Italian with `locale="it"` (names and tooltips: Chiaro, Sistema, Scuro). At the bottom of the screen the tooltips go above with `tooltipPlacement="top"`. -->
<script lang="ts">
	import { ModeSwitch } from '#lib';

	const uid = $props.id();
	const labelId = `${uid}-label`;
</script>

<div class="footer">
	<span id={labelId}>Tema</span>
	<ModeSwitch locale="it" tooltipPlacement="top" aria-labelledby={labelId} />
</div>

<style>
	.footer {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: min(100%, 260px);
		padding: 12px 16px;
		border-top: var(--global-border-width) solid var(--global-color-border);
		color: var(--global-color-text-2);
	}
</style>
