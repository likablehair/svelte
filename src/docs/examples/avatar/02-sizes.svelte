<!-- @component Sizes
`size` goes from `xs` (24px) to `xl` (80px); the initials and the icon scale with it. Any other size with `--avatar-size`. -->
<script lang="ts">
	import { Avatar } from '#lib';

	const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
</script>

<div class="demo">
	<div class="row">
		{#each sizes as size (size)}
			<Avatar name="Giulia Marini" {size} />
		{/each}
		<Avatar name="Giulia Marini" --avatar-size="100px" />
	</div>
	<div class="row">
		{#each sizes as size (size)}
			<Avatar {size} />
		{/each}
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
