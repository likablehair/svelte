<!-- @component
Grid of the twelve months, to choose one. Names come from `locale` through `Intl`. `year` tells which month is the current one (it has a border) and, with `min` and `max`, which months cannot be chosen. It is an ARIA listbox: one Tab stop, the arrows move in the grid, Home and End go to the first and last month, Enter or Space choose. Its state is exposed as `data-disabled` on the grid and as `data-selected`, `data-current` and `data-disabled` on the months, for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './MonthSelector.css';
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { dayKey, makeDate, monthNames } from '../../../utils/dates.js';
	import { gridTarget } from './grid.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** Chosen month, from 0 (January) to 11. */
		selectedMonth?: number;
		/** Year of the months: it decides the current month and, with `min` and `max`, which months are disabled. Defaults to the current year. */
		year?: number;
		/** BCP 47 locale of the month names. */
		locale?: string;
		/** Length of the month names. Screen readers always read the full name. */
		monthFormat?: 'short' | 'long';
		/** Months that end before this day cannot be chosen. */
		min?: Date;
		/** Months that start after this day cannot be chosen. */
		max?: Date;
		/** Shows the months without letting anyone choose them. */
		disabled?: boolean;
		/** Extra classes for each part. */
		class?: { container?: string; month?: string };
		/** The grid element. */
		monthSelectorElement?: HTMLDivElement;
		/** Replaces the name of a month. The cell around it keeps click, keyboard and state. */
		itemSnippet?: Snippet<
			[
				{
					month: number;
					label: string;
					name: string;
					selected: boolean;
					current: boolean;
					disabled: boolean;
				}
			]
		>;
		/** Called when the user chooses a month. */
		onchange?: (event: { month: number }) => void;
	}

	let {
		selectedMonth = $bindable(),
		year,
		locale = 'en',
		monthFormat = 'short',
		min,
		max,
		disabled = false,
		class: clazz = {},
		monthSelectorElement = $bindable(),
		itemSnippet,
		onchange,
		onkeydown,
		...rest
	}: Props = $props();

	let listNode = $state<HTMLDivElement>();
	let focused = $state<number>();
	let now = $state<Date>();
	$effect(() => {
		now = new Date();
	});

	let shownYear = $derived(year ?? now?.getFullYear());
	let labels = $derived(monthNames(locale, monthFormat));
	let names = $derived(monthNames(locale, 'long'));
	let months = $derived(
		labels.map((label, month) => ({
			month,
			label,
			name: names[month],
			selected: month === selectedMonth,
			current: !!now && shownYear === now.getFullYear() && month === now.getMonth(),
			disabled: isDisabled(month)
		}))
	);
	let tabStop = $derived(
		[focused, selectedMonth, months.find((month) => month.current)?.month].find(
			(month) => month !== undefined
		) ?? months.find((month) => !month.disabled)?.month ?? 0
	);

	function isDisabled(month: number) {
		if (shownYear === undefined) return false;
		if (min && dayKey(makeDate(shownYear, month + 1, 0)) < dayKey(min)) return true;
		if (max && dayKey(makeDate(shownYear, month, 1)) > dayKey(max)) return true;
		return false;
	}

	function choose(month: number) {
		if (disabled || isDisabled(month)) return;
		focused = month;
		selectedMonth = month;
		onchange?.({ month });
	}

	async function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const index = Number((event.target as HTMLElement).dataset.month);
		if (Number.isNaN(index)) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(index);
			return;
		}
		const target = gridTarget(event, event.currentTarget, index, 12);
		if (target === undefined) return;
		event.preventDefault();
		focused = target;
		await tick();
		listNode?.querySelector<HTMLElement>(`[data-month="${target}"]`)?.focus();
	}

	/** Moves the focus into the grid: to the last focused month, else the chosen one or the current one. */
	export function focus() {
		listNode?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}
</script>

<div
	{...rest}
	bind:this={() => listNode, (node) => (listNode = monthSelectorElement = node)}
	role="listbox"
	aria-label={rest['aria-labelledby'] ? rest['aria-label'] : (rest['aria-label'] ?? 'Month')}
	aria-disabled={disabled || undefined}
	class={['aurora-month-selector', clazz.container]}
	data-disabled={disabled || undefined}
	onkeydown={handleKeydown}
>
	{#each months as month (month.month)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			role="option"
			class={['aurora-month-selector-month', clazz.month]}
			data-month={month.month}
			data-selected={month.selected || undefined}
			data-current={month.current || undefined}
			data-disabled={month.disabled || undefined}
			tabindex={disabled ? undefined : month.month === tabStop ? 0 : -1}
			aria-selected={month.selected}
			aria-disabled={month.disabled || undefined}
			aria-current={month.current ? 'date' : undefined}
			aria-label={month.name}
			onclick={() => choose(month.month)}
			onfocus={() => (focused = month.month)}
		>
			{#if itemSnippet}
				{@render itemSnippet(month)}
			{:else}
				{month.label}
			{/if}
		</div>
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-month-selector {
			display: grid;
			grid-template-columns: repeat(
				var(--month-selector-columns, var(--month-selector-default-columns)),
				minmax(0, 1fr)
			);
			align-content: start;
			gap: var(--month-selector-gap, var(--month-selector-default-gap));
			box-sizing: border-box;
			width: var(--month-selector-width, var(--month-selector-default-width));
			height: var(--month-selector-height, var(--month-selector-default-height));
		}

		.aurora-month-selector-month {
			box-sizing: border-box;
			overflow: hidden;
			padding: var(--month-selector-padding, var(--month-selector-default-padding));
			border: var(--global-border-width) solid transparent;
			border-radius: var(--month-selector-border-radius, var(--month-selector-default-border-radius));
			background: var(--month-selector-background, var(--month-selector-default-background));
			color: var(--month-selector-color, var(--month-selector-default-color));
			font-size: var(--month-selector-font-size, var(--month-selector-default-font-size));
			font-weight: var(--month-selector-font-weight, var(--month-selector-default-font-weight));
			text-align: center;
			text-overflow: ellipsis;
			white-space: nowrap;
			cursor: pointer;
			user-select: none;
			outline: none;
			transition:
				background-color var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		.aurora-month-selector-month[data-current] {
			border-color: var(
				--month-selector-current-border-color,
				var(--month-selector-default-current-border-color)
			);
		}

		@media (hover: hover) {
			.aurora-month-selector:not([data-disabled])
				.aurora-month-selector-month:not([data-selected], [data-disabled]):hover {
				background: var(
					--month-selector-hover-background,
					var(--month-selector-default-hover-background)
				);
				color: var(--month-selector-hover-color, var(--month-selector-default-hover-color));
			}
		}

		.aurora-month-selector-month:focus-visible {
			outline: var(--global-focus-ring-width) solid
				var(--month-selector-focus-ring-color, var(--month-selector-default-focus-ring-color));
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-month-selector-month[data-selected] {
			background: var(
				--month-selector-selected-background,
				var(--month-selector-default-selected-background)
			);
			color: var(--month-selector-selected-color, var(--month-selector-default-selected-color));
			box-shadow: var(
				--month-selector-selected-box-shadow,
				var(--month-selector-default-selected-box-shadow)
			);
		}

		.aurora-month-selector-month[data-disabled] {
			opacity: var(--month-selector-disabled-opacity, var(--month-selector-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-month-selector[data-disabled] .aurora-month-selector-month {
			cursor: default;
		}
	}
</style>
