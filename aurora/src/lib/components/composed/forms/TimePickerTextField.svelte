<!-- @component
Time field: type the time or choose it in a panel of hours and minutes. The value is `value`, a 24-hour `HH:mm` string, also on a 12-hour clock. The clock comes from `locale` (`en` is 12-hour with AM/PM, `it` 24-hour) or from `hour12`, and the format is shown as a chip after the text, which hides itself when the field is too narrow for both. Typing accepts digits only and adds the colon; on a 12-hour clock A and P set AM and PM, and a whole 24-hour time (`14:30`) turns into `02:30 PM`. A time that does not exist or is outside `min` and `max` (and an unfinished one when the field loses focus) turns the field to the error state with `invalidText`, and the form refuses to submit it. On desktop, focusing or clicking the field opens a `TimePicker` in a menu; Arrow Down moves the focus into it, Escape closes it and Tab leaves it. On screens up to 1024px wide the clock button opens it in a bottom drawer instead, and the field stays typable (`mobileDrawer`). Choosing the minutes (or AM/PM on a 12-hour clock) closes the panel (`closeOnSelect`). With `name` the value is submitted as `HH:mm`. Its state is exposed as `data-state`, `data-disabled`, `data-readonly`, `data-open` and `data-hour-cycle` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';
	import './TimePickerTextField.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Menu from '../../simple/common/Menu.svelte';
	import TimePicker from '../../simple/dates/TimePicker.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';
	import {
		formatTimeText,
		hour12Of,
		inTimeRange,
		maskTime,
		parseTime,
		parseTimeText,
		periodNames,
		timeKey
	} from '../../../utils/time.js';
	import { inheritedLocale, warnWithoutLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const CLOCK_ICON =
		'M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z';
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
		/** The time, as a 24-hour `HH:mm` string (`HH:mm:ss` is read too). `undefined` while the field is empty or its text is not a valid time. */
		value?: string;
		/** Whether the panel is open. `undefined` counts as closed. */
		open?: boolean;
		/** BCP 47 locale: decides between the 12-hour clock (`en`) and the 24-hour clock (`it`), gives the names of AM and PM and the language of the texts (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Forces the 12-hour clock (`true`) or the 24-hour clock (`false`) instead of the one of `locale`. The value stays 24-hour. */
		hour12?: boolean;
		/** Minutes between two options of the minutes column. Typed minutes can be any. */
		minuteStep?: number;
		/** Earliest time that can be chosen or typed, as `HH:mm`. */
		min?: string;
		/** Latest time that can be chosen or typed, as `HH:mm`. When it is earlier than `min` the range crosses midnight. */
		max?: string;
		/** Visible label above the field, linked to the input. In the mobile drawer it is the title. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. Without it the field still shows the error state for an invalid time. */
		state?: 'error' | 'success';
		/** Message shown below the field, and given to the form, when the typed time is not valid. Defaults to "Enter a valid time", in the language of `locale`. */
		invalidText?: string;
		/** Placeholder of the input. Without it the format chip tells what to type. */
		placeholder?: string;
		/** Native `disabled`: the field and the panel cannot be used. */
		disabled?: boolean;
		/** Native `readonly`: the time is shown and can be selected, but not changed. */
		readonly?: boolean;
		/** Native `required` on the input. */
		required?: boolean;
		/** `id` of the input. Generated when missing, so the label always points to it. */
		id?: string;
		/** Name of a hidden input that submits the time as `HH:mm` (empty when there is no time). */
		name?: string;
		/** Shows a button that empties the field. */
		clearable?: boolean;
		/** Accessible name of the clear button. Defaults to "Clear", in the language of `locale`. */
		clearLabel?: string;
		/** Closes the panel when the minutes are chosen (on a 12-hour clock, the minutes or AM/PM) and the time is whole. */
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
		/** On screens up to 1024px wide, opens the panel in a bottom drawer from the clock button instead of a menu, and focusing the field does not open it. */
		mobileDrawer?: boolean;
		/** Title of the mobile drawer. Defaults to `label`. */
		drawerTitle?: string;
		/** Accessible name of the close button of the mobile drawer. Defaults to "Close", in the language of `locale`. */
		closeLabel?: string;
		/** Accessible name of the clock button, and of the panel when there is no `label`. Defaults to "Choose time", in the language of `locale`. */
		openLabel?: string;
		/** Shows the format as a chip after the text, also read by screen readers. The chip hides itself while the field is too narrow for the whole text and the chip. */
		showFormat?: boolean;
		/** Text of the format chip. Defaults to `hh:mm`, or `hh:mm am` on a 12-hour clock. */
		formatLabel?: string;
		/** Accessible name of the hours column of the panel. Defaults to "Hours", in the language of `locale`. */
		hoursLabel?: string;
		/** Accessible name of the minutes column of the panel. Defaults to "Minutes", in the language of `locale`. */
		minutesLabel?: string;
		/** Accessible name of the AM/PM column of the panel. Defaults to "AM/PM", in the language of `locale`. */
		periodLabel?: string;
		/** The input element. */
		input?: HTMLInputElement;
		/** Extra classes for each part. `picker` goes on the `TimePicker`. */
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
		/** Replaces the clock icon. The button around it keeps opening the panel. */
		iconSnippet?: Snippet;
		/** Content outside the field, on the left. */
		prependSnippet?: Snippet;
		/** Content inside the field, after the format chip and before the clear button. */
		appendInnerSnippet?: Snippet;
		/** Content outside the field, on the right. */
		appendSnippet?: Snippet;
		/** Replaces the icon of the clear button. */
		clearSnippet?: Snippet;
		/** Replaces the content of the format chip. */
		formatSnippet?: Snippet<[{ format: string }]>;
		/** Replaces the text of an option in the panel (see `TimePicker`). */
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
		/** Called when the user changes the time: in the panel, by typing a whole valid time (or making it invalid again) and with the clear button. */
		onchange?: (event: { value: string | undefined }) => void;
	}

	let {
		value = $bindable(),
		open = $bindable(),
		locale: localeProp,
		hour12,
		minuteStep = 5,
		min,
		max,
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
	warnWithoutLocale('TimePickerTextField', () => localeProp);
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).timePickerTextField);
	let invalidText = $derived(invalidTextProp ?? texts.invalid);
	let openLabel = $derived(openLabelProp ?? texts.open);

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;
	const formatId = `${uid}-format`;
	const pickerId = `${uid}-picker`;

	let inputId = $derived(id ?? `${uid}-input`);
	let drawerMode = $derived(mobileDrawer && breakpoints.mAndDown);
	let twelve = $derived(hour12 ?? hour12Of(locale));
	let periods = $derived(periodNames(locale));
	let length = $derived(twelve ? 6 + Math.min(periods[0].length, periods[1].length) : 5);
	let pattern = $derived(twelve ? `hh:mm ${periods[0].toLowerCase()}` : 'hh:mm');
	let chars = $derived(
		Math.max(twelve ? 6 + Math.max(periods[0].length, periods[1].length) : 5, placeholder?.length ?? 0)
	);
	let chip = $derived(formatLabel ?? pattern);
	let minKey = $derived(timeKey(min));
	let maxKey = $derived(timeKey(max));

	let anchor = $state<HTMLDivElement>();
	let inputNode = $state<HTMLInputElement>();
	let menuNode = $state<HTMLDivElement>();
	let picker = $state<ReturnType<typeof TimePicker>>();
	let editing = $state(false);
	let silent = false;

	let text = $state(untrack(() => formatTimeText(value, twelve, periods)));
	let shown = untrack(() => timeKey(value));
	let shownClock = untrack(() => `${twelve} ${periods.join(' ')}`);

	$effect(() => {
		const key = timeKey(value);
		const current = value;
		const clock = `${twelve} ${periods.join(' ')}`;
		untrack(() => {
			const reformat = clock !== shownClock;
			shownClock = clock;
			if (key !== shown || (reformat && key !== undefined)) {
				shown = key;
				text = formatTimeText(current, twelve, periods);
			}
		});
	});

	let invalid = $derived(isInvalid(text, value, editing));
	let validation = $derived(validationState ?? (invalid ? 'error' : undefined));
	let hintText = $derived(invalid && !validationState ? invalidText : hint);
	let hasHint = $derived(!!hintText || !!hintSnippet);
	let describedBy = $derived(
		[rest['aria-describedby'], hasHint && hintId, showFormat && formatId].filter(Boolean).join(' ') ||
			undefined
	);
	let hidden = $derived(parseTime(value) ? formatTimeText(value, false, periods) : '');

	$effect(() => {
		inputNode?.setCustomValidity(invalid ? invalidText : '');
	});

	$effect(() => {
		if (open) menuNode?.removeAttribute('inert');
	});

	$effect(() => {
		if (!open || !drawerMode) return;
		tick().then(() => picker?.focus());
	});

	function isInvalid(current: string, time: string | undefined, focused: boolean) {
		if (!current) return false;
		if (parseTime(time) && formatTimeText(time, twelve, periods) === current) return false;
		return current.length >= length || !focused;
	}

	function accept(current: string) {
		const time = parseTimeText(current, twelve, periods);
		const key = timeKey(time);
		return key !== undefined && inTimeRange(key, minKey, maxKey) ? time : undefined;
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const node = event.currentTarget;
		const raw = node.value;
		const type = event instanceof InputEvent ? event.inputType : '';
		const masked = maskTime(raw, twelve, periods, {
			caret: node.selectionStart ?? raw.length,
			deleting: type.startsWith('delete'),
			pasted: !type || type.startsWith('insertFrom') || type === 'insertReplacementText'
		});
		const next = masked.text;
		if (next !== raw) {
			node.value = next;
			const position = masked.caret < 0 ? next.length : masked.caret;
			node.setSelectionRange(position, position);
		}
		text = next;
		const time = accept(next);
		const key = timeKey(time);
		if (key === timeKey(value)) return;
		shown = key;
		value = time;
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

	async function focusPicker() {
		if (disabled || readonly) return;
		open = true;
		await tick();
		picker?.focus();
	}

	function clear() {
		const changed = timeKey(value) !== undefined;
		text = '';
		shown = undefined;
		value = undefined;
		if (changed) onchange?.({ value });
		focusField();
	}

	function pick(event: { value: string; column: 'hours' | 'minutes' | 'period' }) {
		const key = timeKey(event.value);
		shown = key;
		text = formatTimeText(event.value, twelve, periods);
		if (key !== timeKey(value)) {
			value = event.value;
			onchange?.({ value });
		}
		if (closeOnSelect && event.column !== 'hours') close(true);
	}

	function focusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (anchor?.contains(next) || menuNode?.contains(next)) return;
		if (open && next && !drawerMode) close();
	}
