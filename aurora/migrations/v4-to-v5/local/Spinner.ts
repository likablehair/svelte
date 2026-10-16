import type { LocalMigration } from '../../types.js';

export default {
	from: 'Spinner',
	to: 'CircularLoader',
	files: ['Spinner.svelte'],
	contains: ['progress-spinner'],
	summary: 'The local `Spinner` copy becomes `CircularLoader` of the library.',
	manual: [
		{
			id: 'spinner-visible',
			kind: 'review',
			summary:
				'The copy relied on Bootstrap Italia classes that the apps do not load, so it showed only the text "Caricamento..."; CircularLoader draws a spinning ring, announced as "Caricamento" with the Italian locale.',
			action: 'Check the buttons and forms that show it while loading; `--circular-loader-size` changes its size.'
		}
	]
} satisfies LocalMigration;
