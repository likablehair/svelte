<!-- @component Basic
`onconfirmClick` and `oncancelClick` receive the native click event. While `loading` the confirm button shows a spinner and is disabled; `confirmDisable` and `cancelDisable` disable one button. -->
<script lang="ts">
	import { ConfirmOrCancelButtons } from '#lib';

	let saving = $state(false);
	let message = $state('');

	function save() {
		saving = true;
		message = '';
		setTimeout(() => {
			saving = false;
			message = 'Saved';
		}, 1200);
	}
</script>

<div class="demo">
	<ConfirmOrCancelButtons
		loading={saving}
		onconfirmClick={save}
		oncancelClick={() => (message = 'Cancelled')}
	/>
	<ConfirmOrCancelButtons confirmText="Publish" cancelText="Back" confirmDisable />
	<p aria-live="polite">{message}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
	}

	p {
		min-height: 1lh;
		margin: 0;
		font-size: 13px;
	}
</style>
