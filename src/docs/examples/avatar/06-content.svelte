<!-- @component Custom content
`children` replaces the initials inside the circle, for example with an icon, and keeps the color and the image; `icon` changes the icon shown when there is no name. `badgeSnippet` puts anything in the bottom-right corner in place of the status dot. -->
<script lang="ts">
	import { Avatar, Icon } from '#lib';
	import { mdiCurrencyEur, mdiDomain, mdiCheckDecagram } from '@mdi/js';
</script>

<div class="row">
	<Avatar name="Loan request" color={4}>
		<Icon path={mdiCurrencyEur} />
	</Avatar>
	<Avatar icon={mdiDomain} />
	<Avatar name="Giulia Marini" size="lg">
		{#snippet badgeSnippet()}
			<span class="verified"><Icon path={mdiCheckDecagram} /></span>
		{/snippet}
	</Avatar>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}

	.verified {
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--global-color-bg);
		--icon-size: 18px;
		--icon-color: var(--global-color-primary);
		transform: translate(4px, 4px);
	}
</style>
