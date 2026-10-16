<!-- @component
Navigation menu of nested options, as in the sidebar of an app (`SidebarLayout` draws one from its `options`). Options are `HierarchyMenuOption` objects, `{ name: string; label: string; icon?: string; href?: string; options?: HierarchyMenuOption[]; badge?: string | number; disabled?: boolean }`, nested to any depth. An option with `href` is a link; with `currentPath` (pass `page.url.pathname`) the option whose `href` is the longest match of the path is selected, and so are the pages below it; when no `href` matches, no link is selected (with one menu per group, only the menu of the current page shows a selection). Without links, `selected` holds the `name` of the selected option, as `bind:selected`. The options above the selected one are highlighted and opened. A parent opens and closes its children with a click; a parent with `href` is a link with a separate arrow button. With `iconsOnly` (a collapsed sidebar) only the icons show, each with a tooltip, and a parent opens a menu with its children. Keyboard: Tab, plus the arrow keys to move between the options, Right and Left to open and close a parent, Home and End. The state is exposed as `data-selected`, `data-ancestor`, `data-open` and `data-depth` on every row, for app CSS.
-->
<script lang="ts" module>
	export type HierarchyMenuOption = {
		/** Unique value among all the options of the menu: `selected` holds it. */
		name: string;
		/** Visible text. */
		label: string;
		/** SVG path of the icon before the text, for example from `@mdi/js`. */
		icon?: string;
		/** Makes the option a link. With `currentPath`, the option whose `href` best matches the path is selected. */
		href?: string;
		/** Options shown below this one when it is open, nested to any depth. */
		options?: HierarchyMenuOption[];
		/** Short count or text after the label, in a pill. A dot on the icon when the menu shows only icons. */
		badge?: string | number;
		/** The option cannot be chosen. */
		disabled?: boolean;
	};
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './HierarchyMenu.css';
	import { tick, type Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import Menu from '../common/Menu.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import HierarchyMenu from './HierarchyMenu.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import { optionOfPath } from '../../../utils/menu.js';

	const CARET_ICON = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
		/** Options of the menu, in order, each with its nested `options`. */
		options?: HierarchyMenuOption[];
		/** `name` of the selected option. It changes when an option is chosen and, with `currentPath`, when the path matches an option's `href`. */
		selected?: string;
		/** Path of the current page, usually `page.url.pathname`. The option whose `href` is the longest match is selected: equal to the path, or a parent folder of it (`/clients` matches `/clients/12`). `/` matches only itself. When no option matches, no link option is selected. */
		currentPath?: string;
		/** `name`s of the open parents. The parents of the selected option open by themselves. */
		expanded?: string[];
		/** Shows only the icons, as in a collapsed sidebar: labels become tooltips and a parent opens a menu with its children. */
		iconsOnly?: boolean;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Accessible name of the `<nav>`. Defaults to "Menu", in the language of `locale`, unless `aria-labelledby` names it. */
		'aria-label'?: string | null;
		/** Classes of the parts: `container` the `<nav>`, `option` every option, `selected` the selected option, `children` every list of nested options. */
		class?: {
			container?: ClassValue;
			option?: ClassValue;
			selected?: ClassValue;
			children?: ClassValue;
		};
		/** Called when an option is chosen with a click, Enter or Space, after `selected` has changed. Links then navigate on their own. Not called for a parent without `href`, which only opens and closes. */
		onoptionClick?: (event: { option: HierarchyMenuOption; nativeEvent: MouseEvent }) => void;
		/** The `<nav>` element. */
		hierarchyMenuElement?: HTMLElement;
		/** Replaces the icon of every option. */
		prependSnippet?: Snippet<[{ option: HierarchyMenuOption; selected: boolean; depth: number }]>;
		/** Replaces the label of every option. */
		optionSnippet?: Snippet<[{ option: HierarchyMenuOption; selected: boolean; depth: number }]>;
		/** Content after every option, outside the link or button, so it can hold its own buttons. Hidden with `iconsOnly`. */
		appendSnippet?: Snippet<[{ option: HierarchyMenuOption; selected: boolean; depth: number }]>;
	}

	let {
		options = [],
		selected = $bindable(),
		currentPath,
		expanded = $bindable(),
		iconsOnly = false,
		locale: localeProp,
		'aria-label': ariaLabel,
		class: clazz = {},
		onoptionClick,
		hierarchyMenuElement = $bindable(),
		prependSnippet,
		optionSnippet,
		appendSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).hierarchyMenu);

	type Entry = { option: HierarchyMenuOption; parent: string | undefined; id: string };

	let entries = $derived.by(() => {
		const map = new Map<string, Entry>();
		const walk = (list: HierarchyMenuOption[], parent: string | undefined) => {
			for (const option of list) {
				map.set(option.name, { option, parent, id: `${uid}-${map.size}` });
				if (option.options) walk(option.options, option.name);
			}
		};
		walk(options, undefined);
		return map;
	});

	let matched = $derived(currentPath === undefined ? undefined : optionOfPath(options, currentPath));

	let current = $derived(
		matched ??
			(currentPath !== undefined && selected !== undefined && entries.get(selected)?.option.href !== undefined
				? undefined
				: selected)
	);

	$effect(() => {
		if (currentPath !== undefined && current !== selected) selected = current;
	});

	let ancestors = $derived.by(() => {
		const names = new Set<string>();
		let parent = current === undefined ? undefined : entries.get(current)?.parent;
		while (parent !== undefined && !names.has(parent)) {
			names.add(parent);
			parent = entries.get(parent)?.parent;
		}
		return names;
	});

	let open = $derived(new Set(expanded ?? []));

	$effect(() => {
		const missing = [...ancestors].filter((name) => !open.has(name));
		if (missing.length) expanded = [...(expanded ?? []), ...missing];
	});

	let anyIcon = $derived(options.some((option) => option.icon));

	function toggle(option: HierarchyMenuOption) {
		if (option.disabled) return;
		expanded = open.has(option.name)
			? (expanded ?? []).filter((name) => name !== option.name)
			: [...(expanded ?? []), option.name];
	}

	function choose(option: HierarchyMenuOption, nativeEvent: MouseEvent) {
		if (option.disabled) {
			nativeEvent.preventDefault();
			return;
		}
		if (
			option.href !== undefined &&
			(nativeEvent.metaKey || nativeEvent.ctrlKey || nativeEvent.shiftKey || nativeEvent.altKey)
		)
			return;
		selected = option.name;
		onoptionClick?.({ option, nativeEvent });
	}

	let navNode: HTMLElement | undefined = $state();
	let rowNodes: Record<string, HTMLElement> = $state({});
	let flyoutOpen = $state(false);
	let flyoutOption: HierarchyMenuOption | undefined = $state();
	let flyoutMenu: HTMLDivElement | undefined = $state();

	async function openFlyout(option: HierarchyMenuOption) {
		if (option.disabled) return;
		if (flyoutOpen && flyoutOption?.name === option.name) {
			flyoutOpen = false;
			return;
		}
		flyoutOption = option;
		flyoutOpen = true;
		await tick();
		requestAnimationFrame(() =>
			flyoutMenu?.querySelector<HTMLElement>('a[href], button:not(:disabled)')?.focus()
		);
	}

	function closeFlyout() {
		const activator = flyoutOption && rowNodes[flyoutOption.name];
		flyoutOpen = false;
		activator?.focus();
	}

	$effect(() => {
		if (!iconsOnly) flyoutOpen = false;
	});

	function controls() {
		if (!navNode) return [];
		return [...navNode.querySelectorAll<HTMLElement>('.aurora-hierarchy-menu-option')].filter(
			(node) => node.closest('.aurora-hierarchy-menu') === navNode && !node.closest('[inert]')
		);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target as HTMLElement;
		const row = target.closest<HTMLElement>('.aurora-hierarchy-menu-item');
		if (!row || row.closest('.aurora-hierarchy-menu') !== navNode) return;
		const entry = entries.get(row.dataset.name ?? '');
		if (!entry) return;
		const list = controls();
		const own = row.querySelector<HTMLElement>(':scope > .aurora-hierarchy-menu-row > .aurora-hierarchy-menu-option');
		const index = own ? list.indexOf(own) : -1;
		const parent = (entry.option.options?.length ?? 0) > 0;
		let next: HTMLElement | undefined;
		if (event.key === 'ArrowDown') next = list[Math.min(index + 1, list.length - 1)];
		else if (event.key === 'ArrowUp') next = list[Math.max(index - 1, 0)];
		else if (event.key === 'Home') next = list[0];
		else if (event.key === 'End') next = list[list.length - 1];
		else if (event.key === 'ArrowRight' && parent) {
			if (iconsOnly) openFlyout(entry.option);
			else if (!open.has(entry.option.name)) toggle(entry.option);
			else next = list[index + 1];
		} else if (event.key === 'ArrowLeft') {
			if (parent && !iconsOnly && open.has(entry.option.name)) toggle(entry.option);
			else if (entry.parent !== undefined) next = rowNodes[entry.parent];
			else return;
		} else return;
		event.preventDefault();
		next?.focus();
	}

	function fill(text: string, label: string) {
		return text.replace('{label}', label);
	}
