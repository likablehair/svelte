<!-- @component Actions, loading and progress
`action` adds a button that runs a callback and closes the toast. A `loading` toast stays open until `updateToast` turns it into a result; `progress` shows a bar that `updateToast` moves. -->
<script lang="ts">
	import { addSuccessToast, addToast, Button, updateToast } from '#lib';

	function remove() {
		addToast({
			title: 'Client deleted',
			description: 'Giulia Rossi was moved to the bin.',
			action: { label: 'Undo', onclick: () => addSuccessToast('Client restored') }
		});
	}

	function sync() {
		const id = addToast({ title: 'Importing clients…', loading: true, closable: false });
		setTimeout(() => {
			updateToast(id, {
				variant: 'success',
				title: '248 clients imported',
				loading: false,
				closable: true
			});
		}, 2500);
	}

	function upload() {
		const id = addToast({ title: 'Uploading photos', progress: 0, duration: 0 });
		let value = 0;
		const timer = setInterval(() => {
			value += 10;
			updateToast(id, { progress: value });
			if (value < 100) return;
			clearInterval(timer);
			updateToast(id, { variant: 'success', title: '12 photos uploaded', progress: undefined, duration: 4000 });
		}, 300);
	}
</script>

<div class="row">
	<Button variant="secondary" onclick={remove}>With action</Button>
	<Button variant="secondary" onclick={sync}>Loading</Button>
	<Button variant="secondary" onclick={upload}>Progress</Button>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
