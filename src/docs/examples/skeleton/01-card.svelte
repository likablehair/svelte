<!-- @component Loading card
Skeletons in the shape of the content that is coming. The region that is loading gets `aria-busy="true"`; the skeletons themselves are hidden from screen readers. -->
<script lang="ts">
	import { Skeleton, Switch } from '#lib';

	let loaded = $state(false);
</script>

<div class="stack">
	<Switch bind:checked={loaded} label="Loaded" />
	<article class="card" aria-busy={!loaded}>
		{#if loaded}
			<header>
				<span class="avatar">GR</span>
				<div>
					<b>Giulia Rossi</b>
					<p>Colour and cut · 2h ago</p>
				</div>
			</header>
			<div class="photo"></div>
			<p>Warm copper balayage with a soft layered cut. Next appointment in six weeks for a gloss.</p>
		{:else}
			<header>
				<Skeleton shape="circle" --skeleton-size="44px" />
				<div class="lines">
					<Skeleton --skeleton-height="12px" --skeleton-width="60%" />
					<Skeleton --skeleton-height="10px" --skeleton-width="35%" />
				</div>
			</header>
			<Skeleton --skeleton-height="110px" --skeleton-border-radius="8px" />
			<Skeleton shape="text" lines={2} />
		{/if}
	</article>
</div>

<style>
	.stack {
		display: grid;
		gap: 16px;
		justify-items: start;
		width: min(100%, 360px);
	}

	.card {
		box-sizing: border-box;
		display: grid;
		gap: 12px;
		width: 100%;
		padding: 16px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
		font-size: 14px;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.lines {
		display: grid;
		flex: 1;
		gap: 8px;
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--global-color-primary-soft);
		color: var(--global-color-primary);
		font-weight: 600;
	}

	b {
		font-weight: 600;
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
	}

	header p {
		color: var(--global-color-text-3);
		font-size: 12px;
	}

	.photo {
		height: 110px;
		border-radius: 8px;
		background: var(--global-gradient-soft);
	}
</style>
