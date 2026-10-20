<script lang="ts">
	import { Button } from '@likable-hair/svelte';

	let { label, ...rest } = $props();
</script>

<Button {...rest} --button-max-height="40px">{label}</Button>
