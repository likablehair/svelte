<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FilterLabels } from '../../../../utils/filters/labels.js';
	import {
		clearFilters,
		type FilterField,
		type FilterGroup,
		type FilterOperatorOptions
	} from '../../../../utils/filters/model.js';
	import Button from '../../../simple/buttons/Button.svelte';
	import Menu from '../../../simple/common/Menu.svelte';
	import Drawer from '../../../simple/navigation/Drawer.svelte';
	import FilterGroupEditor from './FilterGroupEditor.svelte';

	interface Props {
		open: boolean;
		drawer: boolean;
		group: FilterGroup;
		fields: FilterField[];
		maxDepth: number;
		allowOr: boolean;
		operatorOptions: FilterOperatorOptions;
		labels: FilterLabels;
		locale: string;
		inputSnippet?: Snippet<
			[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
		>;
		confirm: boolean;
		removable: boolean;
		id: string;
		activator?: HTMLElement;
		panelClass?: string;
		onchange: (group: FilterGroup) => void;
		onclose: (apply: boolean) => void;
	}

	let {
		open = $bindable(),
		drawer,
		group,
		fields,
		maxDepth,
		allowOr,
		operatorOptions,
		labels,
		locale,
		inputSnippet,
		confirm,
		removable,
		id,
		activator,
		panelClass,
		onchange,
		onclose
	}: Props = $props();
</script>

{#snippet panel()}
	<div class={['aurora-filters-panel', panelClass]}>
		{#if !drawer}
			<div class="aurora-filters-panel-head">
				<span>{labels.filters}</span>
				{#if removable}
					<Button buttonType="text" size="sm" variant="danger" onclick={() => onchange(clearFilters(group))}>
						{labels.clearAll}
					</Button>
				{/if}
			</div>
		{/if}
		<FilterGroupEditor
			{group}
			{fields}
			depth={0}
			{maxDepth}
			{allowOr}
			{operatorOptions}
			{labels}
			{locale}
			{inputSnippet}
			{onchange}
		/>
		{#if confirm && !drawer}
			<div class="aurora-filters-panel-actions">
				<Button buttonType="text" size="sm" onclick={() => onclose(false)}>{labels.cancel}</Button>
				<Button size="sm" onclick={() => onclose(true)}>{labels.apply}</Button>
			</div>
		{/if}
	</div>
{/snippet}

{#if drawer}
	<Drawer
		bind:open={() => open, (next) => (next ? (open = true) : onclose(false))}
		position="bottom"
		title={labels.filters}
		closable
		closeLabel={labels.close}
		class={{ drawer: 'aurora-filters-drawer' }}
	>
		{@render panel()}
		{#snippet actionsSnippet()}
			<div class="aurora-filters-drawer-actions">
				{#if removable}
					<Button buttonType="text" onclick={() => onchange(clearFilters(group))}>
						{labels.clearAll}
					</Button>
				{/if}
				<Button variant="gradient" onclick={() => onclose(true)}>{labels.showResults}</Button>
			</div>
		{/snippet}
	</Drawer>
{:else}
	<Menu
		bind:open
		{activator}
		placement="bottom-start"
		class="aurora-filters-panel-menu"
		role="dialog"
		aria-label={labels.filters}
		{id}
	>
		{@render panel()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filters-panel {
			display: flex;
			flex-direction: column;
			gap: 12px;
			box-sizing: border-box;
			width: var(--filters-panel-width, var(--filters-default-panel-width));
			max-width: 100%;
			padding: var(--filters-panel-padding, var(--filters-default-panel-padding));
		}

		.aurora-filters-panel-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-weight: 600;
		}

		.aurora-filters-panel-actions,
		.aurora-filters-drawer-actions {
			display: flex;
			justify-content: flex-end;
			gap: 8px;
		}

		.aurora-filters-drawer-actions {
			justify-content: space-between;
			width: 100%;
		}

		:global(.aurora-filters-panel-menu) {
			--menu-default-max-width: min(calc(100vw - 16px), 900px);
		}

		:global(.aurora-filters-drawer) {
			--drawer-default-size: auto;
			--drawer-default-max-size: 90dvh;
		}

		:global(.aurora-filters-drawer) .aurora-filters-panel {
			width: 100%;
			padding: 0;
		}
	}
</style>
