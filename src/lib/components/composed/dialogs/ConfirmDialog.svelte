<!-- @component
Dialog that asks to confirm an action, usually a delete: an icon in the tone of the action, the question as title, a description and two buttons, Cancel and the action. It is a `Dialog` with `role="alertdialog"`, so it keeps its behaviour (top layer, focus trap, Escape, click on the backdrop). Focus starts on Cancel with `variant="danger"` and on the action with `variant="primary"`. After `onconfirm` it closes by itself; when `onconfirm` returns a Promise it shows a spinner on the action and blocks every way of closing until it settles, then closes if it resolved and stays open if it rejected. `closeOnConfirm={false}` or `event.preventDefault()` in `onconfirm` keep it open. `oncancel` runs on every other way of closing: Cancel, the close button, Escape, the backdrop. Its state is exposed as `data-variant` and `data-loading` on the `<dialog>` for app CSS.
-->
<script lang="ts" module>
	const DANGER_ICON =
		'M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z';
	const PRIMARY_ICON =
		'M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z';
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './ConfirmDialog.css';
	import { tick, type ComponentProps, type Snippet } from 'svelte';
	import Dialog from '../../simple/dialogs/Dialog.svelte';
	import Button from '../../simple/buttons/Button.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import { CLOSE_ICON } from '../../simple/dialogs/modal.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props
		extends Omit<
			ComponentProps<typeof Dialog>,
			| 'title'
			| 'closable'
			| 'onclose'
			| 'class'
			| 'children'
			| 'titleSnippet'
			| 'closeSnippet'
			| 'actionsSnippet'
			| 'topRightSnippet'
			| 'centerLeftSnippet'
			| 'centerRightSnippet'
		> {
		/** The question, as the title of the dialog. It names the thing and the action ("Delete Mario Rossi?"), not "Are you sure?". */
		title: string;
		/** Text under the title. An array renders one paragraph per item; line breaks are kept. */
		description?: string | string[];
		/** Tone of the icon and of the action button: `danger` for destructive actions, `primary` for the others. */
		variant?: 'danger' | 'primary';
		/** SVG path of the icon above the title. Defaults to an icon for each variant; an empty string removes it. */
		icon?: string;
		/** Text of the action button. Defaults to "Delete" with `variant="danger"` and "Confirm" with `variant="primary"`, in the language of `locale`. */
		confirmText?: string;
		/** Text of the cancel button. Defaults to "Cancel", in the language of `locale`. */
		cancelText?: string;
		/** Shows a spinner on the action button and blocks every way of closing. A Promise returned by `onconfirm` does the same by itself. */
		loading?: boolean;
		/** Disables the action button. */
		confirmDisable?: boolean;
		/** Disables the cancel and close buttons, Escape and the click on the backdrop. */
		cancelDisable?: boolean;
		/** Shows a close button in the top right corner. */
		closable?: boolean;
		/** Closes the dialog after `onconfirm`, once its Promise resolves. With `false` the app closes it by setting `open`. */
		closeOnConfirm?: boolean;
		/** Called on a click on the action button. It may return a Promise: the dialog waits for it with a spinner, closes if it resolves and stays open if it rejects. `event.preventDefault()` keeps the dialog open. */
		onconfirm?: (event: MouseEvent) => void | Promise<unknown>;
		/** Called when the dialog closes without confirming: Cancel, the close button, Escape, the click on the backdrop. */
		oncancel?: (event: Event) => void;
		/** Extra classes for each part. */
		class?: {
			dialog?: string;
			surface?: string;
			icon?: string;
			title?: string;
			description?: string;
			content?: string;
			actions?: string;
			cancel?: string;
			confirm?: string;
		};
		/** Content under the description, for example a field to type before confirming. */
		children?: Snippet;
		/** Replaces the title text, inside the heading. */
		titleSnippet?: Snippet<[{ title: string }]>;
		/** Replaces the icon box. */
		iconSnippet?: Snippet<[{ icon: string; variant: 'danger' | 'primary' }]>;
		/** Replaces the two buttons. Call `confirm` and `cancel` from your buttons to keep the behaviour. */
		actionsSnippet?: Snippet<
			[
				{
					confirm: (event: MouseEvent) => void;
					cancel: (event: Event) => void;
					loading: boolean;
				}
			]
		>;
	}

	let {
		open = $bindable(),
		dialogElement = $bindable(),
		title,
		description,
		variant = 'danger',
		icon: iconProp,
		confirmText: confirmTextProp,
		cancelText: cancelTextProp,
		loading = false,
		confirmDisable = false,
		cancelDisable = false,
		persistent = false,
		closable = true,
		closeOnConfirm = true,
		closeLabel,
		locale: localeProp,
		onconfirm,
		oncancel,
		class: clazz = {},
		children,
		titleSnippet,
		iconSnippet,
		actionsSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).confirmDialog);
	let confirmText = $derived(
		confirmTextProp ?? (variant === 'danger' ? texts.delete : texts.confirm)
	);
	let cancelText = $derived(cancelTextProp ?? texts.cancel);
	let icon = $derived(iconProp ?? (variant === 'danger' ? DANGER_ICON : PRIMARY_ICON));
	let paragraphs = $derived(
		(Array.isArray(description) ? description : [description]).filter((text) => !!text)
	);

	const id = $props.id();
	const descriptionId = `${id}-description`;

	let dialogNode = $state<HTMLDialogElement>();
	let pending = $state(false);
	let busy = $derived(loading || pending);
	let run = 0;

	$effect(() => {
		if (!open) {
			run++;
			pending = false;
		}
	});

	function isThenable(value: unknown): value is PromiseLike<unknown> {
		return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';
	}

	async function confirm(event: MouseEvent) {
		if (busy || confirmDisable) return;
		const trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
		const current = ++run;
		const result = onconfirm?.(event);
		if (isThenable(result)) {
			pending = true;
			try {
				await result;
			} finally {
				if (current === run) {
					pending = false;
					await tick();
					if (open && !dialogNode?.contains(document.activeElement)) trigger?.focus();
				}
			}
		}
		if (current === run && closeOnConfirm && !event.defaultPrevented) open = false;
	}

	function cancel(event: Event) {
		if (busy || cancelDisable || !open) return;
		open = false;
		oncancel?.(event);
	}
