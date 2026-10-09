<!-- @component Basic
A field with label, placeholder, icon and hint. `bind:value` keeps the value in sync. -->
<script lang="ts">
	import { mdiEmailOutline, mdiLockOutline } from '@mdi/js';
	import { SimpleTextField } from '#lib';

	let email = $state('');
	let password = $state('');
</script>

<div class="form">
	<SimpleTextField
		label="Email"
		type="email"
		placeholder="name@salon.com"
		prependInnerIcon={mdiEmailOutline}
		hint="We never share your email."
		bind:value={email}
	/>
	<SimpleTextField
		label="Password"
		type="password"
		prependInnerIcon={mdiLockOutline}
		bind:value={password}
	/>
</div>

<style>
	.form {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}
</style>
