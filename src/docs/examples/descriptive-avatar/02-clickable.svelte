<!-- @component Clickable
With `onclick` it is a `<button>`, with `href` a link: both get the focus, a hover background and the pointer cursor. `disabled` turns them off. Without either it is plain content, with no pointer. -->
<script lang="ts">
	import { DescriptiveAvatar } from '#lib';

	let clicks = $state(0);
</script>

<div class="demo">
	<DescriptiveAvatar title="Giulia Marini" subtitle="Open profile ({clicks})" onclick={() => clicks++} />
	<DescriptiveAvatar title="Sara Bianchi" subtitle="Link to the profile" href="#profile" />
	<DescriptiveAvatar title="Luca Ferri" subtitle="Disabled" onclick={() => clicks++} disabled />
	<DescriptiveAvatar title="Anna Greco" subtitle="Card" direction="column" size="lg" href="#profile" />
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}
</style>
