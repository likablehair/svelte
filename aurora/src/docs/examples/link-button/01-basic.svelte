<!-- @component Basic
A text link whose underline grows on hover and focus. `appendIcon` slides forward with it; `prependIcon` stays still. The color comes from `--link-button-color`. -->
<script lang="ts">
	import { mdiArrowRight, mdiBookOpenVariant } from '@mdi/js';
	import { LinkButton } from '#lib';
</script>

<div class="row">
	<LinkButton href="#appointments" appendIcon={mdiArrowRight}>See all appointments</LinkButton>
	<LinkButton
		href="https://svelte.dev"
		target="_blank"
		prependIcon={mdiBookOpenVariant}
		--link-button-color="var(--global-color-primary)"
	>
		Documentation
	</LinkButton>
	<LinkButton href="#disabled" disabled>Disabled</LinkButton>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 28px;
	}
</style>
