import type { ComponentMigration } from '../types.js';

export default {
	from: 'SimpleTimeLine',
	to: 'Timeline',
	props: {
		renamed: [
			{
				from: 'circleAlignment',
				to: 'markerAlignment',
				note: 'Same values. `bottom` now really puts the marker on the last line (v4 wrote an invalid `align-items` and left it at the top).'
			}
		],
		removed: [
			{
				name: 'singleSided',
				note: 'One column is now the default. Drop `singleSided`; where it was missing or false (the v4 alternate layout) add `alternate`, which also falls back to one column below 640px of width.',
				replacement: 'alternate'
			}
		],
		defaults: [
			{
				name: 'alternate',
				v4: 'true (without singleSided)',
				v5: 'false',
				keepV4: 'alternate',
				note: 'Add `keepV4` only where the v4 usage had no `singleSided`.'
			}
		],
		types: [
			{
				name: 'items',
				v4: '{ name: string; title?: string; description?: string; imageUrl?: string; from?: Date; to?: Date; data?: Data }[]',
				v5: 'TimelineItem<Data>[]',
				note: 'See the `timeline-items` step: `title` is required and shown, `name` is gone, `imageUrl` is gone.'
			}
		]
	},
	snippets: {
		renamed: [
			{ from: 'circleSnippet', to: 'markerSnippet' },
			{ from: 'timesSnippet', to: 'timeSnippet' },
			{ from: 'infosSnippet', to: 'contentSnippet' },
			{ from: 'infosAppendSnippet', to: 'appendSnippet' }
		],
		parameters: [
			{
				name: 'itemSnippet',
				v4: '{ item, alignment }',
				v5: '{ item, index, side }',
				note: "`alignment` ('left' | 'right') becomes `side` ('start' | 'end'): v4 'right' is 'end'; in one column v4 said 'left' and v5 says 'end' (the content is after the line). As in v4 it does not replace the marker; with `alternate` the dates on the other side of the line are not shown either."
			},
			{
				name: 'timeSnippet',
				v4: '{ item, dateToString }',
				v5: '{ item, text }',
				note: '`text` is the formatted date (or `item.time`). Code that formatted `item.from` itself can keep doing it, or use `text`.'
			},
			{
				name: 'contentSnippet',
				v4: '{ item, alignment }',
				v5: '{ item, index, side }',
				note: 'Same mapping of `alignment` to `side` as `itemSnippet`.'
			},
			{
				name: 'appendSnippet',
				v4: '{ item, alignment }',
				v5: '{ item, index }'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--simple-time-line-gap',
				to: '--timeline-item-spacing',
				note: 'Default 22px instead of 16px.'
			},
			{
				from: '--simple-time-line-line-background',
				to: '--timeline-line-color',
				note: 'Still painted as a background, so it takes a gradient; the default is the theme gradient instead of a grey line.'
			},
			{ from: '--simple-time-line-line-width', to: '--timeline-line-width' },
			{
				from: '--simple-time-line-circle-background-color',
				to: '--timeline-marker-color',
				note: 'Colors the border of every marker and the fill of the done and current ones; empty markers use `--timeline-marker-background`.'
			},
			{ from: '--simple-time-line-width', to: '--timeline-width' }
		],
		removed: [
			...['--simple-time-line-circle-width', '--simple-time-line-circle-height'].map((name) => ({
				name,
				note: 'One size for both sides.',
				replacement: '--timeline-marker-size'
			})),
			{
				name: '--simple-time-line-height',
				note: 'The timeline is as tall as its items. To limit it, wrap it in a scrolling container or pass a `class`.'
			},
			...[
				'--simple-time-line-divider-width',
				'--simple-time-line-central-line-left',
				'--simple-time-line-body-width'
			].map((name) => ({
				name,
				note: 'v4 wrote these inline on the root, so apps could not change them. The column of the line is `--timeline-rail-width`, the space after it `--timeline-content-gap`.'
			}))
		]
	},
	items: [
		{
			prop: 'items',
			keys: [{ from: 'name', to: 'title', note: 'where both exist, rename `name` to `key` if it is a unique id, else drop it' }],
			drop: ['imageUrl'],
			note: 'items need a `title` (v4 `name`, never displayed); `imageUrl` is gone (v4 never read it)'
		}
	],
	manual: [
		{
			id: 'timeline-items',
			kind: 'edit',
			summary:
				'Items need a `title`, the text the timeline shows; v4 required `name`, which it never displayed, and apps used it as the visible title in their snippets. The codemod renames `name` to `title` where the items are written in the same file.',
			action:
				'In the snippets read `item.title` instead of `item.name`. Import the `TimelineItem` type from the library instead of `ComponentProps<...>` or a local copy.',
			when: { snippets: ['itemSnippet', 'circleSnippet', 'timesSnippet', 'infosSnippet', 'infosAppendSnippet'] }
		},
		{
			id: 'timeline-dates',
			kind: 'review',
			summary:
				'Dates are formatted with `locale` (day, short month, year, plus the time when it is not midnight) and `from`–`to` on one line; v4 always wrote Italian dates without the time, on two lines.',
			action:
				'Pass `locale` (or call `setDefaultLocale`) so the dates are not in English. Many apps format the dates themselves in `itemSnippet`/`timesSnippet` (luxon or `Intl`): they can drop that code and let the timeline format them, use `dateFormat` for a different format, or keep it in `timeSnippet`. A free label such as "Now" goes in `item.time`.'
		},
		{
			id: 'timeline-look',
			kind: 'review',
			summary:
				'New look: one column, theme-gradient line that stops at the first and last marker, empty markers (filled with `status: "done"`), date above the title.',
			action:
				'Usually nothing to do. Add `status` to the items to show progress; `variant="card"` puts each item in a card (replaces app wrappers with a background and radius); `asideSnippet` holds an amount or a badge next to the title; `appendSnippet` holds actions. Drop wrappers that existed only to contain the v4 `z-index: 5` of the markers (`isolation: isolate`).'
		},
		{
			id: 'timeline-separators',
			kind: 'review',
			summary:
				'Day separators made with fake items (for example `name: "__separator__"` plus an empty `circleSnippet`) can be replaced by `groupBy`.',
			action:
				'Remove the fake items and pass `groupBy="day"` (a heading per day, items show only their time) or `groupBy={(item) => label}`; `groupSnippet` replaces the heading.',
			when: { snippets: ['circleSnippet', 'itemSnippet'] }
		},
		{
			id: 'timeline-empty',
			kind: 'review',
			summary: 'With no items the timeline shows an empty state.',
			action:
				'Remove the `{#if items.length}` / empty message written around the timeline, or move the message to `empty` (text) or `emptySnippet`.'
		},
		{
			id: 'timeline-local-copies',
			kind: 'edit',
			summary:
				'Several apps hold a copied `StandardSimpleTimeline.svelte` wrapper, often unused, that passes v1 props (`circleColor`, `circleDiameter`, `timesWidth`, `firstItemMarginTop`) ignored since v3.',
			action:
				'Delete the copies nothing imports. In the used ones drop the v1 props and apply the steps above, or replace the wrapper with `Timeline` directly.',
			scope: 'app'
		}
	],
	added: [
		'`status` per item (done, current, upcoming) with `aria-current="step"` and text for screen readers.',
		'`icon` and `variant` per item: an icon inside the marker and its color.',
		'`time` per item: a free label instead of the dates.',
		'`groupBy` (`day` or a function) with `groupSnippet`.',
		'`variant="card"`.',
		'`dateFormat` and `locale` for the dates.',
		'`empty` and `emptySnippet`.',
		'`titleSnippet`, `descriptionSnippet`, `asideSnippet`, `itemSnippet` with `index`.',
		'`bind:timelineElement`, `class` and native attributes on the root.',
		'`data-variant`, `data-layout`, `data-marker-alignment` on the root and `data-status`, `data-variant`, `data-side` on each item.',
		'`--timeline-*` variables for every part (markers by status and variant, time, title, description, card, groups).'
	]
} satisfies ComponentMigration;
