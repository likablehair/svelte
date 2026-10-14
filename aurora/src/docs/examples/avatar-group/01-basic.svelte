<!-- @component Group
The avatars overlap, separated by a thin gap; every avatar shows its name in a Tooltip. With `maxVisible` the others become a "+N" counter whose Tooltip lists them. `aria-label` tells what the people are. -->
<script lang="ts">
	import { AvatarGroup, type AvatarGroupItem } from '#lib';

	const team: AvatarGroupItem[] = [
		{ name: 'Mario Rossi', status: 'online' },
		{ name: 'Giulia Marini' },
		{ name: 'Sara Bianchi' },
		{ name: 'Luca Ferri' },
		{ name: 'Anna Greco' },
		{ name: 'Paolo Russo' },
		{ name: 'Chiara Costa' }
	];
</script>

<div class="demo">
	<AvatarGroup avatars={team} maxVisible={3} aria-label="Assigned people" />
	<AvatarGroup avatars={team.slice(0, 4)} aria-label="Reviewers" />
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
</style>
