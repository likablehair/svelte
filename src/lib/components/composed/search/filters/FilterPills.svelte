<script lang="ts">
	import type { Snippet } from 'svelte';
	import { operatorLabel, valueText, type FilterLabels } from '../../../../utils/filters/labels.js';
	import {
		filterConditions,
		isConditionComplete,
		isFilterGroup,
		type FilterCondition,
		type FilterField,
		type FilterGroup,
		type FilterLogic,
		type FilterNode
	} from '../../../../utils/filters/model.js';
	import Icon from '../../../simple/media/Icon.svelte';

	const PLUS_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
	const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';

	interface Props {
		fields: FilterField[];
		pinned: FilterField[];
		pills: FilterNode[];
		logic: FilterLogic;
		showPills: boolean;
		labels: FilterLabels;
		locale: string;
		pillClass?: string;
		pillSnippet?: Snippet<[{ condition: FilterCondition; field: FilterField; operator: string; value: string }]>;
		editing?: string;
		fieldsOpen: boolean;
		panelOpen: boolean;
		addButton?: HTMLButtonElement;
		onedit: (condition: FilterCondition, anchor: HTMLElement) => void;
		onremove: (id: string) => void;
		onstart: (field: FilterField, anchor: HTMLElement) => void;
		onopenpanel: () => void;
		onopenfields: (anchor: HTMLElement) => void;
		showAdd?: boolean;
	}

	let {
		fields,
		pinned,
		pills,
		logic,
		showPills,
		labels,
		locale,
		pillClass,
		pillSnippet,
		editing,
		fieldsOpen,
		panelOpen,
		addButton = $bindable(),
		onedit,
		onremove,
		onstart,
		onopenpanel,
		onopenfields,
		showAdd = true
	}: Props = $props();

	let byName = $derived(new Map(fields.map((field) => [field.name, field])));
	let loose = $derived(
		pills.filter((node) => isFilterGroup(node) || !byName.get(node.field)?.pinned)
	);

	function isComplete(condition: FilterCondition) {
		return isConditionComplete(condition, byName.get(condition.field));
	}

	function soleCondition(group: FilterGroup) {
		const complete = filterConditions(group).filter((condition) => isComplete(condition));
		const field = complete.length === 1 ? byName.get(complete[0].field) : undefined;
		return field && !field.hidden ? { condition: complete[0], field } : undefined;
	}

	function groupText(group: FilterGroup) {
		const total = filterConditions(group).filter((condition) => isComplete(condition)).length;
		return `${group.logic === 'or' ? labels.anyOf : labels.allOf} ${total} ${labels.conditions}`;
	}
</script>

