<!-- @component
Floating surface anchored to an `activator`, for dropdowns, autocompletes, pickers, action and context menus. It opens on the browser's top layer (`popover`), so it is never clipped by `overflow` containers and needs no z-index. It flips and shifts to stay in the viewport and follows the activator wherever it moves. It closes on outside click (the activator excluded) and on Escape, which returns focus to the activator. Opening a menu closes the other open menus, except nested ones and those with `closeOnClickOutside={false}`. The content decides the role (`role="menu"`, `role="listbox"`, ...). The current side is exposed as `data-side` on the menu element.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Menu.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cubicOut } from 'svelte/easing';
	import { follow, place, type Side, type VirtualElement } from './floating.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'popover'> {
		/** Whether the menu is open. `undefined` counts as closed. */
		open?: boolean;
		/** What the menu is anchored to: usually the button or field that opens it, or any object with `getBoundingClientRect()` (for example the mouse position of a context menu). Without it the menu is centered in the viewport. */
		activator?: HTMLElement | VirtualElement;
		/** Side of the activator and alignment. Flips to the opposite side when there is not enough space. */
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
		/** Distance from the activator, in pixels. */
		offset?: number;
		/** Makes the menu as wide as the activator, as in autocompletes and selects. */
		matchActivatorWidth?: boolean;
		/** Closes the menu on a click outside it and outside the activator. When `false` the menu also stays open when other menus open. */
		closeOnClickOutside?: boolean;
		/** The menu element. */
		menuElement?: HTMLDivElement;
		/** Menu content. */
		children?: Snippet;
	}

	let {
		open = $bindable(),
		activator = $bindable(),
		placement = 'bottom-start',
		offset = 6,
		matchActivatorWidth = false,
		closeOnClickOutside = true,
		menuElement = $bindable(),
		children,
		class: clazz,
		...rest
	}: Props = $props();

	let menuNode = $state<HTMLDivElement>();

	function position(menu = menuNode) {
		if (menu) place(menu, activator, placement, offset, matchActivatorWidth);
	}

	function show(node: HTMLDivElement) {
		node.showPopover();
		position(node);
	}

	function pop(node: HTMLElement) {
		const style = getComputedStyle(node);
		const raw = style.getPropertyValue('--_duration').trim();
		const value = parseFloat(raw) || 0;
		const duration = raw.endsWith('ms') ? value : value * 1000;
		const distance = parseFloat(style.getPropertyValue('--_distance')) || 0;
		const scale = parseFloat(style.getPropertyValue('--_scale')) || 1;
		const [x, y] = {
			bottom: [0, -distance],
			top: [0, distance],
			left: [distance, 0],
			right: [-distance, 0]
		}[(node.dataset.side as Side) ?? 'bottom'];
		return {
			duration,
			easing: cubicOut,
			css: (t: number) =>
				`opacity: ${t}; transform: translate(${(1 - t) * x}px, ${(1 - t) * y}px) scale(${scale + (1 - scale) * t});`
		};
	}

	$effect(() => {
		const menu = menuNode;
		if (!open || !menu) return;
		const anchor = activator;
		const anchorElement = anchor instanceof Element ? anchor : undefined;
		const dismissOnOutside = closeOnClickOutside;

		const stopFollowing = follow(menu, anchor, () => position(menu));

		const onPointerDown = (event: PointerEvent) => {
			if (!dismissOnOutside) return;
			const target = event.target as Node;
			if (menu.contains(target) || anchorElement?.contains(target)) return;
			open = false;
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			if (menu.querySelector(':popover-open')) return;
			event.preventDefault();
			if (menu.contains(document.activeElement) && anchorElement instanceof HTMLElement)
				anchorElement.focus();
			open = false;
		};
		const onOtherMenuOpen = (event: Event) => {
			if (!dismissOnOutside) return;
			const other = (event as CustomEvent<HTMLElement>).detail;
			if (other === menu || menu.contains(other) || other.contains(menu)) return;
			open = false;
		};

		document.dispatchEvent(new CustomEvent('aurora:menu-open', { detail: menu }));
		document.addEventListener('pointerdown', onPointerDown, true);
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('aurora:menu-open', onOtherMenuOpen);

		return () => {
			stopFollowing();
			document.removeEventListener('pointerdown', onPointerDown, true);
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('aurora:menu-open', onOtherMenuOpen);
		};
	});
</script>

{#if open}
	<div
		{...rest}
		popover="manual"
		class={['aurora-menu', clazz]}
		bind:this={() => menuNode, (node) => (menuNode = menuElement = node)}
		{@attach show}
		transition:pop
	>
		{@render children?.()}
	</div>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-menu {
			--_duration: var(--menu-duration, var(--menu-default-duration));
			--_distance: var(--menu-transition-distance, var(--menu-default-transition-distance));
			--_scale: var(--menu-transition-scale, var(--menu-default-transition-scale));

			position: fixed;
			inset: auto;
			margin: 0;
			box-sizing: border-box;
			width: var(--menu-width, var(--menu-default-width));
			min-width: var(--menu-min-width, var(--menu-default-min-width));
			max-width: var(--menu-max-width, var(--menu-default-max-width));
			height: var(--menu-height, var(--menu-default-height));
			max-height: var(--menu-max-height, var(--menu-default-max-height));
			overflow: var(--menu-overflow, var(--menu-default-overflow));
			padding: var(--menu-padding, var(--menu-default-padding));
			background: var(--menu-background, var(--menu-default-background));
			color: var(--menu-color, var(--menu-default-color));
			border: var(--menu-border-width, var(--menu-default-border-width)) solid
				var(--menu-border-color, var(--menu-default-border-color));
			border-radius: var(--menu-border-radius, var(--menu-default-border-radius));
			box-shadow: var(--menu-box-shadow, var(--menu-default-box-shadow));
			backdrop-filter: var(--menu-backdrop-filter, var(--menu-default-backdrop-filter));
		}
	}
</style>