</script>

{#snippet panel()}
	<TimePicker
		bind:this={picker}
		{value}
		{locale}
		hour12={twelve}
		{minuteStep}
		{min}
		{max}
		{hoursLabel}
		{minutesLabel}
		{periodLabel}
		{optionSnippet}
		id={pickerId}
		role={drawerMode ? undefined : 'dialog'}
		aria-label={drawerMode ? undefined : (label ?? openLabel)}
		class={{
			container: ['aurora-time-picker-text-field-picker', clazz.picker].filter(Boolean).join(' ')
		}}
		onchange={pick}
		onfocusout={focusOut}
		onmousedown={(event) => {
			if (!drawerMode) event.preventDefault();
		}}
		onkeydown={(event) => {
			if (event.key !== 'Escape' || event.defaultPrevented || drawerMode) return;
			event.preventDefault();
			close(true);
		}}
	/>
{/snippet}

<div
	class={['aurora-time-picker-text-field', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-open={open || undefined}
	data-hour-cycle={twelve ? '12' : '24'}
	onfocusout={focusOut}
>
	{#if labelSnippet || label}
		<label id={labelId} class={['aurora-time-picker-text-field-label', clazz.label]} for={inputId}>
			{#if labelSnippet}
				{@render labelSnippet({ label })}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
	<div class={['aurora-time-picker-text-field-row', clazz.row]}>
		{@render prependSnippet?.()}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class={['aurora-time-picker-text-field-control', clazz.field]}
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
				class="aurora-time-picker-text-field-toggle"
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
					<Icon path={CLOCK_ICON} />
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
				aria-controls={open ? pickerId : undefined}
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
						focusPicker();
					} else if (event.key === 'Enter' && open) {
						event.preventDefault();
						close();
					} else if (event.key === 'Tab' && open && !drawerMode) close();
				}}
			/>
			{#if showFormat}
				<span class="aurora-time-picker-text-field-format-slot">
					<kbd class="aurora-time-picker-text-field-format" aria-hidden="true">
						{#if formatSnippet}
							{@render formatSnippet({ format: pattern })}
						{:else}
							{chip}
						{/if}
					</kbd>
					<span hidden id={formatId}>{chip}</span>
				</span>
			{/if}
			{#if appendInnerSnippet || (clearable && (text || value) && !disabled && !readonly) || validation}
				<span class="aurora-time-picker-text-field-end">
					{@render appendInnerSnippet?.()}
					{#if clearable && (text || value) && !disabled && !readonly}
						<button
							type="button"
							class="aurora-time-picker-text-field-clear"
							aria-label={clearLabel ?? texts.clear}
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
							class="aurora-time-picker-text-field-state-icon"
						/>
					{/if}
				</span>
			{/if}
		</div>
		{@render appendSnippet?.()}
	</div>
	{#if hintSnippet}
		<div class={['aurora-time-picker-text-field-hint', clazz.hint]} id={hintId}>
			{@render hintSnippet({ hint: hintText })}
		</div>
	{:else if hintText}
		<div class={['aurora-time-picker-text-field-hint', clazz.hint]} id={hintId}>{hintText}</div>
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
		closeLabel={closeLabel ?? texts.close}
		class={{
			drawer: 'aurora-time-picker-text-field-drawer',
			body: 'aurora-time-picker-text-field-drawer-body'
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
		class="aurora-time-picker-text-field-menu"
	>
		{@render panel()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-time-picker-text-field {
			--_border: var(
				--time-picker-text-field-border-color,
				var(--time-picker-text-field-default-border-color)
			);
			--_hover-border: var(
				--time-picker-text-field-hover-border-color,
				var(--time-picker-text-field-default-hover-border-color)
			);
			--_focus-border: var(
				--time-picker-text-field-focus-border-color,
				var(--time-picker-text-field-default-focus-border-color)
			);
			--_ring: var(
				--time-picker-text-field-focus-ring-color,
				var(--time-picker-text-field-default-focus-ring-color)
			);
			--_hint: var(
				--time-picker-text-field-hint-color,
				var(--time-picker-text-field-default-hint-color)
			);
			--icon-size: var(
				--time-picker-text-field-icon-size,
				var(--time-picker-text-field-default-icon-size)
			);

			display: flex;
			flex-direction: column;
			gap: var(--time-picker-text-field-gap, var(--time-picker-text-field-default-gap));
			box-sizing: border-box;
			width: var(--time-picker-text-field-width, var(--time-picker-text-field-default-width));
			max-width: var(
				--time-picker-text-field-max-width,
				var(--time-picker-text-field-default-max-width)
			);
			min-width: 0;
		}

		.aurora-time-picker-text-field[data-state='error'] {
			--_border: var(
				--time-picker-text-field-error-color,
				var(--time-picker-text-field-default-error-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-time-picker-text-field[data-state='success'] {
			--_border: var(
				--time-picker-text-field-success-color,
				var(--time-picker-text-field-default-success-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-time-picker-text-field-label {
			color: var(
				--time-picker-text-field-label-color,
				var(--time-picker-text-field-default-label-color)
			);
			font-size: var(
				--time-picker-text-field-label-font-size,
				var(--time-picker-text-field-default-label-font-size)
			);
			font-weight: var(
				--time-picker-text-field-label-font-weight,
				var(--time-picker-text-field-default-label-font-weight)
			);
		}

		.aurora-time-picker-text-field-row {
			display: flex;
			align-items: center;
			gap: var(
				--time-picker-text-field-outer-gap,
				var(--time-picker-text-field-default-outer-gap)
			);
			color: var(
				--time-picker-text-field-icon-color,
				var(--time-picker-text-field-default-icon-color)
			);
		}

		.aurora-time-picker-text-field-control {
			flex: 1;
			min-width: 0;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(
				--time-picker-text-field-inner-gap,
				var(--time-picker-text-field-default-inner-gap)
			);
			height: var(--time-picker-text-field-height, var(--time-picker-text-field-default-height));
			padding: var(
				--time-picker-text-field-padding,
				var(--time-picker-text-field-default-padding)
			);
			background: var(
				--time-picker-text-field-background,
				var(--time-picker-text-field-default-background)
			);
			border: var(
					--time-picker-text-field-border-width,
					var(--time-picker-text-field-default-border-width)
				)
				solid var(--_border);
			border-radius: var(
				--time-picker-text-field-border-radius,
				var(--time-picker-text-field-default-border-radius)
			);
			box-shadow: var(
				--time-picker-text-field-box-shadow,
				var(--time-picker-text-field-default-box-shadow)
			);
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-time-picker-text-field:not([data-disabled])
				.aurora-time-picker-text-field-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-time-picker-text-field-control:focus-within,
		.aurora-time-picker-text-field[data-open] .aurora-time-picker-text-field-control {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
				var(
					--time-picker-text-field-focus-ring-width,
					var(--time-picker-text-field-default-focus-ring-width)
				)
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-time-picker-text-field-toggle,
		.aurora-time-picker-text-field-clear {
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

		.aurora-time-picker-text-field-toggle:disabled {
			cursor: inherit;
		}

		.aurora-time-picker-text-field-control:focus-within .aurora-time-picker-text-field-toggle,
		.aurora-time-picker-text-field[data-open] .aurora-time-picker-text-field-toggle {
			color: var(--_focus-border);
		}

		.aurora-time-picker-text-field-clear:focus-visible {
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
			color: var(--time-picker-text-field-color, var(--time-picker-text-field-default-color));
			font-family: var(
				--time-picker-text-field-font-family,
				var(--time-picker-text-field-default-font-family)
			);
			font-size: var(
				--time-picker-text-field-font-size,
				var(--time-picker-text-field-default-font-size)
			);
			font-weight: var(
				--time-picker-text-field-font-weight,
				var(--time-picker-text-field-default-font-weight)
			);
			font-variant-numeric: tabular-nums;
		}

		input::placeholder {
			color: var(
				--time-picker-text-field-placeholder-color,
				var(--time-picker-text-field-default-placeholder-color)
			);
			opacity: 1;
		}

		.aurora-time-picker-text-field-format-slot {
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

		.aurora-time-picker-text-field-format-slot::before {
			content: '';
			height: 100%;
		}

		.aurora-time-picker-text-field-end {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(
				--time-picker-text-field-inner-gap,
				var(--time-picker-text-field-default-inner-gap)
			);
			margin-inline-start: auto;
		}

		.aurora-time-picker-text-field-format {
			padding: var(
				--time-picker-text-field-format-padding,
				var(--time-picker-text-field-default-format-padding)
			);
			border: var(--global-border-width) solid
				var(
					--time-picker-text-field-format-border-color,
					var(--time-picker-text-field-default-format-border-color)
				);
			border-radius: var(
				--time-picker-text-field-format-border-radius,
				var(--time-picker-text-field-default-format-border-radius)
			);
			background: var(
				--time-picker-text-field-format-background,
				var(--time-picker-text-field-default-format-background)
			);
			color: var(
				--time-picker-text-field-format-color,
				var(--time-picker-text-field-default-format-color)
			);
			font-family: var(--global-font-family-mono);
			font-size: var(
				--time-picker-text-field-format-font-size,
				var(--time-picker-text-field-default-format-font-size)
			);
			line-height: 1.4;
			white-space: nowrap;
		}

		.aurora-time-picker-text-field-control :global(.aurora-time-picker-text-field-state-icon) {
			color: var(--_border);
		}

		.aurora-time-picker-text-field-hint {
			color: var(--_hint);
			font-size: var(
				--time-picker-text-field-hint-font-size,
				var(--time-picker-text-field-default-hint-font-size)
			);
		}

		.aurora-time-picker-text-field[data-disabled] .aurora-time-picker-text-field-control {
			background: var(
				--time-picker-text-field-disabled-background,
				var(--time-picker-text-field-default-disabled-background)
			);
			opacity: var(
				--time-picker-text-field-disabled-opacity,
				var(--time-picker-text-field-default-disabled-opacity)
			);
			cursor: not-allowed;
		}

		.aurora-time-picker-text-field[data-disabled] input {
			cursor: not-allowed;
		}

		:global(.aurora-time-picker-text-field-picker) {
			--time-picker-default-border-width: 0px;
			--time-picker-default-box-shadow: 0 0 #0000;
			--time-picker-default-background: transparent;
			--time-picker-default-padding: 4px;
		}

		:global(.aurora-time-picker-text-field-drawer) {
			--drawer-default-size: auto;
		}

		:global(.aurora-drawer-body.aurora-time-picker-text-field-drawer-body) {
			display: grid;
			justify-items: center;
		}

		:global(.aurora-time-picker-text-field-drawer) :global(.aurora-time-picker-text-field-picker) {
			--time-picker-default-padding: 0px;
			--time-picker-default-column-width: 72px;
			--time-picker-default-column-height: min(280px, 45dvh);
			--time-picker-default-option-padding: 9px 0;
			--time-picker-default-option-font-size: 16px;
		}
	}
</style>
