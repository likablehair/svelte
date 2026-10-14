<!-- @component
Date and time field: type them or choose them in a panel with a calendar and the columns of hours and minutes. The value is `value`, a `Date` with the local date and time (seconds at 0). The text is one mask, the date and then the time: the date format comes from `locale` (`en` is MM/dd/yyyy, `it` dd/MM/yyyy) or from `format`, the clock from `locale` (`en` is 12-hour with AM/PM, `it` 24-hour) or from `hour12`, and the whole format is shown as a chip after the text, which hides itself when the field is too narrow for both. Typing accepts digits only and adds the separators, the space and the colon; on a 12-hour clock A and P set AM and PM. A date and time that does not exist, is before `min` or after `max` or falls on a day disabled by `isDateDisabled` (and an unfinished one when the field loses focus) turns the field to the error state with `invalidText`, and the form refuses to submit it. On desktop, focusing or clicking the field opens a `DatePicker` and a `TimePicker` side by side in a menu; Arrow Down moves the focus into the calendar, choosing a day with the keyboard moves it to the hours, Escape closes the panel and Tab leaves it. Choosing a day keeps the time already chosen, or uses 00:00 (moved inside `min` and `max`); choosing the minutes (or AM/PM on a 12-hour clock) once there is a day closes the panel (`closeOnSelect`). On screens up to 1024px wide the calendar button opens the panel in a bottom drawer instead, and the field stays typable (`mobileDrawer`); in the drawer, and in the menu on screens up to 600px wide, the time is below the calendar. With `name` the value is submitted as the local `yyyy-MM-ddTHH:mm`. Its state is exposed as `data-state`, `data-disabled`, `data-readonly`, `data-open` and `data-hour-cycle` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';
	import './DateTimePickerTextField.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { MediaQuery } from 'svelte/reactivity';
	import Menu from '../../simple/common/Menu.svelte';
	import type { CalendarDay } from '../../simple/dates/Calendar.svelte';
	import DatePicker from '../../simple/dates/DatePicker.svelte';
	import TimePicker from '../../simple/dates/TimePicker.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';
	import {
		formatDate,
		formatOf,
		outOfBounds,
		parseDate,
		parseISODate,
		sameDay,
		startOfDay
	} from '../../../utils/dates.js';
	import {
		formatDateTimeText,
		formatTime,
		hour12Of,
		maskDateTime,
		parseDateTimeText,
		parseISODateTime,
		parseTime,
		parseTimeText,
		periodNames,
		toISODateTime,
		type TimeOfDay
	} from '../../../utils/time.js';
	import { inheritedLocale, warnWithoutLocale } from '../../../utils/locale.js';
	import { formatLetters, libraryTexts } from '../../../utils/texts.js';

	const CALENDAR_CLOCK_ICON =
		'M6 1V3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H11.1C12.36 22.24 14.09 23 16 23C19.87 23 23 19.87 23 16C23 14.09 22.24 12.36 21 11.1V5C21 3.9 20.11 3 19 3H18V1H16V3H8V1M5 5H19V7H5M5 9H19V9.67C18.09 9.24 17.07 9 16 9C12.13 9 9 12.13 9 16C9 17.07 9.24 18.09 9.67 19H5M16 11.15C18.68 11.15 20.85 13.32 20.85 16C20.85 18.68 18.68 20.85 16 20.85C13.32 20.85 11.15 18.68 11.15 16C11.15 13.32 13.32 11.15 16 11.15M15 13V16.69L18.19 18.53L18.94 17.23L16.5 15.82V13Z';
	const CLEAR_ICON =
		'M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z';
	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const SUCCESS_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';

	interface Props
		extends Omit<
			HTMLInputAttributes,
			| 'value'
			| 'type'
			| 'class'
			| 'children'
			| 'min'
			| 'max'
			| 'onchange'
			| 'name'
			| 'placeholder'
			| 'disabled'
			| 'readonly'
			| 'required'
			| 'id'
		> {
		/** The date and time, as a `Date` in local time with seconds at 0. `undefined` while the field is empty or its text is not a valid date and time. */
		value?: Date;
		/** Whether the panel is open. `undefined` counts as closed. */
		open?: boolean;
		/** BCP 47 locale: the date format, the names in the calendar, the first day of the week, the 12-hour (`en`) or 24-hour (`it`) clock, the names of AM and PM and the language of the texts (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Format of the date part of the text, with the tokens `dd`, `MM` and `yyyy` and any separator (`dd/MM/yyyy`, `yyyy-MM-dd`). Defaults to the one of `locale`. */
		format?: string;
		/** Forces the 12-hour clock (`true`) or the 24-hour clock (`false`) instead of the one of `locale`. */
		hour12?: boolean;
		/** Minutes between two options of the minutes column. Typed minutes can be any. */
		minuteStep?: number;
		/** Earliest date and time that can be chosen or typed, compared as an instant: it limits the days of the calendar and, on its day, the hours and minutes. */
		min?: Date;
		/** Latest date and time that can be chosen or typed, compared as an instant. */
		max?: Date;
		/** Returns `true` for the days that cannot be chosen or typed (weekends, holidays, ...). It receives the day at local midnight. */
		isDateDisabled?: (date: Date) => boolean;
		/** First day of the week in the calendar, from 0 (Sunday) to 6 (Saturday). Defaults to the one of `locale`. */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Length of the names of the days of the week in the calendar. */
		weekdayFormat?: 'narrow' | 'short' | 'long';
		/** Shows in the calendar the days of the previous and next month that complete the first and last week. */
		showOutsideDays?: boolean;
		/** Visible label above the field, linked to the input. In the mobile drawer it is the title. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. Without it the field still shows the error state for an invalid date and time. */
		state?: 'error' | 'success';
		/** Message shown below the field, and given to the form, when the typed date and time is not valid. Defaults to "Enter a valid date and time", in the language of `locale`. */
		invalidText?: string;
		/** Placeholder of the input. Without it the format chip tells what to type. */
		placeholder?: string;
		/** Native `disabled`: the field and the panel cannot be used. */
		disabled?: boolean;
		/** Native `readonly`: the date and time are shown and can be selected, but not changed. */
		readonly?: boolean;
		/** Native `required` on the input. */
		required?: boolean;
		/** `id` of the input. Generated when missing, so the label always points to it. */
		id?: string;
		/** Name of a hidden input that submits the value as the local `yyyy-MM-ddTHH:mm` (empty when there is no value). */
		name?: string;
		/** Shows a button that empties the field. */
		clearable?: boolean;
		/** Accessible name of the clear button. Defaults to "Clear", in the language of `locale`. */
		clearLabel?: string;
		/** Closes the panel when the minutes (on a 12-hour clock, the minutes or AM/PM) are chosen and there is a day, or when the day is chosen after the time. */
		closeOnSelect?: boolean;
		/** Side of the field where the panel opens. It flips when there is not enough space. */
		placement?:
			| 'bottom-start'
			| 'bottom'
			| 'bottom-end'
			| 'top-start'
			| 'top'
			| 'top-end'
			| 'left-start'
			| 'left'
			| 'left-end'
			| 'right-start'
			| 'right'
			| 'right-end';
		/** On screens up to 1024px wide, opens the panel in a bottom drawer from the calendar button instead of a menu, and focusing the field does not open it. */
		mobileDrawer?: boolean;
		/** Title of the mobile drawer. Defaults to `label`. */
		drawerTitle?: string;
		/** Accessible name of the close button of the mobile drawer. Defaults to "Close", in the language of `locale`. */
		closeLabel?: string;
		/** Accessible name of the calendar button, and of the panel when there is no `label`. Defaults to "Choose date and time", in the language of `locale`. */
		openLabel?: string;
		/** Shows the format as a chip after the text, also read by screen readers. The chip hides itself while the field is too narrow for the whole text and the chip. */
		showFormat?: boolean;
		/** Text of the format chip. Defaults to the date format in lowercase, with the letters of the language of `locale`, and `hh:mm` (`dd/mm/yyyy hh:mm`, in Italian `gg/mm/aaaa hh:mm`), with `am` on a 12-hour clock (`mm/dd/yyyy hh:mm am`). */
		formatLabel?: string;
		/** Accessible name of the calendar's left arrow in the day view (`DatePicker`). Defaults to "Previous month", in the language of `locale`. */
		previousMonthLabel?: string;
		/** Accessible name of the calendar's right arrow in the day view. Defaults to "Next month", in the language of `locale`. */
		nextMonthLabel?: string;
		/** Accessible name of the calendar's left arrow in the month view. Defaults to "Previous year", in the language of `locale`. */
		previousYearLabel?: string;
		/** Accessible name of the calendar's right arrow in the month view. Defaults to "Next year", in the language of `locale`. */
		nextYearLabel?: string;
		/** Accessible name of the hours column of the panel (`TimePicker`). Defaults to "Hours", in the language of `locale`. */
		hoursLabel?: string;
		/** Accessible name of the minutes column of the panel. Defaults to "Minutes", in the language of `locale`. */
		minutesLabel?: string;
		/** Accessible name of the AM/PM column of the panel. Defaults to "AM/PM", in the language of `locale`. */
		periodLabel?: string;
		/** The input element. */
		input?: HTMLInputElement;
		/** Extra classes for each part. `panel` goes on the box around the calendar and the time, `datePicker` on the `DatePicker`, `timePicker` on the `TimePicker`. */
		class?: {
			container?: string;
			label?: string;
			row?: string;
			field?: string;
			input?: string;
			hint?: string;
			panel?: string;
			datePicker?: string;
			timePicker?: string;
		};
		/** Replaces the label content. It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the icon shown for the validation state. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the calendar icon. The button around it keeps opening the panel. */
		iconSnippet?: Snippet;
		/** Content outside the field, on the left. */
		prependSnippet?: Snippet;
		/** Content inside the field, after the format chip and before the clear button. */
		appendInnerSnippet?: Snippet;
		/** Content outside the field, on the right. */
		appendSnippet?: Snippet;
		/** Replaces the icon of the clear button. */
		clearSnippet?: Snippet;
		/** Replaces the content of the format chip. `format` is the date format and the clock (`dd/MM/yyyy hh:mm`). */
		formatSnippet?: Snippet<[{ format: string }]>;
		/** Replaces the number of a day in the calendar (see `Calendar`). */
		daySnippet?: Snippet<[CalendarDay]>;
		/** Content after the number of a day in the calendar (see `Calendar`). */
		dayAppendSnippet?: Snippet<[CalendarDay]>;
		/** Replaces the text of an option of the time columns (see `TimePicker`). */
		optionSnippet?: Snippet<
			[
				{
					value: number | 'am' | 'pm';
					label: string;
					column: 'hours' | 'minutes' | 'period';
					selected: boolean;
					disabled: boolean;
				}
			]
		>;
		/** Called when the user changes the date and time: in the panel, by typing a whole valid date and time (or making it invalid again) and with the clear button. */
		onchange?: (event: { value: Date | undefined }) => void;
	}

	let {
		value = $bindable(),
		open = $bindable(),
		locale: localeProp,
		format,
		hour12,
		minuteStep = 5,
		min,
		max,
		isDateDisabled,
		weekStart,
		weekdayFormat = 'short',
		showOutsideDays = true,
		label,
		hint,
		state: validationState,
		invalidText: invalidTextProp,
		placeholder,
		disabled = false,
		readonly = false,
		required = false,
		id,
		name,
		clearable = false,
		clearLabel,
		closeOnSelect = true,
		placement = 'bottom-start',
		mobileDrawer = true,
		drawerTitle,
		closeLabel,
		openLabel: openLabelProp,
		showFormat = true,
		formatLabel,
		previousMonthLabel,
		nextMonthLabel,
		previousYearLabel,
		nextYearLabel,
		hoursLabel,
		minutesLabel,
		periodLabel,
		input = $bindable(),
		class: clazz = {},
		labelSnippet,
		hintSnippet,
		stateIconSnippet,
		iconSnippet,
		prependSnippet,
		appendInnerSnippet,
		appendSnippet,
		clearSnippet,
		formatSnippet,
		daySnippet,
		dayAppendSnippet,
		optionSnippet,
		onchange,
		oninput,
		onfocus,
		onblur,
		onclick,
		onkeydown,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	warnWithoutLocale('DateTimePickerTextField', () => localeProp);
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale));
	let invalidText = $derived(invalidTextProp ?? texts.dateTimePickerTextField.invalid);
	let openLabel = $derived(openLabelProp ?? texts.dateTimePickerTextField.open);

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;
	const formatId = `${uid}-format`;
	const panelId = `${uid}-panel`;
	const narrow = new MediaQuery('max-width: 600px', false);
	const ISO_INPUT = /^\s*(\d{4}-\d{2}-\d{2})(?:[Tt\s](\d{2}:\d{2}))?/;

	let inputId = $derived(id ?? `${uid}-input`);
	let drawerMode = $derived(mobileDrawer && breakpoints.mAndDown);
	let pattern = $derived(format ?? formatOf(locale));
	let twelve = $derived(hour12 ?? hour12Of(locale));
	let periods = $derived(periodNames(locale));
	let dateLength = $derived(formatDate(new Date(2000, 0, 1), pattern).length);
	let length = $derived(dateLength + (twelve ? 7 + Math.min(periods[0].length, periods[1].length) : 6));
	let clock = $derived(twelve ? `hh:mm ${periods[0].toLowerCase()}` : 'hh:mm');
	let chars = $derived(
		Math.max(
			dateLength + (twelve ? 7 + Math.max(periods[0].length, periods[1].length) : 6),
			placeholder?.length ?? 0
		)
	);
	let chip = $derived(formatLabel ?? `${formatLetters(pattern, texts.dateLetters)} ${clock}`);
	let current = $derived(value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined);
	let lower = $derived(min && new Date(Math.ceil(min.getTime() / 60_000) * 60_000));
	let upper = $derived(max && new Date(Math.floor(max.getTime() / 60_000) * 60_000));

	let anchor = $state<HTMLDivElement>();
	let inputNode = $state<HTMLInputElement>();
	let menuNode = $state<HTMLDivElement>();
	let panelNode = $state<HTMLDivElement>();
	let datePicker = $state<ReturnType<typeof DatePicker>>();
	let timePicker = $state<ReturnType<typeof TimePicker>>();
	let timePickerNode = $state<HTMLDivElement>();
	let editing = $state(false);
	let pendingTime = $state<string>();
	let timeChosen = false;
	let silent = false;

	let text = $state(untrack(() => (current ? formatDateTimeText(current, pattern, twelve, periods) : '')));
	let shown = untrack(() => minuteOf(current));
	let shownClock = untrack(() => `${pattern} ${twelve} ${periods.join(' ')}`);

	$effect(() => {
		const key = minuteOf(current);
		const date = current;
		const reading = `${pattern} ${twelve} ${periods.join(' ')}`;
		untrack(() => {
			const reformat = reading !== shownClock;
			shownClock = reading;
			if (key !== shown || (reformat && key !== undefined)) {
				shown = key;
				text = date ? formatDateTimeText(date, pattern, twelve, periods) : '';
			}
		});
	});

	let typed = $derived(current ? undefined : partsOf(text));
	let day = $derived(current ? startOfDay(current) : typed?.day);
	let time = $derived(current ? formatTime(current) : (pendingTime ?? typed?.time));
	let minTime = $derived(lower && day && sameDay(day, lower) ? formatTime(lower) : undefined);
	let maxTime = $derived(upper && day && sameDay(day, upper) ? formatTime(upper) : undefined);

	let invalid = $derived(isInvalid(text, current, editing));
	let validation = $derived(validationState ?? (invalid ? 'error' : undefined));
	let hintText = $derived(invalid && !validationState ? invalidText : hint);
	let hasHint = $derived(!!hintText || !!hintSnippet);
	let describedBy = $derived(
		[rest['aria-describedby'], hasHint && hintId, showFormat && formatId].filter(Boolean).join(' ') ||
			undefined
	);
	let hidden = $derived(current ? toISODateTime(current) : '');

	$effect(() => {
		inputNode?.setCustomValidity(invalid ? invalidText : '');
	});

	$effect(() => {
		if (open) menuNode?.removeAttribute('inert');
	});

	$effect(() => {
		if (open) return;
		timeChosen = false;
		untrack(() => (pendingTime = undefined));
	});

	$effect(() => {
		if (!open || !drawerMode) return;
		tick().then(() => datePicker?.focus());
	});

	function minuteOf(date: Date | undefined) {
		return date ? Math.floor(date.getTime() / 60_000) : undefined;
	}

	function textOf(date: Date) {
		return formatDateTimeText(date, pattern, twelve, periods);
	}

	function partsOf(current: string) {
		const date = parseDate(current.slice(0, dateLength), pattern);
		const clockText = current.slice(dateLength + 1);
		return {
			day: date && !outOfBounds(date, lower, upper, isDateDisabled) ? date : undefined,
			time: clockText ? parseTimeText(clockText, twelve, periods) : undefined
		};
	}

	function allowed(date: Date) {
		if (outOfBounds(startOfDay(date), min, max, isDateDisabled)) return false;
		return (!min || date >= min) && (!max || date <= max);
	}

	function clamp(date: Date) {
		if (lower && date < lower) return lower;
		if (upper && date > upper) return upper;
		return date;
	}

	function combine(target: Date, clockTime: TimeOfDay) {
		const date = new Date(target.getTime());
		date.setHours(clockTime.hours, clockTime.minutes, 0, 0);
		return clamp(date);
	}

	function isInvalid(current: string, date: Date | undefined, focused: boolean) {
		if (!current) return false;
		if (date && textOf(date) === current) return false;
		return current.length >= length || !focused;
	}

	function accept(current: string) {
		const date = parseDateTimeText(current, pattern, twelve, periods);
		return date && allowed(date) ? date : undefined;
	}

	function fromISO(raw: string) {
		const match = ISO_INPUT.exec(raw);
		if (!match) return undefined;
		if (match[2]) {
			const date = parseISODateTime(`${match[1]}T${match[2]}`);
			return date ? textOf(date) : undefined;
		}
		const date = parseISODate(match[1]);
		return date ? `${formatDate(date, pattern)} ` : undefined;
	}

	function commit(date: Date | undefined) {
		pendingTime = undefined;
		shown = minuteOf(date);
		text = date ? textOf(date) : '';
		if (minuteOf(date) === minuteOf(current)) return;
		value = date;
		onchange?.({ value });
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const node = event.currentTarget;
		const raw = node.value;
		const type = event instanceof InputEvent ? event.inputType : '';
		const pasted = !type || type.startsWith('insertFrom') || type === 'insertReplacementText';
		const iso = pasted || pattern !== 'yyyy-MM-dd' ? fromISO(raw) : undefined;
		const masked =
			iso !== undefined
				? { text: iso, caret: -1 }
				: maskDateTime(raw, pattern, twelve, periods, {
						caret: node.selectionStart ?? raw.length,
						deleting: type.startsWith('delete'),
						pasted
					});
		const next = masked.text;
		if (next !== raw) {
			node.value = next;
			const position = masked.caret < 0 ? next.length : masked.caret;
			node.setSelectionRange(position, position);
		}
		text = next;
		const date = accept(next);
		if (minuteOf(date) === minuteOf(current)) return;
		shown = minuteOf(date);
		value = date;
		onchange?.({ value });
	}

	function openPanel() {
		if (disabled || readonly || open) return;
		open = true;
	}

	function close(returnFocus = false) {
		menuNode?.setAttribute('inert', '');
		open = false;
		if (returnFocus && !drawerMode) focusField();
	}

	function focusField() {
		silent = true;
		inputNode?.focus();
		silent = false;
	}

	async function focusPanel() {
		if (disabled || readonly) return;
		open = true;
		await tick();
		datePicker?.focus();
	}

	function clear() {
		const changed = !!current;
		text = '';
		shown = undefined;
		pendingTime = undefined;
		value = undefined;
		if (changed) onchange?.({ value });
		focusField();
	}

	function draftTime(): TimeOfDay | undefined {
		const selected = (column: string) =>
			timePickerNode
				?.querySelector(`[data-column="${column}"] [data-selected]`)
				?.getAttribute('data-value');
		const hour = selected('hours');
		const minute = selected('minutes');
		if (hour == null && minute == null) return undefined;
		const hours = Number(hour ?? 0);
		return {
			hours: twelve ? (hours % 12) + (selected('period') === 'pm' ? 12 : 0) : hours,
			minutes: Number(minute ?? 0)
		};
	}

	async function pickDay(event: { selectedDate: Date | undefined }) {
		if (!event.selectedDate) return;
		const keyboard = !!panelNode?.contains(document.activeElement);
		const clockTime = parseTime(time) ?? draftTime() ?? { hours: 0, minutes: 0 };
		commit(combine(event.selectedDate, clockTime));
		if (closeOnSelect && timeChosen) {
			close(true);
			return;
		}
		if (!keyboard) return;
		await tick();
		timePicker?.focus();
	}

	function pickTime(event: { value: string; column: 'hours' | 'minutes' | 'period' }) {
		const clockTime = parseTime(event.value);
		if (!clockTime) return;
		const last = event.column !== 'hours';
		if (last) timeChosen = true;
		if (!day) {
			pendingTime = event.value;
			return;
		}
		commit(combine(day, clockTime));
		if (closeOnSelect && last) close(true);
	}

	function focusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (anchor?.contains(next) || menuNode?.contains(next)) return;
		if (open && next && !drawerMode) close();
	}
