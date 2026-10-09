import type { ComponentMigration } from '../types.js';

export default {
	from: 'CircularLoader',
	to: 'CircularLoader',
	props: {
		removed: [
			{
				name: 'loading',
				note: 'Without `loading` (default `true`) nothing changes: delete `loading` and `loading={true}`. `loading={false}` hid the arc but kept the empty space: wrap the loader in `{#if condition}`, or, when the space must stay, in an element with `visibility: hidden` while not loading.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--circular-loader-height',
				to: '--circular-loader-size',
				note: 'The loader is always square. If the same usage also sets `--circular-loader-width`, delete that one.'
			},
			{ from: '--circular-loader-default-height', to: '--circular-loader-default-size' }
		],
		removed: [
			{
				name: '--circular-loader-width',
				note: 'Had no effect in v4 (a later rule overwrote `width`; the loader was sized by its height, 30px by default). Delete it.'
			},
			{
				name: '--circular-loader-default-width',
				note: 'Had no effect in v4. Delete it; the size default is `--circular-loader-default-size`.'
			}
		],
		changed: [
			...['--circular-loader-color', '--circular-loader-default-color'].map((name) => ({
				name,
				note: 'Had no effect in v4 (it overwrote `width` with an invalid value) and now colors the ring. Check that the value is a CSS color or gradient, not an RGB triplet such as `var(--global-color-primary-500)` (map it with the global token rules), and that the color is still wanted: delete it for the theme gradient, or use `currentColor`.'
			}))
		]
	},
	manual: [
		{
			id: 'circular-loader-look',
			summary:
				'The ring is drawn in the theme gradient (`--global-gradient`), 32px by default; v4 always drew it in `currentColor` (the text color around it), 30px.',
			action:
				'Where the loader sits on a colored surface (inside a primary Button, a filled banner or header, an element whose `color` the app sets) or must match the text next to it, pass `--circular-loader-color="currentColor"`. Pass `--circular-loader-size="30px"` only where the 2px matter.'
		},
		{
			id: 'circular-loader-label',
			summary:
				'The loader is a `role="progressbar"` named "Loading" (English) for screen readers; v4 rendered a bare `<svg>`.',
			action:
				'When a visible text next to it already says what is loading ("Loading…", "Saving"), pass `label=""` to hide the loader from screen readers. Otherwise pass `label` with a text in the app language that says what is loading.'
		},
		{
			id: 'circular-loader-class',
			summary: '`class` is on a `<span>` that holds the ring; v4 put it on the `<svg>`.',
			action:
				'App CSS that sized the loader through the class (`width`, `height`, margins) still works. Rules for SVG properties (`stroke`, `fill`, `circle`, the `.active` class) do nothing: use `--circular-loader-color`, `--circular-loader-thickness`, `--circular-loader-size`.',
			when: { props: ['class'] }
		}
	],
	added: [
		'`value` and `total`: a progress ring that fills up to `value / total`, with `aria-valuenow` (both clamped to `0…total`; `children` gets the raw `value`).',
		'`children({ value, total, percent })` in the middle of the ring, for example the percentage.',
		'`label` (accessible name, `""` = decorative), native attributes, `data-indeterminate`.',
		'`--circular-loader-thickness`, `--circular-loader-track-color`, `--circular-loader-duration`, `--circular-loader-value-duration`, `--circular-loader-content-*`.',
		'`DotsLoader`, a new component: three dots that light up in turn.'
	]
} satisfies ComponentMigration;
