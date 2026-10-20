<!-- @component Content and icons
`children` sits at the start of the row, for example a note about unsaved changes. `confirmIcon`, `cancelIcon` and `confirmVariant` change the buttons; `danger` suits a delete. -->
<script lang="ts">
	import { mdiCheck, mdiDeleteOutline, mdiInformationOutline } from '@mdi/js';
	import { ConfirmOrCancelButtons, Icon } from '#lib';
</script>

<div class="demo">
	<div class="bar">
		<ConfirmOrCancelButtons confirmText="Confirm" confirmIcon={mdiCheck}>
			<Icon path={mdiInformationOutline} />
			Unsaved changes
		</ConfirmOrCancelButtons>
	</div>
	<div class="bar">
		<ConfirmOrCancelButtons
			confirmText="Delete"
			confirmVariant="danger"
			confirmIcon={mdiDeleteOutline}
		/>
	</div>
</div>

<style>
	.demo {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 520px;
	}

	.bar {
		padding: 14px 16px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}
</style>
