<!-- @component Variants and sizes
Seven colors and two sizes. `prependIcon` takes an SVG path; `prependSnippet` takes any content, here a pulsing status dot. -->
<script lang="ts">
	import { mdiCheck, mdiLightningBolt, mdiTagOutline } from '@mdi/js';
	import { Chip } from '#lib';
</script>

<div class="rows">
	<div class="row">
		<Chip prependIcon={mdiTagOutline}>Default</Chip>
		<Chip variant="primary">VIP</Chip>
		<Chip variant="accent">
			{#snippet prependSnippet()}<span class="dot"></span>{/snippet}
			Online
		</Chip>
		<Chip variant="success" prependIcon={mdiCheck}>Paid</Chip>
		<Chip variant="warning">Pending</Chip>
		<Chip variant="error">Expired</Chip>
		<Chip variant="filled" prependIcon={mdiLightningBolt}>Pro</Chip>
	</div>
	<div class="row">
		<Chip size="sm">10′</Chip>
		<Chip size="sm" variant="primary">35′</Chip>
		<Chip size="sm" variant="success">Confirmed</Chip>
		<Chip size="sm" variant="error">Cancelled</Chip>
	</div>
</div>

<style>
	.rows {
		display: grid;
		gap: 14px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		animation: pulse 1.8s infinite;
	}

	@keyframes pulse {
		from {
			box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 60%, transparent);
		}
		to {
			box-shadow: 0 0 0 8px transparent;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
		}
	}
</style>
