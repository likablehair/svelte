<script lang="ts">
	import { Button, Chip, ToolTip, Icon } from '@likable-hair/svelte';
	import type { Header } from '@likable-hair/svelte/dist/components/simple/lists/SimpleTable.svelte';
	import StandardButton from '$lib/components/StandardButton.svelte';

	let saving = $state(false);
	let headers: Header[] = [];

	function save(event: CustomEvent) {
		console.log(event.detail, headers);
	}
</script>

<Button icon="mdi-plus" onclick={(e) => console.log(e.detail.nativeEvent)} disabled={saving}>Add</Button>
<Chip close>Tag</Chip>
<ToolTip menuProps={{}}>Hint</ToolTip>
<Icon name="mdi-check" />
<StandardButton label="Save" icon="mdi-content-save" loading={saving} onclick={save} --button-background-color="red" />
