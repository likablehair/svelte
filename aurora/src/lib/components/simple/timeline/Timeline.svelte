<!-- @component
Events in time order: a marker on a line for each item, with its date or time, title and description. One column by default; `alternate` places the items on both sides of the line with the dates on the other side, and falls back to one column when the timeline is narrower than 640px. `status` marks an item as done, current or upcoming, `icon` and `variant` change its marker, `groupBy` adds a heading for each day, `variant="card"` puts every item in a card. Dates follow `locale`; the items are shown in the given order. Its state is exposed as `data-variant`, `data-layout`, `data-marker-alignment` and, on each item, `data-status`, `data-variant` and `data-side` for app CSS.
-->
<script lang="ts" module>
	/** One event of a `Timeline`. */
	export interface TimelineItem<Data = unknown> {
		/** Unique key of the item in the list. Defaults to its position. */
		key?: string | number;
		/** Main text of the item. */
		title: string;
		/** Secondary text under the title. */
		description?: string;
		/** When the event happens or starts: a `Date`, an ISO string or a timestamp (a luxon `DateTime` works too). The time is shown when it is not midnight. */
		from?: Date | string | number;
		/** When the event ends. Shown after `from` as a range, such as "24–26 Sep 2026". */
		to?: Date | string | number;
		/** Free text shown instead of the dates, such as "Now" or "09:30". */
		time?: string;
		/** Progress of the item: `done` fills the marker, `current` fills it with the accent color, makes it pulse and sets `aria-current="step"`, `upcoming` leaves it empty. Screen readers read it after the title. */
		status?: 'done' | 'current' | 'upcoming';
		/** SVG path of an icon inside the marker, which grows to fit it. */
		icon?: string;
		/** Color of the marker. Defaults to the primary color, and to the accent color for the current item. */
		variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
		/** Any app data, passed back to the snippets. */
		data?: Data;
	}

	const TIMELINE_ICON =
		'M4 2V8H2V2H4M2 22V16H4V22H2M5 12C5 13.11 4.11 14 3 14C1.9 14 1 13.11 1 12C1 10.9 1.9 10 3 10C4.11 10 5 10.9 5 12M16 4C20.42 4 24 7.58 24 12C24 16.42 20.42 20 16 20C12.4 20 9.36 17.62 8.35 14.35L6 12L8.35 9.65C9.36 6.38 12.4 4 16 4M16 6C12.69 6 10 8.69 10 12C10 15.31 12.69 18 16 18C19.31 18 22 15.31 22 12C22 8.69 19.31 6 16 6M15 13V8H16.5V12.2L19.5 14L18.68 15.26L15 13Z';

	const NARROW_WIDTH = 640;

	function isMidnight(date: Date): boolean {
		return (
			date.getHours() === 0 &&
			date.getMinutes() === 0 &&
			date.getSeconds() === 0 &&
			date.getMilliseconds() === 0
		);
	}

	function machineDate(date: Date): string {
		return isMidnight(date) ? toISODate(date) : toISODateTime(date);
	}
</script>

