import type { ComponentMigration } from '../types.js';

export default {
	from: 'NoData',
	to: 'NoData',
	props: {
		renamed: [
			{ from: 'noItemsText', to: 'title' },
			{
				from: 'iconName',
				to: 'icon',
				note: 'The value changes too: an MDI class name becomes an SVG path (`iconName="mdi-magnify"` → `icon={mdiMagnify}`).'
			}
		],
		changed: [
			{
				name: 'lang',
				native: true,
				note: 'No longer a prop: it still type-checks but becomes the native `lang` attribute of the root, which would mark the English default title ("No data available") as Italian. Delete it; where `lang="it"` relied on the Italian default, pass `title="Nessun dato disponibile"`.'
			}
		],
		defaults: [
			{
				name: 'icon',
				v4: "'mdi-database-off'",
				v5: 'mdiDatabaseOffOutline',
				keepV4: 'icon={mdiDatabaseOff}',
				note: 'The outline variant of the same icon.'
			}
		],
		icons: ['icon']
	},
	cssVars: {
		changed: [
			{
				name: '--no-data-height',
				note: 'Still the height, but the space now comes from a `min-height` of 200px (`size="sm"`: 120px) that wins over a smaller value. Where the v4 value is below that, also set `--no-data-min-height` (the same value, or `0`).'
			},
			{
				name: '--no-data-default-height',
				note: 'Default `auto` now (v4: 200px); the space comes from `--no-data-default-min-height` (200px) and `--no-data-default-sm-min-height` (120px). An app default below that needs those set too.'
			}
		]
	},
	manual: [
		{
			id: 'no-data-look',
			summary:
				'The default (`size="md"`) is a framed icon with dashed rings, a 19px title in the display font, optional description and actions; v4 was a dimmed 40px icon and 12px text. `size="sm"` is close to the v4 look.',
			action:
				'Pass `size="sm"` where NoData sits inside a table, list, card or other small space; keep the default for full pages and panels. Remove app workarounds for the v4 25% text opacity.'
		},
		{
			id: 'no-data-class',
			summary: '`class` is on the root element (v4: on the text `<span>`).',
			action:
				'Check app classes passed to NoData: text styles (color, size) now apply to the whole block; target `.aurora-no-data-title` inside the class or use `--no-data-title-*`.',
			when: { props: ['class'] }
		}
	],
	added: [
		'`description`, `size` (`sm` | `md`) and `data-size`.',
		'`children` (actions under the text), `titleSnippet({ title })`, `descriptionSnippet({ description })`, `iconSnippet`.',
		'`icon=""` removes the icon; native attributes on the root.',
		'`--no-data-min-height`, `-padding`, `-max-width`, `--no-data-icon-*`, `-ring-color`, `--no-data-title-*`, `--no-data-description-*`, `-actions-gap`.'
	]
} satisfies ComponentMigration;
