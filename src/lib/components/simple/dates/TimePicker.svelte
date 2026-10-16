<!-- @component
Panel to choose a time of day: a scrolling column of hours and one of minutes (every `minuteStep`), plus an AM/PM column on a 12-hour clock. The value is always a 24-hour `HH:mm` string; the clock comes from `locale` (`en` is 12-hour, `it` 24-hour) or from `hour12`. When it appears each column scrolls to the chosen option, or to the current time when there is no value. `min` and `max` disable the options outside the range, which crosses midnight when `min` is later than `max`; a chosen minute that is not on the step stays in the list. The value is set once hours and minutes (and AM or PM) are chosen. Each column is an ARIA listbox with one Tab stop: Arrow Up and Down move in the column, Arrow Left and Right go to the other columns, Home and End go to the first and last option, Page Up and Page Down jump five options, typing digits (or A and P) goes to the matching option and Enter or Space choose it and move to the next column. It is a `role="group"` named by `aria-label` (the field gives it `role="dialog"`) with the surface of a popup; `TimePickerTextField` shows it in a menu under a field. Its state is exposed as `data-hour-cycle` and `data-disabled` on the panel, `data-column` on the columns and `data-value`, `data-selected` and `data-disabled` on the options, for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './TimePicker.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { hour12Of, inTimeRange, keyTime, periodNames, timeKey } from '../../../utils/time.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** The time, as a 24-hour `HH:mm` string (`HH:mm:ss` is read too). It stays `undefined` until the hours and the minutes (and AM or PM on a 12-hour clock) are chosen. */
		value?: string;
		/** BCP 47 locale: decides between the 12-hour and the 24-hour clock, gives the names of AM and PM and the language of the texts (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Forces the 12-hour clock (`true`) or the 24-hour clock (`false`) instead of the one of `locale`. The value stays 24-hour. */
		hour12?: boolean;
		/** Minutes between two options of the minutes column, from 1 to 60. */
		minuteStep?: number;
		/** Earliest time that can be chosen, as `HH:mm`. */
		min?: string;
		/** Latest time that can be chosen, as `HH:mm`. When it is earlier than `min` the range crosses midnight (`min="22:00"`, `max="06:00"`). */
		max?: string;
		/** Shows the options without letting anyone choose them. */
		disabled?: boolean;
		/** Accessible name of the hours column. Defaults to "Hours", in the language of `locale`. */
		hoursLabel?: string;
		/** Accessible name of the minutes column. Defaults to "Minutes", in the language of `locale`. */
		minutesLabel?: string;
		/** Accessible name of the AM/PM column. Defaults to "AM/PM", in the language of `locale`. */
		periodLabel?: string;
		/** Extra classes for each part. */
		class?: { container?: string; column?: string; option?: string };
		/** The panel element. */
		timePickerElement?: HTMLDivElement;
		/** Replaces the text of an option. The option around it keeps click, keyboard and state. `value` is the hour as shown (0–23, or 1–12 on a 12-hour clock), the minute, or `am` / `pm`. */
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
		/** Called when the user chooses an option and the time is whole: `value` is the time (`HH:mm`), `column` the column of the option. */
		onchange?: (event: { value: string; column: 'hours' | 'minutes' | 'period' }) => void;
	}

	let {
		value = $bindable(),
		locale: localeProp,
		hour12,
		minuteStep = 5,
		min,
		max,
		disabled = false,
		hoursLabel,
		minutesLabel,
		periodLabel,
		class: clazz = {},
		timePickerElement = $bindable(),
		optionSnippet,
		onchange,
		onkeydown,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).timePicker);

	type Column = 'hours' | 'minutes' | 'period';
	type Draft = { hour?: number; minute?: number; period?: number };
	type Option = { value: number; key: string; label: string; selected: boolean; disabled: boolean };

	const HOURS_24 = Array.from({ length: 24 }, (_, hour) => hour);
	const HOURS_12 = [12, ...Array.from({ length: 11 }, (_, index) => index + 1)];
	const PAGE = 5;

	let twelve = $derived(hour12 ?? hour12Of(locale));
	let periods = $derived(periodNames(locale));
	let step = $derived(Math.min(60, Math.max(1, Math.round(minuteStep) || 1)));
	let steps = $derived(Array.from({ length: Math.ceil(60 / step) }, (_, index) => index * step));
	let minKey = $derived(timeKey(min));
	let maxKey = $derived(timeKey(max));

	let rootNode = $state<HTMLDivElement>();
	let lists = $state<Partial<Record<Column, HTMLDivElement>>>({});
	let draft = $state<Draft>(untrack(() => partsOf(timeKey(value), twelve)));
	let draftTwelve = untrack(() => twelve);
	let focused = $state<Partial<Record<Column, number>>>({});
	let now = $state<{ hour: number; minute: number }>();
	let centered: Partial<Record<Column, number>> = {};
	let typed = { column: '', text: '', at: -Infinity };

	let minuteValues = $derived(
		draft.minute !== undefined && !steps.includes(draft.minute)
			? [...steps, draft.minute].sort((a, b) => a - b)
			: steps
	);

	let columns = $derived.by(() => {
		const list: { name: Column; label: string; options: Option[] }[] = [
			{
				name: 'hours',
				label: hoursLabel ?? texts.hours,
				options: (twelve ? HOURS_12 : HOURS_24).map((hour) => ({
					value: hour,
					key: String(hour),
					label: pad(hour),
					selected: draft.hour === hour,
					disabled: !hoursOf(draft, hour).some((h) => minuteValues.some((m) => allowed(h, m)))
				}))
			},
			{
				name: 'minutes',
				label: minutesLabel ?? texts.minutes,
				options: minuteValues.map((minute) => ({
					value: minute,
					key: String(minute),
					label: pad(minute),
					selected: draft.minute === minute,
					disabled: !hoursOf(draft).some((h) => allowed(h, minute))
				}))
			}
		];
		if (twelve)
			list.push({
				name: 'period',
				label: periodLabel ?? texts.period,
				options: [0, 1].map((period) => ({
					value: period,
					key: period ? 'pm' : 'am',
					label: periods[period],
					selected: draft.period === period,
					disabled: !hoursOf({ ...draft, period }).some((h) =>
						minuteValues.some((m) => allowed(h, m))
					)
				}))
			});
		return list;
	});

	let anchors = $derived(
		Object.fromEntries(
			columns.map((column) => [
				column.name,
				column.options.find((option) => option.selected)?.value ?? fallback(column.name, column.options)
			])
		) as Partial<Record<Column, number>>
	);

	let stops = $derived(
		Object.fromEntries(
			columns.map((column) => {
				const own = focused[column.name];
				const known = own !== undefined && column.options.some((option) => option.value === own);
				return [column.name, known ? own : anchors[column.name]];
			})
		) as Partial<Record<Column, number>>
	);

	$effect(() => {
		const date = new Date();
		now = { hour: date.getHours(), minute: date.getMinutes() };
	});

	$effect(() => {
		const key = timeKey(value);
		const clock = twelve;
		untrack(() => {
			if (clock === draftTwelve && key === compose(draft)) return;
			draftTwelve = clock;
			draft = partsOf(key, clock);
		});
	});

	$effect(() => {
		if (!now) return;
		const targets = { ...anchors };
		const nodes = { ...lists };
		tick().then(() => {
			const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
			for (const [column, target] of Object.entries(targets) as [Column, number | undefined][]) {
				const list = nodes[column];
				if (!list || target === undefined) continue;
				const first = !(column in centered);
				if (!first && centered[column] === target) continue;
				centered[column] = target;
				const option = list.querySelector<HTMLElement>(`[data-value="${keyOf(column, target)}"]`);
				if (!option) continue;
				list.scrollTo({
					top: option.offsetTop - (list.clientHeight - option.offsetHeight) / 2,
					behavior: first || reduced ? 'instant' : 'smooth'
				});
			}
		});
	});

	function pad(value: number) {
		return String(value).padStart(2, '0');
	}

	function keyOf(column: Column, value: number) {
		return column === 'period' ? (value ? 'pm' : 'am') : String(value);
	}

	function hour24(hour: number, period: number) {
		return (hour % 12) + period * 12;
	}

	function allowed(hour: number, minute: number) {
		return inTimeRange(hour * 60 + minute, minKey, maxKey);
	}

	function hoursOf(state: Draft, hour = state.hour): number[] {
		if (!twelve) return hour === undefined ? HOURS_24 : [hour];
		const halves = state.period === undefined ? [0, 1] : [state.period];
		const hours = hour === undefined ? HOURS_12 : [hour];
		return halves.flatMap((period) => hours.map((h) => hour24(h, period)));
	}

	function partsOf(key: number | undefined, clock12: boolean): Draft {
		if (key === undefined) return {};
		const hour = Math.floor(key / 60);
		const minute = key % 60;
		return clock12 ? { hour: hour % 12 || 12, minute, period: hour < 12 ? 0 : 1 } : { hour, minute };
	}

	function compose(state: Draft): number | undefined {
		if (state.hour === undefined || state.minute === undefined) return undefined;
		if (!twelve) return state.hour * 60 + state.minute;
		if (state.period === undefined) return undefined;
		return hour24(state.hour, state.period) * 60 + state.minute;
	}

	function fallback(column: Column, options: Option[]) {
		let target: number | undefined;
		if (now) {
			const minute = now.minute;
			if (column === 'hours') target = twelve ? now.hour % 12 || 12 : now.hour;
			else if (column === 'minutes')
				target = [...options].reverse().find((option) => option.value <= minute)?.value;
			else target = now.hour < 12 ? 0 : 1;
		}
		const option =
			options.find((option) => option.value === target && !option.disabled) ??
			options.find((option) => !option.disabled) ??
			options[0];
		return option?.value;
	}

	function fit(state: Draft) {
		if (state.hour === undefined || state.minute === undefined) return;
		if (twelve && state.period === undefined) return;
		const hour = twelve ? hour24(state.hour, state.period!) : state.hour;
		const minute = state.minute;
		if (allowed(hour, minute)) return;
		const best = steps
			.filter((m) => allowed(hour, m))
			.sort((a, b) => Math.abs(a - minute) - Math.abs(b - minute))[0];
		if (best !== undefined) state.minute = best;
	}

	function pick(column: Column, option: Option, fromKeyboard = false) {
		if (disabled || option.disabled) return;
		focused[column] = option.value;
		const next: Draft = { ...draft };
		if (column === 'hours') next.hour = option.value;
		else if (column === 'minutes') next.minute = option.value;
		else next.period = option.value;
		if (column !== 'minutes') fit(next);
		draft = next;
		const key = compose(next);
		if (key !== undefined) {
			const time = keyTime(key);
			value = time;
			onchange?.({ value: time, column });
		}
		if (fromKeyboard) advance(column);
	}

	async function advance(column: Column) {
		const next = columns[columns.findIndex((c) => c.name === column) + 1];
		if (!next) return;
		await tick();
		if (rootNode?.contains(document.activeElement)) focusColumn(next.name);
	}

	async function focusColumn(column: Column, target?: number) {
		if (target !== undefined) focused[column] = target;
		await tick();
		lists[column]?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}

	function find(options: Option[], text: string) {
		const exact = options.findIndex((option) => !option.disabled && option.value === Number(text));
		return exact >= 0 ? exact : options.findIndex((o) => !o.disabled && o.label.startsWith(text));
	}

	function typeAhead(event: KeyboardEvent, column: { name: Column; options: Option[] }) {
		const key = event.key;
		if (column.name === 'period') {
			const letter = key.toLowerCase();
			if (letter.length !== 1) return undefined;
			const index = column.options.findIndex(
				(option) =>
					!option.disabled &&
					(option.key[0] === letter || option.label.toLowerCase().startsWith(letter))
			);
			return index < 0 ? undefined : index;
		}
		if (!/^\d$/.test(key)) return undefined;
		const fresh =
			typed.column !== column.name || event.timeStamp - typed.at > 1000 || typed.text.length >= 2;
		typed = { column: column.name, text: fresh ? key : typed.text + key, at: event.timeStamp };
		let index = find(column.options, typed.text);
		if (index < 0 && typed.text.length > 1) {
			typed.text = key;
			index = find(column.options, key);
		}
		return index < 0 ? undefined : index;
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || disabled) return;
		const target = event.target as HTMLElement;
		const name = target.closest<HTMLElement>('[role="listbox"]')?.dataset.column;
		const index = columns.findIndex((c) => c.name === name);
		const column = columns[index];
		if (!column || target.getAttribute('role') !== 'option') return;
		const position = column.options.findIndex((option) => option.key === target.dataset.value);
		const option = column.options[position];
		if (!option) return;
		const enabled = column.options.flatMap((o, i) => (o.disabled ? [] : [i]));
		let next: number | undefined;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			pick(column.name, option, true);
			return;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			const side = columns[index + (event.key === 'ArrowRight' ? 1 : -1)];
			event.preventDefault();
			if (side) focusColumn(side.name);
			return;
		} else if (event.key === 'ArrowDown') next = enabled.find((i) => i > position) ?? position;
		else if (event.key === 'ArrowUp') next = enabled.findLast((i) => i < position) ?? position;
		else if (event.key === 'PageDown')
			next = enabled.find((i) => i >= position + PAGE) ?? enabled.findLast((i) => i > position) ?? position;
		else if (event.key === 'PageUp')
			next = enabled.findLast((i) => i <= position - PAGE) ?? enabled.find((i) => i < position) ?? position;
		else if (event.key === 'Home') next = enabled[0] ?? position;
		else if (event.key === 'End') next = enabled.at(-1) ?? position;
		else {
			next = typeAhead(event, column);
			if (next === undefined) return;
		}
		event.preventDefault();
		focusColumn(column.name, column.options[next].value);
	}

	/** Moves the focus into the panel: to the chosen hour, else the hour of the current time. */
	export function focus() {
		lists.hours?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}