<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './Timeline.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Divider from '../common/Divider.svelte';
	import NoData from '../common/NoData.svelte';
	import Icon from '../media/Icon.svelte';
	import { dayKey, sameDay, toISODate } from '../../../utils/dates.js';
	import { toISODateTime } from '../../../utils/time.js';
	import { toDate } from '../../../utils/table/values.js';
	import { observeWidth } from '../../../utils/size.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** The events, shown in this order: the timeline does not sort them. */
		items: TimelineItem<Data>[];
		/** Places the items on alternate sides of the line, with the dates on the other side. Below 640px of width the timeline falls back to one column. */
		alternate?: boolean;
		/** `card` puts the content of each item in a card. */
		variant?: 'plain' | 'card';
		/** Where the marker sits next to the content: on the first line (`top`), in the middle or on the last line. */
		markerAlignment?: 'top' | 'center' | 'bottom';
		/** Adds a heading before each run of items in the same group: `day` groups by the day of `from` (or `to`) and then shows only the times, a function returns the heading of each item. */
		groupBy?: 'day' | ((item: TimelineItem<Data>, index: number) => string);
		/** Format of the dates, as `Intl.DateTimeFormat` options. Defaults to day, short month and year, plus hours and minutes when the time is not midnight. */
		dateFormat?: Intl.DateTimeFormatOptions;
		/** Text shown when `items` is empty. Defaults to "No events yet", in the language of `locale`. */
		empty?: string;
		/** BCP 47 locale of the texts and of the dates: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Extra classes on the root element. */
		class?: string;
		/** The root element. */
		timelineElement?: HTMLDivElement;
		/** Replaces everything next to the marker: dates, title, description and the other snippets. `side` is where the content sits, `end` in one column. */
		itemSnippet?: Snippet<[{ item: TimelineItem<Data>; index: number; side: 'start' | 'end' }]>;
		/** Replaces the marker on the line. */
		markerSnippet?: Snippet<[{ item: TimelineItem<Data>; index: number }]>;
		/** Replaces the dates or the `time` text; `text` is what the timeline would show. */
		timeSnippet?: Snippet<[{ item: TimelineItem<Data>; text: string }]>;
		/** Replaces title, `asideSnippet` and description, keeping the dates and `appendSnippet`. */
		contentSnippet?: Snippet<[{ item: TimelineItem<Data>; index: number; side: 'start' | 'end' }]>;
		/** Replaces the title. */
		titleSnippet?: Snippet<[{ item: TimelineItem<Data> }]>;
		/** Replaces the description. */
		descriptionSnippet?: Snippet<[{ item: TimelineItem<Data> }]>;
		/** Content next to the title, on the far side, such as an amount or a badge. */
		asideSnippet?: Snippet<[{ item: TimelineItem<Data> }]>;
		/** Content under the description, such as actions or details. */
		appendSnippet?: Snippet<[{ item: TimelineItem<Data>; index: number }]>;
		/** Replaces the heading of a group made by `groupBy`. */
		groupSnippet?: Snippet<[{ label: string; items: TimelineItem<Data>[] }]>;
		/** Replaces the empty state. */
		emptySnippet?: Snippet;
	}

	let {
		items,
		alternate = false,
		variant = 'plain',
		markerAlignment = 'top',
		groupBy,
		dateFormat,
		empty,
		locale: localeProp,
		class: clazz = '',
		timelineElement = $bindable(),
		itemSnippet,
		markerSnippet,
		timeSnippet,
		contentSnippet,
		titleSnippet,
		descriptionSnippet,
		asideSnippet,
		appendSnippet,
		groupSnippet,
		emptySnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).timeline);

	let width = $state(0);
	let layout = $derived<'single' | 'alternate'>(
		alternate && (width === 0 || width >= NARROW_WIDTH) ? 'alternate' : 'single'
	);

	let formats = $derived.by(() => {
		const date: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
		const time: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
		return {
			date: new Intl.DateTimeFormat(locale, date),
			dateTime: new Intl.DateTimeFormat(locale, { ...date, ...time }),
			time: new Intl.DateTimeFormat(locale, time),
			day: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
			custom: dateFormat && new Intl.DateTimeFormat(locale, dateFormat)
		};
	});

	type Entry = { item: TimelineItem<Data>; index: number; key: string | number };
	type Group = { key: string; label: string; entries: Entry[] };

	function anchorDate(item: TimelineItem<Data>): Date | undefined {
		return toDate(item.from) ?? toDate(item.to);
	}

	let groups = $derived.by(() => {
		const result: Group[] = [];
		let current: Group | undefined;
		let previous: string | number | undefined;
		items.forEach((item, index) => {
			let id: string | number = '';
			let label = '';
			if (groupBy === 'day') {
				const date = anchorDate(item);
				if (date) {
					id = dayKey(date);
					label = formats.day.format(date);
				}
			} else if (groupBy) {
				label = groupBy(item, index);
				id = label;
			}
			if (!current || id !== previous) {
				current = { key: String(index), label, entries: [] };
				result.push(current);
				previous = id;
			}
			current.entries.push({ item, index, key: item.key ?? index });
		});
		return result;
	});

	function timeText(item: TimelineItem<Data>): string {
		if (item.time) return item.time;
		const from = toDate(item.from);
		const to = toDate(item.to);
		const start = from ?? to;
		if (!start) return '';
		const end = from && to ? to : undefined;
		const withTime = !isMidnight(start) || (end !== undefined && !isMidnight(end));
		let format = formats.custom;
		if (!format) {
			if (groupBy === 'day' && (!end || sameDay(start, end))) {
				if (!withTime) return '';
				format = formats.time;
			} else {
				format = withTime ? formats.dateTime : formats.date;
			}
		}
		if (!end) return format.format(start);
		if (end < start) return `${format.format(start)} – ${format.format(end)}`;
		return format.formatRange(start, end);
	}

	function sideOf(index: number): 'start' | 'end' {
		return layout === 'alternate' && index % 2 === 1 ? 'start' : 'end';
	}

	function trackLine(..._dependencies: unknown[]) {
		return (list: HTMLOListElement) => {
			const update = () => {
				const markers = list.querySelectorAll<HTMLElement>(
					':scope > li > .aurora-timeline-marker'
				);
				const first = markers[0];
				const last = markers[markers.length - 1];
				if (!first || !last) return;
				const box = list.getBoundingClientRect();
				const a = first.getBoundingClientRect();
				const b = last.getBoundingClientRect();
				list.style.setProperty('--_line-start', `${a.top + a.height / 2 - box.top}px`);
				list.style.setProperty('--_line-end', `${box.bottom - (b.top + b.height / 2)}px`);
			};
			const observer = new ResizeObserver(update);
			observer.observe(list);
			update();
			return () => observer.disconnect();
		};
	}
