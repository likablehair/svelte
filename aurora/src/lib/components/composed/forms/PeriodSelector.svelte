<!-- @component
Panel to choose a period: a column of presets (today, this month, ...), a month for a custom range (two side by side with `months={2}`), a relative period ("last 3 months", counting today) and, at the bottom, the start and end dates, which can also be typed. Its size does not change between the views. Dates that are not a preset highlight no entry of the list; the relative period goes back to the calendar with a preset or with "Choose dates on the calendar". Every change updates `timespanSettings` at once and calls `onchange` with the days it covers; `PeriodPicker` shows it in a menu with Cancel and Apply. The value has the JSON shape the app backends save (`quick`, `rolling` or `picker`) and the days follow their meaning (see `resolvePeriod`). A range can stay open: with one day chosen it runs from that day on. On screens up to 768px wide, or with `compact`, the presets wrap as chips and one month is shown. Its state is exposed as `data-compact` and `data-view` (`calendar` or `rolling`) for app CSS.
-->
<script lang="ts" module>
	const PREVIOUS_ICON = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
	const NEXT_ICON = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';
	const ARROW_ICON = 'M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z';
	const UNITS = ['days', 'weeks', 'months', 'years'] as const;
</script>

<script lang="ts" generics="T extends string">
	import '../../../css/tokens.css';
	import './PeriodSelector.css';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Calendar from '../../simple/dates/Calendar.svelte';
	import Select from '../../simple/forms/Select.svelte';
	import SimpleTextField from '../../simple/forms/SimpleTextField.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import {
		addMonths,
		formatDate,
		formatOf,
		makeDate,
		maskInput,
		monthTitle,
		parseDate
	} from '../../../utils/dates.js';
	import {
		QUICK_VALUES,
		rangeDays,
		resolvePeriod,
		rollingText,
		type PeriodPreset,
		type PeriodRange,
		type PeriodRolling,
		type TimespanSettings
	} from '../../../utils/period.js';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { formatLetters, libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** The chosen period, in the JSON shape the backends save: `{ method: 'quick', values: 'this-month' }`, `{ method: 'rolling', values: { numberOfUnits, measurementUnit, direction } }` or `{ method: 'picker', values: { from, to } }`. */
		timespanSettings?: TimespanSettings<T>;
		/** The presets of the list. Defaults to today, this week, this month, last 3 months, last 6 months, this year and all time, the ones the backends understand. Presets of the app need a `range`. */
		quickSelectOptions?: PeriodPreset<T>[];
		/** BCP 47 locale of the texts, of the names of months and days and of the date format: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** First day of the week, from 0 (Sunday) to 6. It changes the calendars and the days of "this week". Defaults to the one of `locale` for the calendars and to Monday for "this week", as the backends. */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Earliest day that can be chosen in the calendars. */
		min?: Date;
		/** Latest day that can be chosen in the calendars. */
		max?: Date;
		/** Months shown for the custom range: one, or two side by side. A compact panel always shows one. */
		months?: 1 | 2;
		/** Shows the presets as chips and one month, as on a phone. Defaults to `true` on screens up to 768px wide. */
		compact?: boolean;
		/** Text of the relative period in the list. Defaults to "Relative period", in the language of `locale`. */
		rollingLabel?: string;
		/** Extra classes on the root element. */
		class?: string;
		/** The root element. */
		periodSelectorElement?: HTMLDivElement;
		/** Called after every change, with the new value and the days it covers (`from` and `to` at local midnight, both included; missing for an open end and for `total`). */
		onchange?: (change: { timespanSettings: TimespanSettings<T>; from?: Date; to?: Date }) => void;
		/** Replaces the content of a preset in the list. */
		presetSnippet?: Snippet<[{ preset: PeriodPreset<T>; selected: boolean }]>;
		/** Content at the end of the bottom bar, such as the buttons of `PeriodPicker`. */
		actionsSnippet?: Snippet;
	}

	let {
		timespanSettings = $bindable(),
		quickSelectOptions,
		locale: localeProp,
		weekStart,
		min,
		max,
		months = 1,
		compact,
		rollingLabel,
		class: clazz = '',
		periodSelectorElement = $bindable(),
		onchange,
		presetSnippet,
		actionsSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).period);
	let dateFormat = $derived(formatOf(locale));

	let presets = $derived<PeriodPreset<T>[]>(
		quickSelectOptions ??
			QUICK_VALUES.map((value) => ({ value: value as T, label: texts.presets[value] }))
	);

	let mounted = $state(false);
	$effect(() => {
		mounted = true;
	});

	function resolve(value: TimespanSettings<T> | undefined) {
		if (!mounted && value?.method !== 'picker') return undefined;
		return resolvePeriod(value, { weekStart: weekStart ?? 1, presets });
	}

	let range = $derived(resolve(timespanSettings));
	let view = $derived<'calendar' | 'rolling'>(timespanSettings?.method === 'rolling' ? 'rolling' : 'calendar');

	let isCompact = $derived(compact ?? breakpoints.sAndDown);
	let twoMonths = $derived(months === 2 && !isCompact);

	type Option = { kind: 'preset'; preset: PeriodPreset<T>; id: string } | { kind: 'rolling'; id: string };

	let options = $derived<Option[]>([
		...presets.map((preset, index) => ({ kind: 'preset' as const, preset, id: `${uid}-preset-${index}` })),
		{ kind: 'rolling', id: `${uid}-rolling` }
	]);

	function isActive(option: Option): boolean {
		const method = timespanSettings?.method;
		if (option.kind === 'preset') return method === 'quick' && timespanSettings?.values === option.preset.value;
		return method === 'rolling';
	}

	let highlighted = $state<number>();
	let activeIndex = $derived(options.findIndex(isActive));

	function pickDates() {
		emit({ method: 'picker', values: { from: range?.from, to: range?.to } }, true);
	}

	let shown = $state<{ year: number; month: number }>();
	let previewDate = $state<Date>();
	let calendarFrom = $state<Date>();
	let calendarTo = $state<Date>();
	let ownChange = false;
	let lastRolling: PeriodRolling | undefined;

	function reveal(target: PeriodRange | undefined) {
		const day = target?.to ?? target?.from ?? new Date();
		shown = { year: day.getFullYear(), month: day.getMonth() };
	}

	$effect.pre(() => {
		const value = timespanSettings;
		const resolved = range;
		const ready = mounted;
		untrack(() => {
			calendarFrom = resolved?.from;
			calendarTo = resolved?.to;
			if (value?.method === 'rolling' && value.values) lastRolling = value.values as PeriodRolling;
			if (ready && (!ownChange || !shown)) reveal(resolved);
			if (ready) ownChange = false;
		});
	});

	function emit(next: TimespanSettings<T>, show = false) {
		ownChange = true;
		timespanSettings = next;
		const resolved = resolve(next);
		if (show) reveal(resolved);
		onchange?.({ timespanSettings: next, from: resolved?.from, to: resolved?.to });
	}

	function choose(option: Option) {
		if (option.kind === 'preset') emit({ method: 'quick', values: option.preset.value }, true);
		else {
			if (timespanSettings?.method === 'rolling') return;
			emit(
				{
					method: 'rolling',
					values: lastRolling ?? { numberOfUnits: 7, measurementUnit: 'days', direction: 'last' }
				},
				true
			);
		}
	}

	function optionLabel(option: Option): string {
		if (option.kind === 'preset') return option.preset.label;
		return rollingLabel ?? texts.rolling;
	}

	let daysFormat = $derived(
		new Intl.NumberFormat(locale, { style: 'unit', unit: 'day', unitDisplay: 'narrow' })
	);
	let longDaysFormat = $derived(
		new Intl.NumberFormat(locale, { style: 'unit', unit: 'day', unitDisplay: 'long' })
	);

	function presetDays(preset: PeriodPreset<T>): string {
		const days = rangeDays(resolve({ method: 'quick', values: preset.value } as TimespanSettings<T>) ?? {});
		return days === undefined ? '' : daysFormat.format(days);
	}

	function handleListKeydown(event: KeyboardEvent) {
		const last = options.length - 1;
		const current = highlighted ?? Math.max(activeIndex, 0);
		let next: number | undefined;
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = current >= last ? 0 : current + 1;
		else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = current <= 0 ? last : current - 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = last;
		else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(options[current]);
			return;
		}
		if (next === undefined) return;
		event.preventDefault();
		highlighted = next;
		document.getElementById(options[next].id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}

	let leftMonth = $derived.by(() => {
		if (!shown || !twoMonths) return shown;
		const day = addMonths(makeDate(shown.year, shown.month, 1), -1);
		return { year: day.getFullYear(), month: day.getMonth() };
	});

	function move(months: number) {
		if (!shown) return;
		const day = addMonths(makeDate(shown.year, shown.month, 1), months);
		shown = { year: day.getFullYear(), month: day.getMonth() };
	}

	let canGoBack = $derived(
		!min || !leftMonth || leftMonth.year * 12 + leftMonth.month > min.getFullYear() * 12 + min.getMonth()
	);
	let canGoForward = $derived(
		!max || !shown || shown.year * 12 + shown.month < max.getFullYear() * 12 + max.getMonth()
	);

	function setVisible(offset: number, part: 'month' | 'year', value: number | undefined) {
		if (!shown || value === undefined) return;
		const base = addMonths(makeDate(shown.year, shown.month, 1), offset);
		const next = part === 'month' ? makeDate(base.getFullYear(), value, 1) : makeDate(value, base.getMonth(), 1);
		const right = addMonths(next, -offset);
		shown = { year: right.getFullYear(), month: right.getMonth() };
	}

	function handleCalendarChange({ selectedDate, selectedDateTo }: { selectedDate: Date | undefined; selectedDateTo: Date | undefined }) {
		emit({ method: 'picker', values: { from: selectedDate, to: selectedDateTo } });
	}

	let rolling = $derived(
		(timespanSettings?.method === 'rolling' ? (timespanSettings.values as PeriodRolling | undefined) : undefined) ?? {}
	);

	function emitRolling(change: PeriodRolling) {
		emit({ method: 'rolling', values: { ...rolling, ...change } }, true);
	}

	let rollingSummary = $derived(rollingText(rolling, locale));

	let editing = $state<'start' | 'end'>();
	let editText = $state('');
	let invalid = $state<{ start?: boolean; end?: boolean }>({});
	let placeholder = $derived(formatLetters(dateFormat, libraryTexts(locale).dateLetters));

	function fieldText(edge: 'start' | 'end'): string {
		if (editing === edge) return editText;
		const day = edge === 'start' ? range?.from : range?.to;
		return day ? formatDate(day, dateFormat) : '';
	}

	function handleFieldInput(edge: 'start' | 'end', event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const masked = maskInput(input.value, dateFormat, input.selectionStart ?? undefined);
		editing = edge;
		editText = masked.text;
		input.value = masked.text;
		input.setSelectionRange(masked.caret, masked.caret);
		invalid = { ...invalid, [edge]: false };
	}

	function commitField(edge: 'start' | 'end') {
		if (editing !== edge) return;
		const text = editText.trim();
		editing = undefined;
		const day = text ? parseDate(text, dateFormat) : undefined;
		if (text && !day) {
			editing = edge;
			invalid = { ...invalid, [edge]: true };
			return;
		}
		const from = edge === 'start' ? day : range?.from;
		const to = edge === 'end' ? day : range?.to;
		if (from?.getTime() === range?.from?.getTime() && to?.getTime() === range?.to?.getTime()) return;
		emit({ method: 'picker', values: { from, to } }, true);
	}

	let durationText = $derived.by(() => {
		if (!range || (!range.from && !range.to)) return '';
		const days = rangeDays(range);
		if (days !== undefined) return longDaysFormat.format(days);
		return range.from ? texts.pickEnd : texts.pickStart;
	});
