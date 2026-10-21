<!-- @component
Page shell of an app: a sidebar on the left (logo, menu, user), a bar at the top and the content. The window scrolls: the bar and the sidebar stay in place. On desktop the sidebar is a narrow rail of icons that widens according to `expandOn`: `toggle` with a button at the top of the sidebar, next to the logo (while the sidebar is narrow the logo turns into the button as soon as the pointer is on the sidebar or the button has the keyboard focus, and a click on an empty spot of the rail widens it too), pushing the content (default); `hover` and `click` over the content; `none` only through `sidebarExpanded` (`sidebarExpanded` with `none` keeps it always wide). Up to 1024px wide (the `mAndDown` breakpoint) the sidebar moves into a `Drawer` opened by a menu button in the bar, which closes when an option is chosen or `currentPath` changes. The menu is a `HierarchyMenu` drawn from `options` (pass `currentPath={page.url.pathname}` to select the option of the page), or `menuSnippet`; when it is taller than the window it scrolls by itself to show the selected option. The bar shows the menu button on mobile, then `headerSnippet`; with `sidebarSnippet` the toggle button of `toggle` stays in the bar. A "Skip to content" link appears on the first Tab. The state is exposed as `data-expand-on` and `data-expanded` on the root.
-->
<script lang="ts">
	import '../../css/tokens.css';
	import './SidebarLayout.css';
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import Button from '../simple/buttons/Button.svelte';
	import Drawer from '../simple/navigation/Drawer.svelte';
	import HierarchyMenu, { type HierarchyMenuOption } from '../simple/navigation/HierarchyMenu.svelte';
	import { breakpoints } from '../../utils/breakpoints.svelte.js';
	import { inheritedLocale } from '../../utils/locale.js';
	import { libraryTexts } from '../../utils/texts.js';
	import { optionOfPath } from '../../utils/menu.js';

	const MENU_ICON = 'M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z';
	const DOCK_ICON =
		'M20 4H4A2 2 0 0 0 2 6V18A2 2 0 0 0 4 20H20A2 2 0 0 0 22 18V6A2 2 0 0 0 20 4M20 18H9V6H20Z';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** How the sidebar widens on desktop: `toggle` with a button at the top of the sidebar, or a click on an empty spot of the narrow rail, pushing the content; `hover` while the pointer or the keyboard focus is on it, over the content; `click` with a click on the rail (not on an option), over the content, until a click outside, Escape or the choice of an option; `none` only through `sidebarExpanded`. */
		expandOn?: 'toggle' | 'hover' | 'click' | 'none';
		/** Whether the sidebar is wide on desktop. `undefined` counts as narrow. It has no effect on the mobile drawer. */
		sidebarExpanded?: boolean;
		/** Whether the mobile drawer is open. `undefined` counts as closed. */
		drawerOpened?: boolean;
		/** Options of the menu, drawn with `HierarchyMenu`. Ignored with `menuSnippet`. */
		options?: HierarchyMenuOption[];
		/** `name` of the selected option of the menu. */
		selected?: string;
		/** Path of the current page, usually `page.url.pathname`: it selects the option whose `href` matches it, and a change closes the mobile drawer. */
		currentPath?: string;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Accessible name of the menu button and of the drawer. Defaults to "Menu", in the language of `locale`. */
		menuLabel?: string;
		/** Accessible name of the button that widens the sidebar. Defaults to "Sidebar", in the language of `locale`. */
		sidebarLabel?: string;
		/** Text of the link that skips to the content, shown on the first Tab. Defaults to "Skip to content", in the language of `locale`. */
		skipLabel?: string;
		/** Classes of the parts: `container` the root, `sidebar` the desktop sidebar, `header` the bar, `content` the `<main>`, `drawer` the panel of the mobile drawer. */
		class?: {
			container?: ClassValue;
			sidebar?: ClassValue;
			header?: ClassValue;
			content?: ClassValue;
			drawer?: string;
		};
		/** Called when the layout opens or closes the mobile drawer by itself (menu button, Escape, backdrop, choice of an option, change of `currentPath`). */
		ondrawerChange?: (event: { opened: boolean }) => void;
		/** Called when the layout widens or narrows the sidebar by itself (button, hover, click). */
		onsidebarToggle?: (event: { expanded: boolean }) => void;
		/** Called when an option of the menu is chosen, after `selected` has changed. */
		onmenuSelect?: (event: { option: HierarchyMenuOption; nativeEvent: MouseEvent }) => void;
		/** The root element. */
		sidebarLayoutElement?: HTMLDivElement;
		/** Content of the page, inside `<main>`. */
		children?: Snippet;
		/** Content of the bar (after the menu button on mobile): search, account, actions. `hamburgerVisible` is true on mobile, `collapsed` while the desktop sidebar is narrow. */
		headerSnippet?: Snippet<[{ hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean }]>;
		/** Replaces the buttons that open the mobile drawer and widen the sidebar, in the bar (the sidebar then has no toggle button). `toggle` opens the drawer on mobile and widens the sidebar on desktop. */
		toggleSnippet?: Snippet<[{ toggle: () => void; hamburgerVisible: boolean; sidebarExpanded: boolean; drawerOpened: boolean }]>;
		/** Replaces the whole content of the sidebar and of the drawer (logo, menu and user). In the drawer `hamburgerVisible` is true. */
		sidebarSnippet?: Snippet<[{ hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean }]>;
		/** Top of the sidebar, usually the logo; `collapsed` asks for its narrow version. */
		logoSnippet?: Snippet<[{ hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean }]>;
		/** Replaces the menu drawn from `options`. It scrolls when it does not fit. */
		menuSnippet?: Snippet<[{ hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean }]>;
		/** Bottom of the sidebar, usually the account, the theme and the logout. */
		userSnippet?: Snippet<[{ hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean }]>;
	}

	let {
		expandOn = 'toggle',
		sidebarExpanded = $bindable(),
		drawerOpened = $bindable(),
		options = [],
		selected = $bindable(),
		currentPath,
		locale: localeProp,
		menuLabel,
		sidebarLabel,
		skipLabel,
		class: clazz = {},
		ondrawerChange,
		onsidebarToggle,
		onmenuSelect,
		sidebarLayoutElement = $bindable(),
		children,
		headerSnippet,
		toggleSnippet,
		sidebarSnippet,
		logoSnippet,
		menuSnippet,
		userSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).sidebarLayout);

	let mobile = $derived(breakpoints.mAndDown);
	let expanded = $derived(!!sidebarExpanded);
	let overlay = $derived(expandOn === 'hover' || expandOn === 'click');
	let desktop = $derived({ hamburgerVisible: false, sidebarExpanded: expanded, collapsed: !expanded });
	let header = $derived(mobile ? { hamburgerVisible: true, sidebarExpanded: expanded, collapsed: false } : desktop);
	const drawer = { hamburgerVisible: true, sidebarExpanded: true, collapsed: false };

	let dockInSidebar = $derived(expandOn === 'toggle' && !toggleSnippet && !sidebarSnippet);

	let matched = $derived(currentPath === undefined ? undefined : optionOfPath(options, currentPath));

	$effect(() => {
		if (matched !== undefined && matched !== selected) selected = matched;
	});

	let sidebarNode: HTMLDivElement | undefined = $state();

	function reveal(menu: HTMLElement) {
		void selected;
		void currentPath;
		const frame = requestAnimationFrame(() => {
			const option = menu.querySelector<HTMLElement>('[aria-current]');
			if (option) {
				const box = menu.getBoundingClientRect();
				const rect = option.getBoundingClientRect();
				if (rect.top < box.top || rect.bottom > box.bottom)
					menu.scrollTop += rect.top - box.top - (box.height - rect.height) / 2;
			}
			if (menu.closest('dialog') && menu.contains(document.activeElement))
				(option ?? menu.querySelector<HTMLElement>('a[href], button:not(:disabled)'))?.focus({
					preventScroll: true
				});
		});
		return () => cancelAnimationFrame(frame);
	}

	function setExpanded(value: boolean) {
		if (expanded === value) return;
		sidebarExpanded = value;
		onsidebarToggle?.({ expanded: value });
	}

	function setDrawer(value: boolean) {
		if (!!drawerOpened === value) return;
		drawerOpened = value;
		ondrawerChange?.({ opened: value });
	}

	function toggle() {
		if (breakpoints.mAndDown) setDrawer(!drawerOpened);
		else setExpanded(!expanded);
	}

	function chosen(event: { option: HierarchyMenuOption; nativeEvent: MouseEvent }) {
		setDrawer(false);
		if (overlay) setExpanded(false);
		onmenuSelect?.(event);
	}

	let lastPath: string | undefined | null = null;
	$effect(() => {
		const path = currentPath;
		if (lastPath !== null && path !== lastPath) setDrawer(false);
		lastPath = path;
	});

	$effect(() => {
		if (!mobile && drawerOpened) setDrawer(false);
	});

	function onpointerenter(event: PointerEvent) {
		if (expandOn === 'hover' && event.pointerType === 'mouse' && !mobile) setExpanded(true);
	}

	function onpointerleave(event: PointerEvent) {
		if (expandOn === 'hover' && event.pointerType === 'mouse' && !sidebarNode?.contains(document.activeElement))
			setExpanded(false);
	}

	function onfocusin(event: FocusEvent) {
		if (!overlay || mobile) return;
		if ((event.target as HTMLElement).matches(':focus-visible')) setExpanded(true);
	}

	function onfocusout(event: FocusEvent) {
		if (!overlay) return;
		if (!sidebarNode?.contains(event.relatedTarget as Node | null)) {
			if (expandOn === 'click' || !sidebarNode?.matches(':hover')) setExpanded(false);
		}
	}

	function onclick(event: MouseEvent) {
		if ((expandOn !== 'click' && expandOn !== 'toggle') || expanded || mobile) return;
		if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [tabindex]')) return;
		setExpanded(true);
	}

	$effect(() => {
		if (!overlay || !expanded) return;
		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) setExpanded(false);
		};
		const away = (event: PointerEvent) => {
			const target = event.target as Element | null;
			if (!sidebarNode?.contains(target) && !target?.closest('.aurora-menu, .aurora-tooltip'))
				setExpanded(false);
		};
		document.addEventListener('keydown', escape);
		if (expandOn === 'click') document.addEventListener('pointerdown', away);
		return () => {
			document.removeEventListener('keydown', escape);
			document.removeEventListener('pointerdown', away);
		};
	});
