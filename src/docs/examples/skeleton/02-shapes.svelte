<!-- @component Shapes
`rect` fills its parent (here a 64px row) unless `--skeleton-width` and `--skeleton-height` say otherwise, `circle` is `--skeleton-size` wide, `text` draws `lines` bars of text height with a shorter last line. -->
<script lang="ts">
	import { Skeleton } from '#lib';
</script>

<div class="grid">
	<div class="cell"><Skeleton /></div>
	<Skeleton shape="circle" --skeleton-size="64px" />
	<Skeleton shape="text" lines={3} />
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr auto 2fr;
		align-items: center;
		gap: 24px;
		width: 100%;
	}

	.cell {
		height: 64px;
	}
</style>
