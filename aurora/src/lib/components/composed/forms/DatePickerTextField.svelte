<!-- @component
Date field: type the date or choose it in a calendar. The value is `selectedDate`, a `Date` at local midnight; with `range` the field has a start and an end input and `selectedDateTo` holds the end. The format comes from `locale` (`en` is MM/dd/yyyy, `it` dd/MM/yyyy) or from `format`, and it is shown as a chip at the end of the field. Typing accepts digits only and adds the separators; a whole date that does not exist, is outside `min` and `max` or is disabled by `isDateDisabled` (and an unfinished one when the field loses focus) turns the field to the error state with `invalidText`, and the form refuses to submit it. On desktop, focusing or clicking the field opens a `DatePicker` in a menu; Arrow Down moves the focus into it, Escape closes it and Tab leaves it. On screens up to 1024px wide the calendar button opens it in a bottom drawer instead, and the field stays typable with the numeric keyboard (`mobileDrawer`). Choosing a day closes the calendar (`closeOnSelect`). With `name` (and `nameTo`) the value is submitted as `yyyy-MM-dd`. Its state is exposed as `data-state`, `data-disabled`, `data-readonly`, `data-open` and `data-range` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './DatePickerTextField.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { MediaQuery } from 'svelte/reactivity';
	import Menu from '../../simple/common/Menu.svelte';
	import type { CalendarDay } from '../../simple/dates/Calendar.svelte';
	import DatePicker from '../../simple/dates/DatePicker.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';
	import {
		dayKey,
		formatDate,
		formatOf,
		maskInput,
		outOfBounds,
		parseDate,
		parseISODate,
		sameDay,
		toISODate
	} from '../../../utils/dates.js';

	const CALENDAR_ICON =
		'M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.9 20.11 3 19 3M19 19H5V9H19V19M19 7H5V5H19V7Z';
	const CLEAR_ICON =
		'M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z';
	const ARROW_ICON = 'M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z';
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
		/** The date, at local midnight; with `range`, the start of the range. `undefined` while the field is empty or its text is not a valid date. */
		selectedDate?: Date;
		/** With `range`, the end of the range. */
		selectedDateTo?: Date;
		/** Chooses a range: the field has a start and an end input, and the calendar picks the start with the first click and the end with the second. */
		range?: boolean;
		/** Whether the calendar is open. `undefined` counts as closed. */
		open?: boolean;
		/** BCP 47 locale of the format, of the names in the calendar and of the first day of the week. */
		locale?: string;
		/** Format of the typed date, with the tokens `dd`, `MM` and `yyyy` and any separator (`dd/MM/yyyy`, `yyyy-MM-dd`, `dd.MM.yyyy`). Defaults to the one of `locale`. */
		format?: string;
		/** First day of the week in the calendar, from 0 (Sunday) to 6 (Saturday). Defaults to the one of `locale`. */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Length of the names of the days of the week in the calendar. */
		weekdayFormat?: 'narrow' | 'short' | 'long';
		/** Shows in the calendar the days of the previous and next month that complete the first and last week. */
		showOutsideDays?: boolean;
		/** Earliest date that can be chosen or typed. It also limits the months and years of the calendar. */
		min?: Date;
		/** Latest date that can be chosen or typed. */
		max?: Date;
		/** Returns `true` for the days that cannot be chosen or typed (weekends, holidays, ...). */
		isDateDisabled?: (date: Date) => boolean;
		/** Visible label above the field, linked to the input. In the mobile drawer it is the title. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. Without it the field still shows the error state for an invalid date. */
		state?: 'error' | 'success';
		/** Message shown below the field, and given to the form, when the typed date is not valid. */
		invalidText?: string;
		/** Placeholder of the (start) input. Without it the format chip tells what to type. */
		placeholder?: string;
		/** With `range`, placeholder of the end input. */
		placeholderTo?: string;
		/** Native `disabled`: the field and the calendar cannot be used. */
		disabled?: boolean;
		/** Native `readonly`: the date is shown and can be selected, but not changed. */
		readonly?: boolean;
		/** Native `required` on the inputs. */
		required?: boolean;
		/** `id` of the (start) input. Generated when missing, so the label always points to it. */
		id?: string;
		/** Name of a hidden input that submits the date as `yyyy-MM-dd` (empty when there is no date). */
		name?: string;
		/** With `range`, name of the hidden input with the end date. */
		nameTo?: string;
		/** Shows a button that empties the field. */
		clearable?: boolean;
		/** Accessible name of the clear button. */
		clearLabel?: string;
		/** Closes the calendar when a day is chosen (with `range`, when the end is chosen). */
		closeOnSelect?: boolean;
		/** Side of the field where the calendar menu opens. It flips when there is not enough space. */
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
		/** On screens up to 1024px wide, opens the calendar in a bottom drawer from the calendar button instead of a menu, and focusing the field does not open it. */
		mobileDrawer?: boolean;
		/** Title of the mobile drawer. Defaults to `label`. */
		drawerTitle?: string;
		/** Accessible name of the close button of the mobile drawer. */
		closeLabel?: string;
		/** Accessible name of the calendar button, and of the calendar when there is no `label`. */
		openLabel?: string;
		/** With `range`, accessible name of the start input, after the label. */
		startLabel?: string;
		/** With `range`, accessible name of the end input, after the label. */
		endLabel?: string;
		/** Shows the format as a chip at the end of the field, also read by screen readers. */
		showFormat?: boolean;
		/** Text of the format chip. Defaults to the format in lowercase (`dd/mm/yyyy`). */
		formatLabel?: string;
		/** The (start) input element. */
		input?: HTMLInputElement;
		/** With `range`, the end input element. */
		inputTo?: HTMLInputElement;
		/** Extra classes for each part. `picker` goes on the `DatePicker`. */
		class?: {
			container?: string;
			label?: string;
			row?: string;
			field?: string;
			input?: string;
			hint?: string;
			picker?: string;
		};
		/** Replaces the label content. It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the icon shown for the validation state. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the calendar icon. The button around it keeps opening the calendar. */
		iconSnippet?: Snippet;
		/** Content outside the field, on the left. */
		prependSnippet?: Snippet;
		/** Content inside the field, before the clear button and the format chip. */
		appendInnerSnippet?: Snippet;
		/** Content outside the field, on the right. */
		appendSnippet?: Snippet;
		/** Replaces the icon of the clear button. */
		clearSnippet?: Snippet;
		/** Replaces the content of the format chip. */
		formatSnippet?: Snippet<[{ format: string }]>;
		/** Replaces the number of a day in the calendar (see `Calendar`). */
		daySnippet?: Snippet<[CalendarDay]>;
		/** Content after the number of a day in the calendar (see `Calendar`). */
		dayAppendSnippet?: Snippet<[CalendarDay]>;
		/** Called when the user changes the date: in the calendar, by typing a whole valid date (or making it invalid again) and with the clear button. */
		onchange?: (event: { selectedDate: Date | undefined; selectedDateTo: Date | undefined }) => void;
	}

	let {
		selectedDate = $bindable(),
		selectedDateTo = $bindable(),
		range = false,
		open = $bindable(),
		locale = 'en',
		format,
		weekStart,
		weekdayFormat = 'short',
		showOutsideDays = true,
		min,
		max,
		isDateDisabled,
		label,
		hint,
		state: validationState,
		invalidText = 'Enter a valid date',
		placeholder,
		placeholderTo,
		disabled = false,
		readonly = false,
		required = false,
		id,
		name,
		nameTo,
		clearable = false,
		clearLabel = 'Clear',
		closeOnSelect = true,
		placement = 'bottom-start',
		mobileDrawer = true,
		drawerTitle,
		closeLabel = 'Close',
		openLabel = 'Choose date',
		startLabel = 'Start date',
		endLabel = 'End date',
		showFormat = true,
		formatLabel,
		input = $bindable(),
		inputTo = $bindable(),
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
		onchange,
		oninput,
		onfocus,
		onblur,
		onclick,
		onkeydown,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;
	const formatId = `${uid}-format`;
	const startId = `${uid}-start`;
	const endId = `${uid}-end`;
	const pickerId = `${uid}-picker`;
	const mobile = new MediaQuery('max-width: 1024px', false);

	let inputId = $derived(id ?? `${uid}-input`);
	let drawerMode = $derived(mobileDrawer && mobile.current);
	let pattern = $derived(format ?? formatOf(locale));
	let length = $derived(formatDate(new Date(2000, 0, 1), pattern).length);
	let chip = $derived(formatLabel ?? pattern.toLowerCase());

	let anchor = $state<HTMLDivElement>();
	let inputNode = $state<HTMLInputElement>();
	let inputToNode = $state<HTMLInputElement>();
	let menuNode = $state<HTMLDivElement>();
	let picker = $state<ReturnType<typeof DatePicker>>();
	let editing = $state<'from' | 'to'>();
	let origin: 'from' | 'to' = 'from';
	let silent = false;

	let textFrom = $state(untrack(() => (selectedDate ? formatDate(selectedDate, pattern) : '')));
	let textTo = $state(untrack(() => (selectedDateTo ? formatDate(selectedDateTo, pattern) : '')));
	let shownFrom = untrack(() => selectedDate);
	let shownTo = untrack(() => selectedDateTo);
	let shownPattern = untrack(() => pattern);

	$effect(() => {
		const from = selectedDate;
		const to = selectedDateTo;
		const current = pattern;
		untrack(() => {
			const reformat = current !== shownPattern;
			shownPattern = current;
			if (!sameDay(from, shownFrom) || (reformat && from)) {
				shownFrom = from;
				textFrom = from ? formatDate(from, current) : '';
			}
			if (!sameDay(to, shownTo) || (reformat && to)) {
				shownTo = to;
				textTo = to ? formatDate(to, current) : '';
			}
		});
	});

	let invalidFrom = $derived(isInvalid(textFrom, selectedDate, editing === 'from'));
	let invalidTo = $derived(range && isInvalid(textTo, selectedDateTo, editing === 'to'));
	let invalid = $derived(invalidFrom || invalidTo);
	let validation = $derived(validationState ?? (invalid ? 'error' : undefined));
	let hintText = $derived(invalid && !validationState ? invalidText : hint);
	let hasHint = $derived(!!hintText || !!hintSnippet);
	let describedBy = $derived(
		[rest['aria-describedby'], hasHint && hintId, showFormat && formatId].filter(Boolean).join(' ') ||
			undefined
	);
	let filled = $derived(!!(textFrom || textTo || selectedDate || selectedDateTo));

	$effect(() => {
		inputNode?.setCustomValidity(invalidFrom ? invalidText : '');
	});

	$effect(() => {
		inputToNode?.setCustomValidity(invalidTo ? invalidText : '');
	});

	$effect(() => {
		if (open) menuNode?.removeAttribute('inert');
	});

	$effect(() => {
		if (!open || !drawerMode) return;
		tick().then(() => picker?.focus());
	});

	function isInvalid(text: string, value: Date | undefined, focused: boolean) {
		if (!text) return false;
		if (value && formatDate(value, pattern) === text) return false;
		return text.length >= length || !focused;
	}

	function accept(date: Date | undefined, which: 'from' | 'to') {
		if (!date || outOfBounds(date, min, max, isDateDisabled)) return undefined;
		if (range && which === 'to' && selectedDate && dayKey(date) < dayKey(selectedDate))
			return undefined;
		if (range && which === 'from' && selectedDateTo && dayKey(date) > dayKey(selectedDateTo))
			return undefined;
		return date;
	}

	function handleInput(node: HTMLInputElement, which: 'from' | 'to') {
		const raw = node.value;
		const pasted = pattern !== 'yyyy-MM-dd' && /^\s*\d{4}-\d{2}-\d{2}/.test(raw);
		const iso = pasted ? parseISODate(raw) : undefined;
		const masked = iso
			? { text: formatDate(iso, pattern), caret: -1 }
			: maskInput(raw, pattern, node.selectionStart ?? raw.length);
		const text = masked.text;
		if (text !== raw) {
			node.value = text;
			const position = masked.caret < 0 ? text.length : masked.caret;
			node.setSelectionRange(position, position);
		}
		const date = accept(parseDate(text, pattern), which);
		if (which === 'from') {
			textFrom = text;
			if (sameDay(date, selectedDate)) return;
			shownFrom = date;
			selectedDate = date;
		} else {
			textTo = text;
			if (sameDay(date, selectedDateTo)) return;
			shownTo = date;
			selectedDateTo = date;
		}
		onchange?.({ selectedDate, selectedDateTo });
	}

	function openPicker() {
		if (disabled || readonly || open) return;
		open = true;
	}

	function close(returnFocus?: 'from' | 'to') {
		menuNode?.setAttribute('inert', '');
		open = false;
		if (returnFocus && !drawerMode) focusField(returnFocus);
	}

	function focusField(which: 'from' | 'to' = editing ?? 'from') {
		silent = true;
		(which === 'to' ? inputToNode : inputNode)?.focus();
		silent = false;
	}

	async function focusPicker() {
		if (disabled || readonly) return;
		open = true;
		await tick();
		picker?.focus();
	}

	function clear() {
		const changed = !!(selectedDate || selectedDateTo);
		textFrom = '';
		textTo = '';
		shownFrom = undefined;
		shownTo = undefined;
		selectedDate = undefined;
		selectedDateTo = undefined;
		if (changed) onchange?.({ selectedDate, selectedDateTo });
		focusField('from');
	}

	function pickerChange(event: { selectedDate: Date | undefined; selectedDateTo: Date | undefined }) {
		onchange?.(event);
		if (closeOnSelect && (!range || event.selectedDateTo)) close(range ? 'to' : 'from');
	}

	function focusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (anchor?.contains(next) || menuNode?.contains(next)) return;
		if (open && next && !drawerMode) close();
	}

	function inputKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			focusPicker();
		} else if (event.key === 'Enter' && open) {
			event.preventDefault();
			close();
		} else if (event.key === 'Tab' && open && !drawerMode) {
			close();
		}
	}