</script>

<div
	role="group"
	{...rest}
	bind:this={() => rootNode, (node) => (rootNode = timePickerElement = node)}
	class={['aurora-time-picker', clazz.container]}
	data-hour-cycle={twelve ? '12' : '24'}
	data-disabled={disabled || undefined}
	onkeydown={handleKeydown}
>
	{#each columns as column (column.name)}
		<div
			bind:this={lists[column.name]}
			role="listbox"
			tabindex="-1"
			aria-label={column.label}
			aria-disabled={disabled || undefined}
			class={['aurora-time-picker-column', clazz.column]}
			data-column={column.name}
		>
			{#each column.options as option (option.key)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					role="option"
					class={['aurora-time-picker-option', clazz.option]}
					data-value={option.key}
					data-selected={option.selected || undefined}
					data-disabled={option.disabled || undefined}
					tabindex={disabled ? undefined : option.value === stops[column.name] ? 0 : -1}
					aria-selected={option.selected}
					aria-disabled={option.disabled || undefined}
					onclick={() => pick(column.name, option)}
					onfocus={() => (focused[column.name] = option.value)}
				>
					{#if optionSnippet}
						{@render optionSnippet({
							value: column.name === 'period' ? (option.key as 'am' | 'pm') : option.value,
							label: option.label,
							column: column.name,
							selected: option.selected,
							disabled: option.disabled
						})}
					{:else}
						{option.label}
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-time-picker {
			display: inline-flex;
			gap: var(--time-picker-gap, var(--time-picker-default-gap));
			box-sizing: border-box;
			width: var(--time-picker-width, var(--time-picker-default-width));
			max-width: 100%;
			padding: var(--time-picker-padding, var(--time-picker-default-padding));
			border: var(--time-picker-border-width, var(--time-picker-default-border-width)) solid
				var(--time-picker-border-color, var(--time-picker-default-border-color));
			border-radius: var(--time-picker-border-radius, var(--time-picker-default-border-radius));
			background: var(--time-picker-background, var(--time-picker-default-background));
			box-shadow: var(--time-picker-box-shadow, var(--time-picker-default-box-shadow));
			color: var(--time-picker-color, var(--time-picker-default-color));
			direction: ltr;
		}

		.aurora-time-picker-column {
			position: relative;
			display: flex;
			flex: 1 0 auto;
			flex-direction: column;
			justify-content: safe center;
			gap: var(--time-picker-column-gap, var(--time-picker-default-column-gap));
			box-sizing: border-box;
			width: var(--time-picker-column-width, var(--time-picker-default-column-width));
			height: var(--time-picker-column-height, var(--time-picker-default-column-height));
			overflow-y: auto;
			padding: calc(var(--global-focus-ring-width) + var(--global-focus-ring-offset));
			overscroll-behavior: contain;
			scrollbar-width: var(--time-picker-scrollbar-width, var(--time-picker-default-scrollbar-width));
		}

		.aurora-time-picker-column::before,
		.aurora-time-picker-column::after {
			content: '';
			flex: none;
			height: calc(var(--time-picker-column-height, var(--time-picker-default-column-height)) / 2);
		}

		.aurora-time-picker-column + .aurora-time-picker-column {
			border-left: var(--global-border-width) solid
				var(--time-picker-divider-color, var(--time-picker-default-divider-color));
		}

		.aurora-time-picker-option {
			flex: none;
			box-sizing: border-box;
			padding: var(--time-picker-option-padding, var(--time-picker-default-option-padding));
			border-radius: var(
				--time-picker-option-border-radius,
				var(--time-picker-default-option-border-radius)
			);
			background: var(--time-picker-option-background, var(--time-picker-default-option-background));
			color: var(--time-picker-option-color, var(--time-picker-default-option-color));
			font-family: var(
				--time-picker-option-font-family,
				var(--time-picker-default-option-font-family)
			);
			font-size: var(--time-picker-option-font-size, var(--time-picker-default-option-font-size));
			font-weight: var(
				--time-picker-option-font-weight,
				var(--time-picker-default-option-font-weight)
			);
			font-variant-numeric: tabular-nums;
			line-height: 1.4;
			text-align: center;
			white-space: nowrap;
			cursor: pointer;
			user-select: none;
			outline: none;
			transition:
				background-color var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-time-picker:not([data-disabled])
				.aurora-time-picker-option:not([data-selected], [data-disabled]):hover {
				background: var(
					--time-picker-option-hover-background,
					var(--time-picker-default-option-hover-background)
				);
				color: var(--time-picker-option-hover-color, var(--time-picker-default-option-hover-color));
			}
		}

		.aurora-time-picker-option:focus-visible {
			outline: var(--global-focus-ring-width) solid
				var(--time-picker-focus-ring-color, var(--time-picker-default-focus-ring-color));
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-time-picker-option[data-selected] {
			background: var(
				--time-picker-option-selected-background,
				var(--time-picker-default-option-selected-background)
			);
			color: var(
				--time-picker-option-selected-color,
				var(--time-picker-default-option-selected-color)
			);
			box-shadow: var(
				--time-picker-option-selected-box-shadow,
				var(--time-picker-default-option-selected-box-shadow)
			);
		}

		.aurora-time-picker-option[data-disabled] {
			opacity: var(
				--time-picker-option-disabled-opacity,
				var(--time-picker-default-option-disabled-opacity)
			);
			cursor: default;
		}

		.aurora-time-picker[data-disabled] {
			opacity: var(--time-picker-disabled-opacity, var(--time-picker-default-disabled-opacity));
		}

		.aurora-time-picker[data-disabled] .aurora-time-picker-option {
			cursor: default;
		}
	}
</style>
