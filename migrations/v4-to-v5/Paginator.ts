import type { ComponentMigration } from '../types.js';

export default {
	from: 'Paginator',
	to: 'Paginator',
	props: {
		renamed: [
			{
				from: 'maxPage',
				to: 'pageCount',
				note: 'Same meaning. `bind:maxPage` becomes `pageCount={maxPage}`: the paginator never wrote it.'
			}
		],
		changed: [
			{
				name: 'page',
				note: 'Still bindable and 1-based, but the paginator no longer clamps it to the last page (v4 set `page = maxPage` without calling `onchange`, so the data did not reload). See `paginator-page-past-count`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { 'detail.page': 'page', detail: '' },
				type: '{ page: number }',
				note: 'The same object without `detail`: `e.detail.page` → `e.page`. It is no longer called for the page that is already current (v4 called it for first and last even on the first or last page).'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--paginator-page-button-background-color', to: '--paginator-button-background' },
			{ from: '--paginator-page-button-color', to: '--paginator-button-color' },
			{ from: '--paginator-page-button-padding', to: '--paginator-button-padding' },
			{ from: '--paginator-page-button-border-radius', to: '--paginator-button-border-radius' },
			{ from: '--paginator-page-button-hover-background-color', to: '--paginator-button-hover-background' },
			{ from: '--paginator-page-button-selected-background-color', to: '--paginator-current-background' },
			{ from: '--paginator-page-button-selected-color', to: '--paginator-current-color' },
			{ from: '--paginator-default-page-button-background-color', to: '--paginator-default-button-background' },
			{ from: '--paginator-default-page-button-color', to: '--paginator-default-button-color' },
			{ from: '--paginator-default-page-button-padding', to: '--paginator-default-button-padding' },
			{ from: '--paginator-default-page-button-border-radius', to: '--paginator-default-button-border-radius' },
			{
				from: '--paginator-default-page-button-hover-background-color',
				to: '--paginator-default-button-hover-background'
			},
			{
				from: '--paginator-default-page-button-selected-background-color',
				to: '--paginator-default-current-background'
			},
			{ from: '--paginator-default-page-button-selected-color', to: '--paginator-default-current-color' }
		],
		removed: [
			...['--paginator-page-button-hover-border-radius', '--paginator-default-page-button-hover-border-radius'].map(
				(name) => ({
					name,
					note: 'The radius no longer changes on hover: drop it, or set the same value on `--paginator-button-border-radius`.'
				})
			),
			...[
				'--paginator-page-button-selected-padding',
				'--paginator-default-page-button-selected-padding'
			].map((name) => ({
				name,
				note: 'The current page has the padding of the other buttons; it is centred in a `--paginator-button-size` square.',
				replacement: '--paginator-button-padding'
			})),
			...[
				'--paginator-page-button-focus-color',
				'--paginator-page-button-focus-background-color',
				'--paginator-default-page-button-focus-color',
				'--paginator-default-page-button-focus-background-color'
			].map((name) => ({
				name,
				note: 'v4 recolored a focused button, after a mouse click too; v5 draws a focus ring for keyboard users only. Use `--paginator-focus-ring-color` and `--paginator-focus-ring-width`.'
			}))
		]
	},
	manual: [
		{
			id: 'paginator-page-past-count',
			kind: 'review',
			summary:
				'v4 moved `page` back to `maxPage` when `maxPage` shrank (for example after a filter), without calling `onchange`; v5 leaves `page` as it is, marks no number and makes "previous" go to the last page.',
			action:
				'Where filters, search or page size change the results, set `page = 1` before loading them (the usual `handleFilterChange` already does). Where the app relied on the clamp, clamp it there: `page = Math.min(page, pageCount)` before loading.',
			when: { props: ['maxPage'] }
		},
		{
			id: 'paginator-look',
			kind: 'review',
			summary:
				'Default look changed: the prototype window `« ‹ 1 … 6 7 8 … 24 › »` (v4: previous, current and next page only) with mono digits, 30px buttons and a filled current page; first and previous are disabled on the first page, next and last on the last one.',
			action:
				'Usually accept it. For fewer numbers pass `siblingCount={0}`; for a narrow space use `compact`. App CSS that targeted `.paginator-container`, `.page-button` or `.selected` must target `.aurora-paginator`, `.aurora-paginator-button` and `[aria-current="page"]`, or use the `class` parts.'
		},
		{
			id: 'paginator-local-copies',
			kind: 'edit',
			summary:
				'Six apps keep a copy of the v4 paginator in `$lib/components/common/StandardPaginator.svelte` (Svelte 4 syntax, `on:change`, MDI icon classes).',
			action:
				'Replace `<StandardPaginator bind:page {maxPage} on:change={handler} />` with `<Paginator bind:page pageCount={maxPage} onchange={handler} />` from the library, read `e.page` instead of `e.detail.page`, and delete the copy when nothing imports it.',
			scope: 'app'
		},
		{
			id: 'paginator-url',
			kind: 'review',
			summary:
				'With `pageHref` the controls are links, so the page can live in the URL, open in a new tab and be preloaded by SvelteKit.',
			action:
				'Where `onchange` only calls `goto` with the page in the URL and `load` reads it from there, pass `pageHref={(page) => \'?page=\' + page}` and drop the `goto`.',
			when: { events: ['onchange'] }
		}
	],
	added: [
		'`siblingCount` (pages on each side of the current one) and `showFirstLast`.',
		'`compact`: "7 / 24" between the arrows, read as "Page 7 of 24" by screen readers.',
		'`pageHref(page)`: links instead of buttons.',
		'`pageSnippet({ page, current })` and the icons `firstIcon`, `previousIcon`, `nextIcon`, `lastIcon` (SVG paths).',
		'`<nav>` with `aria-label`, `aria-current="page"`, accessible names of the arrows and pages from `locale` (`firstLabel`, `previousLabel`, `nextLabel`, `lastLabel`, `pageLabel`, `statusLabel`).',
		'`bind:paginatorElement`, `class` parts (`container`, `button`, `current`), native attributes on the `<nav>`, `data-compact`, `data-current`.',
		'`--paginator-gap`, `-font-family`, `-font-size`, `-icon-size`, `-button-size`, `-button-font-weight`, `-button-hover-color`, `-current-box-shadow`, `-current-font-weight`, `-ellipsis-*`, `-status-*`, `-disabled-opacity`, `-focus-ring-*`, `-duration`, `-easing`.'
	]
} satisfies ComponentMigration;
