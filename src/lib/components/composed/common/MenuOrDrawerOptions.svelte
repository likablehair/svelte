<!-- @component
Action menu: a list of options in a `MenuOrDrawer`, so a menu anchored to `activator` on wide screens and a bottom sheet on screens up to 1024px wide. Options are `MenuOrDrawerOption` objects, `{ name, label, icon?, description?, shortcut?, variant?, checked?, divider?, disabled?, class?, data?, onclick? }`: `variant: 'danger'` paints a destructive action in the error color, `checked` adds a check mark (the option becomes a `menuitemcheckbox`), `divider` draws a line above the option, `shortcut` shows a key hint on the right. Choosing an option closes the menu, gives the focus back to the activator and calls the option's `onclick` and then `onselect`. It follows the ARIA menu pattern: the first option takes the focus on open, the arrows, Home and End move between the options, a letter jumps to the next option that starts with it, Enter and Space choose, Escape closes. Disabled options stay reachable with the keyboard, with `aria-disabled`. In the menu it is at least `--menu-or-drawer-options-min-width` wide; in the sheet the options are taller, for touch.
-->
<script lang="ts" module>
	export type MenuOrDrawerOption<Data = any> = {
		/** Unique value among the options of the menu. */
		name: string | number;
		/** Visible text. */
		label: string;
		/** SVG path of the icon before the text, for example from `@mdi/js`. */
		icon?: string;
		/** Second line of smaller text below the label. */
		description?: string;
		/** Key hint shown on the right, such as `⌘D`. It is only a hint: the shortcut itself is up to the app. */
		shortcut?: string;
		/** `danger` for destructive actions, in the error color. */
		variant?: 'default' | 'danger';
		/** Shows a check mark when `true`. Setting it, `true` or `false`, makes the option a `menuitemcheckbox`. */
		checked?: boolean;
		/** Draws a line above the option, to separate a group. */
		divider?: boolean;
		/** The option cannot be chosen. It stays reachable with the keyboard. */
		disabled?: boolean;
		/** Extra classes for the option. */
		class?: string;
		/** Any data for the app, for example the row the menu belongs to. */
		data?: Data;
		/** Called when the option is chosen, before `onselect`. */
		onclick?: (event: MouseEvent) => void;
	};
</script>

