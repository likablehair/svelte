<!-- @component Content after the text
`appendIcon` adds an icon after the text, `appendSnippet` any content (here a counter). When the button is wider than its content, the appended part moves to the right edge. -->
<script lang="ts">
	import { mdiBellOutline, mdiChevronDown, mdiStorefrontOutline } from '@mdi/js';
	import { Button } from '#lib';
</script>

<div class="stack">
	<Button variant="secondary" icon={mdiStorefrontOutline} appendIcon={mdiChevronDown} --button-width="260px">
		Milano Centro
	</Button>
	<Button variant="secondary" icon={mdiBellOutline}>
		Notifications
		{#snippet appendSnippet()}
			<span class="count">8</span>
		{/snippet}
	</Button>
</div>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	.count {
		padding: 1px 7px;
		border-radius: var(--global-radius-full);
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-size: 11.5px;
		font-weight: 600;
	}
</style>
