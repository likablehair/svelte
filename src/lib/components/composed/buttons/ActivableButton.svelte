<!-- @component
Toggle button that stays pressed: every click flips `active` and then calls `onclick`, and the state is announced with `aria-pressed`. It is a `Button` with its own look for the two states (neutral when off, primary tint when on), so `size`, `icon`, `loading`, `disabled` and the other Button props work the same way. Buttons with text and no icon show a dot that lights up when active (`dot={false}` hides it); icon-only buttons, as in a text editor toolbar, need an `aria-label`. To drive `active` from outside (for example from the editor state), pass it without `bind:` and update it in `onclick`. Its state is exposed as `data-active` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './ActivableButton.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import Button from '../../simple/buttons/Button.svelte';

	type ButtonProps = ComponentProps<typeof Button>;

	interface Props extends Omit<ButtonProps, 'variant' | 'buttonType' | 'aria-pressed'> {
		/** Pressed state. A click flips it before `onclick` runs. */
		active?: boolean;
		/** Shows the state dot before the text. It appears only on buttons with text and no icon. */
		dot?: boolean;
		/** Replaces the state dot. */
		dotSnippet?: Snippet<[{ active: boolean }]>;
	}

	let {
		active = $bindable(false),
		dot = true,
		dotSnippet,
		onclick,
		class: clazz,
		children,
		icon,
		iconSnippet,
		...rest
	}: Props = $props();

	let showDot = $derived(dot && !!children && !icon && !iconSnippet);

	function toggle(event: Parameters<NonNullable<ButtonProps['onclick']>>[0]) {
		active = !active;
		onclick?.(event);
	}
</script>

{#snippet dotIcon()}
	{#if dotSnippet}
		{@render dotSnippet({ active })}
	{:else}
		<span class="aurora-activable-button-dot" aria-hidden="true"></span>
	{/if}
{/snippet}

<Button
	{...rest}
	{icon}
	iconSnippet={showDot ? dotIcon : iconSnippet}
	variant="secondary"
	aria-pressed={active}
	data-active={active || undefined}
	onclick={toggle}
	class={['aurora-activable-button', clazz]}
	{children}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-button.aurora-activable-button) {
			--button-background: var(
				--activable-button-background,
				var(--activable-button-default-background)
			);
			--button-color: var(--activable-button-color, var(--activable-button-default-color));
			--button-border-color: var(
				--activable-button-border-color,
				var(--activable-button-default-border-color)
			);
			--button-box-shadow: 0 0 #0000;
			--button-hover-background: var(
				--activable-button-hover-background,
				var(--activable-button-default-hover-background)
			);
			--button-hover-color: var(
				--activable-button-hover-color,
				var(--activable-button-default-hover-color)
			);
			--button-hover-border-color: var(
				--activable-button-hover-border-color,
				var(--activable-button-default-hover-border-color)
			);
			--button-hover-box-shadow: 0 0 #0000;
			--button-hover-filter: none;
			--_dot-color: var(--activable-button-dot-color, var(--activable-button-default-dot-color));
			--_dot-box-shadow: 0 0 0 0 transparent;
		}

		:global(.aurora-button.aurora-activable-button[data-active]) {
			--button-background: var(
				--activable-button-active-background,
				var(--activable-button-default-active-background)
			);
			--button-color: var(
				--activable-button-active-color,
				var(--activable-button-default-active-color)
			);
			--button-border-color: var(
				--activable-button-active-border-color,
				var(--activable-button-default-active-border-color)
			);
			--button-hover-background: var(
				--activable-button-active-hover-background,
				var(--activable-button-default-active-hover-background)
			);
			--button-hover-color: var(
				--activable-button-active-hover-color,
				var(--activable-button-default-active-hover-color)
			);
			--button-hover-border-color: var(
				--activable-button-active-hover-border-color,
				var(--activable-button-default-active-hover-border-color)
			);
			--_dot-color: var(
				--activable-button-active-dot-color,
				var(--activable-button-default-active-dot-color)
			);
			--_dot-box-shadow: var(
				--activable-button-active-dot-box-shadow,
				var(--activable-button-default-active-dot-box-shadow)
			);
		}

		.aurora-activable-button-dot {
			flex-shrink: 0;
			width: var(--activable-button-dot-size, var(--activable-button-default-dot-size));
			height: var(--activable-button-dot-size, var(--activable-button-default-dot-size));
			border-radius: 50%;
			background: var(--_dot-color);
			box-shadow: var(--_dot-box-shadow);
			transition:
				background var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease);
		}
	}
</style>
