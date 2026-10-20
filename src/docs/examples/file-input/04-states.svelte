<!-- @component States
`state` with `hint` shows a message from the app, like the other fields. `disabled` turns off the zone and the native input. -->
<script lang="ts">
	import { FileInput } from '#lib';
</script>

<div class="demo">
	<FileInput label="Identity document" state="error" hint="The document is required" compact />
	<FileInput label="Signed contract" disabled description="Available after the approval" compact />
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 420px;
	}
</style>
