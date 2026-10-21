<!-- @component
Field to choose a period, such as the range of a report or of a dashboard widget: a bar with the name of the period and its dates that opens a `PeriodSelector` in a menu, or in a bottom drawer on screens up to 1024px wide. A preset applies at once and closes the menu; a custom range or a relative period stays a draft until Apply, and Cancel, Escape or a click outside discard it. The two arrows at the start move the period back or forth by its length (by one month, or one year, when it covers whole months): the result is a range of dates, named "August 2026", "2025" or after its day when it is a whole month, year or day, else shown as its dates, and it goes back to a preset when it lands exactly on its days ("This year" ‹ › is "This year" again); `shiftable={false}` hides them. The field is at least 300px wide (`--period-picker-min-width`), so it does not jump while the period changes. The value has the JSON shape the backends save, and `onchange` also gets the days it covers. Its state is exposed as `data-open`, `data-disabled` and `data-empty` for app CSS.
-->
<script lang="ts" module>
	const PREVIOUS_ICON = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
	const NEXT_ICON = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';
	const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';
	const CALENDAR_ICON =
		'M9,10H7V12H9V10M13,10H11V12H13V10M17,10H15V12H17V10M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z';
</script>

<script lang="ts" generics="T extends string">
	import '../../../css/tokens.css';
	import './PeriodPicker.css';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import MenuOrDrawer from '../common/MenuOrDrawer.svelte';
	import PeriodSelector from './PeriodSelector.svelte';
	import {
		QUICK_VALUES,
		rangeName,
		rangeText,
		resolvePeriod,
		rollingText,
		sameRange,
		shiftRange,
		type PeriodPreset,
		type PeriodRolling,
		type TimespanSettings
	} from '../../../utils/period.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

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
		/** Shows the arrows that move the period back and forth, at the start of the field. They are off for "all time" and for open ranges. */
		shiftable?: boolean;
		/** Months shown in the menu for the custom range: one, or two side by side. The bottom drawer always shows one. */
		months?: 1 | 2;
		/** Disables the field and the arrows. */
		disabled?: boolean;
		/** Whether the menu is open. */
		open?: boolean;
		/** Side of the field and alignment of the menu. */
		placement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top';
		/** Text of the field while no period is chosen. Defaults to "Select a period", in the language of `locale`. */
		placeholder?: string;
		/** Text of the button that confirms the draft. Defaults to "Apply", in the language of `locale`. */
		applyLabel?: string;
		/** Text of the button that discards the draft. Defaults to "Cancel", in the language of `locale`. */
		cancelLabel?: string;
		/** Name of the arrow that moves the period back. Defaults to "Previous period", in the language of `locale`. */
		previousLabel?: string;
		/** Name of the arrow that moves the period forth. Defaults to "Next period", in the language of `locale`. */
		nextLabel?: string;
		/** Text of the relative period in the list. Defaults to "Relative period", in the language of `locale`. */
		rollingLabel?: string;
		/** Extra classes on the root element. */
		class?: string;
		/** The root element. */
		periodPickerElement?: HTMLDivElement;
		/** Called when the period changes (a preset, Apply or an arrow), with the new value and the days it covers (`from` and `to` at local midnight, both included; missing for an open end and for `total`). */
		onchange?: (change: { timespanSettings: TimespanSettings<T>; from?: Date; to?: Date }) => void;
		/** Called whenever the menu closes. */
		onclose?: () => void;
		/** Replaces the name and the dates in the field. `label` is the name of the period, `dates` its days as text. */
		labelSnippet?: Snippet<
			[{ label: string; dates: string; from?: Date; to?: Date; timespanSettings?: TimespanSettings<T> }]
		>;
		/** Replaces the content of a preset in the list. */
		presetSnippet?: Snippet<[{ preset: PeriodPreset<T>; selected: boolean }]>;
	}

	let {
		timespanSettings = $bindable(),
		quickSelectOptions,
		locale: localeProp,
		weekStart,
		min,
		max,
		shiftable = true,
		months = 1,
		disabled = false,
		open = $bindable(),
		placement = 'bottom-start',
		placeholder,
		applyLabel,
		cancelLabel,
		previousLabel,
		nextLabel,
		rollingLabel,
		class: clazz = '',
		periodPickerElement = $bindable(),
		onchange,
		onclose,
		labelSnippet,
		presetSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).period);

	let presets = $derived(quickSelectOptions);

	let mounted = $state(false);
	$effect(() => {
		mounted = true;
	});

	function resolve(value: TimespanSettings<T> | undefined) {
		if (!mounted && value?.method !== 'picker') return undefined;
		return resolvePeriod(value, { weekStart: weekStart ?? 1, presets });
	}

	let range = $derived(resolve(timespanSettings));
	let trigger = $state<HTMLButtonElement>();
	let draft = $state<TimespanSettings<T>>();
	let canApply = $derived(resolve(draft) !== undefined);
	let canShift = $derived(!disabled && !!range?.from && !!range?.to);

	let label = $derived.by(() => {
		const value = timespanSettings;
		if (!value?.method || value.values === undefined) return placeholder ?? texts.placeholder;
		if (value.method === 'quick') {
			const preset = quickSelectOptions?.find((item) => item.value === value.values);
			return preset?.label ?? texts.presets[value.values as keyof typeof texts.presets] ?? String(value.values);
		}
		if (value.method === 'rolling') return rollingText(value.values as PeriodRolling, locale) || (rollingLabel ?? texts.rolling);
		return rangeName(range, locale) ?? rangeText(range, locale);
	});
	let dates = $derived(timespanSettings?.method === 'picker' ? '' : rangeText(range, locale));
	let empty = $derived(!timespanSettings?.method || timespanSettings.values === undefined);

	function commit(next: TimespanSettings<T>) {
		timespanSettings = next;
		const resolved = resolve(next);
		onchange?.({ timespanSettings: next, from: resolved?.from, to: resolved?.to });
	}

	function toggle() {
		if (disabled) return;
		open = !open;
	}

	function close() {
		open = false;
	}

	function handleDraftChange({ timespanSettings: next }: { timespanSettings: TimespanSettings<T> }) {
		if (next.method !== 'quick') return;
		commit(next);
		close();
	}

	function apply() {
		if (!draft || !canApply) return;
		commit($state.snapshot(draft) as TimespanSettings<T>);
		close();
	}

	function shift(direction: 1 | -1) {
		if (!range || !canShift) return;
		const next = shiftRange(range, direction);
		if (!next) return;
		const values = quickSelectOptions?.map((preset) => preset.value) ?? (QUICK_VALUES as string[] as T[]);
		const preset = values.find((value) => sameRange(resolve({ method: 'quick', values: value } as TimespanSettings<T>), next));
		commit(preset !== undefined ? { method: 'quick', values: preset } : { method: 'picker', values: { from: next.from, to: next.to } });
	}

	let wasOpen = false;
	$effect.pre(() => {
		if (open && !wasOpen) {
			wasOpen = true;
			const value = untrack(() => timespanSettings);
			draft = value ? ($state.snapshot(value) as TimespanSettings<T>) : undefined;
		} else if (!open && wasOpen) {
			wasOpen = false;
			untrack(() => onclose?.());
		}
	});
