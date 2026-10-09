<script module lang="ts">
	/** A day of the grid, as the day snippets receive it. */
	export interface CalendarDay {
		/** The day, at local midnight. */
		date: Date;
		/** The day belongs to the month before or after the visible one. */
		outside: boolean;
		/** The day is the chosen one, or an end of the chosen range. */
		selected: boolean;
		/** The day is inside the chosen range, ends excluded. */
		inRange: boolean;
		/** The day is today. */
		today: boolean;
		/** The day cannot be chosen (`min`, `max`, `isDateDisabled`). */
		disabled: boolean;
	}
</script>

<!-- @component
Grid of the days of one month, to choose a day or, with `range`, a range of days. It has no header: `visibleMonth` and `visibleYear` decide the month, and `DatePicker` adds the title and the arrows around it. Values are `Date` objects at local midnight. Names of months and days and the first day of the week come from `locale` through `Intl`; `weekStart` overrides the latter. `min`, `max` and `isDateDisabled` decide which days can be chosen. It follows the ARIA grid pattern: the grid is a single Tab stop, the arrows move by day and week, Home and End go to the ends of the week, Page Up and Page Down change month (with Shift, year) and Enter or Space choose. Today has a dot, the days of the nearby months are faded and choosing one shows its month. While a range is being chosen, hovering or focusing a day previews it. The `grid` variant has large bordered cells for an agenda, with events in `dayAppendSnippet`. Screen readers read the full date of every day. Its state is exposed as `data-variant` and `data-disabled` on the grid, and as `data-today`, `data-selected`, `data-outside`, `data-disabled` and `data-range` (`start`, `middle`, `end`, `single`) on the days, for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Calendar.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		addDays,
		addMonths,
		dayKey,
		makeDate,
		monthGrid,
		monthTitle,
		outOfBounds,
		parseISODate,
		sameDay,
		startOfDay,
		toISODate,
		weekdayNames,
		weekStartOf
	} from '../../../utils/dates.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** The chosen day; with `range`, the first day of the range. Days are local midnights. */
		selectedDate?: Date;
		/** With `range`, the last day of the range. */
		selectedDateTo?: Date;
		/** Chooses a range of days: the first click sets `selectedDate`, the second `selectedDateTo` (they swap when the second day is earlier, and the same day twice is a one-day range), the third starts a new range. */
		range?: boolean;
		/** Visible month, 0 to 11. Defaults to the month of `selectedDate`, or the current one; it follows `selectedDate` when that changes to another month. Bind it to drive or follow the navigation. */
		visibleMonth?: number;
		/** Visible year. */
		visibleYear?: number;
		/** BCP 47 locale of the names of months and days and of the first day of the week. */
		locale?: string;
		/** First day of the week, from 0 (Sunday) to 6 (Saturday). Defaults to the one of `locale`. */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Earliest day that can be chosen. */
		min?: Date;
		/** Latest day that can be chosen. */
		max?: Date;
		/** Returns `true` for the days that cannot be chosen (weekends, holidays, ...). */
		isDateDisabled?: (date: Date) => boolean;
		/** Shows the days without letting anyone choose them; the grid leaves the Tab order. */
		disabled?: boolean;
		/** Shows the days of the previous and next month that complete the first and last week. */
		showOutsideDays?: boolean;
		/** Shows the row with the names of the days of the week. */
		showWeekdays?: boolean;
		/** Length of the names of the days of the week. Screen readers always read the full name. */
		weekdayFormat?: 'narrow' | 'short' | 'long';
		/** With `range` and only one end chosen, highlights every day after the start (or before the end). */
		fillOpenRange?: boolean;
		/** `compact` is the grid of a date picker; `grid` has large bordered cells for an agenda, with room for events in `dayAppendSnippet`. */
		variant?: 'compact' | 'grid';
		/** Extra classes for each part. */
		class?: { container?: string; weekday?: string; day?: string };
		/** The grid element. */
		calendarElement?: HTMLDivElement;
		/** Replaces the number of a day. It receives a `CalendarDay`: `date`, `outside`, `selected`, `inRange`, `today`, `disabled`. The cell around it keeps click, keyboard and state, and screen readers keep reading the full date. */
		daySnippet?: Snippet<[CalendarDay]>;
		/** Content after the number of a day: events in the `grid` variant, a mark in the top corner in the `compact` one. */
		dayAppendSnippet?: Snippet<[CalendarDay]>;
		/** Replaces the name of a day of the week. `day` goes from 0 (Sunday) to 6, `name` is the full name. */
		weekdaySnippet?: Snippet<[{ label: string; name: string; day: number }]>;
		/** Called when a day that can be chosen is clicked or chosen with Enter or Space, after the selection changed. `outside` is `true` for the days of the nearby months. */
		ondayClick?: (event: {
			date: Date;
			outside: boolean;
			nativeEvent: MouseEvent | KeyboardEvent;
		}) => void;
		/** Called when the user changes the selection. */
		onchange?: (event: { selectedDate: Date | undefined; selectedDateTo: Date | undefined }) => void;
	}

	let {
		selectedDate = $bindable(),
		selectedDateTo = $bindable(),
		range = false,
		visibleMonth = $bindable(),
		visibleYear = $bindable(),
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
		variant = 'compact',
		class: clazz = {},
		calendarElement = $bindable(),
		daySnippet,
		dayAppendSnippet,
		weekdaySnippet,
		ondayClick,
		onchange,
		onkeydown,
		onfocusin,
		onfocusout,
		onmouseleave,
		...rest
	}: Props = $props();

	const initial = untrack(() => selectedDate ?? selectedDateTo ?? new Date());
	let ownMonth = $state(initial.getMonth());
	let ownYear = $state(initial.getFullYear());
	let month = $derived(visibleMonth ?? ownMonth);
	let year = $derived(visibleYear ?? ownYear);
	let gridNode = $state<HTMLDivElement>();
	let focused = $state<Date>();
	let hovered = $state<Date>();
	let direction = $state<'next' | 'previous'>();

	let firstDay = $derived(weekStart ?? weekStartOf(locale));
	let weekdays = $derived(weekdayNames(locale, firstDay, weekdayFormat));
	let title = $derived(monthTitle(year, month, locale));
	let dateLabel = $derived(new Intl.DateTimeFormat(locale, { dateStyle: 'full' }));
	let today = $state<Date>();
	$effect(() => {
		void month;
		void year;
		today = startOfDay(new Date());
	});
	let weeks = $derived.by(() => {
		const days = monthGrid(year, month, firstDay);
		return Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7));
	});

	let bounds = $derived.by(() => {
		if (!range) return undefined;
		if (selectedDate && selectedDateTo) {
			const [from, to] = [dayKey(selectedDate), dayKey(selectedDateTo)].sort((a, b) => a - b);
			return { from, to, preview: false };
		}
		if (selectedDate && hovered && !outOfBounds(hovered, min, max, isDateDisabled)) {
			const [from, to] = [dayKey(selectedDate), dayKey(hovered)].sort((a, b) => a - b);
			return { from, to, preview: true };
		}
		if (!fillOpenRange) return undefined;
		if (selectedDate) return { from: dayKey(selectedDate), to: Infinity, preview: false };
		if (selectedDateTo) return { from: -Infinity, to: dayKey(selectedDateTo), preview: false };
		return undefined;
	});

	let tabStop = $derived.by(() => {
		for (const candidate of [focused, selectedDate, selectedDateTo, today])
			if (candidate && isVisible(candidate)) return dayKey(candidate);
		return dayKey(makeDate(year, month, 1));
	});

	let lastKey: number | undefined;
	$effect.pre(() => {
		const key = year * 12 + month;
		untrack(() => {
			if (lastKey !== undefined && key !== lastKey) direction = key > lastKey ? 'next' : 'previous';
			lastKey = key;
		});
	});

	let lastSelected = untrack(() => selectedDate);
	$effect(() => {
		const date = selectedDate;
		untrack(() => {
			if (sameDay(date, lastSelected)) return;
			lastSelected = date;
			if (date && !isVisible(date)) show(date);
		});
	});

	let lastSelectedTo = untrack(() => selectedDateTo);
	$effect(() => {
		const date = selectedDateTo;
		untrack(() => {
			if (sameDay(date, lastSelectedTo)) return;
			lastSelectedTo = date;
			if (date && !isVisible(date)) show(date);
		});
	});

	function isVisible(date: Date) {
		return date.getMonth() === month && date.getFullYear() === year;
	}

	function show(date: Date) {
		ownMonth = date.getMonth();
		ownYear = date.getFullYear();
		visibleMonth = ownMonth;
		visibleYear = ownYear;
	}

	function describe(date: Date) {
		const key = dayKey(date);
		const selected = sameDay(date, selectedDate) || (range && sameDay(date, selectedDateTo));
		let edge: 'start' | 'middle' | 'end' | 'single' | undefined;
		if (bounds && key >= bounds.from && key <= bounds.to)
			edge =
				key === bounds.from && key === bounds.to
					? 'single'
					: key === bounds.from
						? 'start'
						: key === bounds.to
							? 'end'
							: 'middle';
		const day: CalendarDay = {
			date,
			outside: !isVisible(date),
			selected: !!selected,
			inRange: !!bounds && !bounds.preview && key > bounds.from && key < bounds.to,
			today: sameDay(date, today),
			disabled: outOfBounds(date, min, max, isDateDisabled)
		};
		return { day, edge };
	}

	function choose(date: Date, nativeEvent: MouseEvent | KeyboardEvent) {
		if (disabled || outOfBounds(date, min, max, isDateDisabled)) return;
		const outside = !isVisible(date);
		if (!range) selectedDate = date;
		else if (!selectedDate || selectedDateTo) {
			selectedDate = date;
			selectedDateTo = undefined;
		} else if (dayKey(date) < dayKey(selectedDate)) {
			selectedDateTo = selectedDate;
			selectedDate = date;
		} else selectedDateTo = date;
		lastSelected = selectedDate;
		lastSelectedTo = selectedDateTo;
		focused = date;
		if (outside) show(date);
		onchange?.({ selectedDate, selectedDateTo });
		ondayClick?.({ date, outside, nativeEvent });
	}

	async function moveFocus(date: Date) {
		focused = date;
		if (range) hovered = date;
		if (!isVisible(date)) show(date);
		await tick();
		gridNode
			?.querySelector<HTMLElement>(`[data-date="${toISODate(date)}"]:not([data-outside])`)
			?.focus();
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-date]');
		const current = cell && parseISODate(cell.dataset.date);
		if (!current) return;
		const step = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
		const column = (current.getDay() - firstDay + 7) % 7;
		let next: Date;
		if (event.key === 'ArrowLeft') next = addDays(current, -step);
		else if (event.key === 'ArrowRight') next = addDays(current, step);
		else if (event.key === 'ArrowUp') next = addDays(current, -7);
		else if (event.key === 'ArrowDown') next = addDays(current, 7);
		else if (event.key === 'Home') next = addDays(current, -column);
		else if (event.key === 'End') next = addDays(current, 6 - column);
		else if (event.key === 'PageUp') next = addMonths(current, event.shiftKey ? -12 : -1);
		else if (event.key === 'PageDown') next = addMonths(current, event.shiftKey ? 12 : 1);
		else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(current, event);
			return;
		} else return;
		event.preventDefault();
		moveFocus(next);
	}

	/** Moves the focus into the grid: to the last focused day, else the chosen one, today or the first of the month. */
	export function focus() {
		gridNode?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	{...rest}
	bind:this={() => gridNode, (node) => (gridNode = calendarElement = node)}
	role="grid"
	aria-label={rest['aria-labelledby'] ? rest['aria-label'] : (rest['aria-label'] ?? title)}
	aria-multiselectable={range || undefined}
	aria-disabled={disabled || undefined}
	class={['aurora-calendar', clazz.container]}
	data-variant={variant}
	data-direction={direction}
	data-disabled={disabled || undefined}
	onkeydown={handleKeydown}
	onfocusin={(event) => {
		onfocusin?.(event);
		const date = parseISODate((event.target as HTMLElement).dataset?.date);
		if (!date) return;
		focused = date;
		if (range) hovered = date;
	}}
	onfocusout={(event) => {
		onfocusout?.(event);
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hovered = undefined;
	}}
	onmouseleave={(event) => {
		onmouseleave?.(event);
		hovered = undefined;
	}}
>
	{#if showWeekdays}
		<div role="row" class="aurora-calendar-weekdays">
			{#each weekdays as weekday (weekday.day)}
				<div
					role="columnheader"
					class={['aurora-calendar-weekday', clazz.weekday]}
					aria-label={weekday.name}
				>
					{#if weekdaySnippet}
						{@render weekdaySnippet(weekday)}
					{:else}
						{weekday.label}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	{#key year * 12 + month}
		<div role="rowgroup" class="aurora-calendar-weeks">
			{#each weeks as week, index (index)}
				<div role="row" class="aurora-calendar-week">
					{#each week as date (dayKey(date))}
						{@const { day, edge } = describe(date)}
						{#if day.outside && !showOutsideDays}
							<div role="gridcell" class="aurora-calendar-day aurora-calendar-day-empty"></div>
						{:else}
							<!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
							<div
								role="gridcell"
								class={['aurora-calendar-day', clazz.day]}
								data-date={toISODate(date)}
								data-outside={day.outside || undefined}
								data-today={day.today || undefined}
								data-selected={day.selected || undefined}
								data-disabled={day.disabled || undefined}
								data-range={edge}
								data-preview={(edge && bounds?.preview) || undefined}
								tabindex={disabled || day.outside ? undefined : dayKey(date) === tabStop ? 0 : -1}
								aria-selected={day.selected || day.inRange}
								aria-disabled={day.disabled || undefined}
								aria-current={day.today ? 'date' : undefined}
								onclick={(event) => choose(date, event)}
								onmouseenter={() => {
									if (range && !disabled) hovered = date;
								}}
							>
								<span class="aurora-calendar-day-content" aria-hidden="true">
									{#if daySnippet}
										{@render daySnippet(day)}
									{:else}
										{date.getDate()}
									{/if}
								</span>
								<span class="aurora-calendar-label">{dateLabel.format(date)}</span>
								{#if dayAppendSnippet}
									<span class="aurora-calendar-day-append">{@render dayAppendSnippet(day)}</span>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{/key}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-calendar {
			--_radius: var(--calendar-day-border-radius, var(--calendar-default-day-border-radius));
			--_band: var(--calendar-range-background, var(--calendar-default-range-background));
			--_duration: var(--calendar-duration, var(--calendar-default-duration));
			--_easing: var(--calendar-easing, var(--calendar-default-easing));
			--_shift: 12px;

			display: flex;
			flex-direction: column;
			box-sizing: border-box;
			width: var(--calendar-width, var(--calendar-default-width));
			color: var(--calendar-color, var(--calendar-default-color));
			font-size: var(--calendar-font-size, var(--calendar-default-font-size));
			font-variant-numeric: tabular-nums;
			user-select: none;
		}

		.aurora-calendar:dir(rtl) {
			--_shift: -12px;
		}

		.aurora-calendar-weekdays,
		.aurora-calendar-week {
			display: grid;
			grid-template-columns: repeat(7, minmax(0, 1fr));
		}

		.aurora-calendar-weeks {
			display: grid;
			row-gap: var(--calendar-row-gap, var(--calendar-default-row-gap));
		}

		.aurora-calendar[data-direction='next'] .aurora-calendar-weeks {
			animation: aurora-calendar-in var(--_duration) var(--_easing);
		}

		.aurora-calendar[data-direction='previous'] .aurora-calendar-weeks {
			animation: aurora-calendar-in-back var(--_duration) var(--_easing);
		}

		.aurora-calendar-weekday {
			overflow: hidden;
			padding: var(--calendar-weekday-padding, var(--calendar-default-weekday-padding));
			color: var(--calendar-weekday-color, var(--calendar-default-weekday-color));
			font-size: var(--calendar-weekday-font-size, var(--calendar-default-weekday-font-size));
			font-weight: var(--calendar-weekday-font-weight, var(--calendar-default-weekday-font-weight));
			letter-spacing: var(
				--calendar-weekday-letter-spacing,
				var(--calendar-default-weekday-letter-spacing)
			);
			text-align: center;
			text-overflow: ellipsis;
			text-transform: var(
				--calendar-weekday-text-transform,
				var(--calendar-default-weekday-text-transform)
			);
			white-space: nowrap;
		}

		.aurora-calendar-day {
			position: relative;
			display: grid;
			place-items: center;
			height: var(--calendar-day-height, var(--calendar-default-day-height));
			min-width: 0;
			cursor: pointer;
			outline: none;
		}

		.aurora-calendar-day-empty,
		.aurora-calendar[data-disabled] .aurora-calendar-day {
			cursor: default;
		}

		.aurora-calendar-day[data-disabled] {
			cursor: not-allowed;
		}

		.aurora-calendar-day-content {
			position: relative;
			z-index: 1;
			display: grid;
			place-items: center;
			box-sizing: border-box;
			width: var(--calendar-day-width, var(--calendar-default-day-width));
			height: 100%;
			border-radius: var(--_radius);
			background: var(--calendar-day-background, var(--calendar-default-day-background));
			transition:
				background-color var(--_duration) var(--_easing),
				color var(--_duration) var(--_easing);
		}

		.aurora-calendar-label {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		@media (hover: hover) {
			.aurora-calendar:not([data-disabled])
				.aurora-calendar-day:not([data-selected], [data-disabled]):hover
				.aurora-calendar-day-content {
				background: var(--calendar-day-hover-background, var(--calendar-default-day-hover-background));
			}
		}

		.aurora-calendar-day:focus-visible .aurora-calendar-day-content {
			outline: var(--global-focus-ring-width) solid
				var(--calendar-focus-ring-color, var(--calendar-default-focus-ring-color));
			outline-offset: 1px;
		}

		.aurora-calendar-day[data-today] .aurora-calendar-day-content {
			color: var(--calendar-today-color, var(--calendar-default-today-color));
			background: var(--calendar-today-background, var(--calendar-default-today-background));
		}

		.aurora-calendar-day[data-range]::before {
			content: '';
			position: absolute;
			inset-block: 1px;
			inset-inline: 0;
			background: var(--_band);
		}

		.aurora-calendar-day[data-preview]::before {
			background: var(
				--calendar-range-preview-background,
				var(--calendar-default-range-preview-background)
			);
		}

		.aurora-calendar-week > .aurora-calendar-day:first-child[data-range]::before {
			inset-inline-start: 2px;
			border-start-start-radius: var(--_radius);
			border-end-start-radius: var(--_radius);
		}

		.aurora-calendar-week > .aurora-calendar-day:last-child[data-range]::before {
			inset-inline-end: 2px;
			border-start-end-radius: var(--_radius);
			border-end-end-radius: var(--_radius);
		}

		.aurora-calendar-week > .aurora-calendar-day[data-range='start']::before {
			inset-inline-start: 50%;
			border-radius: 0;
		}

		.aurora-calendar-week > .aurora-calendar-day[data-range='end']::before {
			inset-inline-end: 50%;
			border-radius: 0;
		}

		.aurora-calendar-week > .aurora-calendar-day:last-child[data-range='start']::before,
		.aurora-calendar-week > .aurora-calendar-day:first-child[data-range='end']::before,
		.aurora-calendar-day[data-range='single']::before {
			display: none;
		}

		.aurora-calendar-day[data-range='middle'] .aurora-calendar-day-content {
			color: var(--calendar-range-color, var(--calendar-default-range-color));
		}

		.aurora-calendar-day[data-selected] .aurora-calendar-day-content {
			background: var(
				--calendar-selected-day-background,
				var(--calendar-default-selected-day-background)
			);
			color: var(--calendar-selected-day-color, var(--calendar-default-selected-day-color));
			box-shadow: var(
				--calendar-selected-day-box-shadow,
				var(--calendar-default-selected-day-box-shadow)
			);
			font-weight: var(
				--calendar-selected-day-font-weight,
				var(--calendar-default-selected-day-font-weight)
			);
		}

		.aurora-calendar-day[data-outside] .aurora-calendar-day-content {
			opacity: var(--calendar-outside-day-opacity, var(--calendar-default-outside-day-opacity));
		}

		.aurora-calendar-day[data-disabled] .aurora-calendar-day-content {
			opacity: var(--calendar-disabled-day-opacity, var(--calendar-default-disabled-day-opacity));
		}

		.aurora-calendar[data-variant='compact']
			.aurora-calendar-day[data-today]
			.aurora-calendar-day-content::after {
			content: '';
			position: absolute;
			bottom: 4px;
			left: 50%;
			width: var(--calendar-today-dot-size, var(--calendar-default-today-dot-size));
			height: var(--calendar-today-dot-size, var(--calendar-default-today-dot-size));
			border-radius: 50%;
			background: var(--calendar-today-dot-color, var(--calendar-default-today-dot-color));
			translate: -50% 0;
		}

		.aurora-calendar[data-variant='compact'] .aurora-calendar-day-append {
			position: absolute;
			z-index: 2;
			top: 3px;
			inset-inline-end: 4px;
			display: flex;
			gap: 2px;
			pointer-events: none;
		}

		.aurora-calendar[data-variant='grid'] {
			--_border: var(--calendar-grid-border-color, var(--calendar-default-grid-border-color));

			overflow: hidden;
			border: var(--global-border-width) solid var(--_border);
			border-radius: var(
				--calendar-grid-border-radius,
				var(--calendar-default-grid-border-radius)
			);
			background: var(--calendar-grid-background, var(--calendar-default-grid-background));
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-weekday {
			padding: var(--calendar-weekday-padding, var(--calendar-default-grid-weekday-padding));
			border-bottom: var(--global-border-width) solid var(--_border);
			text-align: start;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-weeks {
			row-gap: 0;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
			box-sizing: border-box;
			height: auto;
			min-height: var(
				--calendar-grid-cell-min-height,
				var(--calendar-default-grid-cell-min-height)
			);
			padding: var(--calendar-grid-cell-padding, var(--calendar-default-grid-cell-padding));
			border-inline-end: var(--global-border-width) solid var(--_border);
			border-bottom: var(--global-border-width) solid var(--_border);
			transition: background-color var(--_duration) var(--_easing);
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day:last-child {
			border-inline-end: 0;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-week:last-child .aurora-calendar-day {
			border-bottom: 0;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day::before {
			display: none;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day[data-range],
		.aurora-calendar[data-variant='grid'] .aurora-calendar-day[data-selected] {
			background: var(--_band);
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day[data-preview] {
			background: var(
				--calendar-range-preview-background,
				var(--calendar-default-range-preview-background)
			);
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day-content {
			flex: none;
			width: var(--calendar-grid-day-size, var(--calendar-default-grid-day-size));
			height: var(--calendar-grid-day-size, var(--calendar-default-grid-day-size));
			font-size: var(--calendar-grid-day-font-size, var(--calendar-default-grid-day-font-size));
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day[data-selected] .aurora-calendar-day-content {
			background: transparent;
			box-shadow: none;
			color: var(--global-color-primary);
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day[data-today] .aurora-calendar-day-content {
			background: var(--calendar-grid-today-background, var(--calendar-default-grid-today-background));
			color: var(--calendar-grid-today-color, var(--calendar-default-grid-today-color));
			box-shadow: var(--global-shadow-fill);
		}

		@media (hover: hover) {
			.aurora-calendar[data-variant='grid']:not([data-disabled])
				.aurora-calendar-day:not([data-selected], [data-range], [data-disabled]):hover {
				background: var(--calendar-day-hover-background, var(--calendar-default-day-hover-background));
			}

			.aurora-calendar[data-variant='grid']
				.aurora-calendar-day:not([data-today]):hover
				.aurora-calendar-day-content {
				background: transparent;
			}
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day:focus-visible {
			outline: var(--global-focus-ring-width) solid
				var(--calendar-focus-ring-color, var(--calendar-default-focus-ring-color));
			outline-offset: calc(var(--global-focus-ring-width) * -1);
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day:focus-visible .aurora-calendar-day-content {
			outline: none;
		}

		.aurora-calendar[data-variant='grid'] .aurora-calendar-day-append {
			display: grid;
			gap: 4px;
			width: 100%;
			min-width: 0;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-calendar .aurora-calendar-weeks {
				animation: none;
			}
		}
	}

	@keyframes aurora-calendar-in {
		from {
			opacity: 0;
			translate: var(--_shift) 0;
		}
	}

	@keyframes aurora-calendar-in-back {
		from {
			opacity: 0;
			translate: calc(var(--_shift) * -1) 0;
		}
	}
</style>
