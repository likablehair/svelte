<!-- @component Rich
`variant="rich"` is a card with a bold `title` and wrapping text, for explanations longer than a label. `placement` picks the side; the tooltip flips when there is no room. -->
<script lang="ts">
	import { mdiInformationOutline } from '@mdi/js';
	import { Button, Tooltip } from '#lib';

	let info = $state<HTMLButtonElement | HTMLAnchorElement>();
</script>

<span class="field">
	Fidelity score
	<Button
		bind:buttonElement={info}
		buttonType="icon"
		variant="secondary"
		size="sm"
		icon={mdiInformationOutline}
		aria-label="About the fidelity score"
	/>
	<Tooltip
		activator={info}
		variant="rich"
		placement="right"
		title="Fidelity score"
		text="Based on how often the client visited and how much they spent in the last 12 months."
	/>
</span>

<style>
	.field {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
	}
</style>
