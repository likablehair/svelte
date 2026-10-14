import type { ComponentMigration } from '../types.js';
import { activatorStep, drawerHeightStep, drawerPropsNote, menuPropsNote } from './MenuOrDrawer.js';

export default {
	from: 'MenuOrDrawerOptions',
	to: 'MenuOrDrawerOptions',
	props: {
		renamed: [
			{
				from: 'elements',
				to: 'options',
				note: 'Each element changes too (`MenuOrDrawerOption`): see `menu-or-drawer-options-items`.'
			}
		],
		changed: [
			{ name: 'menuProps', note: menuPropsNote },
			{ name: 'drawerProps', note: drawerPropsNote }
		]
	},
	events: {
		changed: [
			{
				name: 'onselect',
				argument: { 'detail.element': 'option', detail: '' },
				type: '{ option: MenuOrDrawerOption<Data>; event: MouseEvent }',
				note: '`e.detail.element` → `e.option`, with the v5 fields (`label` instead of `title`). The menu still closes by itself, and now gives the focus back to the activator. Handlers typed by hand with `Parameters<NonNullable<ComponentProps<typeof MenuOrDrawerOptions>["onselect"]>>[0]` can use `{ option: MenuOrDrawerOption }`.'
			}
		]
	},
	manual: [
		{
			id: 'menu-or-drawer-options-items',
			summary:
				'The options are `MenuOrDrawerOption` objects: `title` → `label`, `icon` is an SVG path, `style` and `appendIcon` are gone.',
			action:
				'In every element: rename `title` to `label` (a number becomes a string); convert `icon` with the global icon rule (`"mdi-pencil"` → `mdiPencil` from `@mdi/js`); replace `style: { color: <error color> }` (delete actions) with `variant: "danger"`, and any other `style` with `class` plus app CSS; remove `appendIcon` (it did nothing in v4). `name`, `description`, `disabled` and `data` stay. Type the array as `MenuOrDrawerOption[]`, imported from the library. Options that call `data.action()` from `onselect` can use the option `onclick` instead.',
			when: { props: ['elements'] }
		},
		activatorStep('menu-or-drawer-options'),
		drawerHeightStep('menu-or-drawer-options')
	],
	added: [
		'Options take `shortcut` (key hint), `checked` (check mark, `menuitemcheckbox`), `divider` (line above), `class` and `onclick`.',
		'Keyboard: the first option takes the focus on open, arrows, Home, End and first letter move, Enter and Space choose; disabled options stay reachable with `aria-disabled`.',
		'`aria-label` names the menu and the sheet (default "Actions", from `locale`).',
		'`optionSnippet` replaces the content of each option.',
		'`mode`, `menuElement` and `drawerElement`, as in MenuOrDrawer.'
	]
} satisfies ComponentMigration;
