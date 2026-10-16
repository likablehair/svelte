<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatOf, parseISODate, toISODate } from '../../../utils/dates.js';
	import { hour12Of, parseISODateTime, periodNames, toISODateTime } from '../../../utils/time.js';
	import {
		DEFAULT_PERIODS,
		type FieldOperator,
		type FilterField,
		type FilterItem,
		type FilterRelative,
		type FilterTimeUnit
	} from '../../../utils/filters/model.js';
	import Menu from '../../simple/common/Menu.svelte';
	import Tooltip from '../../simple/common/Tooltip.svelte';
	import type { FilterLabels } from '../../../utils/filters/labels.js';
	import { formatLetters } from '../../../utils/texts.js';
	import Autocomplete from '../../simple/forms/Autocomplete.svelte';
	import Select from '../../simple/forms/Select.svelte';
	import SimpleTextField from '../../simple/forms/SimpleTextField.svelte';
	import Chip from '../../simple/navigation/Chip.svelte';
	import AsyncAutocomplete from '../forms/AsyncAutocomplete.svelte';
	import CountriesAutocomplete from '../forms/CountriesAutocomplete.svelte';
	import DatePickerTextField from '../forms/DatePickerTextField.svelte';
	import DateTimePickerTextField from '../forms/DateTimePickerTextField.svelte';

	interface Props {
		field: FilterField;
		operator: FieldOperator;
		value?: unknown;
		labels: FilterLabels;
		locale: string;
		label: string;
		autofocus?: boolean;
		compact?: boolean;
		inputSnippet?: Snippet<
			[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
		>;
		onsubmit?: () => void;
	}

	let {
		field,
		operator,
		value = $bindable(),
		labels,
		locale,
		label,
		autofocus = false,
		compact = false,
		inputSnippet,
		onsubmit
	}: Props = $props();

	const SEARCH_THRESHOLD = 2;
	const MINUTE_STEP = 15;

	let formatHint = $derived(formatLetters(formatOf(locale), labels.dateLetters));
	let dateTexts = $derived({
		formatLabel: formatHint,
		invalidText: labels.invalidDate,
		openLabel: labels.chooseDate,
		closeLabel: labels.close,
		previousMonthLabel: labels.previousMonth,
		nextMonthLabel: labels.nextMonth,
		previousYearLabel: labels.previousYear,
		nextYearLabel: labels.nextYear
	});
	let dateTimeHint = $derived(
		`${formatHint} ${hour12Of(locale) ? `hh:mm ${periodNames(locale)[0].toLowerCase()}` : 'hh:mm'}`
	);
	let dateTimeTexts = $derived({
		formatLabel: dateTimeHint,
		invalidText: labels.invalidDateTime,
		openLabel: labels.chooseDateTime,
		closeLabel: labels.close,
		previousMonthLabel: labels.previousMonth,
		nextMonthLabel: labels.nextMonth,
		previousYearLabel: labels.previousYear,
		nextYearLabel: labels.nextYear,
		hoursLabel: labels.hours,
		minutesLabel: labels.minutes,
		periodLabel: labels.amPm
	});
	let listTexts = $derived({
		loadingText: labels.loading,
		noResultsText: labels.noResults,
		removeLabel: labels.remove,
		closeLabel: labels.close
	});
	let range = $derived((value ?? {}) as { from?: unknown; to?: unknown });
	let items = $derived(Array.isArray(value) ? (value as FilterItem[]) : []);
	let options = $derived(
		field.type === 'select' ? [...(field.shortcuts ?? []), ...(field.items ?? [])] : []
	);

	function number(input: HTMLInputElement) {
		return input.value === '' || Number.isNaN(input.valueAsNumber) ? undefined : input.valueAsNumber;
	}

	function submit(event: KeyboardEvent) {
		if (event.key === 'Enter' && onsubmit) {
			event.preventDefault();
			onsubmit();
		}
	}

	function setRange(end: 'from' | 'to', input: unknown) {
		value = { ...range, [end]: input };
	}

	let entry = $state('');
	let entries = $derived(Array.isArray(value) ? (value as (string | number)[]) : []);
	let expanded = $state(false);
	let moreNode = $state<HTMLButtonElement>();
	let visibleChips = $derived(compact ? 2 : 3);
	let shownEntries = $derived(expanded ? entries : entries.slice(0, visibleChips));
	let toggles = $derived(
		field.type === 'select' &&
			field.view === 'toggle' &&
			options.reduce((width, item) => width + String(item.label ?? item.value).length * 7.5 + 32, 0) <=
				(compact ? 236 : 296)
	);
	let placeholder = $derived(field.type !== 'custom' && 'placeholder' in field ? field.placeholder : undefined);
	let relative = $derived.by((): Partial<FilterRelative> => {
		if (typeof value === 'number') return { amount: value, unit: 'days' };
		if (value && typeof value === 'object' && 'unit' in value) return value as FilterRelative;
		return { unit: 'days' };
	});
	let units = $derived<FilterTimeUnit[]>(
		field.type === 'date' && field.withTime
			? ['minutes', 'hours', 'days', 'weeks', 'months', 'years']
			: ['days', 'weeks', 'months', 'years']
	);
	let suggestions = $state<FilterItem[]>([]);
	let suggestOpen = $state(false);
	let suggestAnchor = $state<HTMLElement>();
	let suggestActive = $state(0);
	let suggestTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestController: AbortController | undefined;
	const uid = $props.id();

	$effect(() => () => {
		clearTimeout(suggestTimer);
		suggestController?.abort();
	});

	function addEntry() {
		const text = entry.trim();
		if (!text) return;
		const next = operator.input === 'numbers' ? Number(text) : text;
		if (typeof next === 'number' && !Number.isFinite(next)) return;
		if (!entries.includes(next)) value = [...entries, next];
		entry = '';
	}

	function entryKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			if (entry.trim()) addEntry();
			else if (event.key === 'Enter') onsubmit?.();
		} else if (event.key === 'Backspace' && !entry && entries.length) value = entries.slice(0, -1);
	}

	function instant(input: unknown) {
		return typeof input === 'string' ? parseISODateTime(input) : undefined;
	}

	function instantText(date: Date | undefined) {
		return date ? toISODateTime(date) : undefined;
	}

	function suggestText() {
		if (typeof value === 'string') return value;
		if (value && typeof value === 'object') return String((value as FilterItem).label ?? (value as FilterItem).value);
		return '';
	}

	function suggest(text: string) {
		value = text;
		clearTimeout(suggestTimer);
		suggestController?.abort();
		if (field.type !== 'string' || !field.suggest || !text.trim()) {
			suggestOpen = false;
			return;
		}
		const searcher = field.suggest;
		suggestTimer = setTimeout(async () => {
			const controller = (suggestController = new AbortController());
			try {
				const found = await searcher({ searchText: text, signal: controller.signal });
				if (controller.signal.aborted) return;
				suggestions = found;
				suggestActive = 0;
				suggestOpen = found.length > 0;
			} catch {
				suggestOpen = false;
			}
		}, 250);
	}

	function pick(item: FilterItem) {
		value = { value: item.value, label: item.label ?? item.value };
		suggestOpen = false;
	}

	function suggestKeydown(event: KeyboardEvent) {
		if (suggestOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			suggestActive = (suggestActive + step + suggestions.length) % suggestions.length;
		} else if (suggestOpen && event.key === 'Enter' && suggestions[suggestActive]) {
			event.preventDefault();
			pick(suggestions[suggestActive]);
		} else submit(event);
	}

	function toggle(item: FilterItem) {
		value = items.some((selected) => selected.value === item.value)
			? items.filter((selected) => selected.value !== item.value)
			: [...items, item];
	}
