import type { LocalMigration } from '../../types.js';

export default {
	from: 'WidgetNoData',
	to: 'NoData',
	files: ['WidgetNoData.svelte'],
	summary: 'The local `WidgetNoData` copy becomes `NoData` of the library.',
	cssVars: {
		renamed: [
			{ from: '--title-font-size', to: '--no-data-title-font-size' },
			{ from: '--description-font-size', to: '--no-data-description-font-size' },
			{ from: '--title-margin-bottom', to: '--no-data-gap', note: 'The space between all the parts (icon, title, description).' },
			{ from: '--content-padding', to: '--no-data-padding' }
		]
	},
	manual: [
		{
			id: 'widget-no-data-look',
			kind: 'review',
			summary: 'NoData has an icon above the title and the Aurora look; without `title` it shows the library default ("Nessun dato" in Italian).',
			action: 'Pass `icon=""` to hide the icon in a small widget; pass `title` where the default text of the copy ("Nessun dato presente") mattered.'
		}
	]
} satisfies LocalMigration;