</script>

{#snippet time(item: TimelineItem<Data>)}
	{@const text = timeText(item)}
	{#if timeSnippet}
		<div class="aurora-timeline-time">{@render timeSnippet({ item, text })}</div>
	{:else if text}
		{@const date = !item.time && !toDate(item.to) ? anchorDate(item) : undefined}
		{#if date}
			<time class="aurora-timeline-time" datetime={machineDate(date)}>{text}</time>
		{:else}
			<div class="aurora-timeline-time">{text}</div>
		{/if}
	{/if}
{/snippet}

<div
	{...rest}
	bind:this={timelineElement}
	class={['aurora-timeline', clazz]}
	data-variant={variant}
	data-layout={layout}
	data-marker-alignment={markerAlignment}
	{@attach alternate && observeWidth((value) => (width = value))}
>
	{#if items.length === 0}
		{#if emptySnippet}
			{@render emptySnippet()}
		{:else}
			<NoData
				class="aurora-timeline-empty"
				size="sm"
				icon={TIMELINE_ICON}
				title={empty ?? texts.empty}
				{locale}
			/>
		{/if}
	{/if}
	{#each groups as group (group.key)}
		{#if group.label}
			<div class="aurora-timeline-group">
				{#if groupSnippet}
					{@render groupSnippet({
						label: group.label,
						items: group.entries.map((entry) => entry.item)
					})}
				{:else}
					<Divider label={group.label} />
				{/if}
			</div>
		{/if}
		<ol class="aurora-timeline-list" {@attach trackLine(markerAlignment, layout, variant)}>
			{#each group.entries as { item, index, key } (key)}
				{@const side = sideOf(index)}
				<li
					class="aurora-timeline-item"
					data-status={item.status}
					data-variant={item.variant}
					data-side={side}
					aria-current={item.status === 'current' ? 'step' : undefined}
				>
					<span
						class={['aurora-timeline-marker', markerSnippet && 'aurora-timeline-marker-custom']}
						data-icon={item.icon && !markerSnippet ? '' : undefined}
						aria-hidden="true"
					>
						{#if markerSnippet}
							{@render markerSnippet({ item, index })}
						{:else if item.icon}
							<Icon path={item.icon} />
						{/if}
					</span>
					{#if layout === 'alternate' && !itemSnippet}
						<div class="aurora-timeline-opposite">{@render time(item)}</div>
					{/if}
					<div class="aurora-timeline-body">
						{#if itemSnippet}
							{@render itemSnippet({ item, index, side })}
						{:else}
							{#if layout === 'single'}{@render time(item)}{/if}
							{#if contentSnippet}
								{@render contentSnippet({ item, index, side })}
							{:else}
								<div class="aurora-timeline-heading">
									<span class="aurora-timeline-title">
										{#if titleSnippet}{@render titleSnippet({ item })}{:else}{item.title}{/if}
									</span>
									{#if asideSnippet}
										<span class="aurora-timeline-aside">{@render asideSnippet({ item })}</span>
									{/if}
								</div>
								{#if descriptionSnippet}
									<div class="aurora-timeline-description">
										{@render descriptionSnippet({ item })}
									</div>
								{:else if item.description}
									<p class="aurora-timeline-description">{item.description}</p>
								{/if}
							{/if}
							{#if item.status}
								<span class="aurora-timeline-status">{texts[item.status]}</span>
							{/if}
							{#if appendSnippet}
								<div class="aurora-timeline-append">{@render appendSnippet({ item, index })}</div>
							{/if}
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-timeline {
			--_spacing: var(--timeline-item-spacing, var(--timeline-default-item-spacing));
			--_rail: var(--timeline-rail-width, var(--timeline-default-rail-width));
			--_content-gap: var(--timeline-content-gap, var(--timeline-default-content-gap));
			--_first-line: var(--timeline-first-line-height, var(--timeline-default-first-line-height));
			--_line-width: var(--timeline-line-width, var(--timeline-default-line-width));
			--_lead: 0px;

			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: var(--timeline-group-spacing, var(--timeline-default-group-spacing));
			width: var(--timeline-width, var(--timeline-default-width));
			min-width: 0;
		}

		.aurora-timeline[data-variant='card'] {
			--_lead: var(--timeline-card-padding-y, var(--timeline-default-card-padding-y));
		}

		.aurora-timeline-list {
			--_line-start: calc(var(--_lead) + var(--_first-line) / 2);
			--_line-end: 0px;

			position: relative;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-timeline-list::before {
			content: '';
			position: absolute;
			inset-inline-start: calc(var(--_rail) / 2 - var(--_line-width) / 2);
			top: var(--_line-start);
			bottom: var(--_line-end);
			width: var(--_line-width);
			border-radius: var(--global-radius-full);
			background: var(--timeline-line-color, var(--timeline-default-line-color));
		}

		.aurora-timeline[data-layout='alternate'] .aurora-timeline-list::before {
			inset-inline-start: calc(50% - var(--_line-width) / 2);
		}

		.aurora-timeline-list:has(> :only-child)::before {
			display: none;
		}

		.aurora-timeline-item {
			--_color: var(--timeline-marker-color, var(--timeline-default-marker-color));
			--_soft: var(--global-color-primary-soft);
			--_glow: var(--global-color-primary-glow);
			--_on: var(--global-color-on-primary);

			display: grid;
			grid-template-columns: var(--_rail) minmax(0, 1fr);
			column-gap: var(--_content-gap);
			padding-bottom: var(--_spacing);
		}

		.aurora-timeline-item:last-child {
			padding-bottom: 0;
		}

		.aurora-timeline-item[data-status='current']:not([data-variant]) {
			--_color: var(--timeline-current-marker-color, var(--timeline-default-current-marker-color));
			--_soft: var(--global-color-accent-soft);
			--_glow: transparent;
			--_on: var(--global-color-bg);
		}

		.aurora-timeline-item[data-variant='success'] {
			--_color: var(--timeline-default-success-marker-color);
			--_soft: var(--global-color-success-soft);
			--_glow: transparent;
			--_on: var(--global-color-on-success);
		}

		.aurora-timeline-item[data-variant='warning'] {
			--_color: var(--timeline-default-warning-marker-color);
			--_soft: var(--global-color-warning-soft);
			--_glow: transparent;
			--_on: var(--global-color-on-warning);
		}

		.aurora-timeline-item[data-variant='error'] {
			--_color: var(--timeline-default-error-marker-color);
			--_soft: var(--global-color-error-soft);
			--_glow: var(--global-color-error-glow);
			--_on: var(--global-color-on-error);
		}

		.aurora-timeline-item[data-variant='neutral'] {
			--_color: var(--timeline-default-neutral-marker-color);
			--_soft: var(--global-color-surface-3);
			--_glow: transparent;
			--_on: var(--global-color-bg);
		}

		.aurora-timeline-marker {
			--_size: var(--timeline-marker-size, var(--timeline-default-marker-size));

			box-sizing: border-box;
			position: relative;
			grid-column: 1;
			grid-row: 1;
			justify-self: center;
			align-self: start;
			display: grid;
			place-items: center;
			width: var(--_size);
			height: var(--_size);
			margin-top: max(0px, calc(var(--_lead) + var(--_first-line) / 2 - var(--_size) / 2));
			border: var(--timeline-marker-border-width, var(--timeline-default-marker-border-width))
				solid var(--_color);
			border-radius: var(--global-radius-full);
			background: var(--timeline-marker-background, var(--timeline-default-marker-background));
			color: var(--_color);
			--icon-size: var(--timeline-marker-icon-size, var(--timeline-default-marker-icon-size));
		}

		.aurora-timeline-marker[data-icon] {
			--_size: var(--timeline-icon-marker-size, var(--timeline-default-icon-marker-size));
		}

		.aurora-timeline-marker-custom {
			width: auto;
			height: auto;
			min-width: var(--_size);
			min-height: var(--_size);
			border: 0;
			background: none;
		}

		.aurora-timeline[data-marker-alignment='center'] .aurora-timeline-marker {
			align-self: center;
			margin-top: 0;
		}

		.aurora-timeline[data-marker-alignment='bottom'] .aurora-timeline-marker {
			align-self: end;
			margin-top: 0;
			margin-bottom: max(0px, calc(var(--_lead) + var(--_first-line) / 2 - var(--_size) / 2));
		}

		.aurora-timeline-item[data-status='done'] .aurora-timeline-marker:not(.aurora-timeline-marker-custom),
		.aurora-timeline-item[data-status='current'] .aurora-timeline-marker:not(.aurora-timeline-marker-custom) {
			background: var(--_color);
			color: var(--_on);
		}

		.aurora-timeline-item[data-status='done'] .aurora-timeline-marker:not(.aurora-timeline-marker-custom) {
			box-shadow: var(
				--timeline-done-marker-shadow,
				0 0 0 var(--timeline-done-marker-ring-width, var(--timeline-default-done-marker-ring-width))
					var(--_soft),
				0 0 var(--timeline-done-marker-glow-size, var(--timeline-default-done-marker-glow-size))
					var(--_glow)
			);
		}

		.aurora-timeline-item[data-status='current'] .aurora-timeline-marker:not(.aurora-timeline-marker-custom) {
			animation: aurora-timeline-pulse 1.8s infinite;
		}

		.aurora-timeline-body {
			grid-column: 2;
			grid-row: 1;
			min-width: 0;
		}

		.aurora-timeline[data-variant='card'] .aurora-timeline-body {
			box-sizing: border-box;
			padding: var(--timeline-card-padding-y, var(--timeline-default-card-padding-y))
				var(--timeline-card-padding-x, var(--timeline-default-card-padding-x));
			border: var(--timeline-card-border, var(--timeline-default-card-border));
			border-radius: var(--timeline-card-border-radius, var(--timeline-default-card-border-radius));
			background: var(--timeline-card-background, var(--timeline-default-card-background));
			box-shadow: var(--timeline-card-shadow, var(--timeline-default-card-shadow));
		}

		.aurora-timeline[data-layout='alternate'] .aurora-timeline-item {
			grid-template-columns: minmax(0, 1fr) var(--_rail) minmax(0, 1fr);
		}

		.aurora-timeline[data-layout='alternate'] .aurora-timeline-marker {
			grid-column: 2;
		}

		.aurora-timeline[data-layout='alternate'] [data-side='end'] .aurora-timeline-body {
			grid-column: 3;
		}

		.aurora-timeline[data-layout='alternate'] [data-side='start'] .aurora-timeline-body {
			grid-column: 1;
			text-align: end;
		}

		.aurora-timeline[data-layout='alternate'] [data-side='start'] .aurora-timeline-heading {
			flex-direction: row-reverse;
		}

		.aurora-timeline-opposite {
			grid-row: 1;
			align-self: start;
			min-width: 0;
			padding-top: var(--_lead);
		}

		.aurora-timeline[data-marker-alignment='center'] .aurora-timeline-opposite {
			align-self: center;
			padding-top: 0;
		}

		.aurora-timeline[data-marker-alignment='bottom'] .aurora-timeline-opposite {
			align-self: end;
			padding-top: 0;
			padding-bottom: var(--_lead);
		}

		[data-side='end'] > .aurora-timeline-opposite {
			grid-column: 1;
			text-align: end;
		}

		[data-side='start'] > .aurora-timeline-opposite {
			grid-column: 3;
		}

		.aurora-timeline-opposite .aurora-timeline-time {
			line-height: var(--_first-line);
		}

		.aurora-timeline-time {
			display: block;
			color: var(--timeline-time-color, var(--timeline-default-time-color));
			font-family: var(--timeline-time-font-family, var(--timeline-default-time-font-family));
			font-size: var(--timeline-time-font-size, var(--timeline-default-time-font-size));
			line-height: 1.5;
			font-variant-numeric: tabular-nums;
		}

		.aurora-timeline-heading {
			display: flex;
			align-items: baseline;
			gap: 8px;
			margin: 2px 0;
		}

		.aurora-timeline-heading:first-child {
			margin-top: 0;
		}

		.aurora-timeline-title {
			flex: 1 1 auto;
			min-width: 0;
			color: var(--timeline-title-color, var(--timeline-default-title-color));
			font-size: var(--timeline-title-font-size, var(--timeline-default-title-font-size));
			font-weight: var(--timeline-title-font-weight, var(--timeline-default-title-font-weight));
			line-height: 1.4;
			overflow-wrap: anywhere;
		}

		.aurora-timeline-aside {
			flex: 0 0 auto;
		}

		.aurora-timeline-description {
			margin: 0;
			color: var(--timeline-description-color, var(--timeline-default-description-color));
			font-size: var(--timeline-description-font-size, var(--timeline-default-description-font-size));
			line-height: 1.5;
			overflow-wrap: anywhere;
		}

		.aurora-timeline-append {
			margin-top: 8px;
		}

		.aurora-timeline-status {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-timeline-item[data-status='current'] .aurora-timeline-marker:not(.aurora-timeline-marker-custom) {
				animation: none;
			}
		}
	}

	@keyframes aurora-timeline-pulse {
		0% {
			box-shadow: 0 0 0 0 color-mix(in oklab, var(--_color) 60%, transparent);
		}
		100% {
			box-shadow: 0 0 0 8px transparent;
		}
	}
</style>
