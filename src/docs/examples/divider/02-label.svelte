<!-- @component Text in the middle
With `label` (or any content as children) the text sits in the middle of the line and screen readers read it. -->
<script lang="ts">
	import { mdiGoogle } from '@mdi/js';
	import { Button, Divider, SimpleTextField } from '#lib';
</script>

<div class="sign-in">
	<Button variant="secondary" icon={mdiGoogle} --button-width="100%">Continue with Google</Button>
	<Divider label="or" />
	<SimpleTextField label="Email" type="email" placeholder="name@salon.com" />
	<Divider variant="gradient">Already a client?</Divider>
</div>

<style>
	.sign-in {
		display: grid;
		width: 100%;
		max-width: 320px;
	}
</style>
