<!-- @component Sizes and shape
`size` and `shape` apply to every avatar and the overlap follows the size; `--avatar-group-overlap` and `--avatar-group-gap-width` change the overlap and the gap. -->
<script lang="ts">
	import { AvatarGroup } from '#lib';

	const team = ['Mario Rossi', 'Giulia Marini', 'Sara Bianchi', 'Luca Ferri', 'Anna Greco', 'Paolo Russo'].map((name) => ({ name }));
</script>

<div class="demo">
	<AvatarGroup avatars={team} maxVisible={4} size="xs" aria-label="Team" />
	<AvatarGroup avatars={team} maxVisible={4} size="sm" aria-label="Team" />
	<AvatarGroup avatars={team} maxVisible={4} size="lg" aria-label="Team" />
	<AvatarGroup avatars={team} maxVisible={4} shape="square" aria-label="Team" --avatar-group-overlap="6px" />
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
</style>