</script>

{#snippet field(which: 'from' | 'to')}
	{@const from = which === 'from'}
	<input
		inputmode="numeric"
		autocomplete="off"
		{...from ? rest : {}}
		bind:this={
			() => (from ? inputNode : inputToNode),
			(node) => {
				if (from) inputNode = input = node;
				else inputToNode = inputTo = node;
			}
		}
		id={from ? inputId : `${inputId}-to`}
		type="text"
		role="combobox"
		aria-haspopup="dialog"
		aria-expanded={!!open}
		aria-controls={open ? pickerId : undefined}
		aria-labelledby={range ? [label || labelSnippet ? labelId : '', from ? startId : endId].filter(Boolean).join(' ') : from ? rest['aria-labelledby'] : undefined}
		aria-invalid={(from ? invalidFrom : invalidTo) ||
			(validationState === 'error' && !invalid) ||
			(from && rest['aria-invalid']) ||
			undefined}
		aria-describedby={describedBy}
		value={from ? textFrom : textTo}
		placeholder={from ? placeholder : placeholderTo}
		{disabled}
		{readonly}
		{required}
		class={clazz.input}
		oninput={(event) => {
			if (from) oninput?.(event);
			handleInput(event.currentTarget, which);
		}}
		onfocus={(event) => {
			if (from) onfocus?.(event);
			editing = which;
			origin = which;
			if (!silent && !drawerMode) openPicker();
		}}
		onblur={(event) => {
			if (from) onblur?.(event);
			if (editing === which) editing = undefined;
		}}
		onclick={(event) => {
			if (from) onclick?.(event);
			if (!drawerMode) openPicker();
		}}
		onkeydown={inputKeydown}
	/>
{/snippet}

{#snippet pickerPanel()}
	<DatePicker
		bind:this={picker}
		bind:selectedDate
		bind:selectedDateTo
		{range}
		{locale}
		{weekStart}
		{weekdayFormat}
		{showOutsideDays}
		{min}
		{max}
		{isDateDisabled}
		{daySnippet}
		{dayAppendSnippet}
		id={pickerId}
		role={drawerMode ? undefined : 'dialog'}
		aria-label={drawerMode ? undefined : (label ?? openLabel)}
		class={{
			container: ['aurora-date-picker-text-field-picker', clazz.picker].filter(Boolean).join(' ')
		}}
		onchange={pickerChange}
		onfocusout={focusOut}
		onmousedown={(event) => {
			if (!drawerMode) event.preventDefault();
		}}
		onkeydown={(event) => {
			if (event.key !== 'Escape' || event.defaultPrevented || drawerMode) return;
			event.preventDefault();
			close(origin);
		}}
	/>
{/snippet}

<div
	class={['aurora-date-picker-text-field', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-open={open || undefined}
	data-range={range || undefined}
	onfocusout={focusOut}
>
	{#if labelSnippet || label}
		<label id={labelId} class={['aurora-date-picker-text-field-label', clazz.label]} for={inputId}>
			{#if labelSnippet}
				{@render labelSnippet({ label })}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
	<div class={['aurora-date-picker-text-field-row', clazz.row]}>
		{@render prependSnippet?.()}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class={['aurora-date-picker-text-field-control', clazz.field]}
			bind:this={anchor}
			style:--aurora-date-chars={Math.max(length, placeholder?.length ?? 0, placeholderTo?.length ?? 0)}
			onmousedown={(event) => {
				if ((event.target as Element).closest('input, button')) return;
				event.preventDefault();
				if (document.activeElement !== inputNode && document.activeElement !== inputToNode)
					(editing === 'to' ? inputToNode : inputNode)?.focus();
				else if (!drawerMode) openPicker();
			}}
		>
			<button
				type="button"
				class="aurora-date-picker-text-field-toggle"
				tabindex="-1"
				aria-label={openLabel}
				aria-haspopup="dialog"
				aria-expanded={!!open}
				aria-controls={open ? pickerId : undefined}
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
					<Icon path={CALENDAR_ICON} />
				{/if}
			</button>
			{@render field('from')}
			{#if range}
				<Icon path={ARROW_ICON} class="aurora-date-picker-text-field-separator" />
				{@render field('to')}
				<span hidden id={startId}>{startLabel}</span>
				<span hidden id={endId}>{endLabel}</span>
			{/if}
			<span class="aurora-date-picker-text-field-end">
				{@render appendInnerSnippet?.()}
				{#if clearable && filled && !disabled && !readonly}
					<button
						type="button"
						class="aurora-date-picker-text-field-clear"
						aria-label={clearLabel}
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
				{#if showFormat}
					<kbd class="aurora-date-picker-text-field-format" aria-hidden="true">
						{#if formatSnippet}
							{@render formatSnippet({ format: pattern })}
						{:else}
							{chip}
						{/if}
					</kbd>
					<span hidden id={formatId}>{chip}</span>
				{/if}
				{#if validation && stateIconSnippet}
					{@render stateIconSnippet({ state: validation })}
				{:else if validation}
					<Icon
						path={validation === 'error' ? ALERT_ICON : SUCCESS_ICON}
						class="aurora-date-picker-text-field-state-icon"
					/>
				{/if}
			</span>
		</div>
		{@render appendSnippet?.()}
	</div>
	{#if hintSnippet}
		<div class={['aurora-date-picker-text-field-hint', clazz.hint]} id={hintId}>
			{@render hintSnippet({ hint: hintText })}
		</div>
	{:else if hintText}
		<div class={['aurora-date-picker-text-field-hint', clazz.hint]} id={hintId}>{hintText}</div>
	{/if}
	{#if name}
		<input type="hidden" {name} value={selectedDate ? toISODate(selectedDate) : ''} />
	{/if}
	{#if range && nameTo}
		<input type="hidden" name={nameTo} value={selectedDateTo ? toISODate(selectedDateTo) : ''} />
	{/if}
</div>

{#if drawerMode}
	<Drawer
		bind:open
		position="bottom"
		title={drawerTitle ?? label}
		aria-label={(drawerTitle ?? label) ? undefined : openLabel}
		closable
		{closeLabel}
		class={{
			drawer: 'aurora-date-picker-text-field-drawer',
			body: 'aurora-date-picker-text-field-drawer-body'
		}}
	>
		{@render pickerPanel()}
	</Drawer>
{:else}
	<Menu
		bind:open
		bind:menuElement={menuNode}
		activator={anchor}
		{placement}
		class="aurora-date-picker-text-field-menu"
	>
		{@render pickerPanel()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-date-picker-text-field {
			--_border: var(
				--date-picker-text-field-border-color,
				var(--date-picker-text-field-default-border-color)
			);
			--_hover-border: var(
				--date-picker-text-field-hover-border-color,
				var(--date-picker-text-field-default-hover-border-color)
			);
			--_focus-border: var(
				--date-picker-text-field-focus-border-color,
				var(--date-picker-text-field-default-focus-border-color)
			);
			--_ring: var(
				--date-picker-text-field-focus-ring-color,
				var(--date-picker-text-field-default-focus-ring-color)
			);
			--_hint: var(
				--date-picker-text-field-hint-color,
				var(--date-picker-text-field-default-hint-color)
			);
			--icon-size: var(
				--date-picker-text-field-icon-size,
				var(--date-picker-text-field-default-icon-size)
			);

			display: flex;
			flex-direction: column;
			gap: var(--date-picker-text-field-gap, var(--date-picker-text-field-default-gap));
			box-sizing: border-box;
			width: var(--date-picker-text-field-width, var(--date-picker-text-field-default-width));
			max-width: var(
				--date-picker-text-field-max-width,
				var(--date-picker-text-field-default-max-width)
			);
			min-width: 0;
		}

		.aurora-date-picker-text-field[data-state='error'] {
			--_border: var(
				--date-picker-text-field-error-color,
				var(--date-picker-text-field-default-error-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-date-picker-text-field[data-state='success'] {
			--_border: var(
				--date-picker-text-field-success-color,
				var(--date-picker-text-field-default-success-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-date-picker-text-field-label {
			color: var(
				--date-picker-text-field-label-color,
				var(--date-picker-text-field-default-label-color)
			);
			font-size: var(
				--date-picker-text-field-label-font-size,
				var(--date-picker-text-field-default-label-font-size)
			);
			font-weight: var(
				--date-picker-text-field-label-font-weight,
				var(--date-picker-text-field-default-label-font-weight)
			);
		}

		.aurora-date-picker-text-field-row {
			display: flex;
			align-items: center;
			gap: var(
				--date-picker-text-field-outer-gap,
				var(--date-picker-text-field-default-outer-gap)
			);
			color: var(
				--date-picker-text-field-icon-color,
				var(--date-picker-text-field-default-icon-color)
			);
		}

		.aurora-date-picker-text-field-control {
			flex: 1;
			min-width: 0;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(
				--date-picker-text-field-inner-gap,
				var(--date-picker-text-field-default-inner-gap)
			);
			height: var(--date-picker-text-field-height, var(--date-picker-text-field-default-height));
			padding: var(
				--date-picker-text-field-padding,
				var(--date-picker-text-field-default-padding)
			);
			background: var(
				--date-picker-text-field-background,
				var(--date-picker-text-field-default-background)
			);
			border: var(
					--date-picker-text-field-border-width,
					var(--date-picker-text-field-default-border-width)
				)
				solid var(--_border);
			border-radius: var(
				--date-picker-text-field-border-radius,
				var(--date-picker-text-field-default-border-radius)
			);
			box-shadow: var(
				--date-picker-text-field-box-shadow,
				var(--date-picker-text-field-default-box-shadow)
			);
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-date-picker-text-field:not([data-disabled])
				.aurora-date-picker-text-field-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-date-picker-text-field-control:focus-within,
		.aurora-date-picker-text-field[data-open] .aurora-date-picker-text-field-control {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
				var(
					--date-picker-text-field-focus-ring-width,
					var(--date-picker-text-field-default-focus-ring-width)
				)
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-date-picker-text-field-toggle,
		.aurora-date-picker-text-field-clear {
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

		.aurora-date-picker-text-field-toggle:disabled {
			cursor: inherit;
		}

		.aurora-date-picker-text-field-control:focus-within .aurora-date-picker-text-field-toggle,
		.aurora-date-picker-text-field[data-open] .aurora-date-picker-text-field-toggle {
			color: var(--_focus-border);
		}

		.aurora-date-picker-text-field-clear:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 1px;
		}

		input {
			flex: 1;
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--date-picker-text-field-color, var(--date-picker-text-field-default-color));
			font-family: var(
				--date-picker-text-field-font-family,
				var(--date-picker-text-field-default-font-family)
			);
			font-size: var(
				--date-picker-text-field-font-size,
				var(--date-picker-text-field-default-font-size)
			);
			font-weight: var(
				--date-picker-text-field-font-weight,
				var(--date-picker-text-field-default-font-weight)
			);
			font-variant-numeric: tabular-nums;
		}

		.aurora-date-picker-text-field[data-range] input {
			flex: 0 1 auto;
			width: calc(var(--aurora-date-chars) * 1ch + 2px);
		}

		input::placeholder {
			color: var(
				--date-picker-text-field-placeholder-color,
				var(--date-picker-text-field-default-placeholder-color)
			);
			opacity: 1;
		}

		.aurora-date-picker-text-field-control :global(.aurora-date-picker-text-field-separator) {
			--icon-size: 16px;
			flex: none;
			color: var(
				--date-picker-text-field-separator-color,
				var(--date-picker-text-field-default-separator-color)
			);
		}

		.aurora-date-picker-text-field-control:dir(rtl) :global(.aurora-date-picker-text-field-separator) {
			scale: -1 1;
		}

		.aurora-date-picker-text-field-end {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(
				--date-picker-text-field-inner-gap,
				var(--date-picker-text-field-default-inner-gap)
			);
			margin-inline-start: auto;
		}

		.aurora-date-picker-text-field-end:empty {
			display: none;
		}

		.aurora-date-picker-text-field-format {
			padding: var(
				--date-picker-text-field-format-padding,
				var(--date-picker-text-field-default-format-padding)
			);
			border: var(--global-border-width) solid
				var(
					--date-picker-text-field-format-border-color,
					var(--date-picker-text-field-default-format-border-color)
				);
			border-radius: var(
				--date-picker-text-field-format-border-radius,
				var(--date-picker-text-field-default-format-border-radius)
			);
			background: var(
				--date-picker-text-field-format-background,
				var(--date-picker-text-field-default-format-background)
			);
			color: var(
				--date-picker-text-field-format-color,
				var(--date-picker-text-field-default-format-color)
			);
			font-family: var(--global-font-family-mono);
			font-size: var(
				--date-picker-text-field-format-font-size,
				var(--date-picker-text-field-default-format-font-size)
			);
			line-height: 1.4;
			white-space: nowrap;
		}

		.aurora-date-picker-text-field-control :global(.aurora-date-picker-text-field-state-icon) {
			color: var(--_border);
		}

		.aurora-date-picker-text-field-hint {
			color: var(--_hint);
			font-size: var(
				--date-picker-text-field-hint-font-size,
				var(--date-picker-text-field-default-hint-font-size)
			);
		}

		.aurora-date-picker-text-field[data-disabled] .aurora-date-picker-text-field-control {
			background: var(
				--date-picker-text-field-disabled-background,
				var(--date-picker-text-field-default-disabled-background)
			);
			opacity: var(
				--date-picker-text-field-disabled-opacity,
				var(--date-picker-text-field-default-disabled-opacity)
			);
			cursor: not-allowed;
		}

		.aurora-date-picker-text-field[data-disabled] input {
			cursor: not-allowed;
		}

		:global(.aurora-date-picker-text-field-picker) {
			--date-picker-default-border-width: 0px;
			--date-picker-default-box-shadow: 0 0 #0000;
			--date-picker-default-background: transparent;
			--date-picker-default-padding: 8px;
		}

		:global(.aurora-date-picker-text-field-drawer) {
			--drawer-default-size: auto;
		}

		:global(.aurora-drawer-body.aurora-date-picker-text-field-drawer-body) {
			display: grid;
			justify-items: center;
		}

		:global(.aurora-date-picker-text-field-drawer) :global(.aurora-date-picker-text-field-picker) {
			--date-picker-default-width: min(100%, 360px);
			--date-picker-default-padding: 0px;
			--calendar-default-day-height: 40px;
		}
	}
</style>
