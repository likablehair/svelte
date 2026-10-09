<!-- @component
Compact label for tags, statuses, filters and selections, with seven color variants (`variant`) and two sizes (`size`). With `onclick` its content becomes a native `<button>`; with `selected` as well it is a toggle (`aria-pressed`) that takes the selected look. `closable` adds a separate close button that calls `onclose`. Long text is cut with an ellipsis when the chip has no room, or past `--chip-max-width`. Its state is exposed as `data-variant`, `data-size`, `data-selected` and `data-disabled` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Chip.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'onclick' | 'onclose' | 'children' | 'tabindex'> {
		/** Color. `filled` is the strongest, for a highlighted chip. */
		variant?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'filled';
		/** Height, padding and text size: `sm` 22px, `md` 26px. */
		size?: 'sm' | 'md';
		/** Selected state of a toggle chip: with `onclick` it sets `aria-pressed`. When `true` the chip takes the selected look, by default the same as `filled`. */
		selected?: boolean;
		/** Disables the chip button and the close button. */
		disabled?: boolean;
		/** SVG path of an icon before the text, for example from `@mdi/js`. */
		prependIcon?: string;
		/** Shows a close button after the text, which calls `onclose`. */
		closable?: boolean;
		/** SVG path of the close button icon. Defaults to the MDI `close` icon. */
		closeIcon?: string;
		/** Accessible name of the close button. */
		closeLabel?: string;
		/** Native `tabindex` of the chip button and of the close button: `-1` keeps both out of the tab order. */
		tabindex?: number;
		/** Called on click. With it the chip content becomes a native `<button>`. */
		onclick?: (event: MouseEvent) => void;
		/** Called on a click on the close button. */
		onclose?: (event: MouseEvent) => void;
		/** The root `<span>` element. */
		chipElement?: HTMLSpanElement;
		/** Chip text. */
		children?: Snippet;
		/** Replaces the icon before the text with any content (a status dot, an avatar). */
		prependSnippet?: Snippet;
		/** Replaces the close button. `close` calls `onclose`. Shown even without `closable`. */
		closeSnippet?: Snippet<[{ close: (event: MouseEvent) => void; closeLabel: string }]>;
	}

	let {
		variant = 'neutral',
		size = 'md',
		selected,
		disabled = false,
		prependIcon,
		closable = false,
		closeIcon = CLOSE_ICON,
		closeLabel = 'Remove',
		tabindex,
		onclick,
		onclose,
		chipElement = $bindable(),
		class: clazz,
		children,
		prependSnippet,
		closeSnippet,
		...rest
	}: Props = $props();

	function close(event: MouseEvent) {
		onclose?.(event);
	}
</script>

