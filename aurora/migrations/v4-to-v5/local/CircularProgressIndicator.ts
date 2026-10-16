import type { LocalMigration } from '../../types.js';

export default {
	from: 'CircularProgressIndicator',
	to: 'CircularLoader',
	files: ['CircularProgressIndicator.svelte'],
	summary: 'The local `CircularProgressIndicator` copy becomes `CircularLoader` of the library, with `value`.',
	props: {
		renamed: [{ from: 'progress', to: 'value', note: 'From 0 to `total` (100 by default).' }]
	},
	cssVars: {
		renamed: [
			{ from: '--circular-progress-indicator-height', to: '--circular-loader-size' },
			{ from: '--circular-progress-indicator-width', to: '--circular-loader-size' },
			{ from: '--circular-progress-indicator-color', to: '--circular-loader-color' }
		]
	},
	manual: [
		{
			id: 'circular-progress-indicator-track',
			summary: 'CircularLoader draws its own track (`--circular-loader-track-color`).',
			action:
				'Where two indicators were stacked to draw a track (one at 100 under the real one), remove the one at 100 and set `--circular-loader-track-color` on the other.'
		}
	]
} satisfies LocalMigration;
