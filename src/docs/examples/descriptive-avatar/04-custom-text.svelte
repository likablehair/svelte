<!-- @component Custom texts
`children` replaces the title and subtitle, for example to add a badge; `avatarSnippet` replaces the avatar. The `--descriptive-avatar-*` variables change gaps, text sizes and colors, and the `--avatar-*` ones reach the avatar inside. -->
<script lang="ts">
	import { Chip, DescriptiveAvatar } from '#lib';
</script>

<div class="demo">
	<DescriptiveAvatar title="Giulia Marini">
		<span class="name">Giulia Marini <Chip>Admin</Chip></span>
		<span class="meta">Last seen 5 minutes ago</span>
	</DescriptiveAvatar>
	<DescriptiveAvatar
		title="Mario Rossi"
		subtitle="Manager"
		--descriptive-avatar-title-font-size="18px"
		--descriptive-avatar-image-gap="16px"
		--avatar-size="56px"
	/>
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 32px;
	}

	.name {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}

	.meta {
		color: var(--global-color-text-3);
		font-size: 12.5px;
	}
</style>
