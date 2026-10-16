import type { LocalMigration } from '../../types.js';

export default {
	from: 'InfoBox',
	to: 'AlertBanner',
	files: ['InfoBox.svelte'],
	contains: ['message'],
	summary: 'The local `InfoBox` copy becomes `AlertBanner` of the library.',
	props: {
		renamed: [
			{ from: 'type', to: 'variant' },
			{ from: 'message', to: 'description' }
		],
		removed: [{ name: 'width', note: 'Use `--alert-banner-width`.' }]
	},
	snippets: {
		renamed: [
			{ from: 'messageSnippet', to: 'descriptionSnippet' },
			{
				from: 'alertBannerContentSnippet',
				to: 'children',
				note: 'Content under the title and the description; pass `title` and `description` as props.'
			}
		]
	},
	manual: [
		{
			id: 'info-box-look',
			summary: 'The colored boxes of the copy (per type backgrounds and borders) become the Aurora banners of each variant.',
			action: 'Nothing to do unless a page relied on the strong colors: `--alert-banner-background` and `--alert-banner-border-color` change them.'
		}
	]
} satisfies LocalMigration;
