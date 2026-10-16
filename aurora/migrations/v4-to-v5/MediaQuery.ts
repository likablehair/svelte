import type { ComponentMigration } from '../types.js';

export default {
	from: 'MediaQuery',
	to: 'MediaQuery',
	snippets: {
		parameters: [
			{
				name: 'defaultSnippet',
				v4: '{ xs, s, m, l, xl, xsAndDown, sAndDown, mAndDown, lAndDown, xlAndDown, xsAndUp, sAndUp, mAndUp, lAndUp, xlAndUp }',
				v5: '{ xs, s, m, l, xl, xsAndDown, sAndDown, mAndDown, lAndDown, xlAndDown, xsAndUp, sAndUp, mAndUp, lAndUp, xlAndUp }',
				note: 'Same flags and widths. `sAndUp` is now false on `xs` (v4 included it by mistake).'
			}
		]
	},
	manual: [
		{
			id: 'media-query-server',
			kind: 'review',
			summary:
				'On the server the window now counts as wide (`xl`, every `...AndUp` true); v4 rendered the mobile variant first.',
			action:
				'Usually nothing to do. Where a page must render the mobile markup on the server, choose it from the request (for example the user agent) in `load` instead of `MediaQuery`.',
			scope: 'app'
		},
		{
			id: 'media-query-scripts',
			kind: 'review',
			summary: 'In scripts the same flags are reactive as `breakpoints` (`breakpoints.mAndDown`), without the component.',
			action:
				'Where a `<MediaQuery>` wraps a whole component only to read one flag, or where the v4 `mediaQuery` store was subscribed, read `breakpoints` in a `$derived` instead.'
		}
	],
	added: ['`breakpoints` (reactive flags for scripts) and `BREAKPOINTS` (the widths: 425, 768, 1024, 1440).']
} satisfies ComponentMigration;
