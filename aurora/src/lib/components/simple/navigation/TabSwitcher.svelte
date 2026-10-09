<!-- @component
Row of tabs where one is selected (`bind:selected`). Tabs are `Tab` objects, `{ name: string; label: string; icon?: string; badge?: string | number; href?: string; disabled?: boolean; panelId?: string }`: `name` identifies the tab and is what `selected` holds, `label` is shown, `icon` is an SVG path, `badge` a short count in a pill, `panelId` the `id` of the panel the tab shows (`aria-controls`). By default it is an ARIA tab list: the arrow keys, Home and End move the focus between the tabs, Enter and Space select the focused one, and only one tab is in the Tab order. When the tabs have `href` it is a `<nav>` of links with `aria-current="page"` on the selected one, for tabs that switch page. Two looks, `underline` (default) and `segmented`, with an indicator that slides to the selected tab. Tabs that do not fit scroll sideways, and the selected one is scrolled into view. Its state is exposed as `data-variant` on the root and `data-selected` on the selected tab for app CSS.
-->
<script lang="ts" module>
	export type Tab = {
		/** Unique value: `selected` holds the name of the selected tab. */
		name: string;
		/** Visible text. */
		label: string;
		/** SVG path of an icon before the text, for example from `@mdi/js`. */
		icon?: string;
		/** Short count or text after the label, in a pill. */
		badge?: string | number;
		/** Makes the tab a link. With at least one `href` the tabs are a `<nav>` of links. */
		href?: string;
		/** The tab cannot be selected. */
		disabled?: boolean;
		/** `id` of the panel the tab shows, set as `aria-controls`. */
		panelId?: string;
	};
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './TabSwitcher.css';
	import { untrack, type Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** Tabs, in order. */
		tabs?: Tab[];
		/** `name` of the selected tab. */
		selected?: string;
		/** While `selected` is empty, the first enabled tab is selected. */
		mandatory?: boolean;
		/** Look: `underline` (text tabs on a line) or `segmented` (a pill with a sliding thumb). */
		variant?: 'underline' | 'segmented';
		/** Accessible name of the tab list, or of the `<nav>` with links. Not shown. */
		'aria-label'?: string | null;
		/** `id` of the element that names the tab list. */
		'aria-labelledby'?: string | null;
		/** Classes of the parts: `container` the root, `tab` every tab, `selected` the selected tab, `indicator` the sliding indicator. */
		class?: {
			container?: ClassValue;
			tab?: ClassValue;
			selected?: ClassValue;
			indicator?: ClassValue;
		};
		/** Called on a click on a tab (Enter and Space included), after `selected` has changed. Links navigate on their own. */
		ontabClick?: (event: { tab: Tab; nativeEvent: MouseEvent }) => void;
		/** The root element. */
		tabSwitcherElement?: HTMLDivElement;
		/** Replaces the content of every tab (icon, label and badge). */
		tabSnippet?: Snippet<[{ tab: Tab; selected: boolean }]>;
		/** Content at the end of the row, after the tabs, such as an action button. */
		appendSnippet?: Snippet;
	}

	let {
		tabs = [],
		selected = $bindable(),
		mandatory = true,
		variant = 'underline',
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		class: clazz = {},
		ontabClick,
		tabSwitcherElement = $bindable(),
		tabSnippet,
		appendSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();

	const links = $derived(tabs.some((tab) => tab.href !== undefined));
	const firstEnabled = $derived(tabs.find((tab) => !tab.disabled));
	const current = $derived(selected ?? (mandatory ? firstEnabled?.name : undefined));

	let focused: string | undefined = $state();
	const tabStop = $derived(
		focused ??
			(tabs.some((tab) => tab.name === current && !tab.disabled) ? current : firstEnabled?.name)
	);

	let listNode: HTMLElement | undefined = $state();
	let indicator: { x: number; y: number; width: number; height: number } | undefined = $state();
	let animated = $state(false);

	$effect(() => {
		if (selected === undefined && current !== undefined) selected = current;
	});

	function selectedNode() {
		return listNode?.querySelector<HTMLElement>('.aurora-tab-switcher-tab[data-selected]');
	}

	function measure() {
		const node = selectedNode();
		if (!node || !listNode) {
			indicator = undefined;
			return;
		}
		const tab = node.getBoundingClientRect();
		const list = listNode.getBoundingClientRect();
		indicator = {
			x: tab.left - list.left - listNode.clientLeft + listNode.scrollLeft,
			y: tab.top - list.top - listNode.clientTop + listNode.scrollTop,
			width: tab.width,
			height: tab.height
		};
	}

	function reveal(behavior: ScrollBehavior) {
		const node = selectedNode();
		if (!node || !listNode || listNode.scrollWidth <= listNode.clientWidth) return;
		const tab = node.getBoundingClientRect();
		const list = listNode.getBoundingClientRect();
		const inset = listNode.clientLeft + parseFloat(getComputedStyle(listNode).paddingLeft);
		if (tab.left < list.left + inset)
			listNode.scrollBy({ left: tab.left - list.left - inset, behavior });
		else if (tab.right > list.right - inset)
			listNode.scrollBy({ left: tab.right - list.right + inset, behavior });
	}

	$effect(() => {
		void current;
		void tabs;
		void variant;
		measure();
		reveal(untrack(() => animated) ? 'smooth' : 'instant');
	});

	$effect(() => {
		if (!listNode) return;
		void tabs;
		const observer = new ResizeObserver(() => measure());
		observer.observe(listNode);
		for (const node of listNode.querySelectorAll('.aurora-tab-switcher-tab')) observer.observe(node);
		return () => observer.disconnect();
	});

	$effect(() => {
		const frame = requestAnimationFrame(() => (animated = true));
		return () => cancelAnimationFrame(frame);
	});

	function select(tab: Tab, nativeEvent: MouseEvent) {
		if (tab.disabled) return;
		if (
			tab.href !== undefined &&
			(nativeEvent.metaKey || nativeEvent.ctrlKey || nativeEvent.shiftKey || nativeEvent.altKey)
		)
			return;
		selected = tab.name;
		ontabClick?.({ tab, nativeEvent });
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey || !listNode) return;
		if (!(event.target instanceof HTMLElement) || event.target.getAttribute('role') !== 'tab') return;
		const enabled = tabs.filter((tab) => !tab.disabled);
		const from = enabled.findIndex((tab) => tab.name === tabStop);
		const step = getComputedStyle(listNode).direction === 'rtl' ? -1 : 1;
		let to: number;
		if (event.key === 'ArrowRight') to = from + step;
		else if (event.key === 'ArrowLeft') to = from - step;
		else if (event.key === 'Home') to = 0;
		else if (event.key === 'End') to = enabled.length - 1;
		else return;
		event.preventDefault();
		const tab = enabled[(to + enabled.length) % enabled.length];
		if (!tab) return;
		focused = tab.name;
		listNode.querySelector<HTMLElement>(`#${CSS.escape(tabId(tabs.indexOf(tab)))}`)?.focus();
	}

	function onfocusout(event: FocusEvent) {
		if (!listNode?.contains(event.relatedTarget as Node | null)) focused = undefined;
	}

	function tabId(index: number) {
		return `${uid}-tab-${index}`;
	}
