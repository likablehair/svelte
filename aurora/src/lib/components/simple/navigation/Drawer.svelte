<!-- @component
Panel that slides in from a side of the screen (`position`), modal and on the browser's top layer (`<dialog>` with `showModal()`): it needs no z-index, the page behind is inert and does not scroll, focus stays inside and goes back where it was on close. It closes on Escape (only the topmost one, and not while a menu inside it is open), on a click on the backdrop, with the close button, with `close` from a snippet and with a `<form method="dialog">`; `persistent` blocks Escape and the backdrop. The content is mounted only while open. Every part is optional: `title` (which also names the drawer for screen readers), `closable`, the body (`children`, which scrolls) and `actionsSnippet`, pinned at the bottom. The side is exposed as `data-position`; while closing, the `<dialog>` gets `data-closing`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Drawer.css';
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import Button from '../buttons/Button.svelte';
	import { CLOSE_ICON, leave, modal } from '../dialogs/modal.js';
	import ToastList from '../notifiers/ToastList.svelte';

	type Close = (event: Event) => void;

	interface Props
		extends Omit<HTMLDialogAttributes, 'children' | 'class' | 'open' | 'onclose' | 'title'> {
		/** Whether the drawer is open. `undefined` counts as closed. */
		open?: boolean;
		/** Side of the screen the drawer slides in from. */
		position?: 'left' | 'right' | 'top' | 'bottom';
		/** Keeps the drawer open on Escape and on a click on the backdrop. The close button, `close` from a snippet and a `<form method="dialog">` still close it. */
		persistent?: boolean;
		/** Title in the header. It also names the drawer for screen readers: without it, pass `aria-label`. */
		title?: string;
		/** Shows a close button in the header. */
		closable?: boolean;
		/** Accessible label of the close button. */
		closeLabel?: string;
		/** Called when the drawer closes itself (Escape, backdrop, close button, `close` from a snippet, `<form method="dialog">`), with the event that caused it. Not called when `open` is set to `false` from outside. */
		onclose?: (event: Event) => void;
		/** The `<dialog>` element. */
		drawerElement?: HTMLDialogElement;
		/** Extra classes for each part. */
		class?: {
			drawer?: string;
			backdrop?: string;
			panel?: string;
			header?: string;
			title?: string;
			body?: string;
			actions?: string;
		};
		/** Body of the drawer. It scrolls when it does not fit. */
		children?: Snippet<[{ close: Close }]>;
		/** Replaces the title text, inside the heading. */
		titleSnippet?: Snippet<[{ title: string | undefined }]>;
		/** Replaces the close button. Shown even without `closable`. */
		closeSnippet?: Snippet<[{ close: Close; closeLabel: string }]>;
		/** Footer pinned at the bottom of the panel, usually the buttons, aligned to the right. */
		actionsSnippet?: Snippet<[{ close: Close }]>;
	}

	let {
		open = $bindable(),
		position = 'left',
		persistent = false,
		title,
		closable = false,
		closeLabel = 'Close',
		onclose,
		drawerElement = $bindable(),
		class: clazz = {},
		children,
		titleSnippet,
		closeSnippet,
		actionsSnippet,
		...rest
	}: Props = $props();

	let drawerNode = $state<HTMLDialogElement>();

	const id = $props.id();
	const titleId = `${id}-title`;

	let hasTitle = $derived(!!title || !!titleSnippet);
	let hasHeader = $derived(hasTitle || closable || !!closeSnippet);

	function close(event: Event) {
		if (!open) return;
		open = false;
		onclose?.(event);
	}

	$effect(() => {
		if (open) delete drawerNode?.dataset.closing;
	});
</script>

