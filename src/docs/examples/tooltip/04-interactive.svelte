<!-- @component Interactive
With `interactive` the content can hold links and buttons, like a preview card. The tooltip waits a moment before closing, so the pointer can reach it, and stays open while the keyboard focus is inside; put the Tooltip right after its activator so Tab moves into it. Escape gives the focus back to the activator. -->
<script lang="ts">
	import { Button, Tooltip } from '#lib';

	let client = $state<HTMLButtonElement | HTMLAnchorElement>();
</script>

<div class="note">
	Order placed by
	<Button bind:buttonElement={client} buttonType="text" size="sm">Mario Rossi</Button>
	<Tooltip activator={client} interactive variant="rich" placement="bottom" title="Mario Rossi">
		<span class="card">
			<span>Client since 2019 · 42 orders · Milan</span>
			<a href="#client">Open the client</a>
		</span>
	</Tooltip>
	on 24 September.
</div>

<style>
	.note {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		margin: 0;
		font-size: 14px;
	}

	.card {
		display: grid;
		gap: 8px;
	}

	.card a {
		color: var(--global-color-primary);
		font-weight: 500;
	}
</style>
