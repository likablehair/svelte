<!-- @component
Calendar panel to choose a day or, with `range`, a range of days: the title of the visible month between two arrows, above a `Calendar`. Clicking the title shows the months of the year, clicking it again the years; choosing a year goes to its months, choosing a month to its days. `visibleMonth`, `visibleYear` and `view` can be bound to follow or drive the navigation. Values are `Date` objects at local midnight, names come from `locale` through `Intl`, `min` and `max` limit the days, the months, the years and the arrows, and `isDateDisabled` the days. It is a `role="group"` named by `aria-label` (the field gives it `role="dialog"`) with the surface of a popup; `DatePickerTextField` shows it in a menu under a field. Its state is exposed as `data-view` and `data-disabled` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './DatePicker.css';
	import { tick, untrack, type ComponentProps, type Snippet } from 'svelte';
	import Button from '../buttons/Button.svelte';
	import Icon from '../media/Icon.svelte';
	import Calendar from './Calendar.svelte';
	import MonthSelector from './MonthSelector.svelte';
	import YearSelector from './YearSelector.svelte';
	import { makeDate, monthTitle } from '../../../utils/dates.js';

	const CHEVRON_LEFT = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
	const CHEVRON_RIGHT = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';
	const MENU_DOWN = 'M7,10L12,15L17,10H7Z';

	interface Props
		extends Omit<ComponentProps<typeof Calendar>, 'variant' | 'class' | 'calendarElement'> {
		/** What the panel shows: the days of the visible month, the months of the visible year or the years. Clicking the title goes from days to months to years and back; choosing a year shows its months, choosing a month its days. */
		view?: 'day' | 'month' | 'year';
		/** Extra classes for each part. */
		class?: { container?: string; header?: string; title?: string; calendar?: string };
		/** The panel element. */
		datePickerElement?: HTMLDivElement;
		/** Replaces the text of the title: the month and year in the day view, the year in the others. The button around it keeps switching view. */
		titleSnippet?: Snippet<
			[{ title: string; month: number; year: number; view: 'day' | 'month' | 'year' }]
		>;
		/** Accessible name of the left arrow in the day view. */
		previousMonthLabel?: string;
		/** Accessible name of the right arrow in the day view. */
		nextMonthLabel?: string;
		/** Accessible name of the left arrow in the month view. */
		previousYearLabel?: string;
		/** Accessible name of the right arrow in the month view. */
		nextYearLabel?: string;
	}

	let {
		selectedDate = $bindable(),
		selectedDateTo = $bindable(),
		range = false,
		visibleMonth = $bindable(),
		visibleYear = $bindable(),
		view = $bindable(),
		locale = 'en',
		weekStart,
		min,
		max,
		isDateDisabled,
		disabled = false,
		showOutsideDays = true,
		showWeekdays = true,
		weekdayFormat = 'short',
		fillOpenRange = false,
		class: clazz = {},
		datePickerElement = $bindable(),
		titleSnippet,
		daySnippet,
		dayAppendSnippet,
		weekdaySnippet,
		ondayClick,
		onchange,
		previousMonthLabel = 'Previous month',
		nextMonthLabel = 'Next month',
		previousYearLabel = 'Previous year',
		nextYearLabel = 'Next year',
		...rest
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const initial = untrack(() => selectedDate ?? selectedDateTo ?? new Date());
	let ownMonth = $state(initial.getMonth());
	let ownYear = $state(initial.getFullYear());
	let ownView = $state<'day' | 'month' | 'year'>('day');
	let month = $derived(visibleMonth ?? ownMonth);
	let year = $derived(visibleYear ?? ownYear);
	let shown = $derived(view ?? ownView);
	let bodyNode = $state<HTMLDivElement>();
	let bodyHeight = $state<number>();
	let calendar = $state<ReturnType<typeof Calendar>>();
	let monthSelector = $state<ReturnType<typeof MonthSelector>>();
	let yearSelector = $state<ReturnType<typeof YearSelector>>();

	let title = $derived(
		shown === 'day'
			? monthTitle(year, month, locale)
			: new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(makeDate(year, 0, 1))
	);
	let canGoBack = $derived(
		shown === 'day'
			? !min || year * 12 + month > min.getFullYear() * 12 + min.getMonth()
			: shown === 'month' && (!min || year > min.getFullYear())
	);
	let canGoOn = $derived(
		shown === 'day'
			? !max || year * 12 + month < max.getFullYear() * 12 + max.getMonth()
			: shown === 'month' && (!max || year < max.getFullYear())
	);

	function setMonth(value: number) {
		ownMonth = value;
		visibleMonth = value;
	}

	function setYear(value: number) {
		ownYear = value;
		visibleYear = value;
	}

	function setView(value: 'day' | 'month' | 'year') {
		if (shown === 'day' && value !== 'day') bodyHeight = bodyNode?.offsetHeight;
		ownView = value;
		view = value;
	}

	function show(monthValue: number, yearValue: number) {
		const date = makeDate(yearValue, monthValue, 1);
		setMonth(date.getMonth());
		setYear(date.getFullYear());
	}

	function step(direction: 1 | -1) {
		if (shown === 'day') show(month + direction, year);
		else show(month, year + direction);
	}

	async function pickMonth(event: { month: number }) {
		show(event.month, year);
		setView('day');
		await tick();
		calendar?.focus();
	}

	async function pickYear(event: { year: number }) {
		show(month, event.year);
		setView('month');
		await tick();
		monthSelector?.focus();
	}

	/** Moves the focus into the grid of the current view: a day, a month or a year. */
	export function focus() {
		(shown === 'day' ? calendar : shown === 'month' ? monthSelector : yearSelector)?.focus();
	}
</script>

<div
	role="group"
	{...rest}
	bind:this={datePickerElement}
	class={['aurora-date-picker', clazz.container]}
	data-view={shown}
	data-disabled={disabled || undefined}
>
	<div class={['aurora-date-picker-header', clazz.header]}>
		<span class="aurora-date-picker-arrow" inert={shown === 'year' || undefined}>
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={CHEVRON_LEFT}
				aria-label={shown === 'month' ? previousYearLabel : previousMonthLabel}
				disabled={disabled || !canGoBack}
				onclick={() => step(-1)}
			/>
		</span>
		<button
			type="button"
			id={titleId}
			class={['aurora-date-picker-title', clazz.title]}
			aria-live="polite"
			{disabled}
			onclick={() => setView(shown === 'day' ? 'month' : shown === 'month' ? 'year' : 'day')}
		>
			{#if titleSnippet}
				{@render titleSnippet({ title, month, year, view: shown })}
			{:else}
				{title}
			{/if}
			<Icon path={MENU_DOWN} class="aurora-date-picker-title-icon" />
		</button>
		<span class="aurora-date-picker-arrow" inert={shown === 'year' || undefined}>
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={CHEVRON_RIGHT}
				aria-label={shown === 'month' ? nextYearLabel : nextMonthLabel}
				disabled={disabled || !canGoOn}
				onclick={() => step(1)}
			/>
		</span>
	</div>
	<div
		class="aurora-date-picker-body"
		bind:this={bodyNode}
		data-sized={(shown !== 'day' && bodyHeight) || undefined}
		style:height={shown !== 'day' && bodyHeight ? `${bodyHeight}px` : undefined}
	>
		{#if shown === 'day'}
			<Calendar
				bind:this={calendar}
				bind:selectedDate
				bind:selectedDateTo
				bind:visibleMonth={() => month, setMonth}
				bind:visibleYear={() => year, setYear}
				{range}
				{locale}
				{weekStart}
				{min}
				{max}
				{isDateDisabled}
				{disabled}
				{showOutsideDays}
				{showWeekdays}
				{weekdayFormat}
				{fillOpenRange}
				{daySnippet}
				{dayAppendSnippet}
				{weekdaySnippet}
				{ondayClick}
				{onchange}
				aria-labelledby={titleId}
				class={{ container: clazz.calendar }}
			/>
		{:else if shown === 'month'}
			<MonthSelector
				bind:this={monthSelector}
				selectedMonth={month}
				{year}
				{locale}
				{min}
				{max}
				{disabled}
				aria-labelledby={titleId}
				onchange={pickMonth}
			/>
		{:else}
			<YearSelector
				bind:this={yearSelector}
				selectedYear={year}
				min={min?.getFullYear() ?? 1900}
				max={max?.getFullYear() ?? 2100}
				{disabled}
				aria-labelledby={titleId}
				onchange={pickYear}
			/>
		{/if}
	</div>
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-date-picker {
			display: flex;
			flex-direction: column;
			gap: var(--date-picker-gap, var(--date-picker-default-gap));
			box-sizing: border-box;
			width: var(--date-picker-width, var(--date-picker-default-width));
			max-width: 100%;
			padding: var(--date-picker-padding, var(--date-picker-default-padding));
			border: var(--date-picker-border-width, var(--date-picker-default-border-width)) solid
				var(--date-picker-border-color, var(--date-picker-default-border-color));
			border-radius: var(--date-picker-border-radius, var(--date-picker-default-border-radius));
			background: var(--date-picker-background, var(--date-picker-default-background));
			box-shadow: var(--date-picker-box-shadow, var(--date-picker-default-box-shadow));
			color: var(--date-picker-color, var(--date-picker-default-color));
		}

		.aurora-date-picker-header {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			align-items: center;
			gap: 8px;
		}

		.aurora-date-picker-arrow {
			display: flex;
		}

		.aurora-date-picker-arrow[inert] {
			visibility: hidden;
		}

		.aurora-date-picker:dir(rtl) .aurora-date-picker-arrow :global(svg) {
			scale: -1 1;
		}

		.aurora-date-picker-title {
			justify-self: center;
			display: inline-flex;
			align-items: center;
			gap: 2px;
			max-width: 100%;
			margin: 0;
			padding: 4px 6px 4px 10px;
			border: 0;
			border-radius: var(--date-picker-title-border-radius, var(--date-picker-default-title-border-radius));
			background: transparent;
			color: var(--date-picker-title-color, var(--date-picker-default-title-color));
			font-family: var(--date-picker-title-font-family, var(--date-picker-default-title-font-family));
			font-size: var(--date-picker-title-font-size, var(--date-picker-default-title-font-size));
			font-weight: var(--date-picker-title-font-weight, var(--date-picker-default-title-font-weight));
			letter-spacing: var(
				--date-picker-title-letter-spacing,
				var(--date-picker-default-title-letter-spacing)
			);
			white-space: nowrap;
			cursor: pointer;
			transition: background-color var(--global-duration) var(--global-ease);
		}

		.aurora-date-picker-title:disabled {
			cursor: default;
		}

		@media (hover: hover) {
			.aurora-date-picker-title:not(:disabled):hover {
				background: var(
					--date-picker-title-hover-background,
					var(--date-picker-default-title-hover-background)
				);
			}
		}

		.aurora-date-picker-title:focus-visible {
			outline: var(--global-focus-ring-width) solid
				var(--date-picker-focus-ring-color, var(--date-picker-default-focus-ring-color));
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-date-picker-title :global(.aurora-date-picker-title-icon) {
			--icon-size: 18px;
			color: var(--global-color-text-3);
			transition: rotate var(--global-duration) var(--global-ease);
		}

		.aurora-date-picker:not([data-view='day']) :global(.aurora-date-picker-title-icon) {
			rotate: 180deg;
		}

		.aurora-date-picker-body {
			display: grid;
			align-content: center;
			min-height: 0;
		}

		.aurora-date-picker-body[data-sized] > :global(.aurora-year-selector) {
			--year-selector-default-max-height: 100%;
		}
	}
</style>
