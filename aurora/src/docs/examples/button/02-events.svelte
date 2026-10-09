<!-- @component Events and loading
Events are the native ones of `<button>`. While `loading` the button is disabled and the spinner replaces the icon. -->
<script lang="ts">
	import { mdiTrashCanOutline, mdiTrayArrowDown } from '@mdi/js';
	import { Button } from '#lib';

	let clicks = $state(0);
	let saving = $state(false);

	function save() {
		saving = true;
		setTimeout(() => (saving = false), 1500);
	}
</script>

<Button onclick={() => clicks++}>Clicked {clicks} times</Button>
<Button variant="secondary" loading={saving} icon={mdiTrayArrowDown} onclick={save}>
	{saving ? 'Saving…' : 'Save'}
</Button>
<Button buttonType="text" variant="danger" icon={mdiTrashCanOutline}>Remove</Button>
