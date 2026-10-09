<!-- @component Compact
`size="sm"` keeps only the icon and the text, for tables, lists and cards. Without props it says "No data available". -->
<script lang="ts">
	import { mdiMagnify } from '@mdi/js';
	import { NoData } from '#lib';
</script>

<div class="grid">
	<section class="card">
		<h3>Recent payments</h3>
		<NoData size="sm" />
	</section>
	<section class="card">
		<h3>Clients</h3>
		<NoData size="sm" icon={mdiMagnify} title="No results for “Rossi”" description="Check the spelling or try another name." />
	</section>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
		width: 100%;
	}

	.card {
		padding: 16px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}
</style>
