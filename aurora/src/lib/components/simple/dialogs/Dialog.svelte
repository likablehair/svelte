<!-- @component
Modal dialog on the browser's top layer (`<dialog>` with `showModal()`): it needs no z-index, the page behind is inert and does not scroll, focus stays inside and goes back where it was on close. It closes on Escape (only the topmost one, and not while a menu inside it is open), on a click on the backdrop, with the close button, with `close` from a snippet and with a `<form method="dialog">`; `persistent` blocks Escape and the backdrop. The content is mounted only while open. Every part is optional: `title` (which also names the dialog for screen readers), `closable`, the body (`children`) and `actionsSnippet`; `topRightSnippet`, `centerLeftSnippet` and `centerRightSnippet` sit on the backdrop outside the surface, for example the arrows of a lightbox. While closing, the `<dialog>` gets `data-closing`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Dialog.css';
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import Button from '../buttons/Button.svelte';
	import { CLOSE_ICON, leave, modal } from './modal.js';
	import ToastList from '../notifiers/ToastList.svelte';

	type Close = (event: Event) => void;

	interface Props
		extends Omit<HTMLDialogAttributes, 'children' | 'class' | 'open' | 'onclose' | 'title'> {
		/** Whether the dialog is open. `undefined` counts as closed. */
		open?: boolean;
		/** Keeps the dialog open on Escape and on a click on the backdrop. The close button, `close` from a snippet and a `<form method="dialog">` still close it. */
		persistent?: boolean;
		/** Title in the header. It also names the dialog for screen readers: without it, pass `aria-label`. */
		title?: string;
		/** Shows a close button in the header. */
		closable?: boolean;
		/** Accessible label of the close button. */
		closeLabel?: string;
		/** Called when the dialog closes itself (Escape, backdrop, close button, `close` from a snippet, `<form method="dialog">`), with the event that caused it. Not called when `open` is set to `false` from outside. */
		onclose?: (event: Event) => void;
		/** The `<dialog>` element. */
		dialogElement?: HTMLDialogElement;
		/** Extra classes for each part. */
		class?: {
			dialog?: string;
			backdrop?: string;
			surface?: string;
			header?: string;
			title?: string;
			body?: string;
			actions?: string;
		};
		/** Body of the dialog. It scrolls when the dialog is taller than the viewport. */
		children?: Snippet<[{ close: Close }]>;
		/** Replaces the title text, inside the heading. */
		titleSnippet?: Snippet<[{ title: string | undefined }]>;
		/** Replaces the close button. Shown even without `closable`. */
		closeSnippet?: Snippet<[{ close: Close; closeLabel: string }]>;
		/** Footer, usually the buttons, aligned to the right. */
		actionsSnippet?: Snippet<[{ close: Close }]>;
		/** Content in the top right corner of the screen, on the backdrop. */
		topRightSnippet?: Snippet<[{ close: Close }]>;
		/** Content on the left of the surface, centered vertically, on the backdrop. */
		centerLeftSnippet?: Snippet<[{ close: Close }]>;
		/** Content on the right of the surface, centered vertically, on the backdrop. */
		centerRightSnippet?: Snippet<[{ close: Close }]>;
	}

	let {
		open = $bindable(),
		persistent = false,
		title,
		closable = false,
		closeLabel = 'Close',
		onclose,
		dialogElement = $bindable(),
		class: clazz = {},
		children,
		titleSnippet,
		closeSnippet,
		actionsSnippet,
		topRightSnippet,
		centerLeftSnippet,
		centerRightSnippet,
		...rest
	}: Props = $props();

	let dialogNode = $state<HTMLDialogElement>();

	const id = $props.id();
	const titleId = `${id}-title`;

	let hasTitle = $derived(!!title || !!titleSnippet);
	let hasHeader = $derived(hasTitle || closable || !!closeSnippet);
	let hasSides = $derived(!!centerLeftSnippet || !!centerRightSnippet);

	function close(event: Event) {
		if (!open) return;
		open = false;
		onclose?.(event);
	}

	$effect(() => {
		if (open) delete dialogNode?.dataset.closing;
	});
</script>