</script>

{#snippet monthHeader(year: number, month: number, previous: boolean, next: boolean)}
	<div class="aurora-period-selector-month-header">
		{#if previous}
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={PREVIOUS_ICON}
				aria-label={texts.previousMonth}
				disabled={!canGoBack}
				onclick={() => move(-1)}
			/>
		{:else}
			<span class="aurora-period-selector-month-spacer"></span>
		{/if}
		<span class="aurora-period-selector-month-title" aria-live="polite">{monthTitle(year, month, locale)}</span>
		{#if next}
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={NEXT_ICON}
				aria-label={texts.nextMonth}
				disabled={!canGoForward}
				onclick={() => move(1)}
			/>
		{:else}
			<span class="aurora-period-selector-month-spacer"></span>
		{/if}
	</div>
{/snippet}

{#snippet month(year: number, monthIndex: number, offset: number, previous: boolean, next: boolean)}
	<div class="aurora-period-selector-month">
		{@render monthHeader(year, monthIndex, previous, next)}
		<Calendar
			range
			fillOpenRange
			followSelection={false}
			showOutsideDays={isCompact}
			bind:selectedDate={calendarFrom}
			bind:selectedDateTo={calendarTo}
			bind:previewDate
			bind:visibleMonth={() => monthIndex, (value) => setVisible(offset, 'month', value)}
			bind:visibleYear={() => year, (value) => setVisible(offset, 'year', value)}
			{locale}
			{weekStart}
			{min}
			{max}
			onchange={handleCalendarChange}
		/>
	</div>
{/snippet}

{#snippet dateField(edge: 'start' | 'end')}
	<SimpleTextField
		value={fieldText(edge)}
		label={edge === 'start' ? texts.start : texts.end}
		{placeholder}
		inputmode="numeric"
		autocomplete="off"
		state={invalid[edge] ? 'error' : undefined}
		title={invalid[edge] ? texts.invalid : undefined}
		oninput={(event: Event & { currentTarget: HTMLInputElement }) => handleFieldInput(edge, event)}
		onblur={() => commitField(edge)}
		onkeydown={(event: KeyboardEvent) => {
			if (event.key === 'Enter') commitField(edge);
		}}
		class={{ container: 'aurora-period-selector-field' }}
	/>
{/snippet}

<div
	{...rest}
	bind:this={periodSelectorElement}
	data-compact={isCompact || undefined}
	data-months={twoMonths ? 2 : 1}
	data-view={view}
	class="aurora-period-selector {clazz}"
>
	<div
		class="aurora-period-selector-presets"
		role="listbox"
		tabindex="0"
		aria-label={texts.presetsLabel}
		aria-orientation={isCompact ? 'horizontal' : 'vertical'}
		aria-activedescendant={highlighted !== undefined ? options[highlighted]?.id : undefined}
		onkeydown={handleListKeydown}
		onfocus={() => (highlighted = Math.max(activeIndex, 0))}
		onblur={() => (highlighted = undefined)}
	>
		{#each options as option, index (option.id)}
			{@const selected = isActive(option)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				id={option.id}
				role="option"
				tabindex="-1"
				aria-selected={selected}
				data-highlighted={highlighted === index || undefined}
				data-kind={option.kind}
				class="aurora-period-selector-preset"
				onpointerdown={(event) => event.preventDefault()}
				onclick={() => {
					highlighted = undefined;
					choose(option);
				}}
			>
				{#if option.kind === 'preset' && presetSnippet}
					{@render presetSnippet({ preset: option.preset, selected })}
				{:else}
					<span class="aurora-period-selector-preset-label">{optionLabel(option)}</span>
					{#if option.kind === 'preset'}
						<small class="aurora-period-selector-preset-days">{presetDays(option.preset)}</small>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
	<div class="aurora-period-selector-main">
		<div class="aurora-period-selector-views">
			<div
				class="aurora-period-selector-months"
				inert={view === 'rolling' || undefined}
				data-hidden={view === 'rolling' || undefined}
			>
				{#if shown && leftMonth}
					{#if !twoMonths}
						{@render month(shown.year, shown.month, 0, true, true)}
					{:else}
						{@render month(leftMonth.year, leftMonth.month, -1, true, false)}
						{@render month(shown.year, shown.month, 0, false, true)}
					{/if}
				{/if}
			</div>
			<div
				class="aurora-period-selector-rolling"
				inert={view !== 'rolling' || undefined}
				data-hidden={view !== 'rolling' || undefined}
			>
				<div class="aurora-period-selector-rolling-fields">
					<Select
						label={texts.direction}
						items={[
							{ value: 'last', label: texts.past },
							{ value: 'next', label: texts.future }
						]}
						value={rolling.direction}
						onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
							emitRolling({ direction: event.currentTarget.value as 'last' | 'next' })}
						class={{ container: 'aurora-period-selector-direction' }}
					/>
					<SimpleTextField
						label={texts.amount}
						type="number"
						min="1"
						max="999"
						step="1"
						inputmode="numeric"
						value={rolling.numberOfUnits ?? ''}
						oninput={(event: Event & { currentTarget: HTMLInputElement }) => {
							const amount = Number(event.currentTarget.value);
							if (Number.isInteger(amount) && amount >= 1 && amount <= 999) emitRolling({ numberOfUnits: amount });
						}}
					/>
					<Select
						label={texts.unit}
						items={UNITS.map((unit) => ({ value: unit, label: texts.units[unit] }))}
						value={rolling.measurementUnit}
						onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
							emitRolling({ measurementUnit: event.currentTarget.value as (typeof UNITS)[number] })}
					/>
				</div>
				{#if rollingSummary}
					<p class="aurora-period-selector-rolling-summary">{rollingSummary}</p>
				{/if}
				<div class="aurora-period-selector-pick-dates">
					<Button buttonType="text" size="sm" onclick={pickDates}>{texts.pickDates}</Button>
				</div>
			</div>
		</div>
		<div class="aurora-period-selector-footer">
			<div class="aurora-period-selector-fields">
				{@render dateField('start')}
				<span class="aurora-period-selector-arrow" aria-hidden="true"><Icon path={ARROW_ICON} /></span>
				{@render dateField('end')}
			</div>
			<div class="aurora-period-selector-footer-row">
				<span class="aurora-period-selector-duration" aria-live="polite" hidden={!durationText}>{durationText}</span>
				{#if actionsSnippet}
					<div class="aurora-period-selector-actions">{@render actionsSnippet()}</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-period-selector {
			display: flex;
			box-sizing: border-box;
			width: var(--period-selector-width, var(--period-selector-default-width));
			max-width: var(--period-selector-max-width, var(--period-selector-default-max-width));
			min-height: var(--period-selector-min-height, var(--period-selector-default-min-height));
			background: var(--period-selector-background, var(--period-selector-default-background));
			color: var(--period-selector-color, var(--period-selector-default-color));
			font-size: var(--period-selector-font-size, var(--period-selector-default-font-size));
		}

		.aurora-period-selector-presets {
			display: flex;
			flex: none;
			flex-direction: column;
			gap: 1px;
			box-sizing: border-box;
			min-width: var(--period-selector-presets-width, var(--period-selector-default-presets-width));
			padding: var(--period-selector-presets-padding, var(--period-selector-default-presets-padding));
			border-right: 1px solid var(--period-selector-divider-color, var(--period-selector-default-divider-color));
			background: var(--period-selector-presets-background, var(--period-selector-default-presets-background));
			outline: none;
		}

		.aurora-period-selector-preset {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: var(--period-selector-preset-padding, var(--period-selector-default-preset-padding));
			border-radius: var(--period-selector-preset-border-radius, var(--period-selector-default-preset-border-radius));
			color: var(--period-selector-preset-color, var(--period-selector-default-preset-color));
			font-size: var(--period-selector-preset-font-size, var(--period-selector-default-preset-font-size));
			white-space: nowrap;
			cursor: pointer;
			transition:
				background-color var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-period-selector-preset[data-kind='rolling'] {
			margin-top: var(--period-selector-default-group-gap);
		}

		.aurora-period-selector-preset-days {
			color: var(--period-selector-preset-days-color, var(--period-selector-default-preset-days-color));
			font-family: var(--global-font-family-mono);
			font-size: var(--period-selector-preset-days-font-size, var(--period-selector-default-preset-days-font-size));
		}

		@media (hover: hover) {
			.aurora-period-selector-preset:hover {
				background: var(--period-selector-preset-hover-background, var(--period-selector-default-preset-hover-background));
				color: var(--period-selector-preset-hover-color, var(--period-selector-default-preset-hover-color));
			}
		}

		.aurora-period-selector-preset[aria-selected='true'] {
			background: var(--period-selector-preset-selected-background, var(--period-selector-default-preset-selected-background));
			color: var(--period-selector-preset-selected-color, var(--period-selector-default-preset-selected-color));
			font-weight: 500;
		}

		.aurora-period-selector-preset[aria-selected='true'] .aurora-period-selector-preset-days {
			color: var(--period-selector-preset-selected-days-color, var(--period-selector-default-preset-selected-days-color));
		}

		.aurora-period-selector-preset[data-highlighted] {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: calc(var(--global-focus-ring-width) * -1);
		}

		.aurora-period-selector-main {
			display: flex;
			flex: 1;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-period-selector-views {
			display: grid;
			padding: var(--period-selector-months-padding, var(--period-selector-default-months-padding));
		}

		.aurora-period-selector-views > * {
			grid-area: 1 / 1;
			min-width: 0;
		}

		.aurora-period-selector-views > [data-hidden] {
			visibility: hidden;
		}

		.aurora-period-selector-months {
			display: flex;
			gap: var(--period-selector-months-gap, var(--period-selector-default-months-gap));
		}

		.aurora-period-selector-month {
			width: var(--period-selector-month-width, var(--period-selector-default-month-width));
		}

		.aurora-period-selector-month-header {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			align-items: center;
			gap: 8px;
			margin-bottom: 4px;
		}

		.aurora-period-selector-month-spacer {
			width: var(--period-selector-default-arrow-size);
		}

		.aurora-period-selector-month-title {
			overflow: hidden;
			color: var(--period-selector-month-title-color, var(--period-selector-default-month-title-color));
			font-family: var(--global-font-family-display);
			font-size: var(--period-selector-month-title-font-size, var(--period-selector-default-month-title-font-size));
			font-weight: 600;
			text-align: center;
			text-overflow: ellipsis;
			text-transform: capitalize;
			white-space: nowrap;
		}

		.aurora-period-selector-rolling {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.aurora-period-selector-rolling-fields {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px;
		}

		:global(.aurora-period-selector-direction) {
			grid-column: 1 / -1;
		}

		.aurora-period-selector[data-months='2'] .aurora-period-selector-rolling-fields {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.aurora-period-selector[data-months='2'] :global(.aurora-period-selector-direction) {
			grid-column: auto;
		}

		.aurora-period-selector-pick-dates {
			margin-top: auto;
			margin-left: calc(var(--global-input-padding-x) * -1);
		}

		.aurora-period-selector-rolling-summary {
			margin: 0;
			color: var(--period-selector-rolling-summary-color, var(--period-selector-default-rolling-summary-color));
			font-weight: 600;
		}

		.aurora-period-selector-footer {
			display: flex;
			flex-direction: column;
			gap: 10px;
			margin-top: auto;
			contain: inline-size;
			padding: var(--period-selector-footer-padding, var(--period-selector-default-footer-padding));
			border-top: 1px solid var(--period-selector-divider-color, var(--period-selector-default-divider-color));
		}

		.aurora-period-selector-fields {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			align-items: end;
			gap: 8px;
		}

		.aurora-period-selector-footer-row {
			display: flex;
			align-items: center;
			gap: 12px;
			min-height: var(--period-selector-default-footer-row-height);
		}

		:global(.aurora-period-selector-field) {
			--simple-text-field-width: var(--period-selector-field-width, var(--period-selector-default-field-width));
			--simple-text-field-height: var(--period-selector-field-height, var(--period-selector-default-field-height));
			--simple-text-field-font-size: var(--period-selector-field-font-size, var(--period-selector-default-field-font-size));
			--simple-text-field-padding: 0 var(--period-selector-field-padding-x, var(--period-selector-default-field-padding-x));
			--simple-text-field-label-color: var(--period-selector-field-label-color, var(--period-selector-default-field-label-color));
		}

		:global(.aurora-period-selector-field input) {
			font-family: var(--global-font-family-mono);
		}

		.aurora-period-selector-arrow {
			display: inline-flex;
			align-items: center;
			height: var(--period-selector-field-height, var(--period-selector-default-field-height));
			color: var(--period-selector-field-label-color, var(--period-selector-default-field-label-color));
		}

		.aurora-period-selector-duration {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			padding: 2px 8px;
			border-radius: var(--global-radius-full);
			background: var(--period-selector-duration-background, var(--period-selector-default-duration-background));
			color: var(--period-selector-duration-color, var(--period-selector-default-duration-color));
			font-size: var(--period-selector-duration-font-size, var(--period-selector-default-duration-font-size));
			white-space: nowrap;
		}

		.aurora-period-selector-actions {
			display: flex;
			flex: none;
			gap: 6px;
			margin-left: auto;
		}

		.aurora-period-selector[data-compact] {
			flex-direction: column;
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-presets {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 6px;
			min-width: 0;
			border-right: 0;
			border-bottom: 1px solid var(--period-selector-divider-color, var(--period-selector-default-divider-color));
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-preset {
			border: 1px solid var(--period-selector-divider-color, var(--period-selector-default-divider-color));
			border-radius: var(--global-radius-full);
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-preset[data-kind='rolling'] {
			margin-top: 0;
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-preset-days {
			display: none;
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-month {
			width: 100%;
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-rolling-fields {
			grid-template-columns: 1fr;
		}

		.aurora-period-selector[data-compact] .aurora-period-selector-actions {
			justify-content: flex-end;
			width: 100%;
		}
	}
</style>
