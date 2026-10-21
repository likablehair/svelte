<!-- @component
Shows its content in a `Menu` anchored to `activator` on wide screens and in a bottom `Drawer` on screens up to 1024px wide (`breakpoints.mAndDown`, the breakpoint of the whole library); `mode` forces one of the two. The bottom drawer is as tall as its content, up to 85% of the screen (`--drawer-size` fixes the height). `children` receives `isDrawer` and `isMenu`, to adapt spacing or content, and `close`. Both close on Escape and on a click outside; Escape and `close` give the focus back to the activator in the menu, the drawer gives it back to the element that had it. The other props of the two go in `menuProps` and `drawerProps`, and their CSS variables (`--menu-*`, `--drawer-*`) can be set on this component. The menu element has the class `aurora-menu-or-drawer-menu`, the drawer `aurora-menu-or-drawer-drawer`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import Menu from '../../simple/common/Menu.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';
	import type { VirtualElement } from '../../simple/common/floating.js';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';

	export interface Props {
		/** Whether the menu or the drawer is open. `undefined` counts as closed. */
		open?: boolean;
		/** What the menu is anchored to: usually the button that opens it, or any object with `getBoundingClientRect()`. The drawer ignores it. */
		activator?: HTMLElement | VirtualElement;
		/** Side of the activator and alignment of the menu. Flips to the opposite side when there is not enough space. */
		placement?:
			| 'bottom-start'
			| 'bottom'
			| 'bottom-end'
			| 'top-start'
			| 'top'
			| 'top-end'
			| 'left-start'
			| 'left'
			| 'left-end'
			| 'right-start'
			| 'right'
			| 'right-end';
		/** `auto` opens a drawer on screens up to 1024px wide and a menu on wider ones; `menu` and `drawer` always open that one. */
		mode?: 'auto' | 'menu' | 'drawer';
		/** Other props of the `Menu`, such as `offset`, `matchActivatorWidth`, `class` or `aria-label`. */
		menuProps?: Omit<
			ComponentProps<typeof Menu>,
			'open' | 'activator' | 'placement' | 'menuElement' | 'children'
		>;
		/** Other props of the `Drawer`, such as `title`, `closable`, `position` (default `bottom`) or `aria-label`. */
		drawerProps?: Omit<ComponentProps<typeof Drawer>, 'open' | 'drawerElement' | 'children'>;
		/** The menu element, while the menu is open. */
		menuElement?: HTMLDivElement;
		/** The `<dialog>` element of the drawer, while the drawer is open. */
		drawerElement?: HTMLDialogElement;
		/** Content of the menu or of the drawer. `close` closes it. */
		children?: Snippet<[{ isDrawer: boolean; isMenu: boolean; close: () => void }]>;
	}

	let {
		open = $bindable(),
		activator,
		placement = 'bottom',
		mode = 'auto',
		menuProps = {},
		drawerProps = {},
		menuElement = $bindable(),
		drawerElement = $bindable(),
		children: content
	}: Props = $props();

	let menuNode = $state<HTMLDivElement>();

	let isDrawer = $derived(mode === 'drawer' || (mode === 'auto' && breakpoints.mAndDown));
	let position = $derived(drawerProps.position ?? 'bottom');
	let sheet = $derived(position === 'bottom' || position === 'top');

	function closeMenu() {
		if (!open) return;
		const menu = menuNode;
		open = false;
		if (menu?.contains(document.activeElement) && activator instanceof HTMLElement)
			activator.focus();
	}

	function joined(...names: (string | false | undefined)[]) {
		return names.filter(Boolean).join(' ');
	}
</script>

{#if isDrawer}
	<Drawer
		{...drawerProps}
		{position}
		class={{
			...drawerProps.class,
			drawer: joined(
				'aurora-menu-or-drawer-drawer',
				sheet && 'aurora-menu-or-drawer-sheet',
				drawerProps.class?.drawer
			)
		}}
		bind:open
		bind:drawerElement
	>
		{#snippet children({ close })}
			{@render content?.({ isDrawer: true, isMenu: false, close: () => close(new Event('close')) })}
		{/snippet}
	</Drawer>
{:else}
	<Menu
		{...menuProps}
		class={['aurora-menu-or-drawer-menu', menuProps.class]}
		{activator}
		{placement}
		bind:open
		bind:menuElement={() => menuNode, (node) => (menuNode = menuElement = node)}
	>
		{@render content?.({ isDrawer: false, isMenu: true, close: closeMenu })}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-menu-or-drawer-sheet) {
			--_drawer-size: auto;
			--_drawer-max-size: 85dvh;
		}
	}
</style>