{#snippet pill(condition: FilterCondition, field: FilterField)}
	{@const operator = field.type === 'bool' ? '' : operatorLabel(field, condition.operator, labels)}
	{@const text = valueText(condition, field, labels, locale)}
	<span class={['aurora-filters-pill', pillClass]} data-locked={condition.locked || undefined} data-incomplete={!isComplete(condition) || undefined}>
		<button
			type="button"
			class="aurora-filters-pill-main"
			aria-label="{labels.editFilter}: {field.label} {operator} {text}"
			aria-haspopup={condition.locked ? undefined : 'dialog'}
			aria-expanded={condition.locked ? undefined : editing === condition.id}
			disabled={condition.locked}
			onclick={(event) => onedit(condition, event.currentTarget)}
		>
			{#if pillSnippet}
				{@render pillSnippet({ condition, field, operator, value: text })}
			{:else}
				<span class="aurora-filters-pill-key">
					{#if field.icon}<Icon path={field.icon} />{/if}
					{field.label}
				</span>
				{#if operator}<span class="aurora-filters-pill-operator">{operator}</span>{/if}
				{#if text}<span class="aurora-filters-pill-value">{text}</span>{/if}
			{/if}
		</button>
		{#if !condition.locked}
			<button
				type="button"
				class="aurora-filters-pill-remove"
				aria-label="{labels.removeFilter}: {field.label}"
				onclick={() => onremove(condition.id)}
			>
				<Icon path={CLOSE_ICON} />
			</button>
		{/if}
	</span>
{/snippet}

{#if showPills}
	{#each pinned as field (field.name)}
		{@const own = pills.filter((node) => !isFilterGroup(node) && node.field === field.name) as FilterCondition[]}
		{#if own.length}
			{#each own as condition (condition.id)}{@render pill(condition, field)}{/each}
		{:else}
			<button type="button" class="aurora-filters-pinned" aria-haspopup="dialog" onclick={(event) => onstart(field, event.currentTarget)}>
				{#if field.icon}<Icon path={field.icon} />{/if}
				{field.label}
				<Icon path={CHEVRON_ICON} />
			</button>
		{/if}
	{/each}
	{#each loose as node, index (node.id)}
		{#if index > 0 && logic === 'or'}
			<span class="aurora-filters-connective">{labels.or}</span>
		{/if}
		{@const single = isFilterGroup(node) ? soleCondition(node) : undefined}
		{#if single}
			{@render pill(single.condition, single.field)}
		{:else if isFilterGroup(node)}
			<span class={['aurora-filters-pill', pillClass]}>
				<button type="button" class="aurora-filters-pill-main" aria-haspopup="dialog" aria-expanded={panelOpen} onclick={() => onopenpanel()}>
					<span class="aurora-filters-pill-value">{groupText(node)}</span>
				</button>
				{#if !node.locked}
					<button type="button" class="aurora-filters-pill-remove" aria-label="{labels.clearGroup}" onclick={() => onremove(node.id)}>
						<Icon path={CLOSE_ICON} />
					</button>
				{/if}
			</span>
		{:else}
			{@const field = byName.get(node.field)}
			{#if field}{@render pill(node, field)}{/if}
		{/if}
	{/each}
{/if}
{#if showAdd}
	<button
		type="button"
		class="aurora-filters-add"
		bind:this={addButton}
		aria-haspopup="listbox"
		aria-expanded={fieldsOpen}
		onclick={(event) => onopenfields(event.currentTarget)}
	>
		<Icon path={PLUS_ICON} />
		{labels.addFilter}
	</button>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filters-pill {
			display: inline-flex;
			align-items: stretch;
			max-width: 100%;
			height: var(--filters-pill-height, var(--filters-default-pill-height));
			overflow: hidden;
			box-sizing: border-box;
			border: var(--global-border-width) solid
				var(--filters-pill-border-color, var(--filters-default-pill-border-color));
			border-radius: var(--filters-pill-border-radius, var(--filters-default-pill-border-radius));
			background: var(--filters-pill-background, var(--filters-default-pill-background));
			box-shadow: var(--filters-pill-box-shadow, var(--filters-default-pill-box-shadow));
			font-size: var(--filters-pill-font-size, var(--filters-default-pill-font-size));
		}

		.aurora-filters-pill[data-incomplete] {
			border-style: dashed;
		}

		.aurora-filters-pill-main,
		.aurora-filters-pill-remove,
		.aurora-filters-add,
		.aurora-filters-pinned {
			margin: 0;
			border: 0;
			background: transparent;
			color: inherit;
			font: inherit;
			cursor: pointer;
		}

		.aurora-filters-pill-main {
			display: flex;
			align-items: stretch;
			min-width: 0;
			padding: 0;
		}

		.aurora-filters-pill-main:disabled {
			cursor: default;
		}

		.aurora-filters-pill-main > span {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 0 10px;
			white-space: nowrap;
		}

		.aurora-filters-pill-key {
			--icon-size: 15px;
			color: var(--filters-pill-key-color, var(--filters-default-pill-key-color));
			border-inline-end: var(--global-border-width) solid
				var(--filters-pill-divider-color, var(--filters-default-pill-divider-color));
		}

		.aurora-filters-pill-operator {
			color: var(--filters-pill-operator-color, var(--filters-default-pill-operator-color));
			font-family: var(--global-font-family-mono);
			font-size: 12px;
			border-inline-end: var(--global-border-width) solid
				var(--filters-pill-divider-color, var(--filters-default-pill-divider-color));
		}

		.aurora-filters-pill-value {
			overflow: hidden;
			max-width: var(--filters-pill-value-max-width, 220px);
			color: var(--filters-pill-value-color, var(--filters-default-pill-value-color));
			font-weight: 500;
			text-overflow: ellipsis;
		}

		.aurora-filters-pill-remove {
			--icon-size: 15px;
			display: flex;
			align-items: center;
			padding: 0 8px;
			border-inline-start: var(--global-border-width) solid
				var(--filters-pill-divider-color, var(--filters-default-pill-divider-color));
			color: var(--global-color-text-3);
			transition:
				color var(--global-duration) var(--global-ease),
				background-color var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-filters-pill-remove:hover {
				background: var(--filters-pill-remove-hover-background, var(--filters-default-pill-remove-hover-background));
				color: var(--filters-pill-remove-hover-color, var(--filters-default-pill-remove-hover-color));
			}

			.aurora-filters-pill-main:not(:disabled):hover {
				background: var(--global-color-surface-2);
			}

			.aurora-filters-add:hover,
			.aurora-filters-pinned:hover {
				border-color: var(--filters-add-hover-color, var(--filters-default-add-hover-color));
				color: var(--filters-add-hover-color, var(--filters-default-add-hover-color));
			}
		}

		.aurora-filters-pill-main:focus-visible,
		.aurora-filters-pill-remove:focus-visible,
		.aurora-filters-add:focus-visible,
		.aurora-filters-pinned:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: -2px;
		}

		.aurora-filters-add,
		.aurora-filters-pinned {
			--icon-size: 16px;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			height: var(--filters-pill-height, var(--filters-default-pill-height));
			padding: 0 12px;
			box-sizing: border-box;
			border: 1.5px dashed var(--filters-add-border-color, var(--filters-default-add-border-color));
			border-radius: var(--filters-pill-border-radius, var(--filters-default-pill-border-radius));
			color: var(--filters-add-color, var(--filters-default-add-color));
			font-size: var(--filters-pill-font-size, var(--filters-default-pill-font-size));
			transition:
				color var(--global-duration) var(--global-ease),
				border-color var(--global-duration) var(--global-ease);
		}

		.aurora-filters-pinned {
			border-style: solid;
			border-width: var(--global-border-width);
			background: var(--filters-pill-background, var(--filters-default-pill-background));
		}

		.aurora-filters-pinned :global(.aurora-icon:last-child) {
			--icon-size: 14px;
			color: var(--global-color-text-3);
		}

		.aurora-filters-connective {
			color: var(--filters-connective-color, var(--filters-default-connective-color));
			font-size: 12px;
		}
	}
</style>