</script>

{#snippet panel()}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={panelNode}
		id={panelId}
		role={drawerMode ? undefined : 'dialog'}
		aria-label={drawerMode ? undefined : (label ?? openLabel)}
		class={['aurora-date-time-picker-text-field-panel', clazz.panel]}
		data-layout={drawerMode || narrow.current ? 'stacked' : 'side'}
		onfocusout={focusOut}
		onmousedown={(event) => {
			if (!drawerMode) event.preventDefault();
		}}
		onkeydown={(event) => {
			if (event.key !== 'Escape' || event.defaultPrevented || drawerMode) return;
			event.preventDefault();
			close(true);
		}}
	>
		<DatePicker
			bind:this={datePicker}
			selectedDate={day}
			{locale}
			{weekStart}
			{weekdayFormat}
			{showOutsideDays}
			min={lower}
			max={upper}
			{isDateDisabled}
			{daySnippet}
			{dayAppendSnippet}
			{previousMonthLabel}
			{nextMonthLabel}
			{previousYearLabel}
			{nextYearLabel}
			class={{
				container: ['aurora-date-time-picker-text-field-date', clazz.datePicker].filter(Boolean).join(' ')
			}}
			onchange={pickDay}
		/>
		<TimePicker
			bind:this={timePicker}
			bind:timePickerElement={timePickerNode}
			value={time}
			{locale}
			hour12={twelve}
			{minuteStep}
			min={minTime}
			max={maxTime}
			{hoursLabel}
			{minutesLabel}
			{periodLabel}
			{optionSnippet}
			class={{
				container: ['aurora-date-time-picker-text-field-time', clazz.timePicker].filter(Boolean).join(' ')
			}}
			onchange={pickTime}
		/>
	</div>
{/snippet}

<div
	class={['aurora-date-time-picker-text-field', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-open={open || undefined}
	data-hour-cycle={twelve ? '12' : '24'}
	onfocusout={focusOut}
>
	{#if labelSnippet || label}
		<label id={labelId} class={['aurora-date-time-picker-text-field-label', clazz.label]} for={inputId}>
			{#if labelSnippet}
				{@render labelSnippet({ label })}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
	<div class={['aurora-date-time-picker-text-field-row', clazz.row]}>
		{@render prependSnippet?.()}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class={['aurora-date-time-picker-text-field-control', clazz.field]}
			bind:this={anchor}
			style:--_chars={chars}
			onmousedown={(event) => {
				if ((event.target as Element).closest('input, button')) return;
				event.preventDefault();
				if (document.activeElement !== inputNode) inputNode?.focus();
				else if (!drawerMode) openPanel();
			}}
		>
			<button
				type="button"
				class="aurora-date-time-picker-text-field-toggle"
				tabindex="-1"
				aria-label={openLabel}
				aria-haspopup="dialog"
				aria-expanded={!!open}
				aria-controls={open ? panelId : undefined}
				disabled={disabled || readonly}
				onmousedown={(event) => {
					if (!drawerMode) event.preventDefault();
				}}
				onclick={() => {
					if (open) close();
					else {
						open = true;
						if (!drawerMode) focusField();
					}
				}}
			>
				{#if iconSnippet}
					{@render iconSnippet()}
				{:else}
					<Icon path={CALENDAR_CLOCK_ICON} />
				{/if}
			</button>
			<input
				inputmode={twelve ? 'text' : 'numeric'}
				autocomplete="off"
				{...rest}
				bind:this={() => inputNode, (node) => (inputNode = input = node)}
				id={inputId}
				type="text"
				role="combobox"
				aria-haspopup="dialog"
				aria-expanded={!!open}
				aria-controls={open ? panelId : undefined}
				aria-invalid={invalid || validationState === 'error' || rest['aria-invalid'] || undefined}
				aria-describedby={describedBy}
				value={text}
				{placeholder}
				{disabled}
				{readonly}
				{required}
				class={clazz.input}
				oninput={(event) => {
					oninput?.(event);
					handleInput(event);
				}}
				onfocus={(event) => {
					onfocus?.(event);
					editing = true;
					if (!silent && !drawerMode) openPanel();
				}}
				onblur={(event) => {
					onblur?.(event);
					editing = false;
				}}
				onclick={(event) => {
					onclick?.(event);
					if (!drawerMode) openPanel();
				}}
				onkeydown={(event) => {
					onkeydown?.(event);
					if (event.defaultPrevented) return;
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						focusPanel();
					} else if (event.key === 'Enter' && open) {
						event.preventDefault();
						close();
					} else if (event.key === 'Tab' && open && !drawerMode) close();
				}}
			/>
			{#if showFormat}
				<span class="aurora-date-time-picker-text-field-format-slot">
					<kbd class="aurora-date-time-picker-text-field-format" aria-hidden="true">
						{#if formatSnippet}
							{@render formatSnippet({ format: `${pattern} ${clock}` })}
						{:else}
							{chip}
						{/if}
					</kbd>
					<span hidden id={formatId}>{chip}</span>
				</span>
			{/if}
			{#if appendInnerSnippet || (clearable && (text || current) && !disabled && !readonly) || validation}
				<span class="aurora-date-time-picker-text-field-end">
					{@render appendInnerSnippet?.()}
					{#if clearable && (text || current) && !disabled && !readonly}
						<button
							type="button"
							class="aurora-date-time-picker-text-field-clear"
							aria-label={clearLabel ?? texts.dateTimePickerTextField.clear}
							onmousedown={(event) => event.preventDefault()}
							onclick={clear}
						>
							{#if clearSnippet}
								{@render clearSnippet()}
							{:else}
								<Icon path={CLEAR_ICON} />
							{/if}
						</button>
					{/if}
					{#if validation && stateIconSnippet}
						{@render stateIconSnippet({ state: validation })}
					{:else if validation}
						<Icon
							path={validation === 'error' ? ALERT_ICON : SUCCESS_ICON}
							class="aurora-date-time-picker-text-field-state-icon"
						/>
					{/if}
				</span>
			{/if}
		</div>
		{@render appendSnippet?.()}
	</div>
	{#if hintSnippet}
		<div class={['aurora-date-time-picker-text-field-hint', clazz.hint]} id={hintId}>
			{@render hintSnippet({ hint: hintText })}
		</div>
	{:else if hintText}
		<div class={['aurora-date-time-picker-text-field-hint', clazz.hint]} id={hintId}>{hintText}</div>
	{/if}
	{#if name}
		<input type="hidden" {name} value={hidden} />
	{/if}
</div>

{#if drawerMode}
	<Drawer
		bind:open
		position="bottom"
		title={drawerTitle ?? label}
		aria-label={(drawerTitle ?? label) ? undefined : openLabel}
		closable
		closeLabel={closeLabel ?? texts.dateTimePickerTextField.close}
		class={{
			drawer: 'aurora-date-time-picker-text-field-drawer',
			body: 'aurora-date-time-picker-text-field-drawer-body'
		}}
	>
		{@render panel()}
	</Drawer>
{:else}
	<Menu
		bind:open
		bind:menuElement={menuNode}
		activator={anchor}
		{placement}
		class="aurora-date-time-picker-text-field-menu"
	>
		{@render panel()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-date-time-picker-text-field {
			--_border: var(
				--date-time-picker-text-field-border-color,
				var(--date-time-picker-text-field-default-border-color)
			);
			--_hover-border: var(
				--date-time-picker-text-field-hover-border-color,
				var(--date-time-picker-text-field-default-hover-border-color)
			);
			--_focus-border: var(
				--date-time-picker-text-field-focus-border-color,
				var(--date-time-picker-text-field-default-focus-border-color)
			);
			--_ring: var(
				--date-time-picker-text-field-focus-ring-color,
				var(--date-time-picker-text-field-default-focus-ring-color)
			);
			--_hint: var(
				--date-time-picker-text-field-hint-color,
				var(--date-time-picker-text-field-default-hint-color)
			);
			--icon-size: var(
				--date-time-picker-text-field-icon-size,
				var(--date-time-picker-text-field-default-icon-size)
			);

			display: flex;
			flex-direction: column;
			gap: var(--date-time-picker-text-field-gap, var(--date-time-picker-text-field-default-gap));
			box-sizing: border-box;
			width: var(--date-time-picker-text-field-width, var(--date-time-picker-text-field-default-width));
			max-width: var(
				--date-time-picker-text-field-max-width,
				var(--date-time-picker-text-field-default-max-width)
			);
			min-width: 0;
		}

		.aurora-date-time-picker-text-field[data-state='error'] {
			--_border: var(
				--date-time-picker-text-field-error-color,
				var(--date-time-picker-text-field-default-error-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-date-time-picker-text-field[data-state='success'] {
			--_border: var(
				--date-time-picker-text-field-success-color,
				var(--date-time-picker-text-field-default-success-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-date-time-picker-text-field-label {
			color: var(
				--date-time-picker-text-field-label-color,
				var(--date-time-picker-text-field-default-label-color)
			);
			font-size: var(
				--date-time-picker-text-field-label-font-size,
				var(--date-time-picker-text-field-default-label-font-size)
			);
			font-weight: var(
				--date-time-picker-text-field-label-font-weight,
				var(--date-time-picker-text-field-default-label-font-weight)
			);
		}

		.aurora-date-time-picker-text-field-row {
			display: flex;
			align-items: center;
			gap: var(
				--date-time-picker-text-field-outer-gap,
				var(--date-time-picker-text-field-default-outer-gap)
			);
			color: var(
				--date-time-picker-text-field-icon-color,
				var(--date-time-picker-text-field-default-icon-color)
			);
		}

		.aurora-date-time-picker-text-field-control {
			flex: 1;
			min-width: 0;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(
				--date-time-picker-text-field-inner-gap,
				var(--date-time-picker-text-field-default-inner-gap)
			);
			height: var(
				--date-time-picker-text-field-height,
				var(--date-time-picker-text-field-default-height)
			);
			padding: var(
				--date-time-picker-text-field-padding,
				var(--date-time-picker-text-field-default-padding)
			);
			background: var(
				--date-time-picker-text-field-background,
				var(--date-time-picker-text-field-default-background)
			);
			border: var(
					--date-time-picker-text-field-border-width,
					var(--date-time-picker-text-field-default-border-width)
				)
				solid var(--_border);
			border-radius: var(
				--date-time-picker-text-field-border-radius,
				var(--date-time-picker-text-field-default-border-radius)
			);
			box-shadow: var(
				--date-time-picker-text-field-box-shadow,
				var(--date-time-picker-text-field-default-box-shadow)
			);
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-date-time-picker-text-field:not([data-disabled])
				.aurora-date-time-picker-text-field-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-date-time-picker-text-field-control:focus-within,
		.aurora-date-time-picker-text-field[data-open] .aurora-date-time-picker-text-field-control {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
				var(
					--date-time-picker-text-field-focus-ring-width,
					var(--date-time-picker-text-field-default-focus-ring-width)
				)
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-date-time-picker-text-field-toggle,
		.aurora-date-time-picker-text-field-clear {
			display: inline-flex;
			flex: none;
			align-items: center;
			justify-content: center;
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--global-radius-xs);
			background: transparent;
			color: inherit;
			cursor: pointer;
		}

		.aurora-date-time-picker-text-field-toggle:disabled {
			cursor: inherit;
		}

		.aurora-date-time-picker-text-field-control:focus-within .aurora-date-time-picker-text-field-toggle,
		.aurora-date-time-picker-text-field[data-open] .aurora-date-time-picker-text-field-toggle {
			color: var(--_focus-border);
		}

		.aurora-date-time-picker-text-field-clear:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 1px;
		}

		input {
			flex: 0 1 auto;
			width: calc(var(--_chars) * 1ch + 2px);
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(
				--date-time-picker-text-field-color,
				var(--date-time-picker-text-field-default-color)
			);
			font-family: var(
				--date-time-picker-text-field-font-family,
				var(--date-time-picker-text-field-default-font-family)
			);
			font-size: var(
				--date-time-picker-text-field-font-size,
				var(--date-time-picker-text-field-default-font-size)
			);
			font-weight: var(
				--date-time-picker-text-field-font-weight,
				var(--date-time-picker-text-field-default-font-weight)
			);
			font-variant-numeric: tabular-nums;
		}

		input::placeholder {
			color: var(
				--date-time-picker-text-field-placeholder-color,
				var(--date-time-picker-text-field-default-placeholder-color)
			);
			opacity: 1;
		}

		.aurora-date-time-picker-text-field-format-slot {
			display: flex;
			flex: 1 1 0;
			flex-wrap: wrap;
			align-self: stretch;
			align-items: center;
			align-content: flex-start;
			justify-content: flex-end;
			min-width: 0;
			overflow: clip;
		}

		.aurora-date-time-picker-text-field-format-slot::before {
			content: '';
			height: 100%;
		}

		.aurora-date-time-picker-text-field-end {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(
				--date-time-picker-text-field-inner-gap,
				var(--date-time-picker-text-field-default-inner-gap)
			);
			margin-inline-start: auto;
		}

		.aurora-date-time-picker-text-field-format {
			padding: var(
				--date-time-picker-text-field-format-padding,
				var(--date-time-picker-text-field-default-format-padding)
			);
			border: var(--global-border-width) solid
				var(
					--date-time-picker-text-field-format-border-color,
					var(--date-time-picker-text-field-default-format-border-color)
				);
			border-radius: var(
				--date-time-picker-text-field-format-border-radius,
				var(--date-time-picker-text-field-default-format-border-radius)
			);
			background: var(
				--date-time-picker-text-field-format-background,
				var(--date-time-picker-text-field-default-format-background)
			);
			color: var(
				--date-time-picker-text-field-format-color,
				var(--date-time-picker-text-field-default-format-color)
			);
			font-family: var(--global-font-family-mono);
			font-size: var(
				--date-time-picker-text-field-format-font-size,
				var(--date-time-picker-text-field-default-format-font-size)
			);
			line-height: 1.4;
			white-space: nowrap;
		}

		.aurora-date-time-picker-text-field-control :global(.aurora-date-time-picker-text-field-state-icon) {
			color: var(--_border);
		}

		.aurora-date-time-picker-text-field-hint {
			color: var(--_hint);
			font-size: var(
				--date-time-picker-text-field-hint-font-size,
				var(--date-time-picker-text-field-default-hint-font-size)
			);
		}

		.aurora-date-time-picker-text-field[data-disabled] .aurora-date-time-picker-text-field-control {
			background: var(
				--date-time-picker-text-field-disabled-background,
				var(--date-time-picker-text-field-default-disabled-background)
			);
			opacity: var(
				--date-time-picker-text-field-disabled-opacity,
				var(--date-time-picker-text-field-default-disabled-opacity)
			);
			cursor: not-allowed;
		}

		.aurora-date-time-picker-text-field[data-disabled] input {
			cursor: not-allowed;
		}

		.aurora-date-time-picker-text-field-panel {
			display: flex;
			gap: var(
				--date-time-picker-text-field-panel-gap,
				var(--date-time-picker-text-field-default-panel-gap)
			);
			padding: var(
				--date-time-picker-text-field-panel-padding,
				var(--date-time-picker-text-field-default-panel-padding)
			);
		}

		.aurora-date-time-picker-text-field-panel[data-layout='stacked'] {
			flex-direction: column;
			align-items: center;
		}

		.aurora-date-time-picker-text-field-panel :global(.aurora-date-time-picker-text-field-date) {
			--date-picker-default-border-width: 0px;
			--date-picker-default-box-shadow: 0 0 #0000;
			--date-picker-default-background: transparent;
			--date-picker-default-padding: 4px;
		}

		.aurora-date-time-picker-text-field-panel :global(.aurora-date-time-picker-text-field-time) {
			--time-picker-default-border-width: 0px;
			--time-picker-default-box-shadow: 0 0 #0000;
			--time-picker-default-background: transparent;
			--time-picker-default-padding: 0px;
			--time-picker-default-border-radius: 0px;
			--time-picker-default-column-height: 276px;
			border-inline-start: var(--global-border-width) solid
				var(
					--date-time-picker-text-field-divider-color,
					var(--date-time-picker-text-field-default-divider-color)
				);
			padding-inline-start: var(
				--date-time-picker-text-field-panel-gap,
				var(--date-time-picker-text-field-default-panel-gap)
			);
		}

		.aurora-date-time-picker-text-field-panel[data-layout='stacked']
			:global(.aurora-date-time-picker-text-field-time) {
			--time-picker-default-column-height: min(200px, 30dvh);
			align-self: stretch;
			border-inline-start: 0;
			border-block-start: var(--global-border-width) solid
				var(
					--date-time-picker-text-field-divider-color,
					var(--date-time-picker-text-field-default-divider-color)
				);
			padding-inline-start: 0;
			padding-block-start: var(
				--date-time-picker-text-field-panel-gap,
				var(--date-time-picker-text-field-default-panel-gap)
			);
		}

		:global(.aurora-date-time-picker-text-field-drawer) :global(.aurora-date-time-picker-text-field-date) {
			--date-picker-default-width: min(100%, 360px);
			--date-picker-default-padding: 0px;
			--calendar-default-day-height: 40px;
		}

		:global(.aurora-date-time-picker-text-field-drawer) :global(.aurora-date-time-picker-text-field-time) {
			--time-picker-default-column-width: 72px;
			--time-picker-default-option-padding: 9px 0;
			--time-picker-default-option-font-size: 16px;
		}

		:global(.aurora-date-time-picker-text-field-drawer) :global(.aurora-date-time-picker-text-field-panel) {
			justify-self: stretch;
			padding: 0;
		}

		:global(.aurora-date-time-picker-text-field-drawer) {
			--drawer-default-size: auto;
		}

		:global(.aurora-drawer-body.aurora-date-time-picker-text-field-drawer-body) {
			display: grid;
			justify-items: center;
		}
	}
</style>