</script>

{#snippet content(tab: Tab, isSelected: boolean)}
	{#if tabSnippet}
		{@render tabSnippet({ tab, selected: isSelected })}
	{:else}
		{#if tab.icon}<Icon path={tab.icon} />{/if}
		<span class="aurora-tab-switcher-label">{tab.label}</span>
		{#if tab.badge !== undefined && tab.badge !== ''}
			<span class="aurora-tab-switcher-badge">{tab.badge}</span>
		{/if}
	{/if}
{/snippet}

{#snippet indicatorNode()}
	<span
		aria-hidden="true"
		class={['aurora-tab-switcher-indicator', clazz.indicator]}
		style:--aurora-indicator-x={indicator && `${indicator.x}px`}
		style:--aurora-indicator-y={indicator && `${indicator.y}px`}
		style:--aurora-indicator-width={indicator && `${indicator.width}px`}
		style:--aurora-indicator-height={indicator && `${indicator.height}px`}
	></span>
{/snippet}

<div
	{...rest}
	bind:this={tabSwitcherElement}
	data-variant={variant}
	data-indicator={indicator ? '' : undefined}
	data-animated={animated ? '' : undefined}
	class={['aurora-tab-switcher', clazz.container]}
>
	{#if links}
		<nav
			bind:this={listNode}
			class="aurora-tab-switcher-list"
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
		>
			{#each tabs as tab, index (tab.name)}
				{@const isSelected = tab.name === current}
				{#if tab.href !== undefined}
					<a
						id={tabId(index)}
						href={tab.disabled ? undefined : tab.href}
						role={tab.disabled ? 'link' : undefined}
						aria-disabled={tab.disabled ? 'true' : undefined}
						aria-current={isSelected ? 'page' : undefined}
						data-selected={isSelected ? '' : undefined}
						class={['aurora-tab-switcher-tab', clazz.tab, isSelected && clazz.selected]}
						onclick={(event) => select(tab, event)}
					>
						{@render content(tab, isSelected)}
					</a>
				{:else}
					<button
						id={tabId(index)}
						type="button"
						disabled={tab.disabled}
						data-selected={isSelected ? '' : undefined}
						class={['aurora-tab-switcher-tab', clazz.tab, isSelected && clazz.selected]}
						onclick={(event) => select(tab, event)}
					>
						{@render content(tab, isSelected)}
					</button>
				{/if}
			{/each}
			{@render indicatorNode()}
		</nav>
	{:else}
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			bind:this={listNode}
			role="tablist"
			aria-orientation="horizontal"
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			class="aurora-tab-switcher-list"
			{onkeydown}
			{onfocusout}
		>
			{#each tabs as tab, index (tab.name)}
				{@const isSelected = tab.name === current}
				<button
					id={tabId(index)}
					type="button"
					role="tab"
					aria-selected={isSelected}
					aria-controls={tab.panelId}
					tabindex={tab.name === tabStop ? 0 : -1}
					disabled={tab.disabled}
					data-selected={isSelected ? '' : undefined}
					class={['aurora-tab-switcher-tab', clazz.tab, isSelected && clazz.selected]}
					onclick={(event) => select(tab, event)}
					onfocus={() => (focused = tab.name)}
				>
					{@render content(tab, isSelected)}
				</button>
			{/each}
			{@render indicatorNode()}
		</div>
	{/if}
	{#if appendSnippet}
		<div class="aurora-tab-switcher-append">{@render appendSnippet()}</div>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-tab-switcher {
			--_gap: var(--tab-switcher-default-underline-gap);
			--_padding: var(--tab-switcher-default-underline-padding);
			--_font-size: var(--tab-switcher-default-underline-font-size);
			--_color: var(--tab-switcher-default-underline-color);
			--_hover-color: var(--tab-switcher-default-underline-hover-color);
			--_selected-color: var(--tab-switcher-default-underline-selected-color);
			--_radius: var(--tab-switcher-default-underline-border-radius);
			--_ind-background: var(--tab-switcher-default-underline-indicator-background);
			--_ind-border-width: var(--tab-switcher-default-underline-indicator-border-width);
			--_ind-border-color: var(--tab-switcher-default-underline-indicator-border-color);
			--_ind-radius: var(--tab-switcher-default-underline-indicator-border-radius);
			--_ind-shadow: var(--tab-switcher-default-underline-indicator-box-shadow);
			--_easing: var(--tab-switcher-default-underline-easing);
			--_ind-thickness: var(
				--tab-switcher-indicator-height,
				var(--tab-switcher-default-underline-indicator-height)
			);
			--_ring-width: var(
				--tab-switcher-focus-ring-width,
				var(--tab-switcher-default-focus-ring-width)
			);
			--_ring-offset: var(
				--tab-switcher-focus-ring-offset,
				var(--tab-switcher-default-focus-ring-offset)
			);
			--_ring-space: calc(var(--_ring-width) + var(--_ring-offset));

			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(--tab-switcher-append-gap, var(--tab-switcher-default-append-gap));
			width: var(--tab-switcher-width, var(--tab-switcher-default-width));
			min-width: 0;
			box-shadow: inset 0
				calc(-1 * var(--tab-switcher-guide-width, var(--tab-switcher-default-guide-width)))
				var(--tab-switcher-guide-color, var(--tab-switcher-default-guide-color));
			font-family: var(--tab-switcher-font-family, var(--tab-switcher-default-font-family));
			font-size: var(--tab-switcher-font-size, var(--_font-size));
			font-weight: var(--tab-switcher-font-weight, var(--tab-switcher-default-font-weight));
		}

		.aurora-tab-switcher[data-variant='segmented'] {
			--_gap: var(--tab-switcher-default-segmented-gap);
			--_padding: var(--tab-switcher-default-segmented-padding);
			--_font-size: var(--tab-switcher-default-segmented-font-size);
			--_color: var(--tab-switcher-default-segmented-color);
			--_hover-color: var(--tab-switcher-default-segmented-hover-color);
			--_selected-color: var(--tab-switcher-default-segmented-selected-color);
			--_radius: var(--tab-switcher-default-segmented-border-radius);
			--_ind-background: var(--tab-switcher-default-segmented-indicator-background);
			--_ind-border-width: var(--tab-switcher-default-segmented-indicator-border-width);
			--_ind-border-color: var(--tab-switcher-default-segmented-indicator-border-color);
			--_ind-radius: var(--tab-switcher-default-segmented-indicator-border-radius);
			--_ind-shadow: var(--tab-switcher-default-segmented-indicator-box-shadow);
			--_easing: var(--tab-switcher-default-segmented-easing);

			box-shadow: none;
		}

		.aurora-tab-switcher-list {
			position: relative;
			display: flex;
			flex: 0 1 auto;
			gap: var(--tab-switcher-gap, var(--_gap));
			min-width: 0;
			margin: calc(-1 * var(--_ring-space));
			padding: var(--_ring-space);
			overflow-x: auto;
			scrollbar-width: thin;
		}

		.aurora-tab-switcher[data-variant='segmented'] .aurora-tab-switcher-list {
			--_ring-space: var(--tab-switcher-list-padding, var(--tab-switcher-default-list-padding));

			margin: 0;
			border: var(--tab-switcher-list-border-width, var(--tab-switcher-default-list-border-width))
				solid var(--tab-switcher-list-border-color, var(--tab-switcher-default-list-border-color));
			border-radius: var(
				--tab-switcher-list-border-radius,
				var(--tab-switcher-default-list-border-radius)
			);
			background: var(--tab-switcher-list-background, var(--tab-switcher-default-list-background));
		}

		.aurora-tab-switcher-tab {
			--icon-size: var(--tab-switcher-icon-size, var(--tab-switcher-default-icon-size));

			box-sizing: border-box;
			position: relative;
			z-index: 1;
			display: inline-flex;
			flex: none;
			align-items: center;
			gap: var(--tab-switcher-icon-gap, var(--tab-switcher-default-icon-gap));
			margin: 0;
			padding: var(--tab-switcher-padding, var(--_padding));
			border: 0;
			border-radius: var(--tab-switcher-border-radius, var(--_radius));
			background: none;
			color: var(--tab-switcher-color, var(--_color));
			font: inherit;
			line-height: 1.3;
			text-decoration: none;
			white-space: nowrap;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition: color var(--global-duration) var(--global-ease);
		}

		.aurora-tab-switcher-tab[data-selected] {
			color: var(--tab-switcher-selected-color, var(--_selected-color));
		}

		@media (hover: hover) {
			.aurora-tab-switcher-tab:not([data-selected], :disabled, [aria-disabled='true']):hover {
				color: var(--tab-switcher-hover-color, var(--_hover-color));
			}
		}

		.aurora-tab-switcher-tab:focus-visible {
			outline: var(--_ring-width) solid
				var(--tab-switcher-focus-ring-color, var(--tab-switcher-default-focus-ring-color));
			outline-offset: var(--_ring-offset);
		}

		.aurora-tab-switcher[data-variant='segmented'] .aurora-tab-switcher-tab:focus-visible {
			outline-offset: 0px;
		}

		.aurora-tab-switcher-tab:disabled,
		.aurora-tab-switcher-tab[aria-disabled='true'] {
			opacity: var(--tab-switcher-disabled-opacity, var(--tab-switcher-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-tab-switcher-badge {
			padding: var(--tab-switcher-badge-padding, var(--tab-switcher-default-badge-padding));
			border-radius: var(
				--tab-switcher-badge-border-radius,
				var(--tab-switcher-default-badge-border-radius)
			);
			background: var(--tab-switcher-badge-background, var(--tab-switcher-default-badge-background));
			color: var(--tab-switcher-badge-color, var(--tab-switcher-default-badge-color));
			font-family: var(
				--tab-switcher-badge-font-family,
				var(--tab-switcher-default-badge-font-family)
			);
			font-size: var(--tab-switcher-badge-font-size, var(--tab-switcher-default-badge-font-size));
			line-height: 1.4;
		}

		.aurora-tab-switcher-indicator,
		.aurora-tab-switcher:not([data-indicator]) .aurora-tab-switcher-tab[data-selected]::after {
			box-sizing: border-box;
			position: absolute;
			border: var(--tab-switcher-indicator-border-width, var(--_ind-border-width)) solid
				var(--tab-switcher-indicator-border-color, var(--_ind-border-color));
			border-radius: var(--tab-switcher-indicator-border-radius, var(--_ind-radius));
			background: var(--tab-switcher-indicator-background, var(--_ind-background));
			box-shadow: var(--tab-switcher-indicator-box-shadow, var(--_ind-shadow));
			pointer-events: none;
		}

		.aurora-tab-switcher-indicator {
			top: 0;
			left: 0;
			width: var(--aurora-indicator-width);
			height: var(--_ind-thickness);
			translate: var(--aurora-indicator-x)
				calc(var(--aurora-indicator-y) + var(--aurora-indicator-height) - var(--_ind-thickness));
		}

		.aurora-tab-switcher:not([data-indicator]) .aurora-tab-switcher-indicator {
			visibility: hidden;
		}

		.aurora-tab-switcher[data-animated] .aurora-tab-switcher-indicator {
			transition-property: translate, width, height;
			transition-duration: var(--tab-switcher-duration, var(--tab-switcher-default-duration));
			transition-timing-function: var(--tab-switcher-easing, var(--_easing));
		}

		.aurora-tab-switcher:not([data-indicator]) .aurora-tab-switcher-tab[data-selected]::after {
			content: '';
			inset: auto 0 0;
			height: var(--_ind-thickness);
		}

		.aurora-tab-switcher[data-variant='segmented'] .aurora-tab-switcher-indicator {
			z-index: 0;
			height: var(--aurora-indicator-height);
			translate: var(--aurora-indicator-x) var(--aurora-indicator-y);
		}

		.aurora-tab-switcher[data-variant='segmented']:not([data-indicator])
			.aurora-tab-switcher-tab[data-selected]::after {
			z-index: -1;
			inset: 0;
			height: auto;
		}

		.aurora-tab-switcher-append {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(--tab-switcher-append-gap, var(--tab-switcher-default-append-gap));
			margin-inline-start: auto;
		}
	}
</style>
