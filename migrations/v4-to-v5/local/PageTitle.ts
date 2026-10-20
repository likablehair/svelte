import type { LocalMigration } from '../../types.js';

export default {
	from: 'PageTitle',
	to: 'PageHeader',
	files: ['PageTitle.svelte'],
	summary: 'The local `PageTitle` copy becomes `PageHeader` of the library.',
	appDefaults: [
		{
			cssVar: '--page-header-default-margin-bottom',
			value: '16px',
			note: 'the space the PageTitle copies left under the title'
		}
	],
	props: {
		renamed: [
			{
				from: 'prependVisible',
				to: 'back',
				note: 'Shows the back control. Without `backHref` it calls `history.back()`, as the copies did.'
			},
			{
				from: 'prependRoute',
				to: 'backHref',
				note: 'A link to the route, preloaded on hover. Without `prependVisible` the copies showed nothing: if so, remove `backHref`.'
			},
			{ from: 'titleBack', to: 'backLabel' },
			{ from: 'iconBack', to: 'backIcon', note: 'An SVG path from `@mdi/js`.' },
			{
				from: 'handleBackClick',
				to: 'onback',
				note: 'Runs before the navigation; `event.preventDefault()` stops it, for example to save and then `goto`.'
			},
			{ from: 'titleSize', to: 'size', note: '`s` and `xs` become `sm`, the rest `md`.' }
		],
		parentRoute: {
			from: 'prependVisible',
			to: 'backHref',
			unless: ['prependRoute'],
			note: 'In a `+page.svelte` the back control without a route becomes a link to the parent page (the nearest existing page up the path, `(groups)` left out), so a page opened from outside (an email, a new tab) no longer leaves the app; it goes to that page instead of the previous one. Not done when a parameter (`[id]`) comes first: there `back` keeps `history.back()`.'
		},
		values: [{ name: 'size', values: { s: 'sm', xs: 'sm', sm: 'sm', m: 'md', md: 'md', l: 'md', lg: 'md', xl: 'md' } }],
		removed: [
			{
				name: 'marginTop',
				note: 'Space above comes from the layout (`gap`) or `style="margin-top: …"` on the PageHeader.'
			},
			{
				name: 'paddingTop',
				note: 'Space above comes from the layout (`gap`) or `style="padding-top: …"` on the PageHeader.'
			},
			{ name: 'titleClass', note: 'Use `class={{ title: "…" }}`.' },
			{ name: 'subtitleClass', note: 'Use `class={{ subtitle: "…" }}`.' },
			{
				name: 'previousPageUrl',
				note: 'Replaced by `backHref`, a native link that SvelteKit preloads on hover.',
				drop: true
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclick',
				to: 'onback',
				argument: {},
				type: 'MouseEvent',
				note: 'The click on the back control.'
			},
			{
				name: 'on:click',
				to: 'onback',
				argument: {},
				type: 'MouseEvent',
				note: 'Svelte 4 event directive of older app code: the click on the back control.'
			}
		]
	},
	snippets: {
		renamed: [
			{ from: 'appendSnippet', to: 'actionsSnippet' },
			{ from: 'append', to: 'actionsSnippet' },
			{
				from: 'prependSnippet',
				to: 'backSnippet',
				note: 'It replaces the icon and the text inside the back control, which stays a link or a button. Content before the title (an avatar) goes in `prependSnippet`.'
			},
			{
				from: 'prepend',
				to: 'backSnippet',
				note: 'It replaces the icon and the text inside the back control, which stays a link or a button. Content before the title (an avatar) goes in `prependSnippet`.'
			}
		]
	},
	manual: [
		{
			id: 'page-title-heading',
			kind: 'review',
			summary:
				'The title is an `h1` heading with the Aurora look (26px display font); the copies drew a big bold `div` with Tailwind classes.',
			action:
				'Inside a component, a panel or a dialog pass `headingLevel={2}` (or deeper) and `size="sm"`. Remove app CSS aimed at the classes of the copy (`.title`, `.prepend-button`).'
		},
		{
			id: 'page-title-subtitle-with-title-snippet',
			kind: 'review',
			summary: 'With `titleSnippet` the copies hid `subtitle`; PageHeader shows it under the title.',
			action: 'Remove `subtitle` where it was passed together with a title snippet and was not visible.',
			when: { snippets: ['titleSnippet'] }
		},
		{
			id: 'page-title-route-without-back',
			kind: 'review',
			summary: '`prependRoute` without `prependVisible` showed nothing; `backHref` shows the back link.',
			action: 'If the page had no back link, remove `backHref`.',
			when: { props: ['prependRoute'] }
		}
	]
} satisfies LocalMigration;
