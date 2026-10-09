<!-- @component
Short description of an element, shown on hover after `appearTimeout` and right away on keyboard focus. It stays open while the pointer moves onto it and closes on Escape, on a click or when the pointer and the focus leave; on touch screens a tap on the activator toggles it. It opens on the browser's top layer (`popover`) next to the `activator`, flips and shifts to stay in the viewport, and adds its id to the activator's `aria-describedby`. `variant="plain"` is a dark one-line label, `variant="rich"` a card with a `title` and wrapping text. A tooltip is never interactive: for links or buttons use `Menu`. The current side is exposed as `data-side` and the variant as `data-variant` on the tooltip element.
-->
<script lang="ts" module>
	let lastClosedAt = 0;
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './Tooltip.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { follow, place } from './floating.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'popover' | 'title'> {
		/** Element the tooltip describes and opens from. */
		activator?: HTMLElement;
		/** Whether the tooltip is open. It opens and closes by itself; bind it to open it from code. */
		open?: boolean;
		/** Text of the tooltip. */
		text?: string;
		/** Bold first line, mostly for `variant="rich"`. */
		title?: string;
		/** `plain` a dark one-line label, `rich` a card with a title and wrapping text. */
		variant?: 'plain' | 'rich';
		/** Side of the activator and alignment. Flips to the opposite side when there is not enough space. */
		placement?:
			| 'top'
			| 'top-start'
			| 'top-end'
			| 'bottom'
			| 'bottom-start'
			| 'bottom-end'
			| 'left'
			| 'left-start'
			| 'left-end'
			| 'right'
			| 'right-start'
			| 'right-end';
		/** Distance from the activator, in pixels, arrow included. */
		offset?: number;
		/** Delay before the tooltip opens on hover, in milliseconds. Keyboard focus opens it right away, and so does hovering another tooltip's activator just after one closed. */
		appearTimeout?: number;
		/** The tooltip element. */
		tooltipElement?: HTMLDivElement;
		/** Extra classes on the tooltip element. */
		class?: string;
		/** Replaces `text`. Keep it non-interactive. */
		children?: Snippet;
		/** Replaces the title. */
		titleSnippet?: Snippet<[{ title: string | undefined }]>;
	}

	let {
		activator = $bindable(),
		open = $bindable(),
		text,
		title,
		variant = 'plain',
		placement = 'top',
		offset = 10,
		appearTimeout = 400,
		tooltipElement = $bindable(),
		class: clazz,
		children,
		titleSnippet,
		...rest
	}: Props = $props();

	let tooltipNode = $state<HTMLDivElement>();

	const generatedId = $props.id();
	let id = $derived(rest.id ?? generatedId);

	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function clearTimers() {
		clearTimeout(openTimer);
		clearTimeout(closeTimer);
	}

	function scheduleOpen() {
		clearTimeout(closeTimer);
		if (open) return;
		clearTimeout(openTimer);
		const delay = Date.now() - lastClosedAt < 300 ? 0 : appearTimeout;
		openTimer = setTimeout(() => (open = true), delay);
	}

	function scheduleClose() {
		clearTimers();
		closeTimer = setTimeout(() => (open = false), 100);
	}

	$effect(() => {
		const element = activator;
		if (!element) return;
		const tooltipId = id;
		const described = (element.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
		if (!described.includes(tooltipId))
			element.setAttribute('aria-describedby', [...described, tooltipId].join(' '));

		const onPointerEnter = (event: PointerEvent) => {
			if (event.pointerType !== 'touch') scheduleOpen();
		};
		const onPointerLeave = (event: PointerEvent) => {
			if (event.pointerType !== 'touch') scheduleClose();
		};
		const onPointerDown = (event: PointerEvent) => {
			clearTimers();
			open = event.pointerType === 'touch' ? !open : false;
		};
		const onFocusIn = (event: FocusEvent) => {
			if (!(event.target as Element).matches(':focus-visible')) return;
			clearTimers();
			open = true;
		};
		const onFocusOut = () => {
			clearTimers();
			open = false;
		};

		element.addEventListener('pointerenter', onPointerEnter);
		element.addEventListener('pointerleave', onPointerLeave);
		element.addEventListener('pointerdown', onPointerDown);
		element.addEventListener('focusin', onFocusIn);
		element.addEventListener('focusout', onFocusOut);

		return () => {
			clearTimers();
			element.removeEventListener('pointerenter', onPointerEnter);
			element.removeEventListener('pointerleave', onPointerLeave);
			element.removeEventListener('pointerdown', onPointerDown);
			element.removeEventListener('focusin', onFocusIn);
			element.removeEventListener('focusout', onFocusOut);
			const remaining = (element.getAttribute('aria-describedby') ?? '')
				.split(' ')
				.filter((token) => token && token !== tooltipId);
			if (remaining.length) element.setAttribute('aria-describedby', remaining.join(' '));
			else element.removeAttribute('aria-describedby');
		};
	});

	$effect(() => {
		const node = tooltipNode;
		if (!node) return;
		const onPointerEnter = () => clearTimeout(closeTimer);
		const onPointerLeave = (event: PointerEvent) => {
			if (event.pointerType !== 'touch') scheduleClose();
		};
		node.addEventListener('pointerenter', onPointerEnter);
		node.addEventListener('pointerleave', onPointerLeave);
		return () => {
			node.removeEventListener('pointerenter', onPointerEnter);
			node.removeEventListener('pointerleave', onPointerLeave);
		};
	});

	$effect(() => {
		const node = tooltipNode;
		if (!node) return;
		if (!open) {
			if (node.matches(':popover-open')) {
				node.hidePopover();
				lastClosedAt = Date.now();
			}
			return;
		}

		const anchor = activator;
		const side = placement;
		const distance = offset;
		const update = () => place(node, anchor, side, distance);
		if (!node.matches(':popover-open')) node.showPopover();
		update();
		const stopFollowing = follow(node, anchor, update);

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			event.preventDefault();
			clearTimers();
			open = false;
		};
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (node.contains(target) || anchor?.contains(target)) return;
			clearTimers();
			open = false;
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown, true);

		return () => {
			stopFollowing();
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown, true);
		};
	});
