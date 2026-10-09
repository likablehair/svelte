import type { ComponentMigration } from '../types.js';

const clickable =
	'Only clickable v4 icons used it: once the Icon becomes a Button (manual step `icon-clickable`)';

export default {
	from: 'Icon',
	to: 'Icon',
	props: {
		renamed: [
			{
				from: 'name',
				to: 'path',
				note: "The value changes too: v4 took an MDI class name (`name=\"mdi-plus\"`), v5 takes an SVG path on a 24×24 viewBox (`path={mdiPlus}` with `import { mdiPlus } from '@mdi/js'`): apply the global `icons.transform`. A dynamic value (`name={item.icon}`) needs its source converted too. Extra classes inside the v4 value (`\"mdi-loading mdi-spin\"`) do nothing in v5: see `icon-mdi-helpers`."
			}
		],
		removed: [
			{
				name: 'tabindex',
				note: 'Icon is an image and never takes focus. A focusable v4 icon was a clickable one: convert it to a Button (manual step `icon-clickable`).'
			}
		],
		icons: ['path']
	},
	events: {
		removed: [
			{
				name: 'onclick',
				note: 'Icon is not clickable (v4 rendered `<span role="button">` even without `onclick`, and called it on any key press). Replace `<Icon name="mdi-x" onclick={f} />` with `<Button buttonType="text" icon={mdiX} aria-label="<what it does>" onclick={f} />`; `variant` sets the color (`secondary` for the text color, `danger` for destructive actions), `size="sm"` makes it smaller. The Button callback receives the native MouseEvent of a `<button>`; v4 passed a MouseEvent or a KeyboardEvent of the `<span>`.',
				replacement: '<Button buttonType="text" icon={...} aria-label="..." onclick={...} />'
			}
		]
	},
	cssVars: {
		removed: [
			{
				name: '--icon-hover-color',
				note: `${clickable}, set its hover color on the Button.`,
				replacement: '--button-hover-color'
			},
			{
				name: '--icon-active-color',
				note: `${clickable}, the pressed state is a transform of the Button.`,
				replacement: '--button-active-transform'
			},
			{
				name: '--icon-cursor',
				note: `${clickable}, the Button has the pointer cursor; plain icons have the default one.`
			},
			{
				name: '--icon-pointer-events',
				note: 'The Icon handles no clicks, so a click on it already reaches the parent: drop it, or set `pointer-events` with app CSS through `class` if `event.target` matters.'
			},
			{
				name: '--icon-container-height',
				note: `${clickable}, size the Button.`,
				replacement: '--button-height'
			},
			{
				name: '--icon-container-width',
				note: `${clickable}, size the Button.`,
				replacement: '--button-width'
			},
			{
				name: '--icon-default-container-height',
				note: 'v4 default of the clickable icon box, with no v5 counterpart: drop it.'
			},
			{
				name: '--icon-default-container-width',
				note: 'v4 default of the clickable icon box, with no v5 counterpart: drop it.'
			},
			{
				name: '--icon-height',
				note: 'Listed in the v4 docs but never read by the component (the real name was `--icon-container-height`): drop it.'
			},
			{
				name: '--icon-width',
				note: 'Listed in the v4 docs but never read by the component (the real name was `--icon-container-width`): drop it.'
			}
		]
	},
	manual: [
		{
			id: 'icon-clickable',
			summary:
				'Icon is only an image: `onclick` and `tabindex` are gone, a clickable icon is a Button.',
			action:
				'Replace the Icon with `<Button buttonType="text" icon={mdiX} aria-label="..." onclick={...} />` (Button from the library). Move its variables to the Button: `--icon-size` → `--button-icon-size`, `--icon-color` → `--button-color`, `--icon-hover-color` → `--button-hover-color`, `--icon-container-height` / `-width` → `--button-height` / `--button-width`. Check handlers that read `e.key` or the `<span>` as `e.currentTarget`. If the icon sits inside another clickable element (a row, a card), check that the click does not also trigger it.',
			when: {
				props: ['tabindex'],
				events: ['onclick'],
				cssVars: [
					'--icon-hover-color',
					'--icon-active-color',
					'--icon-cursor',
					'--icon-container-height',
					'--icon-container-width'
				]
			}
		},
		{
			id: 'icon-svg',
			summary:
				'Icon renders an `<svg>` sized by `--icon-size` (default `1em`) and filled with `--icon-color` (default `currentColor`) instead of a `<span class="icon mdi ...">` font glyph; without `title` it is hidden from screen readers.',
			action:
				'Rewrite app CSS that targets `.icon`, `.mdi` or the `::before` glyph of an Icon (`font-size` → `--icon-size`, `color` → `--icon-color`, or pass `class`). Where the icon alone carries meaning (a status icon with no text next to it), pass `title`.'
		},
		{
			id: 'icon-mdi-helpers',
			summary:
				'MDI helper classes (`mdi-spin`, `mdi-rotate-*`, `mdi-flip-*`, `mdi-18px`, `mdi-24px`, `mdi-36px`, `mdi-48px`, `mdi-light`, `mdi-dark`, `mdi-inactive`) do nothing: the MDI webfont CSS is not loaded.',
			action:
				'Remove them from `name` and `class`. Sizes → `--icon-size`; colors and opacity → `--icon-color`; spin, rotation and flip → an app class with `animation` or `transform`, passed through `class`.',
			when: { props: ['class'] }
		}
	],
	added: ['`title`: accessible name (role `img`); without it the icon is decorative.']
} satisfies ComponentMigration;
