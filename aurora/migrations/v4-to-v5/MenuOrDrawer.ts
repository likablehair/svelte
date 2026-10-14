import type { ComponentMigration, ManualStep } from '../types.js';

export const menuPropsNote =
	'Takes the props of the v5 `Menu`, except `open`, `activator`, `placement`, `menuElement` and `children`. `activator` becomes the `activator` prop and `anchor` the `placement` prop (see the `-activator` step). The other v4 keys follow the Menu rule: `_activatorGap` → `offset`; `_width`, `_height`, `_maxHeight`, `_minWidth`, `_boxShadow`, `_borderRadius` → style props `--menu-width`, `--menu-height`, `--menu-max-height`, `--menu-min-width`, `--menu-box-shadow`, `--menu-border-radius` on this component; `flipOnOverflow`, `stayInViewport`, `refreshPosition`, `openingId` are always on or automatic: delete them. It is no longer bindable and no longer written to.';

export const drawerPropsNote =
	'Takes the props of the v5 `Drawer`, except `open`, `drawerElement` and `children`; `position` still defaults to `bottom`. `_space` becomes the style prop `--drawer-size` on this component (`_space: "60dvh"` → `--drawer-size="60dvh"`), `_borderRadius` → `--drawer-border-radius`; the other keys follow the Drawer rule.';

export const activatorStep = (prefix: string): ManualStep => ({
	id: `${prefix}-activator`,
	summary: '`activator` and `anchor` move out of `menuProps` into the `activator` and `placement` props.',
	action:
		'`menuProps={{ activator: x, anchor: "right", flipOnOverflow: true }}` → `activator={x} placement="right-start"`. Convert `anchor` with the values of the Menu rule: `bottom-center` → `bottom`, `bottom` → `bottom-start`, `up-center` → `top`, `up` → `top-start`, `right` → `right-start`, `left` → `left-start`, `right-center` → `right`, `left-center` → `left`. Without `anchor` keep the default: the v5 default `bottom` is the v4 default `bottom-center`. Remove `menuProps` when nothing is left in it. Where the app reads the activator from a `bind:activator` on the component (v3 API, it never worked in v4), pass `activator` instead.',
	when: { props: ['menuProps'] }
});

export const drawerHeightStep = (prefix: string): ManualStep => ({
	id: `${prefix}-drawer-height`,
	summary:
		'The bottom drawer is as tall as its content, up to 85% of the screen; v4 used the 20rem of the Drawer (MenuOrDrawerOptions: 56px per option, up to 5).',
	action:
		'Move `drawerProps._space` to the style prop `--drawer-size` on the component. Without `_space` nothing to do for content of normal height. Content that filled a fixed height (`height: 100%`, a list that must take the whole sheet) needs `--drawer-size`.',
	when: { props: ['drawerProps'] }
});

export default {
	from: 'MenuOrDrawer',
	to: 'MenuOrDrawer',
	props: {
		changed: [
			{ name: 'menuProps', note: menuPropsNote },
			{ name: 'drawerProps', note: drawerPropsNote }
		]
	},
	manual: [
		activatorStep('menu-or-drawer'),
		drawerHeightStep('menu-or-drawer'),
		{
			id: 'menu-or-drawer-surface',
			summary:
				'The menu draws its own surface (background, border, radius, shadow, 4px padding) and the drawer body its own padding; in v4 the apps built the box of the menu in the content.',
			action:
				'In `children`, remove the box the app draws when `isDrawer` is false (background, border, radius, shadow, padding: for example a `menu-style` class or `rounded-md bg-… border shadow`): keep only width and max height, or move them to `--menu-width` / `--menu-max-height` on the component. In the drawer branch the body already has a padding (`--drawer-padding`): remove the extra one (`p-2`, `p-4`) where it doubles.'
		},
		{
			id: 'menu-or-drawer-forced-branch',
			summary:
				'Apps that picked the branch by hand (MenuOrDrawer only when `!mAndDown` plus a separate `Drawer` on mobile, or only on mobile without activator) can use `mode`.',
			action:
				'`mode="menu"` always opens the menu and `mode="drawer"` always the drawer, whatever the screen. Keep the app code when the two branches show different content; otherwise replace the `{#if mAndDown}` with one MenuOrDrawer (with the default `mode="auto"`).',
			scope: 'app'
		}
	],
	added: [
		'`mode` (`auto`, `menu`, `drawer`) forces the menu or the drawer.',
		'`children` also receives `close`, which closes and gives the focus back to the activator.',
		'`menuElement` and `drawerElement` are bindable.',
		'The menu element has the class `aurora-menu-or-drawer-menu`, the drawer `aurora-menu-or-drawer-drawer`.'
	]
} satisfies ComponentMigration;