</script>

<div
	{...rest}
	{id}
	popover="manual"
	role="tooltip"
	class={['aurora-tooltip', clazz]}
	data-variant={variant}
	bind:this={() => tooltipNode, (node) => (tooltipNode = tooltipElement = node)}
>
	<span class="aurora-tooltip-arrow"></span>
	{#if titleSnippet}
		<span class="aurora-tooltip-title">{@render titleSnippet({ title })}</span>
	{:else if title}
		<span class="aurora-tooltip-title">{title}</span>
	{/if}
	{#if children}
		<span class="aurora-tooltip-text">{@render children()}</span>
	{:else if text}
		<span class="aurora-tooltip-text">{text}</span>
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-tooltip {
			--_max-width: var(--tooltip-default-max-width);
			--_padding: var(--tooltip-default-padding);
			--_background: var(--tooltip-default-background);
			--_color: var(--tooltip-default-color);
			--_text-color: var(--tooltip-default-text-color);
			--_border-width: var(--tooltip-default-border-width);
			--_border-color: var(--tooltip-default-border-color);
			--_font-weight: var(--tooltip-default-font-weight);
			--_bw: var(--tooltip-border-width, var(--_border-width));
			--_border: var(--_bw) solid var(--tooltip-border-color, var(--_border-color));
			--_arrow: var(--tooltip-arrow-size, var(--tooltip-default-arrow-size));
			--_duration: var(--tooltip-duration, var(--tooltip-default-duration));
			--_distance: var(--tooltip-transition-distance, var(--tooltip-default-transition-distance));
			--_dx: 0px;
			--_dy: var(--_distance);

			position: fixed;
			inset: auto;
			box-sizing: border-box;
			width: max-content;
			max-width: min(var(--tooltip-max-width, var(--_max-width)), calc(100vw - 16px));
			margin: 0;
			padding: var(--tooltip-padding, var(--_padding));
			overflow: visible;
			background: var(--tooltip-background, var(--_background));
			color: var(--tooltip-color, var(--_color));
			border: var(--_border);
			border-radius: var(--tooltip-border-radius, var(--tooltip-default-border-radius));
			box-shadow: var(--tooltip-box-shadow, var(--tooltip-default-box-shadow));
			font-size: var(--tooltip-font-size, var(--tooltip-default-font-size));
			font-weight: var(--tooltip-font-weight, var(--_font-weight));
			line-height: var(--tooltip-line-height, var(--tooltip-default-line-height));
			text-align: start;
			overflow-wrap: break-word;
			opacity: 0;
			transform: translate(var(--_dx), var(--_dy));
			transition:
				opacity var(--_duration) var(--global-ease),
				transform var(--_duration) var(--global-ease),
				display var(--_duration) allow-discrete,
				overlay var(--_duration) allow-discrete;
		}

		.aurora-tooltip[data-variant='rich'] {
			--_max-width: var(--tooltip-default-rich-max-width);
			--_padding: var(--tooltip-default-rich-padding);
			--_background: var(--tooltip-default-rich-background);
			--_color: var(--tooltip-default-rich-color);
			--_text-color: var(--tooltip-default-rich-text-color);
			--_border-width: var(--tooltip-default-rich-border-width);
			--_border-color: var(--tooltip-default-rich-border-color);
			--_font-weight: var(--tooltip-default-rich-font-weight);
		}

		.aurora-tooltip[data-side='bottom'] {
			--_dy: calc(-1 * var(--_distance));
		}

		.aurora-tooltip[data-side='left'] {
			--_dx: var(--_distance);
			--_dy: 0px;
		}

		.aurora-tooltip[data-side='right'] {
			--_dx: calc(-1 * var(--_distance));
			--_dy: 0px;
		}

		.aurora-tooltip:popover-open {
			opacity: 1;
			transform: none;
		}

		@starting-style {
			.aurora-tooltip:popover-open {
				opacity: 0;
				transform: translate(var(--_dx), var(--_dy));
			}
		}

		.aurora-tooltip-title,
		.aurora-tooltip-text {
			position: relative;
			display: block;
		}

		.aurora-tooltip-title {
			font-weight: var(--tooltip-title-font-weight, var(--tooltip-default-title-font-weight));
		}

		.aurora-tooltip-title + .aurora-tooltip-text {
			margin-top: 2px;
			color: var(--tooltip-text-color, var(--_text-color));
		}

		.aurora-tooltip-arrow {
			--_edge: calc(var(--_bw) / 2 - var(--_arrow) / 2);
			--_x: clamp(
				4px,
				calc(var(--aurora-anchor-x) - var(--_bw) - var(--_arrow) / 2),
				calc(100% - var(--_arrow) - 4px)
			);
			--_y: clamp(
				4px,
				calc(var(--aurora-anchor-y) - var(--_bw) - var(--_arrow) / 2),
				calc(100% - var(--_arrow) - 4px)
			);

			position: absolute;
			box-sizing: border-box;
			width: var(--_arrow);
			height: var(--_arrow);
			background: inherit;
			border: var(--_border);
			rotate: 45deg;
			pointer-events: none;
		}

		.aurora-tooltip[data-side='top'] .aurora-tooltip-arrow {
			top: calc(100% + var(--_edge));
			left: var(--_x);
			border-top-color: transparent;
			border-left-color: transparent;
		}

		.aurora-tooltip[data-side='bottom'] .aurora-tooltip-arrow {
			bottom: calc(100% + var(--_edge));
			left: var(--_x);
			border-right-color: transparent;
			border-bottom-color: transparent;
		}

		.aurora-tooltip[data-side='left'] .aurora-tooltip-arrow {
			left: calc(100% + var(--_edge));
			top: var(--_y);
			border-bottom-color: transparent;
			border-left-color: transparent;
		}

		.aurora-tooltip[data-side='right'] .aurora-tooltip-arrow {
			right: calc(100% + var(--_edge));
			top: var(--_y);
			border-top-color: transparent;
			border-right-color: transparent;
		}
	}
</style>
