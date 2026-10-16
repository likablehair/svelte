<!-- @component Direction
By default the buttons stack only when their space is narrower than 480px. `direction="column"` always stacks them, confirm on top at full width, for example under a login form or in a profile card; `direction="row"` keeps them in a row even in a narrow space. -->
<script lang="ts">
	import { ConfirmOrCancelButtons } from '#lib';
</script>

<div class="demo">
	<div class="card">
		<ConfirmOrCancelButtons direction="column" confirmText="Log out" cancelText="Reload profile" />
	</div>
	<div class="narrow">
		<ConfirmOrCancelButtons direction="row" confirmText="Apply" cancelText="Reset" />
	</div>
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 16px;
	}

	.card {
		width: 320px;
		padding: 16px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	.narrow {
		width: 240px;
	}
</style>
