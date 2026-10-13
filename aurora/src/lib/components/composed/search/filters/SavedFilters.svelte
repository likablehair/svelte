<script lang="ts">
	import type { FilterLabels } from '../../../../utils/filters/labels.js';
	import type { SavedFilter } from '../../../../utils/filters/model.js';
	import Button from '../../../simple/buttons/Button.svelte';
	import Menu from '../../../simple/common/Menu.svelte';
	import SimpleTextField from '../../../simple/forms/SimpleTextField.svelte';

	const DELETE_ICON =
		'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z';

	interface Props {
		open: boolean;
		name: string;
		activator?: HTMLElement;
		list: SavedFilter[];
		count: number;
		labels: FilterLabels;
		onapply: (item: SavedFilter) => void;
		ondelete: (item: SavedFilter) => void;
		onsave: () => void;
	}

	let {
		open = $bindable(),
		name = $bindable(),
		activator,
		list,
		count,
		labels,
		onapply,
		ondelete,
		onsave
	}: Props = $props();
</script>

<Menu
	bind:open
	{activator}
	placement="bottom-start"
	class="aurora-filters-saved-menu"
	role="dialog"
	aria-label={labels.savedFilters}
>
	<div class="aurora-filters-saved">
		{#if list.length}
			<ul class="aurora-filters-saved-list">
				{#each list as item (item.id)}
					<li>
						<button type="button" class="aurora-filters-saved-apply" onclick={() => onapply(item)}>
							{item.name}
						</button>
						<Button
							buttonType="icon"
							variant="secondary"
							size="sm"
							icon={DELETE_ICON}
							aria-label="{labels.deleteSaved}: {item.name}"
							onclick={() => ondelete(item)}
						/>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="aurora-filters-saved-empty">{labels.noSaved}</p>
		{/if}
		<form
			class="aurora-filters-saved-form"
			onsubmit={(event) => {
				event.preventDefault();
				onsave();
			}}
		>
			<SimpleTextField
				value={name}
				placeholder={labels.saveAs}
				aria-label="{labels.saveFilters}: {labels.saveAs}"
				oninput={(event) => (name = event.currentTarget.value)}
			/>
			<Button type="submit" size="sm" disabled={!name.trim() || !count}>{labels.save}</Button>
		</form>
	</div>
</Menu>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filters-saved {
			display: grid;
			gap: 8px;
			box-sizing: border-box;
			width: 280px;
			max-width: 100%;
			padding: 8px;
		}

		.aurora-filters-saved-list {
			display: grid;
			gap: 2px;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-filters-saved-list li {
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.aurora-filters-saved-apply {
			flex: 1;
			min-width: 0;
			margin: 0;
			padding: 8px 10px;
			overflow: hidden;
			border: 0;
			border-radius: var(--global-radius-sm);
			background: transparent;
			color: var(--global-color-text);
			font: inherit;
			font-size: 13.5px;
			text-align: start;
			text-overflow: ellipsis;
			white-space: nowrap;
			cursor: pointer;
		}

		@media (hover: hover) {
			.aurora-filters-saved-apply:hover {
				background: var(--global-color-surface-2);
			}
		}

		.aurora-filters-saved-apply:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: -2px;
		}

		.aurora-filters-saved-empty {
			margin: 0;
			padding: 8px 10px;
			color: var(--global-color-text-3);
			font-size: 13px;
		}

		.aurora-filters-saved-form {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			gap: 8px;
			padding-top: 8px;
			border-top: var(--global-border-width) solid var(--global-color-border);
		}
	}
</style>
