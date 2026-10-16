<!-- @component Loading and protected images
An image that cannot load leaves the initials in place; `bind:imageLoadingStatus` tells `loading`, `success` or `error`. Images downloaded with authentication can be passed as a `Blob` or `File`: the avatar creates the object URL and revokes it when it is no longer needed. -->
<script lang="ts">
	import { Avatar } from '#lib';

	let status = $state<'loading' | 'success' | 'error'>();

	const blob = new Blob(
		[
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2fb6c9"/><circle cx="32" cy="26" r="11" fill="#fff" opacity=".85"/><ellipse cx="32" cy="56" rx="20" ry="14" fill="#fff" opacity=".85"/></svg>'
		],
		{ type: 'image/svg+xml' }
	);
</script>

<div class="demo">
	<div class="row">
		<Avatar name="Mario Rossi" src="/missing-photo.jpg" bind:imageLoadingStatus={status} />
		<span>Image status: {status}</span>
	</div>
	<div class="row">
		<Avatar name="Sara Bianchi" src={blob} />
		<span>From a Blob</span>
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.demo {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