</script>

{#snippet dockButton()}
	<Button
		buttonType="icon"
		variant="secondary"
		icon={DOCK_ICON}
		class="aurora-sidebar-layout-dock"
		aria-label={sidebarLabel ?? texts.sidebar}
		aria-expanded={expanded}
		onclick={() => setExpanded(!expanded)}
	/>
{/snippet}

{#snippet sidebarContent(state: { hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean })}
	{#if sidebarSnippet}
		{@render sidebarSnippet(state)}
	{:else}
		{@const dock = dockInSidebar && !state.hamburgerVisible}
		{#if logoSnippet || dock}
			<div class="aurora-sidebar-layout-top" data-logo={logoSnippet ? '' : undefined}>
				{#if logoSnippet}
					<div class="aurora-sidebar-layout-logo">{@render logoSnippet(state)}</div>
				{/if}
				{#if dock}
					{@render dockButton()}
				{/if}
			</div>
		{/if}
		<div class="aurora-sidebar-layout-menu" {@attach reveal}>
			{#if menuSnippet}
				{@render menuSnippet(state)}
			{:else if options.length}
				<HierarchyMenu
					{options}
					bind:selected
					{currentPath}
					{locale}
					iconsOnly={state.collapsed}
					onoptionClick={chosen}
				/>
			{/if}
		</div>
		{#if userSnippet}
			<div class="aurora-sidebar-layout-user">{@render userSnippet(state)}</div>
		{/if}
	{/if}
{/snippet}

<div
	{...rest}
	bind:this={sidebarLayoutElement}
	data-expand-on={expandOn}
	data-expanded={expanded ? '' : undefined}
	class={['aurora-sidebar-layout', clazz.container]}
>
	<a class="aurora-sidebar-layout-skip" href="#{uid}-content">{skipLabel ?? texts.skip}</a>

	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		bind:this={sidebarNode}
		class={['aurora-sidebar-layout-sidebar', clazz.sidebar]}
		data-overlay={overlay && expanded ? '' : undefined}
		{onpointerenter}
		{onpointerleave}
		{onfocusin}
		{onfocusout}
		{onclick}
	>
		{#if !mobile}
			{@render sidebarContent(desktop)}
		{/if}
	</div>

	<header class={['aurora-sidebar-layout-header', clazz.header]}>
		{#if toggleSnippet}
			{@render toggleSnippet({ toggle, hamburgerVisible: header.hamburgerVisible, sidebarExpanded: expanded, drawerOpened: !!drawerOpened })}
		{:else}
			<Button
				buttonType="icon"
				variant="secondary"
				icon={MENU_ICON}
				class="aurora-sidebar-layout-hamburger"
				aria-label={menuLabel ?? texts.menu}
				aria-expanded={!!drawerOpened}
				onclick={() => setDrawer(!drawerOpened)}
			/>
			{#if expandOn === 'toggle' && sidebarSnippet}
				{@render dockButton()}
			{/if}
		{/if}
		{#if headerSnippet}
			<div class="aurora-sidebar-layout-header-content">{@render headerSnippet(header)}</div>
		{/if}
	</header>

	<main id="{uid}-content" tabindex="-1" class={['aurora-sidebar-layout-content', clazz.content]}>
		{@render children?.()}
	</main>

	{#if mobile}
		<Drawer
			open={!!drawerOpened}
			position="left"
			aria-label={menuLabel ?? texts.menu}
			{locale}
			class={{ drawer: 'aurora-sidebar-layout-drawer', panel: clazz.drawer }}
			onclose={() => setDrawer(false)}
		>
			<div class="aurora-sidebar-layout-drawer-content">
				{@render sidebarContent(drawer)}
			</div>
		</Drawer>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-sidebar-layout {
			--_duration: var(--sidebar-layout-duration, var(--sidebar-layout-default-duration));
			--_easing: var(--sidebar-layout-easing, var(--sidebar-layout-default-easing));
			--_rail: var(--sidebar-layout-sidebar-width, var(--sidebar-layout-default-sidebar-width));
			--_wide: var(
				--sidebar-layout-sidebar-expanded-width,
				var(--sidebar-layout-default-sidebar-expanded-width)
			);
			--_inline: var(
				--sidebar-layout-sidebar-inline-padding,
				var(--sidebar-layout-default-sidebar-inline-padding)
			);
			--_column: var(--_rail);
			--_side: var(--_rail);

			box-sizing: border-box;
			display: grid;
			grid-template-columns: var(--_column) minmax(0, 1fr);
			grid-template-rows: auto 1fr;
			min-height: 100dvh;
			background: var(--sidebar-layout-background, var(--sidebar-layout-default-background));
			transition: grid-template-columns var(--_duration) var(--_easing);
		}

		.aurora-sidebar-layout[data-expanded] {
			--_side: var(--_wide);
		}

		.aurora-sidebar-layout[data-expand-on='toggle'][data-expanded],
		.aurora-sidebar-layout[data-expand-on='none'][data-expanded] {
			--_column: var(--_wide);
		}

		.aurora-sidebar-layout-skip {
			position: fixed;
			top: 8px;
			left: 8px;
			z-index: 10;
			padding: 8px 14px;
			border-radius: var(--global-radius-sm);
			background: var(--sidebar-layout-skip-background, var(--sidebar-layout-default-skip-background));
			color: var(--sidebar-layout-skip-color, var(--sidebar-layout-default-skip-color));
			font-weight: 500;
			text-decoration: none;
			transform: translateY(calc(-100% - 16px));
		}

		.aurora-sidebar-layout-skip:focus-visible {
			transform: none;
			box-shadow: var(--global-shadow-md);
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-sidebar-layout-sidebar {
			position: sticky;
			top: 0;
			z-index: 3;
			grid-column: 1;
			grid-row: 1 / span 2;
			align-self: start;
			display: flex;
			flex-direction: column;
			gap: var(--sidebar-layout-sidebar-gap, var(--sidebar-layout-default-sidebar-gap));
			box-sizing: border-box;
			width: var(--_side);
			height: 100dvh;
			padding: var(--sidebar-layout-sidebar-padding, var(--sidebar-layout-default-sidebar-padding));
			overflow: hidden;
			border-inline-end: var(--sidebar-layout-sidebar-border, var(--sidebar-layout-default-sidebar-border));
			background: var(--sidebar-layout-sidebar-background, var(--sidebar-layout-default-sidebar-background));
			transition:
				width var(--_duration) var(--_easing),
				box-shadow var(--_duration) var(--_easing);
		}

		.aurora-sidebar-layout-sidebar[data-overlay] {
			background: var(
				--sidebar-layout-sidebar-overlay-background,
				var(--sidebar-layout-default-sidebar-overlay-background)
			);
			box-shadow: var(
				--sidebar-layout-sidebar-overlay-box-shadow,
				var(--sidebar-layout-default-sidebar-overlay-box-shadow)
			);
		}

		.aurora-sidebar-layout[data-expand-on='toggle']:not([data-expanded]) .aurora-sidebar-layout-sidebar {
			cursor: e-resize;
		}

		.aurora-sidebar-layout-top {
			position: relative;
			display: flex;
			flex-shrink: 0;
			align-items: center;
			gap: 8px;
			min-width: 0;
			min-height: var(--sidebar-layout-header-height, var(--sidebar-layout-default-header-height));
			padding-inline: var(--_inline);
		}

		.aurora-sidebar-layout-logo {
			display: flex;
			flex: 1;
			align-items: center;
			min-width: 0;
			transition: opacity var(--global-duration-fast) var(--_easing);
		}

		.aurora-sidebar-layout :global(.aurora-sidebar-layout-dock) {
			--button-background: var(
				--sidebar-layout-dock-background,
				var(--sidebar-layout-default-dock-background)
			);
			--button-border-color: var(
				--sidebar-layout-dock-border-color,
				var(--sidebar-layout-default-dock-border-color)
			);
			--button-color: var(--sidebar-layout-dock-color, var(--sidebar-layout-default-dock-color));
			--button-hover-background: var(
				--sidebar-layout-dock-hover-background,
				var(--sidebar-layout-default-dock-hover-background)
			);
			--button-hover-color: var(
				--sidebar-layout-dock-hover-color,
				var(--sidebar-layout-default-dock-hover-color)
			);
			--button-box-shadow: none;
			--button-hover-box-shadow: none;
			flex: none;
			cursor: pointer;
		}

		.aurora-sidebar-layout-top :global(.aurora-sidebar-layout-dock) {
			margin-inline-start: auto;
			transition: opacity var(--global-duration-fast) var(--_easing);
		}

		.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top :global(.aurora-sidebar-layout-dock) {
			margin-inline: auto;
		}

		.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo] :global(.aurora-sidebar-layout-dock) {
			position: absolute;
			inset-inline: 0;
		}

		.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo] .aurora-sidebar-layout-logo {
			opacity: 0;
		}

		@media (hover: hover) {
			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo] .aurora-sidebar-layout-logo {
				opacity: 1;
			}

			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo] :global(.aurora-sidebar-layout-dock) {
				opacity: 0;
			}

			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-sidebar:hover .aurora-sidebar-layout-top[data-logo] :global(.aurora-sidebar-layout-dock),
			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo] :global(.aurora-sidebar-layout-dock:focus-visible) {
				opacity: 1;
			}

			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-sidebar:hover .aurora-sidebar-layout-top[data-logo] .aurora-sidebar-layout-logo,
			.aurora-sidebar-layout:not([data-expanded]) .aurora-sidebar-layout-top[data-logo]:has(:global(.aurora-sidebar-layout-dock:focus-visible)) .aurora-sidebar-layout-logo {
				opacity: 0;
			}
		}

		.aurora-sidebar-layout-user {
			flex-shrink: 0;
			min-width: 0;
			padding-inline: var(--_inline);
		}

		.aurora-sidebar-layout-menu {
			flex: 1;
			min-height: 0;
			padding-inline: var(--_inline);
			overflow-x: hidden;
			overflow-y: auto;
			scrollbar-width: thin;
		}

		.aurora-sidebar-layout-header {
			position: var(--sidebar-layout-header-position, var(--sidebar-layout-default-header-position));
			top: 0;
			z-index: 2;
			grid-column: 2;
			grid-row: 1;
			display: flex;
			align-items: center;
			gap: var(--sidebar-layout-header-gap, var(--sidebar-layout-default-header-gap));
			box-sizing: border-box;
			min-width: 0;
			height: var(--sidebar-layout-header-height, var(--sidebar-layout-default-header-height));
			padding: var(--sidebar-layout-header-padding, var(--sidebar-layout-default-header-padding));
			border-block-end: var(--sidebar-layout-header-border, var(--sidebar-layout-default-header-border));
			background: var(--sidebar-layout-header-background, var(--sidebar-layout-default-header-background));
			backdrop-filter: var(
				--sidebar-layout-header-backdrop-filter,
				var(--sidebar-layout-default-header-backdrop-filter)
			);
		}

		.aurora-sidebar-layout-header-content {
			display: flex;
			flex: 1;
			align-items: center;
			gap: var(--sidebar-layout-header-gap, var(--sidebar-layout-default-header-gap));
			min-width: 0;
		}

		.aurora-sidebar-layout-header :global(.aurora-sidebar-layout-hamburger) {
			display: none;
		}

		.aurora-sidebar-layout-content {
			grid-column: 2;
			grid-row: 2;
			box-sizing: border-box;
			min-width: 0;
			padding: var(--sidebar-layout-content-padding, var(--sidebar-layout-default-content-padding));
			outline: none;
		}

		.aurora-sidebar-layout :global(.aurora-sidebar-layout-drawer) {
			--_drawer-size: var(--sidebar-layout-drawer-width, var(--sidebar-layout-default-drawer-width));
			--_drawer-padding: var(--sidebar-layout-drawer-padding, var(--sidebar-layout-default-drawer-padding));
		}

		.aurora-sidebar-layout-drawer-content {
			display: flex;
			flex-direction: column;
			gap: var(--sidebar-layout-sidebar-gap, var(--sidebar-layout-default-sidebar-gap));
			height: 100%;
		}

		@media (max-width: 1024px) {
			.aurora-sidebar-layout {
				grid-template-columns: minmax(0, 1fr);
			}

			.aurora-sidebar-layout-sidebar {
				display: none;
			}

			.aurora-sidebar-layout-header,
			.aurora-sidebar-layout-content {
				grid-column: 1;
			}

			.aurora-sidebar-layout-header :global(.aurora-sidebar-layout-hamburger) {
				display: inline-flex;
			}

			.aurora-sidebar-layout-header :global(.aurora-sidebar-layout-dock) {
				display: none;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-sidebar-layout,
			.aurora-sidebar-layout-sidebar {
				transition: none;
			}
		}
	}
</style>
