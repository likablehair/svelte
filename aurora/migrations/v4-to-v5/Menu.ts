import type { ComponentMigration } from '../types.js';

export default {
	from: 'Menu',
	to: 'Menu',
	props: {
		renamed: [
			{
				from: '_activatorGap',
				to: 'offset',
				note: 'Same meaning (pixels between activator and menu); the default goes from 5 to 6.'
			},
			{
				from: 'anchor',
				to: 'placement',
				note: 'The values change too: convert them with `props.values` (`bottom`, `left` and `right` still type-check but now mean centered).'
			}
		],
		removed: [
			{
				name: '_top',
				note: 'Fixed coordinates become a virtual activator in viewport coordinates: `activator={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }}`. v4 values were relative to the positioned ancestor of the menu (often with `window.scrollY` added): use `event.clientX` / `event.clientY` instead. Remove `_left` together with it.',
				replacement: 'virtual activator'
			},
			{
				name: '_left',
				note: 'See `_top`: both become one virtual activator `{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }` in viewport coordinates.',
				replacement: 'virtual activator'
			},
			{
				name: '_offsetTop',
				note: 'Add it to `offset` for a menu below or above the activator; otherwise shift the rect returned by a virtual activator.',
				replacement: 'offset'
			},
			{
				name: '_offsetLeft',
				note: 'Add it to `offset` for a menu on the left or right; otherwise pick a `-start` / `-end` placement or shift the rect returned by a virtual activator (`new DOMRect(rect.x + dx, rect.y, rect.width, rect.height)`).',
				replacement: 'offset or virtual activator'
			},
			{
				name: 'refreshPosition',
				note: 'The menu follows its activator by itself (scroll, resize, layout changes): remove the prop and the code that set it to `true`.'
			},
			{
				name: 'flipOnOverflow',
				note: 'Always on: the menu flips to the opposite side when there is no room. Remove the prop.'
			},
			{
				name: 'stayInViewport',
				note: 'Always on: the menu shifts to stay 8px inside the viewport. Remove the prop.'
			},
			{
				name: 'openingId',
				note: 'Opening a menu now closes every other open menu, except the ones rendered inside its `children` (submenus) and those with `closeOnClickOutside={false}`. Remove the prop; a shared id gave the same result.'
			},
			{
				name: 'inAnimation',
				note: 'Animations are CSS variables: `--menu-duration`, `--menu-transition-distance` (slide length), `--menu-transition-scale`. A fade is `--menu-transition-distance="0px" --menu-transition-scale="1"`.',
				replacement: '--menu-duration, --menu-transition-distance, --menu-transition-scale'
			},
			{
				name: 'inAnimationConfig',
				note: '`{ duration: 100, y: 10 }` → `--menu-duration="100ms" --menu-transition-distance="10px"`. Other params have no equivalent.',
				replacement: '--menu-duration, --menu-transition-distance'
			},
			{
				name: 'outAnimation',
				note: 'Opening and closing share the same CSS variables; see `inAnimation`.',
				replacement: '--menu-duration, --menu-transition-distance, --menu-transition-scale'
			},
			{
				name: 'outAnimationConfig',
				note: 'Opening and closing share the same CSS variables; see `inAnimationConfig`.',
				replacement: '--menu-duration, --menu-transition-distance'
			}
		],
		toCssVar: [
			{
				name: '_width',
				cssVar: '--menu-width',
				note: '`_width={activator.offsetWidth + "px"}` (or any width read from the activator) becomes `matchActivatorWidth`, not the variable. With `matchActivatorWidth` the variable has no effect: use `--menu-min-width` / `--menu-max-width`.'
			},
			{ name: '_height', cssVar: '--menu-height' },
			{ name: '_maxHeight', cssVar: '--menu-max-height' },
			{ name: '_minWidth', cssVar: '--menu-min-width' },
			{ name: '_overflow', cssVar: '--menu-overflow' },
			{ name: '_boxShadow', cssVar: '--menu-box-shadow' },
			{ name: '_borderRadius', cssVar: '--menu-border-radius' }
		],
		defaults: [
			{
				name: 'closeOnClickOutside',
				v4: 'false',
				v5: 'true',
				keepV4: 'closeOnClickOutside={false}',
				note: 'With `false` the menu also stays open when another menu opens. Escape closes the menu in both cases.'
			},
			{ name: 'offset', v4: '5', v5: '6', keepV4: 'offset={5}', note: 'v4 name: `_activatorGap`.' }
		],
		values: [
			{
				name: 'placement',
				values: {
					bottom: 'bottom-start',
					'bottom-center': 'bottom',
					up: 'top-start',
					'up-center': 'top',
					left: 'left-start',
					'left-center': 'left',
					right: 'right-start',
					'right-center': 'right'
				},
				note: 'Applies to the value of the v4 `anchor` prop. The v4 default `bottom` equals the v5 default `bottom-start`.'
			}
		],
		types: [
			{
				name: 'menuElement',
				v4: 'HTMLElement',
				v5: 'HTMLDivElement',
				note: 'Type the variable bound with `bind:menuElement` as `HTMLDivElement` if svelte-check complains. It is `undefined` while the menu is closed, as in v4.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onkeydown',
				argument: {},
				type: 'KeyboardEvent',
				note: 'v4 already passed the native event (typed `() => void`): keep the handler as it is, without the global `.detail` rewrite. It is a native attribute of the menu element now.'
			}
		]
	},
	manual: [
		{
			id: 'menu-self-closing',
			summary:
				'The menu closes itself on outside clicks (new default), on Escape and when another menu opens; v4 closed only when the app set `open` to false.',
			action:
				'Use `bind:open` wherever `open` is passed one-way, otherwise the app keeps `true` after the menu closed and the next toggle does nothing. Menus that must stay open together: render the inner one inside the outer menu `children`, or give it `closeOnClickOutside={false}`. Remove app code that closed menus on Escape or on outside clicks by hand.'
		},
		{
			id: 'menu-surface',
			summary:
				'The menu draws its own surface (4px padding, background, border, radius, shadow, blur); v4 was a bare positioned box.',
			action:
				'Where the content draws its own card (a wrapper with background, padding, radius or shadow), remove those styles or pass `--menu-padding="0" --menu-background="transparent" --menu-border-width="0" --menu-box-shadow="none" --menu-backdrop-filter="none"`.'
		},
		{
			id: 'menu-dom',
			summary:
				'The menu element is a `popover` with `position: fixed`, without `role="presentation"`, `data-menu`, `data-uid` or inline z-index, and the hidden controller div is gone.',
			action:
				'Search app code and CSS for `[data-menu]`, `data-uid`, `data-operation="close"` and z-index rules aimed at menus, and use a `class` or `aria-*` attribute passed to the Menu instead. Pass the `role` of the content (`menu`, `listbox`) and an `aria-label` to the Menu.'
		}
	],
	added: [
		'`placement` has `-start` / `-end` variants on every side; the current side is exposed as `data-side`.',
		'`matchActivatorWidth` makes the menu as wide as its activator.',
		'`activator` accepts a virtual element (any object with `getBoundingClientRect()`), for context menus.',
		'`class` and native attributes reach the menu element.',
		'New CSS variables: `--menu-background`, `--menu-color`, `--menu-padding`, `--menu-border-width`, `--menu-border-color`, `--menu-backdrop-filter`, `--menu-max-width`, `--menu-duration`, `--menu-transition-distance`, `--menu-transition-scale`.'
	]
} satisfies ComponentMigration;
