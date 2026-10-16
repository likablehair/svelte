<!-- @component
Switch for the light and dark mode of the page, with three icons in a pill: light, system (follows the operating system) and dark. `system={false}` leaves only light and dark: while the page still follows the operating system, the icon of the mode it shows is selected, and a click on it fixes that mode. A click on an icon calls `setMode`, so the choice is kept across visits once the root layout calls `rememberAppearance()`. It is a group of native radios (`role="radiogroup"`): Tab enters the group and the arrow keys move the choice; every icon has an accessible name and a `Tooltip`. The pill shows the mode of `<html>` (`data-mode`) from the first paint, before the page is interactive, so with `appearanceScript()` it never flashes the wrong choice. `onchange` runs after the mode changed, for example to save it in the user profile. The selected option is exposed as `data-selected`, the size as `data-size` and the missing system option as `data-no-system` for app CSS.
-->
<script lang="ts" module>
	const LIGHT_ICON =
		'M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13';
	const SYSTEM_ICON =
		'M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z';
	const DARK_ICON = 'M2 12A10 10 0 0 0 15 21.54A10 10 0 0 1 15 2.46A10 10 0 0 0 2 12Z';
	const MODES = ['light', 'system', 'dark'] as const;
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './ModeSwitch.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../../simple/media/Icon.svelte';
	import Tooltip from '../../simple/common/Tooltip.svelte';
	import { setMode, theme } from '../../../theme.svelte.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onchange'> {
		/** Accessible name of the group. Defaults to "Theme", in the language of `locale`. */
		label?: string;
		/** Name and tooltip of the light option. Defaults to "Light", in the language of `locale`. */
		lightLabel?: string;
		/** Name and tooltip of the dark option. Defaults to "Dark", in the language of `locale`. */
		darkLabel?: string;
		/** Name and tooltip of the option that follows the operating system. Defaults to "System", in the language of `locale`. */
		systemLabel?: string;
		/** SVG path of the light icon. */
		lightIcon?: string;
		/** SVG path of the dark icon. */
		darkIcon?: string;
		/** SVG path of the system icon. */
		systemIcon?: string;
		/** Shows the option that follows the operating system. Without it only light and dark are offered. */
		system?: boolean;
		/** `md` (the prototype pill) or `sm` for a crowded bar. */
		size?: 'sm' | 'md';
		/** Disables the three options. */
		disabled?: boolean;
		/** Side of the tooltips. They flip when there is no room, so the default fits a top bar; use `top` at the bottom of a sidebar. */
		tooltipPlacement?:
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
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Called after the user picked a mode, which is already applied. */
		onchange?: (event: { mode: 'light' | 'dark' | 'system' }) => void;
		/** Extra classes for each part: the pill and each option. */
		class?: {
			container?: string;
			option?: string;
		};
		/** Replaces the icon inside each option. The option keeps its radio, name and tooltip. */
		optionSnippet?: Snippet<
			[{ mode: 'light' | 'dark' | 'system'; label: string; icon: string; selected: boolean }]
		>;
	}

	let {
		label,
		lightLabel,
		darkLabel,
		systemLabel,
		lightIcon = LIGHT_ICON,
		darkIcon = DARK_ICON,
		systemIcon = SYSTEM_ICON,
		system = true,
		size = 'md',
		disabled = false,
		tooltipPlacement = 'bottom',
		locale: localeProp,
		onchange,
		class: clazz = {},
		optionSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).modeSwitch);
	let options = $state<Partial<Record<'light' | 'dark' | 'system', HTMLLabelElement>>>({});

	let labels = $derived({
		light: lightLabel ?? texts.light,
		dark: darkLabel ?? texts.dark,
		system: systemLabel ?? texts.system
	});
	let icons = $derived({ light: lightIcon, dark: darkIcon, system: systemIcon });
	let modes = $derived(MODES.filter((mode) => system || mode !== 'system'));
	let shown = $derived(
		system || theme.mode !== 'system' ? theme.mode : theme.dark ? 'dark' : 'light'
	);

	function choose(mode: 'light' | 'dark' | 'system') {
		if (theme.mode === mode) return;
		setMode(mode);
		onchange?.({ mode });
	}
</script>

<div
	{...rest}
	class={['aurora-mode-switch', clazz.container]}
	role="radiogroup"
	aria-label={rest['aria-labelledby'] ? undefined : (label ?? texts.label)}
	aria-disabled={disabled || undefined}
	data-size={size}
	data-no-system={!system || undefined}
	data-disabled={disabled || undefined}
