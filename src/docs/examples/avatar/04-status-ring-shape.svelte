<!-- @component Status, ring and shape
`status` adds a dot in the bottom-right corner (`online`, `away`, `busy`, `offline`) and its meaning to the accessible name. `ring` highlights an avatar, for example the current user. `shape="square"` rounds the corners instead of drawing a circle. The thin gap around the dot and the ring takes `--avatar-gap-color`: set it to the background behind the avatar. -->
<script lang="ts">
	import { Avatar } from '#lib';
</script>

<div class="row">
	<Avatar name="Mario Rossi" status="online" />
	<Avatar name="Giulia Marini" status="away" />
	<Avatar name="Sara Bianchi" status="busy" />
	<Avatar name="Luca Ferri" status="offline" />
	<Avatar name="Giulia Marini" size="lg" ring status="online" />
	<Avatar name="Acme S.p.A." text="AC" shape="square" />
	<Avatar name="Acme S.p.A." text="AC" shape="square" size="lg" status="online" />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}
</style>
