<!-- @component
Card that edits one filter condition: the field name with its icon, the operators of the field (side by side when they are up to four, otherwise a select) and the input of the value, which depends on the operator (text, number with unit, range, date, date range, period, last N days, options from a list, a search or countries, yes/no, or the app's input). Every change calls `onchange`; with `confirm` it shows Cancel and Apply instead, and Enter applies. `Filters` shows it under a pill or after "Add filter"; it can also be used alone, for example in a page of settings.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './FilterEditor.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import {
		conditionOperators,
		isConditionComplete,
		operatorOf,
		type FilterCondition,
		type FilterField
	} from '../../../utils/filters/model.js';
	import {
		filterLabels,
		operatorLabel,
		type FilterLabels,
		type FilterLabelsInput
	} from '../../../utils/filters/labels.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import Button from '../../simple/buttons/Button.svelte';
	import Select from '../../simple/forms/Select.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import FilterValueInput from './FilterValueInput.svelte';

	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

	interface Props {
		/** The field of the condition. */
		field: FilterField;
		/** The condition being edited. A new one is a condition with the field's default operator and no value. */
		condition: FilterCondition;
		/** Shows Cancel and Apply: changes reach `onapply` only when the user applies. Without it every change calls `onchange`. */
		confirm?: boolean;
		/** Operators offered when the field has no `operators`: `basic`, `standard` (default) or `all`. */
		operatorSet?: 'basic' | 'standard' | 'all';
		/** Own operator list per field type, instead of `operatorSet`. */
		typeOperators?: Partial<Record<'string' | 'number' | 'date' | 'select' | 'bool' | 'custom', string[]>>;
		/** Shows a Remove button (for a condition already in the filters). */
		removable?: boolean;
		/** Texts to change (see `FilterLabels`), on top of those of `locale`. */
		labels?: FilterLabelsInput;
		/** BCP 47 locale: the language of every text (`it` and `en` are built in, others fall back to English) and the format of dates and numbers. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Moves the focus to the value input when the card appears. */
		autofocus?: boolean;
		/** Extra classes on the card. */
		class?: string;
		/** Input of the value for `custom` fields and for operators with `input: 'custom'`. Call `setValue` with the new value. */
		inputSnippet?: Snippet<
			[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
		>;
		/** Called at every change of operator or value (without `confirm`). */
		onchange?: (condition: FilterCondition) => void;
		/** Called by Apply and by Enter, with the edited condition (with `confirm`), or by Enter alone. */
		onapply?: (condition: FilterCondition) => void;
		/** Called by Cancel. */
		oncancel?: () => void;
		/** Called by Remove. */
		onremove?: () => void;
		/** Shows a close button in the header and calls this when it is clicked. */
		onclose?: () => void;
	}

	let {
		field,
		condition = $bindable(),
		confirm = false,
		operatorSet = 'standard',
		typeOperators,
		removable = false,
		labels: textOverrides,
		locale: localeProp,
		autofocus = false,
		class: clazz,
		inputSnippet,
		onchange,
		onapply,
		oncancel,
		onremove,
		onclose
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts: FilterLabels = $derived(filterLabels(textOverrides, locale));
	let operators = $derived(
		conditionOperators(field, condition.operator, { set: operatorSet, byType: typeOperators })
	);
	let operator = $derived(operatorOf(field, condition.operator) ?? operators[0]);
	let segmented = $derived(
		field.type === 'bool' ||
			(operators.length <= 4 &&
				operators.reduce((width, candidate) => width + label(candidate.name).length * 7.5 + 22, 0) <= 288)
	);
	let complete = $derived(isConditionComplete(condition, field));
	const editing = untrack(() => complete);

	function label(name: string) {
		if (field.type === 'bool')
			return name === 'isTrue' ? (field.trueLabel ?? texts.yes) : (field.falseLabel ?? texts.no);
		return operatorLabel(field, name, texts);
	}

	function update(patch: Partial<FilterCondition>) {
		condition = { ...condition, ...patch };
		if (!confirm) onchange?.(condition);
	}

	function choose(name: string) {
		if (name === condition.operator) return;
		const next = operatorOf(field, name);
		update({ operator: name, value: next?.input === operator?.input ? condition.value : undefined });
	}

	function radioKeydown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
		const forward = ['ArrowRight', 'ArrowDown'];
		const backward = ['ArrowLeft', 'ArrowUp'];
		if (![...forward, ...backward, 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const index = operators.findIndex((candidate) => candidate.name === operator?.name);
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		let step = forward.includes(event.key) ? 1 : -1;
		if (rtl && event.key.startsWith('ArrowL')) step = 1;
		if (rtl && event.key.startsWith('ArrowR')) step = -1;
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? operators.length - 1
					: (index + step + operators.length) % operators.length;
		choose(operators[next].name);
		event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
	}

	function apply() {
		if (complete) onapply?.(condition);
	}

	function focusInside(card: HTMLElement) {
		if (!autofocus) return;
		tick().then(() => {
			if (card.contains(document.activeElement)) return;
			const target = [
				...(editing ? ['.aurora-filter-value input:not([role="combobox"])'] : []),
				'[role="radio"][aria-checked="true"]',
				...(editing ? [] : ['.aurora-filter-value input', '.aurora-filter-value select', '.aurora-filter-value button']),
				'select',
				'button:not([disabled])'
			]
				.map((selector) => card.querySelector<HTMLElement>(selector))
				.find(Boolean);
			target?.focus();
		});
	}

	function keydown(event: KeyboardEvent) {
		if (!confirm || event.key !== 'Enter' || event.defaultPrevented) return;
		if ((event.target as HTMLElement).closest('button, textarea')) return;
		event.preventDefault();
		apply();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class={['aurora-filter-editor', clazz]}
	role="group"
	aria-labelledby="{uid}-title"
	data-type={field.type}
	onkeydown={keydown}
	{@attach focusInside}
>
	<div class="aurora-filter-editor-head">
		<span class="aurora-filter-editor-title" id="{uid}-title">
			{#if field.icon}<Icon path={field.icon} />{/if}
			{field.label}
		</span>
		{#if onclose}
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={CLOSE_ICON}
				aria-label={texts.close}
				onclick={() => onclose?.()}
			/>
		{/if}
	</div>
	{#if operators.length > 1}
		{#if segmented}
			<div
				class="aurora-filter-editor-operators"
				role="radiogroup"
				aria-label={texts.operator}
				tabindex="-1"
				onkeydown={radioKeydown}
			>
				{#each operators as candidate (candidate.name)}
					<button
						type="button"
						role="radio"
						aria-checked={candidate.name === operator?.name}
						tabindex={candidate.name === operator?.name ? 0 : -1}
						onclick={() => choose(candidate.name)}
					>
						{label(candidate.name)}
					</button>
				{/each}
			</div>
		{:else}
			<Select
				items={operators.map((candidate) => ({ value: candidate.name, label: label(candidate.name) }))}
				value={operator?.name}
				aria-label={texts.operator}
				onchange={(event) => choose(event.currentTarget.value)}
			/>
		{/if}
	{/if}
	{#if operators.length === 1 && operator?.input === 'none'}
		<p class="aurora-filter-editor-summary">{label(operator.name)}</p>
	{/if}
	{#if operator && operator.input !== 'none'}
		{#key operator.input}
			<FilterValueInput
				{field}
				{operator}
				bind:value={() => condition.value, (value) => update({ value })}
				labels={texts}
				{locale}
				label={field.label}
				autofocus={autofocus && !editing}
				{inputSnippet}
				onsubmit={() => (confirm ? apply() : complete && onapply?.(condition))}
			/>
		{/key}
	{/if}
	{#if confirm || removable}
		<div class="aurora-filter-editor-actions">
			{#if removable}
				<Button buttonType="text" variant="danger" size="sm" onclick={() => onremove?.()}>
					{texts.remove}
				</Button>
			{/if}
			{#if confirm}
				<span class="aurora-filter-editor-spacer"></span>
				<Button buttonType="text" size="sm" onclick={() => oncancel?.()}>{texts.cancel}</Button>
				<Button size="sm" disabled={!complete} onclick={apply}>{texts.apply}</Button>
			{/if}
		</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filter-editor {
			display: flex;
			flex-direction: column;
			gap: var(--filter-editor-gap, var(--filter-editor-default-gap));
			box-sizing: border-box;
			width: var(--filter-editor-width, var(--filter-editor-default-width));
			max-width: 100%;
			padding: var(--filter-editor-padding, var(--filter-editor-default-padding));
			color: var(--filter-editor-color, var(--filter-editor-default-color));
		}

		.aurora-filter-editor-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			min-height: 28px;
		}

		.aurora-filter-editor-title {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-size: var(--filter-editor-title-font-size, var(--filter-editor-default-title-font-size));
			font-weight: var(--filter-editor-title-font-weight, var(--filter-editor-default-title-font-weight));
			--icon-size: 18px;
			--icon-color: var(--filter-editor-icon-color, var(--filter-editor-default-icon-color));
		}

		.aurora-filter-editor-operators {
			display: flex;
			gap: 2px;
			padding: 3px;
			border-radius: var(--filter-editor-operators-border-radius, var(--filter-editor-default-operators-border-radius));
			background: var(--filter-editor-operators-background, var(--filter-editor-default-operators-background));
			outline: none;
		}

		.aurora-filter-editor-operators button {
			flex: 1 1 auto;
			min-width: 0;
			margin: 0;
			padding: 6px 10px;
			border: 0;
			border-radius: calc(
				var(--filter-editor-operators-border-radius, var(--filter-editor-default-operators-border-radius)) - 3px
			);
			background: transparent;
			color: var(--filter-editor-operator-color, var(--filter-editor-default-operator-color));
			font: inherit;
			font-size: 13px;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			cursor: pointer;
			transition:
				background-color var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-filter-editor-operators button[aria-checked='false']:hover {
				color: var(--global-color-text);
			}
		}

		.aurora-filter-editor-operators button[aria-checked='true'] {
			background: var(
				--filter-editor-operator-selected-background,
				var(--filter-editor-default-operator-selected-background)
			);
			color: var(--filter-editor-operator-selected-color, var(--filter-editor-default-operator-selected-color));
			font-weight: 600;
			box-shadow:
				inset 0 0 0 var(--global-border-width)
					var(
						--filter-editor-operator-selected-border-color,
						var(--filter-editor-default-operator-selected-border-color)
					),
				var(--global-shadow-sm);
		}

		.aurora-filter-editor-operators button:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 0;
		}

		.aurora-filter-editor-summary {
			margin: 0;
			color: var(--global-color-text-2);
			font-size: 13px;
		}

		.aurora-filter-editor-actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.aurora-filter-editor-spacer {
			flex: 1;
		}
	}
</style>