</script>

{#snippet heading()}
	{#if iconSnippet}
		{@render iconSnippet({ icon, variant })}
	{:else if icon}
		<span class={['aurora-confirm-dialog-icon', clazz.icon]}><Icon path={icon} /></span>
	{/if}
	<span class="aurora-confirm-dialog-title-text">
		{#if titleSnippet}
			{@render titleSnippet({ title })}
		{:else}
			{title}
		{/if}
	</span>
{/snippet}

{#snippet closeButton({ closeLabel: label }: { closeLabel: string })}
	<Button
		class="aurora-dialog-close"
		buttonType="icon"
		variant="secondary"
		size="sm"
		icon={CLOSE_ICON}
		aria-label={label}
		disabled={busy || cancelDisable}
		onclick={cancel}
	/>
{/snippet}

{#snippet body()}
	{#if paragraphs.length > 0}
		<div id={descriptionId} class={['aurora-confirm-dialog-description', clazz.description]}>
			{#each paragraphs as paragraph, index (index)}
				<p>{paragraph}</p>
			{/each}
		</div>
	{/if}
	{#if children}
		<div class={['aurora-confirm-dialog-content', clazz.content]}>{@render children()}</div>
	{/if}
{/snippet}

{#snippet actions()}
	{#if actionsSnippet}
		{@render actionsSnippet({ confirm, cancel, loading: busy })}
	{:else}
		<Button
			variant="secondary"
			disabled={busy || cancelDisable}
			autofocus={variant === 'danger' || undefined}
			class={clazz.cancel}
			onclick={cancel}>{cancelText}</Button
		>
		<Button
			{variant}
			loading={busy}
			disabled={confirmDisable}
			autofocus={variant === 'primary' || undefined}
			class={clazz.confirm}
			onclick={confirm}>{confirmText}</Button
		>
	{/if}
{/snippet}

<Dialog
	role="alertdialog"
	{...rest}
	aria-describedby={[paragraphs.length > 0 ? descriptionId : undefined, rest['aria-describedby']]
		.filter(Boolean)
		.join(' ') || undefined}
	data-variant={variant}
	data-loading={busy || undefined}
	bind:open
	bind:dialogElement={() => dialogNode, (node) => (dialogNode = dialogElement = node)}
	{title}
	persistent={persistent || busy || cancelDisable}
	{closeLabel}
	{locale}
	onclose={(event) => oncancel?.(event)}
	class={{
		dialog: ['aurora-confirm-dialog', clazz.dialog].filter(Boolean).join(' '),
		surface: clazz.surface,
		title: ['aurora-confirm-dialog-title', clazz.title].filter(Boolean).join(' '),
		actions: clazz.actions
	}}
	titleSnippet={heading}
	closeSnippet={closable ? closeButton : undefined}
	children={paragraphs.length > 0 || children ? body : undefined}
	actionsSnippet={actions}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-dialog.aurora-confirm-dialog) {
			--dialog-default-max-width: var(
				--confirm-dialog-max-width,
				var(--confirm-dialog-default-max-width)
			);
			--_icon-background: var(--confirm-dialog-default-danger-icon-background);
			--_icon-color: var(--confirm-dialog-default-danger-icon-color);
			--_icon-ring-color: var(--confirm-dialog-default-danger-icon-ring-color);
		}

		:global(.aurora-dialog.aurora-confirm-dialog[data-variant='primary']) {
			--_icon-background: var(--confirm-dialog-default-primary-icon-background);
			--_icon-color: var(--confirm-dialog-default-primary-icon-color);
			--_icon-ring-color: var(--confirm-dialog-default-primary-icon-ring-color);
		}

		:global(.aurora-confirm-dialog-title) {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: var(--confirm-dialog-icon-gap, var(--confirm-dialog-default-icon-gap));
		}

		.aurora-confirm-dialog-title-text {
			display: block;
		}

		.aurora-confirm-dialog-icon {
			--icon-size: var(--confirm-dialog-icon-glyph-size, var(--confirm-dialog-default-icon-glyph-size));

			display: grid;
			place-items: center;
			flex: none;
			width: var(--confirm-dialog-icon-size, var(--confirm-dialog-default-icon-size));
			height: var(--confirm-dialog-icon-size, var(--confirm-dialog-default-icon-size));
			border-radius: var(
				--confirm-dialog-icon-border-radius,
				var(--confirm-dialog-default-icon-border-radius)
			);
			background: var(--confirm-dialog-icon-background, var(--_icon-background));
			color: var(--confirm-dialog-icon-color, var(--_icon-color));
			box-shadow: 0 0 0 var(--confirm-dialog-icon-ring-width, var(--confirm-dialog-default-icon-ring-width))
				var(--confirm-dialog-icon-ring-color, var(--_icon-ring-color));
		}

		.aurora-confirm-dialog-description {
			display: grid;
			gap: var(--confirm-dialog-paragraph-gap, var(--confirm-dialog-default-paragraph-gap));
		}

		.aurora-confirm-dialog-description > p {
			margin: 0;
			white-space: pre-line;
		}

		.aurora-confirm-dialog-description + .aurora-confirm-dialog-content {
			margin-top: var(--confirm-dialog-content-gap, var(--confirm-dialog-default-content-gap));
		}
	}
</style>
