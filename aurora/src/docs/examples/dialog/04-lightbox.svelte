<!-- @component Lightbox
`topRightSnippet`, `centerLeftSnippet` and `centerRightSnippet` sit on the backdrop, outside the surface. Here the surface becomes transparent and wider through CSS variables, and the transition variables turn the default rise into a zoom. -->
<script lang="ts">
	import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiImageMultipleOutline } from '@mdi/js';
	import { Button, Dialog } from '#lib';

	const photos = ['Balayage', 'Copper bob', 'Silver blonde'];
	let open = $state(false);
	let index = $state(0);
</script>

<Button variant="secondary" icon={mdiImageMultipleOutline} onclick={() => (open = true)}>Open gallery</Button>

<Dialog
	bind:open
	aria-label="Gallery"
	--dialog-max-width="720px"
	--dialog-padding="0"
	--dialog-background="transparent"
	--dialog-border-width="0"
	--dialog-box-shadow="none"
	--dialog-transition-y="0px"
	--dialog-transition-scale="0.7"
>
	<figure class="photo" data-index={index}>
		<figcaption>{photos[index]} · {index + 1} of {photos.length}</figcaption>
	</figure>
	{#snippet topRightSnippet({ close })}
		<Button buttonType="icon" variant="secondary" icon={mdiClose} aria-label="Close" onclick={close} />
	{/snippet}
	{#snippet centerLeftSnippet()}
		<Button
			buttonType="icon"
			variant="secondary"
			icon={mdiChevronLeft}
			aria-label="Previous photo"
			disabled={index === 0}
			onclick={() => index--}
		/>
	{/snippet}
	{#snippet centerRightSnippet()}
		<Button
			buttonType="icon"
			variant="secondary"
			icon={mdiChevronRight}
			aria-label="Next photo"
			disabled={index === photos.length - 1}
			onclick={() => index++}
		/>
	{/snippet}
</Dialog>

<style>
	.photo {
		display: grid;
		align-items: end;
		margin: 0;
		aspect-ratio: 4 / 3;
		border-radius: var(--global-radius-xl);
		background: linear-gradient(135deg, var(--global-color-data-1), var(--global-color-data-3));
	}

	.photo[data-index='1'] {
		background: linear-gradient(135deg, var(--global-color-data-5), var(--global-color-data-6));
	}

	.photo[data-index='2'] {
		background: linear-gradient(135deg, var(--global-color-data-2), var(--global-color-data-4));
	}

	figcaption {
		padding: 14px 18px;
		color: #fff;
		font-weight: 600;
	}
</style>
