import type { ComponentMigration } from '../types.js';

export default {
	from: 'AlertBanner',
	to: 'AlertBanner',
	props: {
		removed: [
			{
				name: 'disabled',
				note: 'The banner is no longer clickable, so there is nothing to disable. If it disabled an action in `appendSnippet`, pass `disabled` to that Button directly.'
			}
		],
		changed: ['onclick', 'onkeypress'].map((name) => ({
			name,
			native: true as const,
			note: 'No longer a prop of the component: it still type-checks and works as a native attribute of the root `<div>`, which has no role and is not focusable, so keyboard users cannot trigger it, and `disabled` no longer blocks it. It receives the native event (the global callback rewrite applies). Move the action to a `Button` or `LinkButton` in `appendSnippet`.'
		})),
		types: [
			{
				name: 'class',
				v4: '{ container?: string; border?: string; body?: string }',
				v5: '{ container?: string; icon?: string; body?: string; title?: string; description?: string }',
				note: 'Drop the `border` key: there is no colored strip any more.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'contentSnippet',
				to: 'children',
				note: 'No parameters: `{#snippet contentSnippet({ title, description })}` becomes the component content and reads the app variables that were passed as `title` / `description`. It replaces both texts, as in v4.'
			}
		],
		parameters: [
			{
				name: 'titleSnippet',
				v4: '{ title: string }',
				v5: '{ title: string | undefined }',
				note: 'Rendered even without `title` (v4: only when `title` was set), inside the title element.'
			},
			{
				name: 'descriptionSnippet',
				v4: '{ description: string }',
				v5: '{ description: string | undefined }',
				note: 'Rendered even without `description` (v4: only when `description` was set), inside the description element.'
			},
			{
				name: 'appendSnippet',
				v4: '{ disabled: boolean }',
				v5: 'no parameters',
				note: '`disabled` does not exist any more: drop the parameter.'
			}
		]
	},
	cssVars: {
		removed: [
			{
				name: '--alert-banner-color',
				note: 'The colored strip is gone. Pick the `variant` that matches the meaning of the color (error / warning / success, info for primary or blue); for a color outside the variants set `--alert-banner-background`, `--alert-banner-border-color`, `--alert-banner-icon-background` and `--alert-banner-icon-color`.',
				replacement: 'variant'
			},
			{
				name: '--alert-banner-default-color',
				note: 'v4 default of the strip color (an undefined `--my-var-blue`). Defaults are per variant now (`--alert-banner-default-{variant}-*`): drop the override or set the matching ones.'
			},
			...[
				'--alert-banner-padding-top',
				'--alert-banner-padding-right',
				'--alert-banner-padding-bottom',
				'--alert-banner-padding-left'
			].map((name) => ({
				name,
				note: 'Combine the four sides into the shorthand (`--alert-banner-padding="top right bottom left"`); a side that was not set takes the v5 default (`12px 14px`).',
				replacement: '--alert-banner-padding'
			})),
			...[
				'--alert-banner-default-padding-top',
				'--alert-banner-default-padding-right',
				'--alert-banner-default-padding-bottom',
				'--alert-banner-default-padding-left'
			].map((name) => ({
				name,
				note: 'Combine the four sides into the shorthand default.',
				replacement: '--alert-banner-default-padding'
			})),
			...['--alert-banner-cursor', '--alert-banner-default-cursor'].map((name) => ({
				name,
				note: 'The banner is not clickable any more. Drop it.'
			}))
		],
		changed: ['--alert-banner-border-width', '--alert-banner-default-border-width'].map((name) => ({
			name,
			note: 'It now sets the border around the banner (default `var(--global-border-width)`), not the width of the colored strip (v4 default `.7rem`). Remove the override: a v4 value such as `.7rem` would draw a thick border all around. Keep it only to change the border thickness.'
		}))
	},
	manual: [
		{
			id: 'alert-banner-look',
			summary:
				'A tinted banner with a border and a colored icon box, in four variants (default `info`); v4 was a white card with a shadow and a colored strip on the left. Title 14px / 600 (v4: 1.2rem / 700), description 13px.',
			action:
				'Set `variant` on every usage by the meaning of the message (`--alert-banner-color` tells it where present). Pass `icon=""` where no icon is wanted, and `--alert-banner-box-shadow` for the old card shadow. App CSS that targeted the v4 internals (`.border-colored`, `.content`, `.title`, `.description`) no longer applies: use the `class` keys or the `--alert-banner-title-*` / `-description-*` variables.'
		},
		{
			id: 'alert-banner-role',
			summary:
				'The banner has `role="alert"` (warning, error) or `role="status"` (info, success) and is announced by screen readers when it appears (v4: `role="presentation"`).',
			action:
				'For a banner that is permanent page content rather than feedback (for example a fixed notice rendered with the page), pass `role="note"` so it is not treated as a live region.'
		}
	],
	added: [
		'`variant` (info | success | warning | error) and `data-variant`.',
		'`icon` (SVG path, default per variant, `""` removes it) and `iconSnippet({ variant })`.',
		'`closable`, `closeLabel` (default "Dismiss"), `closeSnippet({ close, closeLabel })`, `onclose(event)`: the app removes the banner.',
		'Native attributes on the root `<div>`; `role` overrides the default.',
		'`--alert-banner-padding`, `-gap`, `-background`, `-border-color`, `-line-height`, `--alert-banner-icon-*`, `-title-*`, `-description-*`, `-close-*`, `-focus-ring-*`.'
	]
} satisfies ComponentMigration;