</script>

{#snippet content(option: HierarchyMenuOption, isSelected: boolean, depth: number, caret: boolean)}
	{@const badge = option.badge !== undefined && option.badge !== ''}
	{#if prependSnippet}
		{@render prependSnippet({ option, selected: isSelected, depth })}
	{:else if option.icon || iconsOnly || (depth === 0 && anyIcon)}
		<span class="aurora-hierarchy-menu-lead">
			{#if option.icon}
				<Icon path={option.icon} class="aurora-hierarchy-menu-icon" />
			{:else if iconsOnly}
				<span class="aurora-hierarchy-menu-initial" aria-hidden="true">{option.label.charAt(0)}</span>
			{/if}
			{#if iconsOnly && badge}<span class="aurora-hierarchy-menu-dot" aria-hidden="true"></span>{/if}
		</span>
	{/if}
	<span class="aurora-hierarchy-menu-label">
		{#if optionSnippet}{@render optionSnippet({ option, selected: isSelected, depth })}{:else}{option.label}{/if}
	</span>
	{#if badge}
		<span class={iconsOnly ? 'aurora-hierarchy-menu-label' : 'aurora-hierarchy-menu-badge'}>{option.badge}</span>
	{/if}
	{#if caret}
		<Icon path={CARET_ICON} class="aurora-hierarchy-menu-caret-icon" />
	{/if}
{/snippet}

{#snippet item(option: HierarchyMenuOption, depth: number)}
	{@const children = option.options ?? []}
	{@const isParent = children.length > 0}
	{@const isOpen = isParent && !iconsOnly && open.has(option.name)}
	{@const isSelected = option.name === current}
	{@const isAncestor = ancestors.has(option.name)}
	{@const listId = entries.get(option.name)?.id}
	{@const optionClass = ['aurora-hierarchy-menu-option', clazz.option, isSelected && clazz.selected]}
	<li class="aurora-hierarchy-menu-item" data-name={option.name}>
		<div
			class="aurora-hierarchy-menu-row"
			data-depth={depth}
			data-selected={isSelected ? '' : undefined}
			data-ancestor={isAncestor ? '' : undefined}
			data-open={isOpen ? '' : undefined}
			data-disabled={option.disabled ? '' : undefined}
		>
			{#if iconsOnly && isParent}
				<button
					bind:this={rowNodes[option.name]}
					type="button"
					class={optionClass}
					disabled={option.disabled}
					aria-haspopup="true"
					aria-expanded={flyoutOpen && flyoutOption?.name === option.name}
					onclick={() => openFlyout(option)}
				>
					{@render content(option, isSelected, depth, false)}
				</button>
			{:else if option.href !== undefined}
				<a
					bind:this={rowNodes[option.name]}
					href={option.disabled ? undefined : option.href}
					role={option.disabled ? 'link' : undefined}
					aria-disabled={option.disabled ? 'true' : undefined}
					aria-current={isSelected ? 'page' : undefined}
					class={optionClass}
					onclick={(event) => choose(option, event)}
				>
					{@render content(option, isSelected, depth, false)}
				</a>
				{#if isParent}
					<button
						type="button"
						class="aurora-hierarchy-menu-caret"
						disabled={option.disabled}
						aria-expanded={isOpen}
						aria-controls={listId}
						aria-label={fill(texts.submenu, option.label)}
						onclick={() => toggle(option)}
					>
						<Icon path={CARET_ICON} class="aurora-hierarchy-menu-caret-icon" />
					</button>
				{/if}
			{:else if isParent}
				<button
					bind:this={rowNodes[option.name]}
					type="button"
					class={optionClass}
					disabled={option.disabled}
					aria-expanded={isOpen}
					aria-controls={listId}
					onclick={() => toggle(option)}
				>
					{@render content(option, isSelected, depth, true)}
				</button>
			{:else}
				<button
					bind:this={rowNodes[option.name]}
					type="button"
					class={optionClass}
					disabled={option.disabled}
					aria-current={isSelected ? 'true' : undefined}
					onclick={(event) => choose(option, event)}
				>
					{@render content(option, isSelected, depth, false)}
				</button>
			{/if}
			{#if appendSnippet && !iconsOnly}
				<div class="aurora-hierarchy-menu-append">
					{@render appendSnippet({ option, selected: isSelected, depth })}
				</div>
			{/if}
			{#if iconsOnly && rowNodes[option.name]}
				<Tooltip activator={rowNodes[option.name]} text={option.label} placement="right" />
			{/if}
		</div>
		{#if isParent && !iconsOnly}
			<div class="aurora-hierarchy-menu-children" data-open={isOpen ? '' : undefined} inert={!isOpen}>
				<div class="aurora-hierarchy-menu-clip">
					<ul id={listId} class={['aurora-hierarchy-menu-list', clazz.children]}>
						{#each children as child (child.name)}
							{@render item(child, depth + 1)}
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	</li>
{/snippet}

<nav
	{...rest}
	bind:this={() => navNode, (node) => (navNode = hierarchyMenuElement = node)}
	aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : texts.label)}
	data-icons-only={iconsOnly ? '' : undefined}
	class={['aurora-hierarchy-menu', clazz.container]}
	{onkeydown}
>
	<ul class="aurora-hierarchy-menu-list">
		{#each options as option (option.name)}
			{@render item(option, 0)}
		{/each}
	</ul>
</nav>

{#if iconsOnly && flyoutOption}
	<Menu
		bind:open={flyoutOpen}
		bind:menuElement={flyoutMenu}
		activator={rowNodes[flyoutOption.name]}
		placement="right-start"
		offset={8}
	>
		<div class="aurora-hierarchy-menu-flyout">
			{#if flyoutOption.href !== undefined && !flyoutOption.disabled}
				<a
					href={flyoutOption.href}
					class="aurora-hierarchy-menu-flyout-title"
					aria-current={flyoutOption.name === current ? 'page' : undefined}
					onclick={(event) => {
						if (flyoutOption) choose(flyoutOption, event);
						flyoutOpen = false;
					}}>{flyoutOption.label}</a
				>
			{:else}
				<div class="aurora-hierarchy-menu-flyout-title">{flyoutOption.label}</div>
			{/if}
			<HierarchyMenu
				options={flyoutOption.options}
				selected={current}
				{currentPath}
				{locale}
				aria-label={flyoutOption.label}
				{prependSnippet}
				{optionSnippet}
				{appendSnippet}
				onoptionClick={(event) => {
					selected = event.option.name;
					closeFlyout();
					onoptionClick?.(event);
				}}
			/>
		</div>
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-hierarchy-menu {
			--_duration: var(--hierarchy-menu-duration, var(--hierarchy-menu-default-duration));
			--_easing: var(--hierarchy-menu-easing, var(--hierarchy-menu-default-easing));
			--_ring-width: var(--hierarchy-menu-focus-ring-width, var(--hierarchy-menu-default-focus-ring-width));
			--_ring-color: var(--hierarchy-menu-focus-ring-color, var(--hierarchy-menu-default-focus-ring-color));
			--_icon-size: var(--hierarchy-menu-icon-size, var(--hierarchy-menu-default-icon-size));
			--_gap: var(--hierarchy-menu-gap, var(--hierarchy-menu-default-gap));

			box-sizing: border-box;
			width: var(--hierarchy-menu-width, var(--hierarchy-menu-default-width));
			font-family: var(--hierarchy-menu-font-family, var(--hierarchy-menu-default-font-family));
		}

		.aurora-hierarchy-menu-list {
			display: flex;
			flex-direction: column;
			gap: var(--_gap);
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-hierarchy-menu-item {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-hierarchy-menu-row {
			--_bg-now: var(--hierarchy-menu-option-background, var(--hierarchy-menu-default-option-background));
			--_color-now: var(--hierarchy-menu-option-color, var(--hierarchy-menu-default-option-color));
			--_height: var(--hierarchy-menu-option-height, var(--hierarchy-menu-default-option-height));
			--_font-size: var(--hierarchy-menu-option-font-size, var(--hierarchy-menu-default-option-font-size));

			position: relative;
			display: flex;
			align-items: center;
			min-height: var(--_height);
			border-radius: var(--hierarchy-menu-option-border-radius, var(--hierarchy-menu-default-option-border-radius));
			background: var(--_bg-now);
			color: var(--_color-now);
			transition:
				background-color var(--global-duration-fast),
				color var(--global-duration-fast);
		}

		.aurora-hierarchy-menu-row:not([data-depth='0']) {
			--_height: var(--hierarchy-menu-child-height, var(--hierarchy-menu-default-child-height));
			--_font-size: var(--hierarchy-menu-child-font-size, var(--hierarchy-menu-default-child-font-size));
		}

		.aurora-hierarchy-menu-row[data-ancestor] {
			--_color-now: var(
				--hierarchy-menu-option-ancestor-color,
				var(--hierarchy-menu-default-option-ancestor-color)
			);
		}

		.aurora-hierarchy-menu-row[data-selected],
		.aurora-hierarchy-menu[data-icons-only] .aurora-hierarchy-menu-row[data-ancestor] {
			--_bg-now: var(
				--hierarchy-menu-option-selected-background,
				var(--hierarchy-menu-default-option-selected-background)
			);
			--_color-now: var(
				--hierarchy-menu-option-selected-color,
				var(--hierarchy-menu-default-option-selected-color)
			);
		}

		.aurora-hierarchy-menu-row[data-selected]::before,
		.aurora-hierarchy-menu[data-icons-only] .aurora-hierarchy-menu-row[data-ancestor]::before {
			content: '';
			position: absolute;
			left: var(--hierarchy-menu-indicator-offset, var(--hierarchy-menu-default-indicator-offset));
			top: var(--hierarchy-menu-indicator-inset, var(--hierarchy-menu-default-indicator-inset));
			bottom: var(--hierarchy-menu-indicator-inset, var(--hierarchy-menu-default-indicator-inset));
			width: var(--hierarchy-menu-indicator-width, var(--hierarchy-menu-default-indicator-width));
			border-radius: 0 3px 3px 0;
			background: var(--hierarchy-menu-indicator-background, var(--hierarchy-menu-default-indicator-background));
			box-shadow: var(--hierarchy-menu-indicator-box-shadow, var(--hierarchy-menu-default-indicator-box-shadow));
		}

		@media (hover: hover) {
			.aurora-hierarchy-menu-row:not([data-selected], [data-disabled]):hover {
				--_bg-now: var(
					--hierarchy-menu-option-hover-background,
					var(--hierarchy-menu-default-option-hover-background)
				);
				--_color-now: var(
					--hierarchy-menu-option-hover-color,
					var(--hierarchy-menu-default-option-hover-color)
				);
			}
		}

		.aurora-hierarchy-menu-row[data-disabled] {
			opacity: var(--hierarchy-menu-disabled-opacity, var(--hierarchy-menu-default-disabled-opacity));
		}

		.aurora-hierarchy-menu-option {
			position: relative;
			display: flex;
			flex: 1;
			align-items: center;
			gap: var(--hierarchy-menu-option-gap, var(--hierarchy-menu-default-option-gap));
			box-sizing: border-box;
			min-width: 0;
			min-height: var(--_height);
			margin: 0;
			padding: var(--hierarchy-menu-option-padding, var(--hierarchy-menu-default-option-padding));
			border: 0;
			border-radius: inherit;
			background: none;
			color: inherit;
			font: inherit;
			font-size: var(--_font-size);
			font-weight: var(--hierarchy-menu-option-font-weight, var(--hierarchy-menu-default-option-font-weight));
			text-align: start;
			text-decoration: none;
			white-space: nowrap;
			cursor: pointer;
		}

		.aurora-hierarchy-menu-row[data-selected] > .aurora-hierarchy-menu-option {
			font-weight: var(
				--hierarchy-menu-option-selected-font-weight,
				var(--hierarchy-menu-default-option-selected-font-weight)
			);
		}

		.aurora-hierarchy-menu-row[data-disabled] > .aurora-hierarchy-menu-option,
		.aurora-hierarchy-menu-row[data-disabled] > .aurora-hierarchy-menu-caret {
			cursor: not-allowed;
		}

		.aurora-hierarchy-menu-option:focus-visible,
		.aurora-hierarchy-menu-caret:focus-visible,
		.aurora-hierarchy-menu-flyout-title:focus-visible {
			outline: var(--_ring-width) solid var(--_ring-color);
			outline-offset: calc(-1 * var(--_ring-width));
		}

		.aurora-hierarchy-menu-option :global(.aurora-hierarchy-menu-icon) {
			--icon-size: var(--_icon-size);
			flex-shrink: 0;
			color: var(--hierarchy-menu-icon-color, var(--hierarchy-menu-default-icon-color));
		}

		.aurora-hierarchy-menu-row[data-selected] :global(.aurora-hierarchy-menu-icon),
		.aurora-hierarchy-menu[data-icons-only]
			.aurora-hierarchy-menu-row[data-ancestor]
			:global(.aurora-hierarchy-menu-icon) {
			color: var(--hierarchy-menu-icon-selected-color, var(--hierarchy-menu-default-icon-selected-color));
		}

		.aurora-hierarchy-menu-lead {
			position: relative;
			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--_icon-size);
			height: var(--_icon-size);
		}

		.aurora-hierarchy-menu-initial {
			font-size: calc(var(--_icon-size) * 0.8);
			font-weight: 600;
			line-height: 1;
			text-transform: uppercase;
		}

		.aurora-hierarchy-menu-label {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.aurora-hierarchy-menu[data-icons-only] .aurora-hierarchy-menu-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.aurora-hierarchy-menu-badge {
			flex-shrink: 0;
			padding: var(--hierarchy-menu-badge-padding, var(--hierarchy-menu-default-badge-padding));
			border-radius: var(--hierarchy-menu-badge-border-radius, var(--hierarchy-menu-default-badge-border-radius));
			background: var(--hierarchy-menu-badge-background, var(--hierarchy-menu-default-badge-background));
			color: var(--hierarchy-menu-badge-color, var(--hierarchy-menu-default-badge-color));
			font-family: var(--hierarchy-menu-badge-font-family, var(--hierarchy-menu-default-badge-font-family));
			font-size: var(--hierarchy-menu-badge-font-size, var(--hierarchy-menu-default-badge-font-size));
			font-weight: 500;
			line-height: 1.5;
		}

		.aurora-hierarchy-menu-row[data-selected] .aurora-hierarchy-menu-badge {
			background: var(
				--hierarchy-menu-badge-selected-background,
				var(--hierarchy-menu-default-badge-selected-background)
			);
			color: var(--hierarchy-menu-badge-selected-color, var(--hierarchy-menu-default-badge-selected-color));
		}

		.aurora-hierarchy-menu-dot {
			position: absolute;
			top: -2px;
			right: -3px;
			width: var(--hierarchy-menu-dot-size, var(--hierarchy-menu-default-dot-size));
			height: var(--hierarchy-menu-dot-size, var(--hierarchy-menu-default-dot-size));
			border-radius: 50%;
			background: var(--hierarchy-menu-dot-color, var(--hierarchy-menu-default-dot-color));
		}

		.aurora-hierarchy-menu-caret {
			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--_height);
			height: var(--_height);
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: inherit;
			background: none;
			color: inherit;
			cursor: pointer;
		}

		.aurora-hierarchy-menu-row :global(.aurora-hierarchy-menu-caret-icon) {
			--icon-size: var(--hierarchy-menu-caret-size, var(--hierarchy-menu-default-caret-size));
			flex-shrink: 0;
			color: var(--hierarchy-menu-caret-color, var(--hierarchy-menu-default-caret-color));
			transition: transform var(--_duration) var(--_easing);
		}

		.aurora-hierarchy-menu-row[data-open] :global(.aurora-hierarchy-menu-caret-icon) {
			transform: rotate(90deg);
		}

		.aurora-hierarchy-menu-append {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			padding-inline-end: 6px;
		}

		.aurora-hierarchy-menu-children {
			display: grid;
			grid-template-rows: 0fr;
			transition: grid-template-rows var(--_duration) var(--_easing);
		}

		.aurora-hierarchy-menu-children[data-open] {
			grid-template-rows: 1fr;
		}

		.aurora-hierarchy-menu-clip {
			min-height: 0;
			overflow: hidden;
		}

		.aurora-hierarchy-menu-clip > .aurora-hierarchy-menu-list {
			margin-inline-start: var(
				--hierarchy-menu-children-offset,
				var(--hierarchy-menu-default-children-offset)
			);
			padding-block-start: var(--_gap);
			padding-inline-start: var(
				--hierarchy-menu-children-indent,
				var(--hierarchy-menu-default-children-indent)
			);
			border-inline-start: var(--hierarchy-menu-children-border, var(--hierarchy-menu-default-children-border));
		}

		.aurora-hierarchy-menu-flyout {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: var(--hierarchy-menu-flyout-min-width, var(--hierarchy-menu-default-flyout-min-width));
			padding: var(--hierarchy-menu-flyout-padding, var(--hierarchy-menu-default-flyout-padding));
			box-sizing: border-box;
		}

		.aurora-hierarchy-menu-flyout-title {
			padding: 6px 13px 4px;
			border-radius: var(--hierarchy-menu-option-border-radius, var(--hierarchy-menu-default-option-border-radius));
			color: var(--hierarchy-menu-flyout-title-color, var(--hierarchy-menu-default-flyout-title-color));
			font-size: var(--hierarchy-menu-flyout-title-font-size, var(--hierarchy-menu-default-flyout-title-font-size));
			font-weight: 600;
			letter-spacing: 0.08em;
			text-decoration: none;
			text-transform: uppercase;
		}

		@media (hover: hover) {
			a.aurora-hierarchy-menu-flyout-title:hover {
				color: var(--hierarchy-menu-option-hover-color, var(--hierarchy-menu-default-option-hover-color));
			}
		}

		.aurora-hierarchy-menu-flyout :global(.aurora-hierarchy-menu) {
			--hierarchy-menu-default-indicator-offset: -6px;
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-hierarchy-menu-children,
			.aurora-hierarchy-menu-row :global(.aurora-hierarchy-menu-caret-icon) {
				transition: none;
			}
		}
	}
</style>
