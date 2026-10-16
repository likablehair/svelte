<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		conditionOperators,
		fieldOperators,
		filterCondition,
		filterGroup,
		isFilterGroup,
		operatorOf,
		type FilterCondition,
		type FilterField,
		type FilterGroup,
		type FilterLogic,
		type FilterNode,
		type FilterOperatorOptions
	} from '../../../../utils/filters/model.js';
	import { operatorLabel, type FilterLabels } from '../../../../utils/filters/labels.js';
	import Button from '../../../simple/buttons/Button.svelte';
	import Tooltip from '../../../simple/common/Tooltip.svelte';
	import Select from '../../../simple/forms/Select.svelte';
	import FilterGroupEditor from './FilterGroupEditor.svelte';
	import FilterValueInput from '../FilterValueInput.svelte';

	const PLUS_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
	const DELETE_ICON =
		'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z';

	interface Props {
		group: FilterGroup;
		fields: FilterField[];
		depth: number;
		maxDepth: number;
		allowOr: boolean;
		operatorOptions?: FilterOperatorOptions;
		labels: FilterLabels;
		locale: string;
		inputSnippet?: Snippet<
			[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
		>;
		onchange: (group: FilterGroup) => void;
		onremove?: () => void;
	}

	let {
		group,
		fields,
		depth,
		maxDepth,
		allowOr,
		operatorOptions = {},
		labels,
		locale,
		inputSnippet,
		onchange,
		onremove
	}: Props = $props();

	let selectable = $derived(fields.filter((field) => !field.hidden));
	let removeButtons = $state<Record<string, HTMLButtonElement | HTMLAnchorElement | undefined>>({});
	let visible = $derived(
		group.items.filter((item) => isFilterGroup(item) || !fieldOf(item.field)?.hidden)
	);
	let boxed = $derived(depth < maxDepth);
	let plain = $derived(depth > 0 && visible.length === 1);

	function fieldOf(name: string) {
		return fields.find((field) => field.name === name);
	}

	function label(field: FilterField, name: string) {
		if (field.type === 'bool')
			return name === 'isTrue' ? (field.trueLabel ?? labels.yes) : (field.falseLabel ?? labels.no);
		return operatorLabel(field, name, labels);
	}

	function replace(node: FilterNode) {
		onchange({ ...group, items: group.items.map((item) => (item.id === node.id ? node : item)) });
	}

	function remove(id: string) {
		const items = group.items.filter((item) => item.id !== id);
		if (!items.length && onremove) onremove();
		else onchange({ ...group, items });
	}

	function replaceGroup(id: string, next: FilterGroup) {
		const node = next.items.length === 1 && !next.locked ? next.items[0] : next;
		onchange({ ...group, items: group.items.map((item) => (item.id === id ? node : item)) });
	}

	function add(node: FilterNode) {
		onchange({ ...group, items: [...group.items, node] });
	}

	function setField(condition: FilterCondition, name: string) {
		const field = fieldOf(name);
		const operator = field
			? (field.defaultOperator ?? fieldOperators(field, operatorOptions)[0]?.name ?? '')
			: '';
		replace({ ...condition, field: name, operator, value: field?.defaultValue });
	}

	function nest(condition: FilterCondition) {
		const logic: FilterLogic = allowOr && group.logic === 'and' ? 'or' : 'and';
		const nested = filterGroup(logic, [condition, filterCondition('', '')]);
		onchange({ ...group, items: group.items.map((item) => (item.id === condition.id ? nested : item)) });
	}

	function setOperator(condition: FilterCondition, field: FilterField, name: string) {
		const keep = operatorOf(field, name)?.input === operatorOf(field, condition.operator)?.input;
		replace({ ...condition, operator: name, value: keep ? condition.value : undefined });
	}
</script>

{#snippet conditionCells(item: FilterCondition)}
	{@const field = fieldOf(item.field)}
	{@const operator = field ? operatorOf(field, item.operator) : undefined}
	<div class="aurora-filter-row-condition">
		<Select
			items={(field?.hidden ? [field, ...selectable] : selectable).map((candidate) => ({
				value: candidate.name,
				label: candidate.label,
				icon: candidate.icon
			}))}
			value={item.field || undefined}
			placeholder={labels.field}
			aria-label={labels.field}
			disabled={item.locked}
			onchange={(event) => setField(item, event.currentTarget.value)}
		/>
		{#if field}
			<Select
				items={conditionOperators(field, item.operator, operatorOptions).map((candidate) => ({
					value: candidate.name,
					label: label(field, candidate.name)
				}))}
				value={item.operator}
				aria-label="{field.label} {labels.operator}"
				disabled={item.locked}
				onchange={(event) => setOperator(item, field, event.currentTarget.value)}
			/>
			{#if operator && operator.input !== 'none'}
				{#key `${item.field}:${operator.input}`}
					<div class="aurora-filter-row-value" inert={item.locked || undefined}>
						<FilterValueInput
							{field}
							{operator}
							bind:value={() => item.value, (value) => replace({ ...item, value })}
							{labels}
							{locale}
							label={field.label}
							compact
							{inputSnippet}
						/>
					</div>
				{/key}
			{/if}
		{/if}
	</div>
	{#if !item.locked}
		<span class="aurora-filter-row-actions">
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={DELETE_ICON}
				aria-label={labels.removeFilter}
				bind:buttonElement={removeButtons[item.id]}
				onclick={() => remove(item.id)}
			/>
			<Tooltip activator={removeButtons[item.id]} text={labels.removeFilter} />
		</span>
	{/if}
{/snippet}

<div
	class="aurora-filter-group"
	data-depth={depth}
	data-alt={depth > 0 && depth % 2 === 0 ? '' : undefined}
	data-logic={group.logic}
>
	{#each visible as item, index (item.id)}
		{@const kind = isFilterGroup(item) ? 'group' : boxed ? 'box' : 'condition'}
		<div class="aurora-filter-row" data-locked={item.locked || undefined} data-kind={kind} data-plain={plain || undefined}>
			{#if !plain}
				<div class="aurora-filter-row-logic">
					{#if index === 0}
						<span>{labels.where}</span>
					{:else if index === 1 && allowOr && !group.locked}
						<Select
							items={[
								{ value: 'and', label: labels.and },
								{ value: 'or', label: labels.or }
							]}
							value={group.logic}
							aria-label="{labels.and} / {labels.or}"
							onchange={(event) => onchange({ ...group, logic: event.currentTarget.value as FilterLogic })}
						/>
					{:else}
						<span>{group.logic === 'or' ? labels.or : labels.and}</span>
					{/if}
				</div>
			{/if}
			{#if isFilterGroup(item)}
				<div class="aurora-filter-row-group">
					<FilterGroupEditor
						group={item}
						{fields}
						depth={depth + 1}
						{maxDepth}
						{allowOr}
						{operatorOptions}
						{labels}
						{locale}
						{inputSnippet}
						onchange={(next) => replaceGroup(item.id, next)}
						onremove={item.locked ? undefined : () => remove(item.id)}
					/>
				</div>
			{:else if boxed}
				<div class="aurora-filter-box">
					<div class="aurora-filter-row" data-kind="condition" data-plain>
						{@render conditionCells(item)}
					</div>
					{#if !item.locked}
						<div class="aurora-filter-group-actions">
							<Button buttonType="text" size="sm" icon={PLUS_ICON} onclick={() => nest(item)}>
								{labels.addNestedFilter}
							</Button>
						</div>
					{/if}
				</div>
			{:else}
				{@render conditionCells(item)}
			{/if}
		</div>
	{/each}
	{#if !group.locked}
		<div class="aurora-filter-group-actions">
			<Button buttonType="text" size="sm" icon={PLUS_ICON} onclick={() => add(filterCondition('', ''))}>
				{depth === 0 ? labels.addFilter : labels.addNestedFilter}
			</Button>
			{#if onremove && visible.length > 1}
				<span class="aurora-filter-group-spacer"></span>
				<Button buttonType="text" size="sm" variant="secondary" onclick={onremove}>
					{labels.clearGroup}
				</Button>
			{/if}
		</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filter-group {
			display: flex;
			flex-direction: column;
			gap: 12px;
			container-type: inline-size;
		}

		.aurora-filter-group[data-depth]:not([data-depth='0']) {
			padding: var(--filters-group-padding, var(--filters-default-group-padding));
			border: var(--global-border-width) solid
				var(--filters-group-border-color, var(--filters-default-group-border-color));
			border-radius: var(--filters-group-border-radius, var(--filters-default-group-border-radius));
			background: var(--filters-group-background, var(--filters-default-group-background));
		}

		.aurora-filter-group[data-depth][data-alt] {
			background: var(--filters-group-alt-background, var(--filters-default-group-alt-background));
		}

		.aurora-filter-row {
			display: grid;
			grid-template-columns: 84px minmax(0, 1fr) auto;
			align-items: start;
			gap: 10px;
		}

		.aurora-filter-row[data-kind='group'],
		.aurora-filter-row[data-kind='box'] {
			grid-template-columns: 84px minmax(0, 1fr);
		}

		.aurora-filter-row[data-plain] {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.aurora-filter-row[data-plain][data-kind='group'],
		.aurora-filter-row[data-plain][data-kind='box'] {
			grid-template-columns: minmax(0, 1fr);
		}

		.aurora-filter-box {
			display: flex;
			flex-direction: column;
			gap: 2px;
			container-type: inline-size;
		}

		.aurora-filter-box > .aurora-filter-group-actions {
			--button-color: var(--global-color-text-3);
			--button-hover-color: var(--global-color-primary);
			--button-hover-background: transparent;
			--button-font-size: 12px;
			--button-height: 24px;
			--button-padding: 0 4px;
		}

		.aurora-filter-row-actions {
			display: flex;
			gap: 4px;
			margin-top: calc((var(--global-input-height) - 30px) / 2);
		}

		.aurora-filter-row-logic :global(.aurora-select) {
			--select-padding-x: 10px;
		}

		.aurora-filter-row-logic {
			display: flex;
			align-items: center;
			min-height: var(--global-input-height);
			color: var(--global-color-text-2);
			font-size: 13px;
		}

		.aurora-filter-row-logic > span {
			padding-inline-start: 4px;
		}

		.aurora-filter-row[data-kind='group'] > .aurora-filter-row-logic {
			margin-top: calc(
				var(--filters-group-padding, var(--filters-default-group-padding)) + var(--global-border-width)
			);
		}

		.aurora-filter-row-condition {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.7fr);
			gap: 10px;
			min-width: 0;
		}

		.aurora-filter-row-value {
			min-width: 0;
		}

		.aurora-filter-group-actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 4px;
		}

		.aurora-filter-group-spacer {
			flex: 1;
		}

		@container (max-width: 560px) {
			.aurora-filter-row,
			.aurora-filter-row[data-kind='group'],
			.aurora-filter-row[data-kind='box'] {
				grid-template-columns: minmax(0, 1fr) auto;
			}

			.aurora-filter-row-logic {
				grid-column: 1 / -1;
				min-height: 0;
			}

			.aurora-filter-row-condition {
				grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			}

			.aurora-filter-row-value {
				grid-column: 1 / -1;
			}
		}
	}
</style>
