<!-- @component
Pair of buttons that closes a form or a dialog: a text "Cancel" button and a filled "Save" button, aligned to the end, with optional content (such as "Unsaved changes") at the start. When the space they sit in is narrower than 480px (a phone, a narrow drawer) they stack at full width, with the confirm button on top. `loading` shows a spinner on the confirm button and disables it; `confirmType="submit"` makes it submit the surrounding form. Both buttons can be replaced with snippets that receive the handlers. Its state is exposed as `data-loading` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './ConfirmOrCancelButtons.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '../../simple/buttons/Button.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
		/** Shows a spinner on the confirm button and disables it. */
		loading?: boolean;
		/** Text of the confirm button. */
		confirmText?: string;
		/** Text of the cancel button. */
		cancelText?: string;
		/** Disables the confirm button. */
		confirmDisable?: boolean;
		/** Disables the cancel button. */
		cancelDisable?: boolean;
		/** SVG path of an icon in the confirm button, for example from `@mdi/js`. */
		confirmIcon?: string;
		/** SVG path of an icon in the cancel button. */
		cancelIcon?: string;
		/** Color of the confirm button, for example `danger` for a delete. */
		confirmVariant?: ComponentProps<typeof Button>['variant'];
		/** Native `type` of the confirm button. `submit` submits the surrounding form, with its validation. */
		confirmType?: 'button' | 'submit';
		/** Extra classes for each part. */
		class?: {
			container?: string;
			content?: string;
			actions?: string;
			cancel?: string;
			confirm?: string;
		};
		/** Called when the confirm button is clicked. */
		onconfirmClick?: (event: MouseEvent) => void;
		/** Called when the cancel button is clicked. */
		oncancelClick?: (event: MouseEvent | KeyboardEvent) => void;
		/** Content at the start of the row, before the buttons (for example "Unsaved changes"). */
		children?: Snippet;
		/** Replaces the cancel button. Call `handleCancel` from your button. */
		cancelButtonSnippet?: Snippet<
			[
				{
					loading: boolean;
					handleCancel: (event: MouseEvent | KeyboardEvent) => void;
					cancelText: string;
					cancelDisable: boolean;
				}
			]
		>;
		/** Replaces the confirm button. Call `handleConfirm` from your button. */
		confirmButtonSnippet?: Snippet<
			[
				{
					loading: boolean;
					handleConfirm: (event: MouseEvent) => void;
					confirmText: string;
					confirmDisable: boolean;
				}
			]
		>;
	}

	let {
		loading = false,
		confirmText = 'Save',
		cancelText = 'Cancel',
		confirmDisable = false,
		cancelDisable = false,
		confirmIcon,
		cancelIcon,
		confirmVariant = 'primary',
		confirmType = 'button',
		class: clazz = {},
		onconfirmClick,
		oncancelClick,
		children,
		cancelButtonSnippet,
		confirmButtonSnippet,
		...rest
	}: Props = $props();

	function handleConfirm(event: MouseEvent) {
		if (!confirmDisable && !loading) onconfirmClick?.(event);
	}

	function handleCancel(event: MouseEvent | KeyboardEvent) {
		if (!cancelDisable) oncancelClick?.(event);
	}
</script>

<div
	{...rest}
	class={['aurora-confirm-or-cancel-buttons', clazz.container]}
	data-loading={loading || undefined}
>
	<div class="aurora-confirm-or-cancel-buttons-row">
		{#if children}
			<div class={['aurora-confirm-or-cancel-buttons-content', clazz.content]}>
				{@render children()}
			</div>
		{/if}
		<div class={['aurora-confirm-or-cancel-buttons-actions', clazz.actions]}>
			{#if cancelButtonSnippet}
				{@render cancelButtonSnippet({ loading, handleCancel, cancelText, cancelDisable })}
			{:else}
				<Button
					buttonType="text"
					icon={cancelIcon}
					disabled={cancelDisable}
					onclick={handleCancel}
					class={clazz.cancel}>{cancelText}</Button
				>
			{/if}
			{#if confirmButtonSnippet}
				{@render confirmButtonSnippet({ loading, handleConfirm, confirmText, confirmDisable })}
			{:else}
				<Button
					type={confirmType}
					variant={confirmVariant}
					icon={confirmIcon}
					{loading}
					disabled={confirmDisable}
					onclick={handleConfirm}
					class={clazz.confirm}>{confirmText}</Button
				>
			{/if}
		</div>
	</div>
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-confirm-or-cancel-buttons {
			container: aurora-confirm-or-cancel-buttons / inline-size;
		}

		.aurora-confirm-or-cancel-buttons-row {
			display: flex;
			align-items: center;
			gap: var(--confirm-or-cancel-buttons-gap, var(--confirm-or-cancel-buttons-default-gap));
		}

		.aurora-confirm-or-cancel-buttons-content {
			display: flex;
			align-items: center;
			gap: var(
				--confirm-or-cancel-buttons-content-gap,
				var(--confirm-or-cancel-buttons-default-content-gap)
			);
			min-width: 0;
			color: var(
				--confirm-or-cancel-buttons-content-color,
				var(--confirm-or-cancel-buttons-default-content-color)
			);
			font-size: var(
				--confirm-or-cancel-buttons-content-font-size,
				var(--confirm-or-cancel-buttons-default-content-font-size)
			);
		}

		.aurora-confirm-or-cancel-buttons-actions {
			display: flex;
			align-items: center;
			gap: var(
				--confirm-or-cancel-buttons-actions-gap,
				var(--confirm-or-cancel-buttons-default-actions-gap)
			);
			margin-inline-start: auto;
		}

		@container aurora-confirm-or-cancel-buttons (max-width: 480px) {
			.aurora-confirm-or-cancel-buttons-row {
				flex-direction: column;
				align-items: stretch;
			}

			.aurora-confirm-or-cancel-buttons-actions {
				--button-default-width: 100%;

				flex-direction: column-reverse;
				align-items: stretch;
				margin-inline-start: 0;
			}
		}
	}
</style>