</script>

<div
	{...rest}
	bind:this={periodPickerElement}
	data-open={open || undefined}
	data-disabled={disabled || undefined}
	data-empty={empty || undefined}
	class="aurora-period-picker {clazz}"
>
	{#if shiftable}
		<span class="aurora-period-picker-arrows">
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={PREVIOUS_ICON}
				aria-label={previousLabel ?? texts.previousPeriod}
				disabled={!canShift}
				onclick={() => shift(-1)}
				class="aurora-period-picker-shift"
			/>
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={NEXT_ICON}
				aria-label={nextLabel ?? texts.nextPeriod}
				disabled={!canShift}
				onclick={() => shift(1)}
				class="aurora-period-picker-shift"
			/>
		</span>
	{/if}
	<button
		bind:this={trigger}
		type="button"
		class="aurora-period-picker-trigger"
		aria-haspopup="dialog"
		aria-expanded={!!open}
		{disabled}
		onclick={toggle}
	>
		<span class="aurora-period-picker-icon"><Icon path={CALENDAR_ICON} /></span>
		{#if labelSnippet}
			{@render labelSnippet({ label, dates, from: range?.from, to: range?.to, timespanSettings })}
		{:else}
			<span class="aurora-period-picker-label">{label}</span>
			{#if dates}<span class="aurora-period-picker-dates">{dates}</span>{/if}
		{/if}
		<span class="aurora-period-picker-chevron"><Icon path={CHEVRON_ICON} /></span>
	</button>
</div>

<MenuOrDrawer
	bind:open
	activator={trigger}
	{placement}
	menuProps={{ class: 'aurora-period-picker-menu' }}
	drawerProps={{ title: texts.open }}
>
	{#snippet children({ isDrawer })}
		<div class="aurora-period-picker-panel" role="dialog" aria-label={texts.open}>
			<PeriodSelector
				bind:timespanSettings={draft}
				{quickSelectOptions}
				{locale}
				{weekStart}
				{min}
				{max}
				months={isDrawer ? 1 : months}
				compact={isDrawer}
				{rollingLabel}
				{presetSnippet}
				onchange={handleDraftChange}
			>
				{#snippet actionsSnippet()}
					<Button buttonType="text" size="sm" onclick={close}>{cancelLabel ?? texts.cancel}</Button>
					<Button variant="primary" size="sm" disabled={!canApply} onclick={apply}>
						{applyLabel ?? texts.apply}
					</Button>
				{/snippet}
			</PeriodSelector>
		</div>
	{/snippet}
</MenuOrDrawer>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-period-picker {
			display: inline-flex;
			align-items: center;
			gap: 2px;
			box-sizing: border-box;
			width: var(--period-picker-width, var(--period-picker-default-width));
			min-width: min(var(--period-picker-min-width, var(--period-picker-default-min-width)), 100%);
			max-width: 100%;
			height: var(--period-picker-height, var(--period-picker-default-height));
			padding: var(--period-picker-padding, var(--period-picker-default-padding));
			border: var(--period-picker-border-width, var(--period-picker-default-border-width)) solid
				var(--period-picker-border-color, var(--period-picker-default-border-color));
			border-radius: var(--period-picker-border-radius, var(--period-picker-default-border-radius));
			background: var(--period-picker-background, var(--period-picker-default-background));
			box-shadow: var(--period-picker-box-shadow, var(--period-picker-default-box-shadow));
			color: var(--period-picker-color, var(--period-picker-default-color));
			font-size: var(--period-picker-font-size, var(--period-picker-default-font-size));
		}

		.aurora-period-picker-arrows {
			display: inline-flex;
			flex: none;
			gap: 2px;
		}

		:global(.aurora-button.aurora-period-picker-shift) {
			--button-background: transparent;
			--button-border-color: transparent;
			--button-box-shadow: none;
			flex: none;
		}

		.aurora-period-picker-trigger {
			display: flex;
			flex: 1;
			align-items: center;
			gap: 10px;
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0 12px;
			border: 0;
			border-radius: var(--global-radius-sm);
			background: transparent;
			color: inherit;
			font: inherit;
			white-space: nowrap;
			cursor: pointer;
			transition: background-color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-period-picker-arrows + .aurora-period-picker-trigger {
			border-left: 1px solid var(--period-picker-divider-color, var(--period-picker-default-divider-color));
			border-radius: 0 var(--global-radius-sm) var(--global-radius-sm) 0;
		}

		@media (hover: hover) {
			.aurora-period-picker-trigger:hover:not(:disabled) {
				background: var(--period-picker-hover-background, var(--period-picker-default-hover-background));
			}
		}

		.aurora-period-picker-trigger:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-period-picker-trigger:disabled {
			cursor: not-allowed;
		}

		.aurora-period-picker[data-disabled] {
			opacity: var(--period-picker-disabled-opacity, var(--period-picker-default-disabled-opacity));
		}

		.aurora-period-picker-icon {
			display: inline-flex;
			flex: none;
			color: var(--period-picker-icon-color, var(--period-picker-default-icon-color));
			--icon-size: var(--period-picker-icon-size, var(--period-picker-default-icon-size));
		}

		.aurora-period-picker-label {
			overflow: hidden;
			font-weight: var(--period-picker-label-font-weight, var(--period-picker-default-label-font-weight));
			text-overflow: ellipsis;
		}

		.aurora-period-picker[data-empty] .aurora-period-picker-label {
			color: var(--period-picker-placeholder-color, var(--period-picker-default-placeholder-color));
			font-weight: 400;
		}

		.aurora-period-picker-dates {
			overflow: hidden;
			color: var(--period-picker-dates-color, var(--period-picker-default-dates-color));
			font-family: var(--global-font-family-mono);
			font-size: var(--period-picker-dates-font-size, var(--period-picker-default-dates-font-size));
			text-overflow: ellipsis;
		}

		.aurora-period-picker-chevron {
			display: inline-flex;
			flex: none;
			margin-left: auto;
			color: var(--period-picker-chevron-color, var(--period-picker-default-chevron-color));
			transition: transform var(--global-duration-fast) var(--global-ease);
		}

		.aurora-period-picker[data-open] .aurora-period-picker-chevron {
			transform: rotate(180deg);
		}

		:global(.aurora-period-picker-menu) {
			--_menu-padding: 0;
			--_menu-max-width: calc(100vw - 16px);
			--_menu-overflow: hidden;
		}
	}
</style>