{#snippet content()}
	{#if prependSnippet}
		{@render prependSnippet()}
	{:else if prependIcon}
		<Icon path={prependIcon} />
	{/if}
	<span class="aurora-chip-text">{@render children?.()}</span>
{/snippet}

<span
	{...rest}
	bind:this={chipElement}
	data-variant={variant}
	data-size={size}
	data-selected={selected || undefined}
	data-disabled={disabled || undefined}
	class={['aurora-chip', onclick && 'aurora-chip-clickable', clazz]}
>
	{#if onclick}
		<button type="button" class="aurora-chip-main" {disabled} {tabindex} aria-pressed={selected} {onclick}>
			{@render content()}
		</button>
	{:else}
		<span class="aurora-chip-main">{@render content()}</span>
	{/if}
	{#if closeSnippet || closable}
		<span class="aurora-chip-end">
			{#if closeSnippet}
				{@render closeSnippet({ close, closeLabel })}
			{:else}
				<button
					type="button"
					class="aurora-chip-close"
					aria-label={closeLabel}
					{disabled}
					{tabindex}
					onclick={close}
				>
					<Icon path={closeIcon} />
				</button>
			{/if}
		</span>
	{/if}
</span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-chip {
			--_height: var(--chip-default-height);
			--_padding: var(--chip-default-padding);
			--_font-size: var(--chip-default-font-size);
			--_icon-size: var(--chip-default-icon-size);
			--_bg: var(--chip-default-neutral-background);
			--_color: var(--chip-default-neutral-color);
			--_border-color: var(--chip-default-neutral-border-color);
			--_hover-border-color: var(--chip-default-neutral-hover-border-color);
			--_shadow: var(--chip-default-neutral-box-shadow);

			--icon-size: var(--chip-icon-size, var(--_icon-size));

			box-sizing: border-box;
			display: inline-flex;
			align-items: stretch;
			vertical-align: middle;
			min-width: 0;
			max-width: var(--chip-max-width, var(--chip-default-max-width));
			height: var(--chip-height, var(--_height));
			--_border-now: var(--chip-border-color, var(--_border-color));
			--_hover-border-now: var(--chip-border-color, var(--_hover-border-color));
			--_bg-now: var(--chip-background, var(--_bg));
			--_color-now: var(--chip-color, var(--_color));
			--_shadow-now: var(--chip-box-shadow, var(--_shadow));
			border: var(--chip-border-width, var(--chip-default-border-width)) solid var(--_border-now);
			border-radius: var(--chip-border-radius, var(--chip-default-border-radius));
			background: var(--_bg-now);
			color: var(--_color-now);
			box-shadow: var(--_shadow-now);
			font-family: var(--chip-font-family, var(--chip-default-font-family));
			font-size: var(--chip-font-size, var(--_font-size));
			font-weight: var(--chip-font-weight, var(--chip-default-font-weight));
			line-height: 1;
			transition:
				transform var(--global-duration-fast) var(--global-ease),
				border-color var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		.aurora-chip[data-size='sm'] {
			--_height: var(--chip-default-sm-height);
			--_padding: var(--chip-default-sm-padding);
			--_font-size: var(--chip-default-sm-font-size);
			--_icon-size: var(--chip-default-sm-icon-size);
		}

		.aurora-chip[data-variant='primary'] {
			--_bg: var(--chip-default-primary-background);
			--_color: var(--chip-default-primary-color);
			--_border-color: var(--chip-default-primary-border-color);
			--_hover-border-color: var(--chip-default-primary-hover-border-color);
			--_shadow: var(--chip-default-primary-box-shadow);
		}

		.aurora-chip[data-variant='accent'] {
			--_bg: var(--chip-default-accent-background);
			--_color: var(--chip-default-accent-color);
			--_border-color: var(--chip-default-accent-border-color);
			--_hover-border-color: var(--chip-default-accent-hover-border-color);
			--_shadow: var(--chip-default-accent-box-shadow);
		}

		.aurora-chip[data-variant='success'] {
			--_bg: var(--chip-default-success-background);
			--_color: var(--chip-default-success-color);
			--_border-color: var(--chip-default-success-border-color);
			--_hover-border-color: var(--chip-default-success-hover-border-color);
			--_shadow: var(--chip-default-success-box-shadow);
		}

		.aurora-chip[data-variant='warning'] {
			--_bg: var(--chip-default-warning-background);
			--_color: var(--chip-default-warning-color);
			--_border-color: var(--chip-default-warning-border-color);
			--_hover-border-color: var(--chip-default-warning-hover-border-color);
			--_shadow: var(--chip-default-warning-box-shadow);
		}

		.aurora-chip[data-variant='error'] {
			--_bg: var(--chip-default-error-background);
			--_color: var(--chip-default-error-color);
			--_border-color: var(--chip-default-error-border-color);
			--_hover-border-color: var(--chip-default-error-hover-border-color);
			--_shadow: var(--chip-default-error-box-shadow);
		}

		.aurora-chip[data-variant='filled'] {
			--_bg: var(--chip-default-filled-background);
			--_color: var(--chip-default-filled-color);
			--_border-color: var(--chip-default-filled-border-color);
			--_hover-border-color: var(--chip-default-filled-hover-border-color);
			--_shadow: var(--chip-default-filled-box-shadow);
		}

		.aurora-chip[data-selected] {
			--_bg: var(--chip-default-selected-background);
			--_color: var(--chip-default-selected-color);
			--_border-color: var(--chip-default-selected-border-color);
			--_hover-border-color: var(--chip-default-selected-hover-border-color);
			--_shadow: var(--chip-default-selected-box-shadow);
			--_border-now: var(--chip-selected-border-color, var(--chip-border-color, var(--_border-color)));
			--_hover-border-now: var(
				--chip-selected-hover-border-color,
				var(--chip-selected-border-color, var(--chip-border-color, var(--_hover-border-color)))
			);
			--_bg-now: var(--chip-selected-background, var(--chip-background, var(--_bg)));
			--_color-now: var(--chip-selected-color, var(--chip-color, var(--_color)));
			--_shadow-now: var(--chip-selected-box-shadow, var(--chip-box-shadow, var(--_shadow)));
		}

		.aurora-chip-main {
			box-sizing: border-box;
			display: inline-flex;
			flex: 1 1 auto;
			align-items: center;
			gap: var(--chip-gap, var(--chip-default-gap));
			min-width: 0;
			margin: 0;
			padding: var(--chip-padding, var(--_padding));
			border: 0;
			border-radius: inherit;
			background: none;
			color: inherit;
			font: inherit;
			letter-spacing: inherit;
			text-align: start;
			-webkit-tap-highlight-color: transparent;
		}

		button.aurora-chip-main {
			cursor: pointer;
		}

		button.aurora-chip-main:focus-visible {
			outline: none;
		}

		.aurora-chip:has(.aurora-chip-end) .aurora-chip-main {
			padding-inline-end: 0;
		}

		.aurora-chip-text {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			line-height: 1.3;
		}

		.aurora-chip-end {
			display: inline-flex;
			flex-shrink: 0;
			align-items: center;
			padding-inline: var(--chip-gap, var(--chip-default-gap))
				var(--chip-close-margin-end, var(--chip-default-close-margin-end));
		}

		.aurora-chip-close {
			--icon-size: var(--chip-close-icon-size, var(--chip-default-close-icon-size));

			box-sizing: border-box;
			display: grid;
			place-items: center;
			width: var(--chip-close-size, var(--chip-default-close-size));
			height: var(--chip-close-size, var(--chip-default-close-size));
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--chip-close-border-radius, var(--chip-default-close-border-radius));
			background: transparent;
			color: var(--chip-close-color, var(--chip-default-close-color));
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition:
				background var(--global-duration) var(--global-ease),
				color var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-chip-clickable:not([data-disabled]):has(.aurora-chip-main:hover) {
				border-color: var(--chip-hover-border-color, var(--_hover-border-now));
				background: var(--chip-hover-background, var(--_bg-now));
				color: var(--chip-hover-color, var(--_color-now));
				transform: var(--chip-hover-transform, var(--chip-default-hover-transform));
			}

			.aurora-chip-close:not(:disabled):hover {
				background: var(--chip-close-hover-background, var(--chip-default-close-hover-background));
				color: var(--chip-close-hover-color, var(--chip-default-close-hover-color));
			}
		}

		.aurora-chip:has(.aurora-chip-main:focus-visible),
		.aurora-chip-close:focus-visible {
			outline: var(--chip-focus-ring-width, var(--chip-default-focus-ring-width)) solid
				var(--chip-focus-ring-color, var(--chip-default-focus-ring-color));
			outline-offset: var(--chip-focus-ring-offset, var(--chip-default-focus-ring-offset));
		}

		.aurora-chip-close:focus-visible {
			outline-offset: var(
				--chip-close-focus-ring-offset,
				var(--chip-default-close-focus-ring-offset)
			);
		}

		.aurora-chip[data-disabled] {
			opacity: var(--chip-disabled-opacity, var(--chip-default-disabled-opacity));
		}

		.aurora-chip[data-disabled] .aurora-chip-main,
		.aurora-chip[data-disabled] .aurora-chip-close {
			cursor: not-allowed;
		}
	}
</style>