>
	{#each modes as mode (mode)}
		{@const selected = shown === mode}
		<label
			bind:this={options[mode]}
			class={['aurora-mode-switch-option', clazz.option]}
			data-option={mode}
			data-selected={selected || undefined}
		>
			<input
				class="aurora-mode-switch-input"
				type="radio"
				name={uid}
				value={mode}
				checked={selected}
				{disabled}
				aria-label={labels[mode]}
				onclick={() => choose(mode)}
				onchange={() => choose(mode)}
			/>
			{#if optionSnippet}
				{@render optionSnippet({ mode, label: labels[mode], icon: icons[mode], selected })}
			{:else}
				<Icon path={icons[mode]} />
			{/if}
		</label>
		{#if options[mode]}
			<Tooltip
				activator={options[mode]}
				text={labels[mode]}
				placement={tooltipPlacement}
				aria-hidden="true"
			/>
		{/if}
	{/each}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-mode-switch {
			--_padding: var(--mode-switch-default-padding);
			--_option-width: var(--mode-switch-default-option-width);
			--_option-height: var(--mode-switch-default-option-height);
			--_icon-size: var(--mode-switch-default-icon-size);

			box-sizing: border-box;
			display: inline-flex;
			flex: none;
			align-items: center;
			gap: var(--mode-switch-gap, var(--mode-switch-default-gap));
			padding: var(--mode-switch-padding, var(--_padding));
			border: var(--mode-switch-border-width, var(--mode-switch-default-border-width)) solid
				var(--mode-switch-border-color, var(--mode-switch-default-border-color));
			border-radius: var(--mode-switch-border-radius, var(--mode-switch-default-border-radius));
			background: var(--mode-switch-background, var(--mode-switch-default-background));
			box-shadow: var(--mode-switch-box-shadow, var(--mode-switch-default-box-shadow));
		}

		.aurora-mode-switch[data-size='sm'] {
			--_padding: var(--mode-switch-default-sm-padding);
			--_option-width: var(--mode-switch-default-sm-option-width);
			--_option-height: var(--mode-switch-default-sm-option-height);
			--_icon-size: var(--mode-switch-default-sm-icon-size);
		}

		.aurora-mode-switch[data-disabled] {
			opacity: var(--mode-switch-disabled-opacity, var(--mode-switch-default-disabled-opacity));
		}

		.aurora-mode-switch-option {
			--icon-size: var(--mode-switch-icon-size, var(--_icon-size));

			box-sizing: border-box;
			position: relative;
			display: inline-grid;
			place-items: center;
			width: var(--mode-switch-option-width, var(--_option-width));
			height: var(--mode-switch-option-height, var(--_option-height));
			border-radius: var(
				--mode-switch-option-border-radius,
				var(--mode-switch-default-option-border-radius)
			);
			color: var(--mode-switch-color, var(--mode-switch-default-color));
			transition:
				color var(--global-duration) var(--global-ease),
				background-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease);
		}

		.aurora-mode-switch-input {
			position: absolute;
			inset: 0;
			z-index: 1;
			width: 100%;
			height: 100%;
			margin: 0;
			border-radius: inherit;
			opacity: 0;
			appearance: none;
			cursor: pointer;
		}

		.aurora-mode-switch-input:disabled {
			cursor: not-allowed;
		}

		@media (hover: hover) {
			.aurora-mode-switch-option:hover:has(.aurora-mode-switch-input:not(:checked, :disabled)) {
				background: var(--mode-switch-hover-background, var(--mode-switch-default-hover-background));
				color: var(--mode-switch-hover-color, var(--mode-switch-default-hover-color));
			}
		}

		:global(:root:not([data-mode='light'], [data-mode='dark']))
			.aurora-mode-switch-option[data-option='system'],
		:global(:root[data-mode='light']) .aurora-mode-switch-option[data-option='light'],
		:global(:root[data-mode='dark']) .aurora-mode-switch-option[data-option='dark'] {
			background: var(--mode-switch-selected-background, var(--mode-switch-default-selected-background));
			box-shadow: var(--mode-switch-selected-box-shadow, var(--mode-switch-default-selected-box-shadow));
			color: var(--mode-switch-selected-color, var(--mode-switch-default-selected-color));
		}

		@media not (prefers-color-scheme: dark) {
			:global(:root:not([data-mode='light'], [data-mode='dark']))
				.aurora-mode-switch[data-no-system]
				.aurora-mode-switch-option[data-option='light'] {
				background: var(--mode-switch-selected-background, var(--mode-switch-default-selected-background));
				box-shadow: var(--mode-switch-selected-box-shadow, var(--mode-switch-default-selected-box-shadow));
				color: var(--mode-switch-selected-color, var(--mode-switch-default-selected-color));
			}
		}

		@media (prefers-color-scheme: dark) {
			:global(:root:not([data-mode='light'], [data-mode='dark']))
				.aurora-mode-switch[data-no-system]
				.aurora-mode-switch-option[data-option='dark'] {
				background: var(--mode-switch-selected-background, var(--mode-switch-default-selected-background));
				box-shadow: var(--mode-switch-selected-box-shadow, var(--mode-switch-default-selected-box-shadow));
				color: var(--mode-switch-selected-color, var(--mode-switch-default-selected-color));
			}
		}

		.aurora-mode-switch-option:has(.aurora-mode-switch-input:focus-visible) {
			outline: var(--global-focus-ring-width) solid
				var(--mode-switch-focus-ring-color, var(--mode-switch-default-focus-ring-color));
			outline-offset: var(--global-focus-ring-offset);
		}
	}
</style>