<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './MenuOrDrawerOptions.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import MenuOrDrawer from './MenuOrDrawer.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const CHECK_ICON = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';

	interface Props
		extends Omit<ComponentProps<typeof MenuOrDrawer>, 'children'>,
			Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> {
		/** Options of the menu, in order. */
		options?: MenuOrDrawerOption<Data>[];
		/** Accessible name of the menu, and of the sheet. Defaults to "Actions", in the language of `locale`, unless `aria-labelledby` names it. */
		'aria-label'?: string | null;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Called when an option is chosen, after the menu closed and after the option's `onclick`. */
		onselect?: (event: { option: MenuOrDrawerOption<Data>; event: MouseEvent }) => void;
		/** Replaces the content of each option (icon, texts, shortcut, check mark). */
		optionSnippet?: Snippet<[{ option: MenuOrDrawerOption<Data>; isDrawer: boolean }]>;
	}

	let {
		open = $bindable(),
		activator,
		placement,
		mode,
		menuProps,
		drawerProps = {},
		menuElement = $bindable(),
		drawerElement = $bindable(),
		options = [],
		'aria-label': ariaLabel,
		locale: localeProp,
		onselect,
		optionSnippet,
		class: clazz,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).menuOrDrawerOptions);

	const id = $props.id();

	let label = $derived(ariaLabel ?? (rest['aria-labelledby'] ? undefined : texts.label));
	let tabStop = $derived(Math.max(0, options.findIndex((option) => !option.disabled)));

	function items(list: HTMLElement) {
		return [...list.querySelectorAll<HTMLElement>('.aurora-menu-or-drawer-options-item')];
	}

	function focusFirst(list: HTMLElement) {
		const frame = requestAnimationFrame(() => {
			const all = items(list);
			(all.find((item) => item.getAttribute('aria-disabled') !== 'true') ?? all[0])?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}

	function move(event: KeyboardEvent) {
		rest.onkeydown?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const all = items(event.currentTarget as HTMLElement);
		if (!all.length) return;
		const at = all.indexOf(document.activeElement as HTMLElement);
		let next = -1;
		if (event.key === 'ArrowDown') next = (at + 1) % all.length;
		else if (event.key === 'ArrowUp') next = (at - 1 + all.length) % all.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = all.length - 1;
		else if (event.key.length === 1 && event.key.trim()) {
			const letter = event.key.toLocaleLowerCase(locale);
			for (let step = 1; step <= all.length; step++) {
				const index = (at + step) % all.length;
				const text = options[index]?.label.trim().toLocaleLowerCase(locale);
				if (text?.startsWith(letter)) {
					next = index;
					break;
				}
			}
		}
		if (next < 0) return;
		event.preventDefault();
		all[next].focus();
	}

	function choose(option: MenuOrDrawerOption<Data>, event: MouseEvent, close: () => void) {
		if (option.disabled) return;
		close();
		option.onclick?.(event);
		onselect?.({ option, event });
	}
</script>

<MenuOrDrawer
	bind:open
	{activator}
	{placement}
	{mode}
	{menuProps}
	drawerProps={{
		...drawerProps,
		'aria-label': drawerProps['aria-label'] ?? (drawerProps.title ? undefined : (label ?? undefined))
	}}
	bind:menuElement
	bind:drawerElement
>
	{#snippet children({ isDrawer, close })}
		<div
			role="menu"
			{...rest}
			aria-label={label}
			class={['aurora-menu-or-drawer-options', clazz]}
			data-drawer={isDrawer || undefined}
			onkeydown={move}
			{@attach isDrawer ? undefined : focusFirst}
		>
			{#each options as option, index (option.name)}
				{#if option.divider}
					<div class="aurora-menu-or-drawer-options-divider" role="separator"></div>
				{/if}
				<button
					type="button"
					role={option.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
					aria-checked={option.checked === undefined ? undefined : option.checked}
					aria-disabled={option.disabled || undefined}
					aria-labelledby={optionSnippet ? undefined : `${id}-${index}-label`}
					aria-describedby={option.description && !optionSnippet ? `${id}-${index}-description` : undefined}
					class={['aurora-menu-or-drawer-options-item', option.class]}
					data-variant={option.variant === 'danger' ? 'danger' : undefined}
					data-checked={option.checked || undefined}
					tabindex={index === tabStop ? 0 : -1}
					onclick={(event) => choose(option, event, close)}
				>
					{#if optionSnippet}
						{@render optionSnippet({ option, isDrawer })}
					{:else}
						{#if option.icon}
							<Icon class="aurora-menu-or-drawer-options-icon" path={option.icon} />
						{/if}
						<span class="aurora-menu-or-drawer-options-text">
							<span id="{id}-{index}-label" class="aurora-menu-or-drawer-options-label">{option.label}</span>
							{#if option.description}
								<span id="{id}-{index}-description" class="aurora-menu-or-drawer-options-description">
									{option.description}
								</span>
							{/if}
						</span>
						{#if option.shortcut}
							<kbd class="aurora-menu-or-drawer-options-shortcut" aria-hidden="true">{option.shortcut}</kbd>
						{/if}
						{#if option.checked}
							<Icon class="aurora-menu-or-drawer-options-check" path={CHECK_ICON} />
						{/if}
					{/if}
				</button>
			{/each}
		</div>
	{/snippet}
</MenuOrDrawer>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-menu-or-drawer-options {
			--_item-padding: var(--menu-or-drawer-options-default-item-padding);
			--_item-font-size: var(--menu-or-drawer-options-default-item-font-size);
			--_icon-size: var(--menu-or-drawer-options-default-icon-size);

			display: flex;
			flex-direction: column;
			gap: var(--menu-or-drawer-options-gap, var(--menu-or-drawer-options-default-gap));
			min-width: var(--menu-or-drawer-options-min-width, var(--menu-or-drawer-options-default-min-width));
		}

		.aurora-menu-or-drawer-options[data-drawer] {
			--_item-padding: var(--menu-or-drawer-options-default-drawer-item-padding);
			--_item-font-size: var(--menu-or-drawer-options-default-drawer-item-font-size);
			--_icon-size: var(--menu-or-drawer-options-default-drawer-icon-size);

			min-width: 0;
		}

		.aurora-menu-or-drawer-options-item {
			--icon-size: var(--menu-or-drawer-options-icon-size, var(--_icon-size));
			--_color: var(--menu-or-drawer-options-item-color, var(--menu-or-drawer-options-default-item-color));
			--_hover-background: var(
				--menu-or-drawer-options-item-hover-background,
				var(--menu-or-drawer-options-default-item-hover-background)
			);

			display: flex;
			align-items: center;
			gap: var(--menu-or-drawer-options-item-gap, var(--menu-or-drawer-options-default-item-gap));
			width: 100%;
			padding: var(--menu-or-drawer-options-item-padding, var(--_item-padding));
			border: 0;
			border-radius: var(
				--menu-or-drawer-options-item-border-radius,
				var(--menu-or-drawer-options-default-item-border-radius)
			);
			background: none;
			color: var(--_color);
			font: inherit;
			font-size: var(--menu-or-drawer-options-item-font-size, var(--_item-font-size));
			line-height: 1.35;
			text-align: start;
			cursor: pointer;
			transition:
				background-color var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-menu-or-drawer-options-item[data-checked] {
			--_color: var(
				--menu-or-drawer-options-checked-color,
				var(--menu-or-drawer-options-default-checked-color)
			);

			background: var(
				--menu-or-drawer-options-checked-background,
				var(--menu-or-drawer-options-default-checked-background)
			);
		}

		.aurora-menu-or-drawer-options-item[data-variant='danger'] {
			--_color: var(
				--menu-or-drawer-options-danger-color,
				var(--menu-or-drawer-options-default-danger-color)
			);
			--_hover-background: var(
				--menu-or-drawer-options-danger-hover-background,
				var(--menu-or-drawer-options-default-danger-hover-background)
			);
		}

		.aurora-menu-or-drawer-options-item[aria-disabled='true'] {
			cursor: not-allowed;
			opacity: var(
				--menu-or-drawer-options-disabled-opacity,
				var(--menu-or-drawer-options-default-disabled-opacity)
			);
		}

		.aurora-menu-or-drawer-options-item:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: -2px;
		}

		@media (hover: hover) {
			.aurora-menu-or-drawer-options-item:not([aria-disabled='true']):hover {
				background: var(--_hover-background);
			}

			.aurora-menu-or-drawer-options-item:not([aria-disabled='true'], [data-variant='danger']):hover {
				color: var(
					--menu-or-drawer-options-item-hover-color,
					var(--menu-or-drawer-options-default-item-hover-color)
				);
			}
		}

		.aurora-menu-or-drawer-options-text {
			display: grid;
			flex: 1;
			gap: 2px;
			min-width: 0;
		}

		.aurora-menu-or-drawer-options-description {
			color: var(
				--menu-or-drawer-options-description-color,
				var(--menu-or-drawer-options-default-description-color)
			);
			font-size: var(
				--menu-or-drawer-options-description-font-size,
				var(--menu-or-drawer-options-default-description-font-size)
			);
		}

		.aurora-menu-or-drawer-options-shortcut {
			margin-inline-start: 12px;
			color: var(
				--menu-or-drawer-options-shortcut-color,
				var(--menu-or-drawer-options-default-shortcut-color)
			);
			font-family: var(
				--menu-or-drawer-options-shortcut-font-family,
				var(--menu-or-drawer-options-default-shortcut-font-family)
			);
			font-size: var(
				--menu-or-drawer-options-shortcut-font-size,
				var(--menu-or-drawer-options-default-shortcut-font-size)
			);
		}

		:global(.aurora-menu-or-drawer-options-check) {
			color: var(--menu-or-drawer-options-check-color, var(--menu-or-drawer-options-default-check-color));
		}

		.aurora-menu-or-drawer-options-divider {
			flex: none;
			height: 1px;
			margin: var(
				--menu-or-drawer-options-divider-margin,
				var(--menu-or-drawer-options-default-divider-margin)
			);
			background: var(
				--menu-or-drawer-options-divider-color,
				var(--menu-or-drawer-options-default-divider-color)
			);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		@layer global.components {
			.aurora-menu-or-drawer-options-item {
				transition: none;
			}
		}
	}
</style>
