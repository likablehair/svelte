import type { LocalMigration } from '../../types.js';

export default {
	from: 'ThemeSwitch',
	to: 'ModeSwitch',
	files: ['ThemeSwitch.svelte'],
	summary: 'The local `ThemeSwitch` copy becomes `ModeSwitch` of the library (light, system, dark).',
	props: {
		removed: [
			{
				name: 'value',
				note: 'ModeSwitch shows the mode of the page by itself (the copies started "off" in dark mode when `value` was not passed).',
				drop: true
			},
			{
				name: 'prefersDark',
				note: '"System" is a choice that stays available in ModeSwitch.',
				drop: true
			},
			{
				name: 'themeSetted',
				note: '"System" is a choice that stays available in ModeSwitch.',
				drop: true
			}
		]
	},
	manual: [
		{
			id: 'theme-switch-look',
			kind: 'review',
			summary:
				'Three icons in a pill (light, system, dark) instead of a two-state switch: about 120px wide (100px with `size="sm"`) against 40px.',
			action:
				'In a top bar use `size="sm"`; at the bottom of a sidebar `tooltipPlacement="top"`; to offer only light and dark, as the copy did, `system={false}`. The saved choice keeps the `theme` key of localStorage, so users keep it.'
		}
	]
} satisfies LocalMigration;
