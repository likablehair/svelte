<!-- @component Initials, images and icon
With `name` the avatar shows the initials of the first and last word and picks a color from the name, so the same person always has the same color. `src` shows an image over the initials, which stay visible while it loads or when it fails. `text` replaces the initials; with neither the avatar shows an icon. -->
<script lang="ts">
	import { Avatar } from '#lib';

	const photo = `data:image/svg+xml,${encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#ffb547"/><stop offset="1" stop-color="#ff4d6d"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" opacity=".85"/><ellipse cx="32" cy="56" rx="20" ry="14" fill="#fff" opacity=".85"/></svg>'
	)}`;
</script>

<div class="row">
	<Avatar name="Mario Rossi" />
	<Avatar name="Giulia Marini" />
	<Avatar name="Sara Bianchi" />
	<Avatar name="Luca" />
	<Avatar name="Elena Conti" src={photo} />
	<Avatar name="Acme S.p.A." text="ACM" />
	<Avatar />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}
</style>
