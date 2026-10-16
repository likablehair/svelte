/**
 * Tailwind CSS 3 preset: maps the `--global-*` tokens to Tailwind names without the prefix
 * (`bg-surface`, `text-primary`, `rounded-md`, `shadow-md`, `font-display`, `bg-fill-primary`).
 * The classes read the tokens at runtime, so they follow the theme and the light/dark mode.
 * For Tailwind 4 import `@likable-hair/svelte/tailwind.css` instead.
 *
 * @example
 * import aurora from '@likable-hair/svelte/tailwind-preset';
 * export default { presets: [aurora], content: [...] };
 */
const preset = {
	theme: {
		extend: {
			colors: {
				bg: 'var(--global-color-bg)',
				'bg-2': 'var(--global-color-bg-2)',
				surface: 'var(--global-color-surface)',
				'surface-2': 'var(--global-color-surface-2)',
				'surface-3': 'var(--global-color-surface-3)',
				'surface-solid': 'var(--global-color-surface-solid)',
				'surface-pop': 'var(--global-color-surface-pop)',
				border: 'var(--global-color-border)',
				'border-strong': 'var(--global-color-border-strong)',
				text: 'var(--global-color-text)',
				'text-2': 'var(--global-color-text-2)',
				'text-3': 'var(--global-color-text-3)',
				primary: 'var(--global-color-primary)',
				'primary-strong': 'var(--global-color-primary-strong)',
				'primary-soft': 'var(--global-color-primary-soft)',
				'primary-glow': 'var(--global-color-primary-glow)',
				'on-primary': 'var(--global-color-on-primary)',
				accent: 'var(--global-color-accent)',
				'accent-soft': 'var(--global-color-accent-soft)',
				success: 'var(--global-color-success)',
				'success-soft': 'var(--global-color-success-soft)',
				'on-success': 'var(--global-color-on-success)',
				warning: 'var(--global-color-warning)',
				'warning-soft': 'var(--global-color-warning-soft)',
				'on-warning': 'var(--global-color-on-warning)',
				error: 'var(--global-color-error)',
				'error-soft': 'var(--global-color-error-soft)',
				'error-glow': 'var(--global-color-error-glow)',
				'on-error': 'var(--global-color-on-error)',
				overlay: 'var(--global-color-overlay)',
				'data-1': 'var(--global-color-data-1)',
				'data-2': 'var(--global-color-data-2)',
				'data-3': 'var(--global-color-data-3)',
				'data-4': 'var(--global-color-data-4)',
				'data-5': 'var(--global-color-data-5)',
				'data-6': 'var(--global-color-data-6)',
				'focus-ring': 'var(--global-focus-ring-color)'
			},
			borderRadius: {
				xs: 'var(--global-radius-xs)',
				sm: 'var(--global-radius-sm)',
				md: 'var(--global-radius-md)',
				lg: 'var(--global-radius-lg)',
				xl: 'var(--global-radius-xl)'
			},
			boxShadow: {
				sm: 'var(--global-shadow-sm)',
				md: 'var(--global-shadow-md)',
				lg: 'var(--global-shadow-lg)',
				fill: 'var(--global-shadow-fill)'
			},
			fontFamily: {
				sans: 'var(--global-font-family)',
				display: 'var(--global-font-family-display)',
				mono: 'var(--global-font-family-mono)'
			},
			transitionTimingFunction: {
				spring: 'var(--global-ease-spring)'
			},
			backgroundImage: {
				'fill-primary': 'var(--global-fill-primary)',
				'fill-error': 'var(--global-fill-error)',
				'fill-gradient': 'var(--global-fill-gradient)',
				gradient: 'var(--global-gradient)',
				'gradient-soft': 'var(--global-gradient-soft)'
			}
		}
	}
};

export default preset;