{#if open}
	<dialog
		aria-labelledby={hasTitle ? titleId : undefined}
		{...rest}
		class={['aurora-drawer', clazz.drawer]}
		data-position={position}
		bind:this={() => drawerNode, (node) => (drawerNode = drawerElement = node)}
		{@attach modal({ persistent: () => persistent, dismiss: close })}
		out:leave
	>
		<div class={['aurora-drawer-backdrop', clazz.backdrop]} data-backdrop></div>
		<div class={['aurora-drawer-panel', clazz.panel]}>
			{#if hasHeader}
				<header class={['aurora-drawer-header', clazz.header]}>
					{#if hasTitle}
						<h2 id={titleId} class={['aurora-drawer-title', clazz.title]}>
							{#if titleSnippet}
								{@render titleSnippet({ title })}
							{:else}
								{title}
							{/if}
						</h2>
					{/if}
					{#if closeSnippet}
						{@render closeSnippet({ close, closeLabel })}
					{:else if closable}
						<Button
							class="aurora-drawer-close"
							buttonType="icon"
							variant="secondary"
							size="sm"
							icon={CLOSE_ICON}
							aria-label={closeLabel}
							onclick={close}
						/>
					{/if}
				</header>
			{/if}
			{#if children}
				<div class={['aurora-drawer-body', clazz.body]}>{@render children({ close })}</div>
			{/if}
			{#if actionsSnippet}
				<footer class={['aurora-drawer-actions', clazz.actions]}>{@render actionsSnippet({ close })}</footer>
			{/if}
		</div>
		<ToastList />
	</dialog>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(html):has(.aurora-drawer:modal) {
			overflow: hidden;
		}

		.aurora-drawer {
			--_duration: var(--drawer-duration, var(--drawer-default-duration));
			--_easing: var(--drawer-easing, var(--drawer-default-easing));
			--_bleed: calc(var(--global-focus-ring-width) + var(--global-focus-ring-offset));
			--_size: var(--drawer-size, var(--drawer-default-size));
			--_max-size: var(--drawer-max-size, var(--drawer-default-max-size));
			--_border: var(--drawer-border-width, var(--drawer-default-border-width)) solid
				var(--drawer-border-color, var(--drawer-default-border-color));

			position: fixed;
			inset: 0;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
			max-width: none;
			max-height: none;
			margin: 0;
			padding: 0;
			border: 0;
			background: none;
			color: inherit;
			overflow: hidden;
		}

		.aurora-drawer::backdrop {
			background: none;
		}

		.aurora-drawer-backdrop {
			position: absolute;
			inset: 0;
			background: var(--drawer-backdrop-background, var(--drawer-default-backdrop-background));
			backdrop-filter: var(--drawer-backdrop-filter, var(--drawer-default-backdrop-filter));
			animation: fade-in var(--_duration) var(--_easing);
		}

		.aurora-drawer-panel {
			position: absolute;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			margin: var(--drawer-margin, var(--drawer-default-margin));
			padding: var(--drawer-padding, var(--drawer-default-padding));
			background: var(--drawer-background, var(--drawer-default-background));
			color: var(--drawer-color, var(--drawer-default-color));
			box-shadow: var(--drawer-box-shadow, var(--drawer-default-box-shadow));
			animation: slide-in var(--_duration) var(--_easing);
		}

		.aurora-drawer[data-position='left'] .aurora-drawer-panel,
		.aurora-drawer[data-position='right'] .aurora-drawer-panel {
			top: 0;
			bottom: 0;
			width: var(--_size);
			max-width: var(--_max-size);
		}

		.aurora-drawer[data-position='top'] .aurora-drawer-panel,
		.aurora-drawer[data-position='bottom'] .aurora-drawer-panel {
			left: 0;
			right: 0;
			height: var(--_size);
			max-height: var(--_max-size);
		}

		.aurora-drawer[data-position='left'] .aurora-drawer-panel {
			--_from: -100% 0;
			left: 0;
			border-right: var(--_border);
			border-radius: var(--drawer-border-radius, var(--drawer-default-left-border-radius));
		}

		.aurora-drawer[data-position='right'] .aurora-drawer-panel {
			--_from: 100% 0;
			right: 0;
			border-left: var(--_border);
			border-radius: var(--drawer-border-radius, var(--drawer-default-right-border-radius));
		}

		.aurora-drawer[data-position='top'] .aurora-drawer-panel {
			--_from: 0 -100%;
			top: 0;
			border-bottom: var(--_border);
			border-radius: var(--drawer-border-radius, var(--drawer-default-top-border-radius));
		}

		.aurora-drawer[data-position='bottom'] .aurora-drawer-panel {
			--_from: 0 100%;
			bottom: 0;
			border-top: var(--_border);
			border-radius: var(--drawer-border-radius, var(--drawer-default-bottom-border-radius));
		}

		.aurora-drawer[data-closing] .aurora-drawer-backdrop {
			animation: fade-out var(--_duration) var(--_easing) forwards;
		}

		.aurora-drawer[data-closing] .aurora-drawer-panel {
			animation: slide-out var(--_duration) var(--_easing) forwards;
		}

		.aurora-drawer-header {
			display: flex;
			align-items: center;
			gap: var(--drawer-header-gap, var(--drawer-default-header-gap));
			padding: var(--drawer-header-padding, var(--drawer-default-header-padding));
		}

		.aurora-drawer-header:not(:last-child) {
			margin-bottom: var(--drawer-header-margin-bottom, var(--drawer-default-header-margin-bottom));
		}

		.aurora-drawer-header > :global(.aurora-drawer-close) {
			flex: none;
			margin-inline-start: auto;
		}

		.aurora-drawer-title {
			flex: 1 1 auto;
			min-width: 0;
			margin: 0;
			color: var(--drawer-title-color, var(--drawer-default-title-color));
			font-family: var(--drawer-title-font-family, var(--drawer-default-title-font-family));
			font-size: var(--drawer-title-font-size, var(--drawer-default-title-font-size));
			font-weight: var(--drawer-title-font-weight, var(--drawer-default-title-font-weight));
			line-height: var(--drawer-title-line-height, var(--drawer-default-title-line-height));
			letter-spacing: var(--drawer-title-letter-spacing, var(--drawer-default-title-letter-spacing));
			overflow-wrap: anywhere;
		}

		.aurora-drawer-body {
			flex: 1 1 auto;
			min-height: 0;
			margin: calc(-1 * var(--_bleed));
			padding: var(--_bleed);
			overflow: var(--drawer-overflow, var(--drawer-default-overflow));
			overscroll-behavior: contain;
			color: var(--drawer-body-color, var(--drawer-default-body-color));
			font-size: var(--drawer-body-font-size, var(--drawer-default-body-font-size));
			line-height: var(--drawer-body-line-height, var(--drawer-default-body-line-height));
		}

		.aurora-drawer-actions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--drawer-actions-gap, var(--drawer-default-actions-gap));
			justify-content: var(
				--drawer-actions-justify-content,
				var(--drawer-default-actions-justify-content)
			);
			padding: var(--drawer-actions-padding, var(--drawer-default-actions-padding));
		}

		.aurora-drawer-actions:not(:first-child) {
			margin-top: var(--drawer-actions-margin-top, var(--drawer-default-actions-margin-top));
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes slide-in {
		from {
			translate: var(--_from);
		}
	}

	@keyframes slide-out {
		to {
			translate: var(--_from);
		}
	}
</style>
