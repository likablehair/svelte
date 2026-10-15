<script>
	import { Button, Card } from '@likable-hair/svelte';

	export let title = '';
	$: upper = title.toUpperCase();
</script>

<Button on:click={(e) => console.log(e.detail)}>
	<span slot="append">→</span>
	{upper}
</Button>
<Card />
