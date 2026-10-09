<!-- @component Dots
Three dots that light up in turn, for small inline states such as "typing". `--dots-loader-color` sets one color for all dots, `--dots-loader-size` their size. -->
<script lang="ts">
	import { DotsLoader } from '#lib';
</script>

<div class="row">
	<DotsLoader />
	<div class="bubble">
		<DotsLoader label="Giulia is typing" --dots-loader-size="7px" --dots-loader-color="var(--global-color-text-3)" />
	</div>
	<DotsLoader --dots-loader-size="12px" --dots-loader-gap="8px" />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 32px;
	}

	.bubble {
		display: inline-flex;
		padding: 12px 14px;
		border-radius: 16px 16px 16px 4px;
		background: var(--global-color-surface-2);
	}
</style>