{#if open}
	<dialog
		aria-labelledby={hasTitle ? titleId : undefined}
		{...rest}
		class={['aurora-dialog', clazz.dialog]}
		bind:this={() => dialogNode, (node) => (dialogNode = dialogElement = node)}
		{@attach modal({ persistent: () => persistent, dismiss: close })}
		out:leave
	>
		<div class={['aurora-dialog-backdrop', clazz.backdrop]} data-backdrop></div>
		{#if hasSides}
			<div class="aurora-dialog-side aurora-dialog-side-start">{@render centerLeftSnippet?.({ close })}</div>
		{/if}
		<div class={['aurora-dialog-surface', clazz.surface]}>
			{#if hasHeader}
				<header class={['aurora-dialog-header', clazz.header]}>
					{#if hasTitle}
						<h2 id={titleId} class={['aurora-dialog-title', clazz.title]}>
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
							class="aurora-dialog-close"
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
				<div class={['aurora-dialog-body', clazz.body]}>{@render children({ close })}</div>
			{/if}
			{#if actionsSnippet}
				<footer class={['aurora-dialog-actions', clazz.actions]}>{@render actionsSnippet({ close })}</footer>
			{/if}
		</div>
		{#if hasSides}
			<div class="aurora-dialog-side aurora-dialog-side-end">{@render centerRightSnippet?.({ close })}</div>
		{/if}
		{#if topRightSnippet}
			<div class="aurora-dialog-top-right">{@render topRightSnippet({ close })}</div>
		{/if}
		<ToastList />
	</dialog>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(html):has(.aurora-dialog:modal) {
			overflow: hidden;
		}

		.aurora-dialog {
			--_inset: var(--dialog-inset, var(--dialog-default-inset));
			--_duration: var(--dialog-duration, var(--dialog-default-duration));
			--_easing: var(--dialog-easing, var(--dialog-default-easing));
			--_bleed: calc(var(--global-focus-ring-width) + var(--global-focus-ring-offset));

			position: fixed;
			inset: 0;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
			max-width: none;
			max-height: none;
			margin: 0;
			padding: var(--_inset);
			border: 0;
			background: none;
			color: inherit;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--_inset);
			overflow: hidden;
		}

		.aurora-dialog::backdrop {
			background: none;
		}

		.aurora-dialog-backdrop {
			position: absolute;
			inset: 0;
			background: var(--dialog-backdrop-background, var(--dialog-default-backdrop-background));
			backdrop-filter: var(--dialog-backdrop-filter, var(--dialog-default-backdrop-filter));
		}

		.aurora-dialog-backdrop,
		.aurora-dialog-side,
		.aurora-dialog-top-right {
			animation: fade-in var(--_duration) var(--_easing);
		}

		.aurora-dialog-side {
			position: relative;
			flex: 1 1 0;
			align-self: stretch;
			display: flex;
			align-items: center;
			pointer-events: none;
		}

		.aurora-dialog-side.aurora-dialog-side-end {
			justify-content: flex-end;
		}

		.aurora-dialog-side > :global(*) {
			pointer-events: auto;
		}

		.aurora-dialog-top-right {
			position: absolute;
			top: var(--_inset);
			inset-inline-end: var(--_inset);
		}

		.aurora-dialog-surface {
			--_x: var(--dialog-transition-x, var(--dialog-default-transition-x));
			--_y: var(--dialog-transition-y, var(--dialog-default-transition-y));
			--_scale: var(--dialog-transition-scale, var(--dialog-default-transition-scale));

			position: relative;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			flex: 0 1 auto;
			width: var(--dialog-width, var(--dialog-default-width));
			max-width: var(--dialog-max-width, var(--dialog-default-max-width));
			height: var(--dialog-height, var(--dialog-default-height));
			max-height: var(--dialog-max-height, var(--dialog-default-max-height));
			padding: var(--dialog-padding, var(--dialog-default-padding));
			background: var(--dialog-background, var(--dialog-default-background));
			color: var(--dialog-color, var(--dialog-default-color));
			border: var(--dialog-border-width, var(--dialog-default-border-width)) solid
				var(--dialog-border-color, var(--dialog-default-border-color));
			border-radius: var(--dialog-border-radius, var(--dialog-default-border-radius));
			box-shadow: var(--dialog-box-shadow, var(--dialog-default-box-shadow));
			animation: pop-in var(--_duration) var(--_easing);
		}

		.aurora-dialog[data-closing] :is(.aurora-dialog-backdrop, .aurora-dialog-side, .aurora-dialog-top-right) {
			animation: fade-out var(--_duration) var(--_easing) forwards;
		}

		.aurora-dialog[data-closing] .aurora-dialog-surface {
			animation: pop-out var(--_duration) var(--_easing) forwards;
		}

		.aurora-dialog-header {
			display: flex;
			align-items: flex-start;
			gap: var(--dialog-header-gap, var(--dialog-default-header-gap));
			padding: var(--dialog-header-padding, var(--dialog-default-header-padding));
		}

		.aurora-dialog-header:not(:last-child) {
			margin-bottom: var(--dialog-header-margin-bottom, var(--dialog-default-header-margin-bottom));
		}

		.aurora-dialog-header > :global(.aurora-dialog-close) {
			flex: none;
			margin-inline-start: auto;
		}

		.aurora-dialog-title {
			flex: 1 1 auto;
			min-width: 0;
			margin: 0;
			color: var(--dialog-title-color, var(--dialog-default-title-color));
			font-family: var(--dialog-title-font-family, var(--dialog-default-title-font-family));
			font-size: var(--dialog-title-font-size, var(--dialog-default-title-font-size));
			font-weight: var(--dialog-title-font-weight, var(--dialog-default-title-font-weight));
			line-height: var(--dialog-title-line-height, var(--dialog-default-title-line-height));
			letter-spacing: var(--dialog-title-letter-spacing, var(--dialog-default-title-letter-spacing));
			overflow-wrap: anywhere;
		}

		.aurora-dialog-body {
			flex: 1 1 auto;
			min-height: 0;
			margin: calc(-1 * var(--_bleed));
			padding: var(--_bleed);
			overflow: auto;
			overscroll-behavior: contain;
			color: var(--dialog-body-color, var(--dialog-default-body-color));
			font-size: var(--dialog-body-font-size, var(--dialog-default-body-font-size));
			line-height: var(--dialog-body-line-height, var(--dialog-default-body-line-height));
		}

		.aurora-dialog-actions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--dialog-actions-gap, var(--dialog-default-actions-gap));
			justify-content: var(
				--dialog-actions-justify-content,
				var(--dialog-default-actions-justify-content)
			);
			padding: var(--dialog-actions-padding, var(--dialog-default-actions-padding));
		}

		.aurora-dialog-actions:not(:first-child) {
			margin-top: var(--dialog-actions-margin-top, var(--dialog-default-actions-margin-top));
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

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translate(var(--_x), var(--_y)) scale(var(--_scale));
		}
	}

	@keyframes pop-out {
		to {
			opacity: 0;
			transform: translate(var(--_x), var(--_y)) scale(var(--_scale));
		}
	}
</style>
