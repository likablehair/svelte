<!-- @component Custom content and colors
`children` replaces the title and the description with any content. `icon=""` removes the icon box. The colors are CSS variables, here for a promotional banner in the accent color. -->
<script lang="ts">
	import { mdiGiftOutline } from '@mdi/js';
	import { AlertBanner } from '#lib';
</script>

<div class="stack">
	<AlertBanner variant="warning" icon="">
		<strong>Before you close the day:</strong>
		<ul>
			<li>2 appointments are still unpaid</li>
			<li>the cash count is missing</li>
		</ul>
	</AlertBanner>
	<AlertBanner
		icon={mdiGiftOutline}
		title="Spring offer"
		description="Clients who book a colour this month get a free gloss."
		--alert-banner-background="var(--global-color-accent-soft)"
		--alert-banner-border-color="color-mix(in oklab, var(--global-color-accent) 30%, transparent)"
		--alert-banner-icon-background="var(--global-color-accent)"
		--alert-banner-icon-color="var(--global-color-on-primary)"
	/>
</div>

<style>
	.stack {
		display: grid;
		gap: 12px;
		width: 100%;
		font-size: 13px;
	}

	ul {
		margin: 4px 0 0;
		padding-left: 18px;
		color: var(--global-color-text-2);
	}
</style>
