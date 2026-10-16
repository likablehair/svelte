import type { LocalMigration } from '../../types.js';

export default {
	from: 'TabToggleSwitch',
	to: 'TabSwitcher',
	files: ['TabToggleSwitch.svelte'],
	summary: 'The local `TabToggleSwitch` copy becomes `TabSwitcher` of the library with the segmented look.',
	exports: [{ from: 'TabToggle', to: 'Tab' }],
	props: {
		renamed: [{ from: 'activeTab', to: 'selected' }],
		removed: [
			{ name: 'maxWidth', note: 'Tabs that do not fit scroll sideways.', drop: true },
			{ name: 'minWidth', note: 'Tabs that do not fit scroll sideways.', drop: true },
			{ name: 'equalWidth', note: 'The segmented tabs size to their text.', drop: true },
			{ name: 'scrollOnOverflow', note: 'Tabs that do not fit always scroll sideways.', drop: true }
		],
		defaults: [{ name: 'variant', v4: 'a segmented pill', v5: "'underline'", keepV4: 'variant="segmented"', behaviour: true }]
	},
	events: {
		changed: [
			{
				name: 'onTabChange',
				to: 'ontabClick',
				argument: { '': 'tab.name' },
				type: '{ tab: Tab; nativeEvent: MouseEvent }',
				note: 'The handler receives `{ tab, nativeEvent }`: the name of the tab is `tab.name`.'
			}
		]
	},
	items: [
		{
			prop: 'tabs',
			keys: [{ from: 'redirectUrl', to: 'href' }],
			note: 'Each tab is a `Tab`: `name`, `label`, `icon` (an `@mdi/js` path), `href`, `badge`, `disabled`.'
		}
	],
	manual: [
		{
			id: 'tab-toggle-switch-links',
			kind: 'edit',
			summary: 'Tabs with `href` are links that navigate by themselves (the copy only preloaded `redirectUrl` and the app navigated in `onTabChange`).',
			action: 'Remove the `goto` from `ontabClick` where the tab has `href`, or it navigates twice.'
		}
	]
} satisfies LocalMigration;