</script>

{#snippet unitSnippet()}
	{#if field.type === 'number' && field.unit}
		<span class="aurora-filter-value-unit">{field.unit}</span>
	{/if}
{/snippet}

<div class="aurora-filter-value" data-input={operator.input}>
	{#if operator.input === 'text'}
		<!-- svelte-ignore a11y_autofocus -->
		<SimpleTextField
			value={typeof value === 'string' ? value : ''}
			placeholder={placeholder ?? labels.value}
			aria-label={label}
			{autofocus}
			oninput={(event) => (value = event.currentTarget.value)}
			onkeydown={submit}
		/>
	{:else if operator.input === 'number' || operator.input === 'days'}
		<!-- svelte-ignore a11y_autofocus -->
		<SimpleTextField
			type="number"
			value={typeof value === 'number' ? value : null}
			placeholder={labels.value}
			step={field.type === 'number' ? field.step : 1}
			min={operator.input === 'days' ? 0 : undefined}
			aria-label={label}
			{autofocus}
			oninput={(event) => (value = number(event.currentTarget))}
			onkeydown={submit}
			appendInnerSnippet={operator.input === 'days' ? daysSnippet : unitSnippet}
		/>
		{#snippet daysSnippet()}
			<span class="aurora-filter-value-unit">{labels.days}</span>
		{/snippet}
	{:else if operator.input === 'numberRange'}
		<div class="aurora-filter-value-range">
			<!-- svelte-ignore a11y_autofocus -->
			<SimpleTextField
				type="number"
				value={typeof range.from === 'number' ? range.from : null}
				step={field.type === 'number' ? field.step : undefined}
				placeholder={labels.from}
				aria-label="{label} {labels.from}"
				{autofocus}
				oninput={(event) => setRange('from', number(event.currentTarget))}
				onkeydown={submit}
				appendInnerSnippet={unitSnippet}
			/>
			<SimpleTextField
				type="number"
				value={typeof range.to === 'number' ? range.to : null}
				step={field.type === 'number' ? field.step : undefined}
				placeholder={labels.to}
				aria-label="{label} {labels.to}"
				oninput={(event) => setRange('to', number(event.currentTarget))}
				onkeydown={submit}
				appendInnerSnippet={unitSnippet}
			/>
		</div>
	{:else if operator.input === 'date'}
		<!-- svelte-ignore a11y_autofocus -->
		<DatePickerTextField
			{...dateTexts}
			{locale}
			selectedDate={typeof value === 'string' ? parseISODate(value) : undefined}
			aria-label={label}
			{autofocus}
			showFormat={!compact}
			placeholder={compact ? formatHint : undefined}
			mobileDrawer={false}
			onchange={(event) => (value = event.selectedDate ? toISODate(event.selectedDate) : undefined)}
		/>
	{:else if operator.input === 'dateRange'}
		<DatePickerTextField
			{...dateTexts}
			{locale}
			range
			selectedDate={typeof range.from === 'string' ? parseISODate(range.from) : undefined}
			selectedDateTo={typeof range.to === 'string' ? parseISODate(range.to) : undefined}
			startLabel={labels.from}
			endLabel={labels.to}
			aria-label={label}
			showFormat={false}
			placeholder={formatHint}
			placeholderTo={formatHint}
			mobileDrawer={false}
			onchange={(event) =>
				(value = {
					from: event.selectedDate ? toISODate(event.selectedDate) : undefined,
					to: event.selectedDateTo ? toISODate(event.selectedDateTo) : undefined
				})}
		/>
	{:else if operator.input === 'period'}
		<Select
			items={((field.type === 'date' && field.periods) || DEFAULT_PERIODS).map((period) => ({
				value: period,
				label: labels.periods[period]
			}))}
			value={typeof value === 'string' ? value : undefined}
			placeholder={placeholder ?? labels.choose}
			aria-label={label}
			onchange={(event) => (value = event.currentTarget.value || undefined)}
		/>
	{:else if operator.input === 'items' && field.type === 'select'}
		{#if toggles}
			<div class="aurora-filter-value-toggles" role="group" aria-label={label}>
				{#each options as item (item.value)}
					<Chip
						selected={items.some((selected) => selected.value === item.value)}
						prependIcon={item.icon}
						onclick={() => toggle(item)}
					>
						{item.label ?? item.value}
					</Chip>
				{/each}
			</div>
		{:else if field.view === 'countries'}
			<CountriesAutocomplete
				{...listTexts}
				multiple
				locale={field.locale ?? locale}
				values={items.map((item) => ({ value: item.value, label: item.label }))}
				placeholder={placeholder ?? labels.choose}
				aria-label={label}
				maxVisibleChips={compact ? 1 : 2}
				mobileDrawer={false}
				onchange={(event) => (value = event.selection.map((item) => ({ value: item.value, label: item.label })))}
			/>
		{:else if field.searcher}
			<AsyncAutocomplete
				{...listTexts}
				searchThreshold={SEARCH_THRESHOLD}
				thresholdText={labels.typeMore.replace('{count}', String(SEARCH_THRESHOLD))}
				errorText={labels.searchError}
				multiple
				searcher={field.searcher}
				items={field.shortcuts}
				values={items}
				placeholder={placeholder ?? labels.search}
				aria-label={label}
				maxVisibleChips={compact ? 1 : 2}
				mobileDrawer={false}
				onchange={(event) => (value = event.selection)}
			/>
		{:else}
			<Autocomplete
				{...listTexts}
				multiple
				items={options}
				values={items}
				placeholder={placeholder ?? labels.choose}
				aria-label={label}
				maxVisibleChips={compact ? 1 : 2}
				mobileDrawer={false}
				onchange={(event) => (value = event.selection)}
			/>
		{/if}
	{:else if operator.input === 'texts' || operator.input === 'numbers'}
		<div class="aurora-filter-value-list">
			{#if entries.length}
				<div class="aurora-filter-value-chips">
					{#each shownEntries as current (current)}
						<Chip
							size="sm"
							closable
							closeLabel="{labels.remove} {current}"
							onclose={() => (value = entries.filter((other) => other !== current))}
						>
							{current}
						</Chip>
					{/each}
					{#if entries.length > visibleChips}
						<button
							type="button"
							class="aurora-filter-value-more"
							aria-expanded={expanded}
							bind:this={moreNode}
							onclick={() => (expanded = !expanded)}
						>
							{expanded ? labels.showLess : `+${entries.length - visibleChips}`}
						</button>
						{#if !expanded}
							<Tooltip activator={moreNode} text={entries.slice(visibleChips).join(', ')} />
						{/if}
					{/if}
				</div>
			{/if}
			<!-- svelte-ignore a11y_autofocus -->
			<SimpleTextField
				type={operator.input === 'numbers' ? 'number' : 'text'}
				value={entry}
				placeholder={labels.addValue}
				aria-label={label}
				{autofocus}
				oninput={(event) => (entry = event.currentTarget.value)}
				onkeydown={entryKeydown}
				onblur={addEntry}
			/>
		</div>
	{:else if operator.input === 'relative'}
		<div class="aurora-filter-value-range">
			<!-- svelte-ignore a11y_autofocus -->
			<SimpleTextField
				type="number"
				min={0}
				value={typeof relative.amount === 'number' ? relative.amount : null}
				placeholder={labels.amount}
				aria-label={label}
				{autofocus}
				oninput={(event) => (value = { amount: number(event.currentTarget), unit: relative.unit ?? 'days' })}
				onkeydown={submit}
			/>
			<Select
				items={units.map((unit) => ({ value: unit, label: labels.units[unit] }))}
				value={relative.unit ?? 'days'}
				aria-label="{label} {labels.unit}"
				onchange={(event) =>
					(value = { amount: relative.amount, unit: event.currentTarget.value as FilterTimeUnit })}
			/>
		</div>
	{:else if operator.input === 'datetime'}
		<!-- svelte-ignore a11y_autofocus -->
		<DateTimePickerTextField
			{...dateTimeTexts}
			{locale}
			value={instant(value)}
			minuteStep={MINUTE_STEP}
			aria-label={label}
			{autofocus}
			showFormat={false}
			placeholder={dateTimeHint}
			mobileDrawer={false}
			onchange={(event) => (value = instantText(event.value))}
		/>
	{:else if operator.input === 'datetimeRange'}
		{#each ['from', 'to'] as const as end (end)}
			<!-- svelte-ignore a11y_autofocus -->
			<DateTimePickerTextField
				{...dateTimeTexts}
				{locale}
				value={instant(range[end])}
				minuteStep={MINUTE_STEP}
				placeholder={end === 'from' ? labels.from : labels.to}
				aria-label="{label} {end === 'from' ? labels.from : labels.to}"
				autofocus={autofocus && end === 'from'}
				showFormat={false}
				mobileDrawer={false}
				onchange={(event) => setRange(end, instantText(event.value))}
			/>
		{/each}
	{:else if operator.input === 'column' && (field.type === 'number' || field.type === 'date')}
		<Select
			items={(field.compareWith ?? []).map((other) => ({ value: other.column, label: other.label }))}
			value={typeof value === 'string' ? value : undefined}
			placeholder={labels.compareWith}
			aria-label="{label} {labels.compareWith}"
			onchange={(event) => (value = event.currentTarget.value || undefined)}
		/>
	{:else if operator.input === 'suggest'}
		<div bind:this={suggestAnchor}>
			<!-- svelte-ignore a11y_autofocus -->
			<SimpleTextField
				value={suggestText()}
				placeholder={placeholder ?? labels.search}
				aria-label={label}
				role="combobox"
				aria-expanded={suggestOpen}
				aria-controls="{uid}-suggestions"
				aria-autocomplete="list"
				aria-activedescendant={suggestOpen ? `${uid}-suggestion-${suggestActive}` : undefined}
				autocomplete="off"
				{autofocus}
				oninput={(event) => suggest(event.currentTarget.value)}
				onkeydown={suggestKeydown}
			/>
		</div>
		<Menu bind:open={suggestOpen} activator={suggestAnchor} matchActivatorWidth>
			<div class="aurora-filter-value-suggestions" role="listbox" id="{uid}-suggestions" aria-label={label}>
				{#each suggestions as item, index (item.value)}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
					<div
						role="option"
						id="{uid}-suggestion-{index}"
						aria-selected={index === suggestActive}
						data-active={index === suggestActive || undefined}
						onmousedown={(event) => event.preventDefault()}
						onclick={() => pick(item)}
					>
						{item.label ?? item.value}
					</div>
				{/each}
			</div>
		</Menu>
	{:else if operator.input === 'custom'}
		{@render inputSnippet?.({
			field,
			operator: operator.name,
			value,
			setValue: (next) => (value = next)
		})}
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filter-value {
			min-width: 0;
		}

		.aurora-filter-value-range {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 8px;
		}

		.aurora-filter-value-list {
			display: grid;
			gap: 8px;
		}

		.aurora-filter-value[data-input='datetimeRange'] {
			display: grid;
			gap: 8px;
		}

		.aurora-filter-value-chips {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 6px;
		}

		.aurora-filter-value-more {
			margin: 0;
			padding: 2px 8px;
			border: var(--global-border-width) solid var(--global-color-border);
			border-radius: var(--global-radius-full);
			background: var(--global-color-surface-2);
			color: var(--global-color-text-2);
			font: inherit;
			font-size: 12px;
			cursor: pointer;
		}

		.aurora-filter-value-more:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
		}

		.aurora-filter-value-suggestions > div {
			padding: 8px 10px;
			border-radius: var(--global-radius-sm);
			font-size: 13.5px;
			cursor: pointer;
		}

		.aurora-filter-value-suggestions > div[data-active] {
			background: var(--global-color-surface-2);
		}

		.aurora-filter-value-toggles {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}

		.aurora-filter-value-unit {
			color: var(--global-color-text-3);
			font-size: 12px;
			white-space: nowrap;
		}
	}
</style>
