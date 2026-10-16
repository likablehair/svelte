<!-- @component Different markup by width
`defaultSnippet` receives the flags of the breakpoints; resize the window to see them change. In scripts the same flags are `breakpoints.mAndDown` and so on. -->
<script lang="ts">
	import { Button, MediaQuery } from '#lib';
	import { mdiPlus } from '@mdi/js';
</script>

<MediaQuery>
	{#snippet defaultSnippet({ mAndDown, sAndDown })}
		<div class="stack">
			<Button icon={mdiPlus} aria-label={sAndDown ? 'New booking' : undefined}>
				{#if !sAndDown}New booking{/if}
			</Button>
			<p>{mAndDown ? 'Mobile layout: up to 1024px' : 'Desktop layout: wider than 1024px'}</p>
		</div>
	{/snippet}
</MediaQuery>

<style>
	.stack {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
