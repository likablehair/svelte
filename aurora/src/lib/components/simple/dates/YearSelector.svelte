<!-- @component
Scrolling grid of years, from `min` to `max`, to choose one. When it appears it scrolls to the chosen year (or the current one, which has a border). Choosing the chosen year again keeps it. It is an ARIA listbox: one Tab stop, the arrows move in the grid, Page Up and Page Down jump three rows, Home and End go to the first and last year, Enter or Space choose. Its state is exposed as `data-disabled` on the grid and as `data-selected` and `data-current` on the years, for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './YearSelector.css';
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { gridTarget } from './grid.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** Chosen year. */
		selectedYear?: number;
		/** First year of the grid. */
		min?: number;
		/** Last year of the grid. */
		max?: number;
		/** Shows the years without letting anyone choose them. */
		disabled?: boolean;
		/** Extra classes for each part. */
		class?: { container?: string; year?: string };
		/** The grid element, which scrolls. */
		yearSelectorElement?: HTMLDivElement;
		/** Replaces the number of a year. The cell around it keeps click, keyboard and state. */
		itemSnippet?: Snippet<[{ year: number; selected: boolean; current: boolean }]>;
		/** Called when the user chooses a year. */
		onchange?: (event: { year: number }) => void;
	}

	let {
		selectedYear = $bindable(),
		min = 1900,
		max = 2100,
		disabled = false,
		class: clazz = {},
		yearSelectorElement = $bindable(),
		itemSnippet,
		onchange,
		onkeydown,
		...rest
	}: Props = $props();

	let listNode = $state<HTMLDivElement>();
	let focused = $state<number>();
	let currentYear = $state<number>();

	let first = $derived(Math.min(min, max));
	let years = $derived(Array.from({ length: Math.abs(max - min) + 1 }, (_, index) => first + index));
	let tabStop = $derived(
		[focused, selectedYear, currentYear].find(
			(year) => year !== undefined && year >= first && year <= first + years.length - 1
		) ?? first
	);

	$effect(() => {
		currentYear = new Date().getFullYear();
	});

	$effect(() => {
		const list = listNode;
		if (!list) return;
		tick().then(() => {
			const year = list.querySelector<HTMLElement>(`[data-year="${tabStop}"]`);
			if (year) list.scrollTop = year.offsetTop - (list.clientHeight - year.offsetHeight) / 2;
		});
	});

	function choose(year: number) {
		if (disabled) return;
		focused = year;
		selectedYear = year;
		onchange?.({ year });
	}

	async function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const year = Number((event.target as HTMLElement).dataset.year);
		if (Number.isNaN(year)) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(year);
			return;
		}
		const target = gridTarget(event, event.currentTarget, year - first, years.length);
		if (target === undefined) return;
		event.preventDefault();
		focused = first + target;
		await tick();
		listNode?.querySelector<HTMLElement>(`[data-year="${first + target}"]`)?.focus();
	}

	/** Moves the focus into the grid: to the last focused year, else the chosen one or the current one. */
	export function focus() {
		listNode?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}
</script>

<div
	tabindex="-1"
	{...rest}
	bind:this={() => listNode, (node) => (listNode = yearSelectorElement = node)}
	role="listbox"
	aria-label={rest['aria-labelledby'] ? rest['aria-label'] : (rest['aria-label'] ?? 'Year')}
	aria-disabled={disabled || undefined}
	class={['aurora-year-selector', clazz.container]}
	data-disabled={disabled || undefined}
	onkeydown={handleKeydown}
>
	{#each years as year (year)}
		{@const selected = year === selectedYear}
		{@const current = year === currentYear}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			role="option"
			class={['aurora-year-selector-year', clazz.year]}
			data-year={year}
			data-selected={selected || undefined}
			data-current={current || undefined}
			tabindex={disabled ? undefined : year === tabStop ? 0 : -1}
			aria-selected={selected}
			aria-current={current ? 'date' : undefined}
			onclick={() => choose(year)}
			onfocus={() => (focused = year)}
		>
			{#if itemSnippet}
				{@render itemSnippet({ year, selected, current })}
			{:else}
				{year}
			{/if}
		</div>
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-year-selector {
			position: relative;
			display: grid;
			grid-template-columns: repeat(
				var(--year-selector-columns, var(--year-selector-default-columns)),
				minmax(0, 1fr)
			);
			align-content: start;
			gap: var(--year-selector-gap, var(--year-selector-default-gap));
			box-sizing: border-box;
			width: var(--year-selector-width, var(--year-selector-default-width));
			height: var(--year-selector-height, var(--year-selector-default-height));
			max-height: var(--year-selector-max-height, var(--year-selector-default-max-height));
			overflow-y: auto;
			padding: calc(var(--global-focus-ring-width) + var(--global-focus-ring-offset));
			overscroll-behavior: contain;
			scrollbar-width: thin;
		}

		.aurora-year-selector-year {
			box-sizing: border-box;
			padding: var(--year-selector-padding, var(--year-selector-default-padding));
			border: var(--global-border-width) solid transparent;
			border-radius: var(--year-selector-border-radius, var(--year-selector-default-border-radius));
			background: var(--year-selector-background, var(--year-selector-default-background));
			color: var(--year-selector-color, var(--year-selector-default-color));
			font-family: var(--year-selector-font-family, var(--year-selector-default-font-family));
			font-size: var(--year-selector-font-size, var(--year-selector-default-font-size));
			font-weight: var(--year-selector-font-weight, var(--year-selector-default-font-weight));
			font-variant-numeric: tabular-nums;
			text-align: center;
			cursor: pointer;
			user-select: none;
			outline: none;
			transition:
				background-color var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		.aurora-year-selector-year[data-current] {
			border-color: var(
				--year-selector-current-border-color,
				var(--year-selector-default-current-border-color)
			);
		}

		@media (hover: hover) {
			.aurora-year-selector:not([data-disabled])
				.aurora-year-selector-year:not([data-selected]):hover {
				background: var(--year-selector-hover-background, var(--year-selector-default-hover-background));
				color: var(--year-selector-hover-color, var(--year-selector-default-hover-color));
			}
		}

		.aurora-year-selector-year:focus-visible {
			outline: var(--global-focus-ring-width) solid
				var(--year-selector-focus-ring-color, var(--year-selector-default-focus-ring-color));
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-year-selector-year[data-selected] {
			background: var(
				--year-selector-selected-background,
				var(--year-selector-default-selected-background)
			);
			color: var(--year-selector-selected-color, var(--year-selector-default-selected-color));
			box-shadow: var(
				--year-selector-selected-box-shadow,
				var(--year-selector-default-selected-box-shadow)
			);
		}

		.aurora-year-selector[data-disabled] {
			opacity: var(--year-selector-disabled-opacity, var(--year-selector-default-disabled-opacity));
		}

		.aurora-year-selector[data-disabled] .aurora-year-selector-year {
			cursor: default;
		}
	}
</style>
