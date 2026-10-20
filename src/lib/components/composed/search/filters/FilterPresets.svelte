<script lang="ts">
	import type { FilterLabels } from '../../../../utils/filters/labels.js';
	import type { FilterGroup, FilterPreset } from '../../../../utils/filters/model.js';
	import Chip from '../../../simple/navigation/Chip.svelte';
	import { presetMatches } from './presets.js';

	interface Props {
		presets: FilterPreset[];
		tree: FilterGroup;
		labels: FilterLabels;
		ontoggle: (preset: FilterPreset) => void;
	}

	let { presets, tree, labels, ontoggle }: Props = $props();
</script>

{#if presets.length}
	<div class="aurora-filters-presets" role="group" aria-label={labels.filters}>
		{#each presets as preset (preset.id)}
			<Chip
				selected={!!presetMatches(tree, preset)}
				prependIcon={preset.icon}
				onclick={() => ontoggle(preset)}
			>
				{preset.label}{#if preset.count !== undefined}<span class="aurora-filters-preset-count">{` · ${preset.count}`}</span>{/if}
			</Chip>
		{/each}
	</div>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filters-presets {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}

		.aurora-filters-preset-count {
			white-space: pre;
			opacity: 0.7;
			font-family: var(--global-font-family-mono);
			font-size: 11px;
		}
	}
</style>
