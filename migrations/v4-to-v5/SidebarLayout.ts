import type {
	Changed,
	ComponentMigration,
	EventChange,
	ManualStep,
	Removal,
	Rename,
	SnippetChange
} from '../types.js';

const pageBackground = {
	match: '--global-color-background-',
	note: 'Its value read a v4 background token, which `v4-compat.css` maps to the page background of Aurora: the sidebar and the bar would lose their tone and border. Removed: the layout has its own background and border.'
};

const dropWhen: Record<string, Rename['dropWhen']> = {
	'sidebar-background': pageBackground,
	'sidebar-border': pageBackground,
	'header-background': pageBackground,
	'header-border': pageBackground,
	'content-padding': {
		match: '^=["\']?\\s*0(px)?\\s*["\']?$',
		note: 'v4 apps set it to 0 and padded the content in their own scroll box, which goes away (`sidebar-layout-scroll`): removed, so the content gets the padding of the layout.'
	}
};

const both = (prefix: string, pairs: [string, string, string?][]): Rename[] =>
	pairs.flatMap(([from, to, note]) => [
		{ from: `--${prefix}-${from}`, to: `--sidebar-layout-${to}`, note, ...(dropWhen[to] ? { dropWhen: dropWhen[to] } : {}) },
		{ from: `--${prefix}-default-${from}`, to: `--sidebar-layout-default-${to}`, note }
	]);

const gone = (prefix: string, items: [string, string, string?][]): Removal[] =>
	items.flatMap(([name, note, replacement]) => [
		{ name: `--${prefix}-${name}`, note, replacement },
		{ name: `--${prefix}-default-${name}`, note }
	]);

const railVars: [string, string, string?][] = [
	['side-bar-width', 'sidebar-width', 'Width of the narrow rail (default 4rem as in v4).'],
	['side-bar-hover-width', 'sidebar-expanded-width', 'Width of the wide sidebar, default 18rem.'],
	['side-bar-border', 'sidebar-border'],
	['side-bar-padding', 'sidebar-padding', 'Now the top and bottom padding; the side padding is `--sidebar-layout-sidebar-inline-padding` (default 10px).'],
	['content-padding', 'content-padding'],
	['header-menu-height', 'header-height'],
	['header-menu-position', 'header-position', 'Default `sticky` (v4: `fixed`); `static` still lets the bar scroll away.'],
	['header-menu-border', 'header-border'],
	['header-menu-padding', 'header-padding'],
	['header-menu-backdrop-filter', 'header-backdrop-filter'],
	['inner-header-menu-background-color', 'header-background', 'A full color now (v4 read an RGB triplet in the default and drew it at 50%).'],
	['drawer-width', 'drawer-width']
];

const railGone: [string, string, string?][] = [
	['content-padding-left', 'The content is placed by a grid next to the sidebar: no left offset to set.', '--sidebar-layout-content-padding'],
	['content-padding-top', 'The bar is in the flow (sticky), the content starts below it: no top offset to set.', '--sidebar-layout-content-padding'],
	['drawer-background-color', 'The mobile drawer is the library Drawer: style its panel with the `class.drawer` part or `--drawer-background` on it.', '--drawer-background']
];

const drawerChange: EventChange = {
	name: 'ondrawerChange',
	argument: { 'detail.opened': 'opened', detail: '' },
	type: '{ opened: boolean }',
	note: 'The same object without `detail`. Called when the layout opens or closes the drawer by itself (menu button, Escape, backdrop, choice of an option, `currentPath`); v4 also called it on every option chosen on desktop.'
};

const menuSelect: EventChange = {
	name: 'onmenuSelect',
	argument: { 'detail.option': 'option', detail: '' },
	type: '{ option: HierarchyMenuOption; nativeEvent: MouseEvent }',
	note: 'The same object without `detail`: `e.detail.option` → `e.option`. Options with `href` navigate on their own: see `sidebar-layout-links`.'
};

const classChange = (keys: string): Changed => ({
	name: 'class',
	note: `Still an object of classes per part, with other keys: ${keys}`
});

const state = '{ hamburgerVisible, sidebarExpanded, collapsed }';
const stateSnippets = (names: string[]): SnippetChange[] =>
	names.map((name) => ({
		name,
		v4: '{ hamburgerVisible, sidebarExpanded }',
		v5: state,
		note: '`collapsed` is true while the desktop sidebar is narrow: use it instead of `!sidebarExpanded && !hamburgerVisible`. Placeholder texts ("logo", "Menu", "Content") are gone when the snippet is missing.'
	}));

const shellManual: ManualStep[] = [
	{
		id: 'sidebar-layout-scroll',
		kind: 'edit',
		summary:
			'The window scrolls the page: the bar and the sidebar stay in place by themselves and the content is in a `<main>` that takes the remaining width. v5 apps do not need their own scroll box.',
		action:
			'Remove the wrapper the app put around the content to scroll it (a div with `calc(100dvw - 52px)` width, `calc(100dvh - 50px)` height and `overflow-auto`) and the extra `<main>` inside it: render the page content directly. Code that scrolled that box (`bind:this` to a global scroller, `scrollTo` on it) must use `window` instead. Full-height pages can use `calc(100dvh - var(--sidebar-layout-header-height, 3.5rem))`.',
		when: { snippets: ['children'], contains: ['calc\\(100d?vh\\s*-\\s*\\d+px\\)'] },
		scope: 'usage'
	},
	{
		id: 'sidebar-layout-header',
		kind: 'edit',
		summary:
			'The library draws the toggle buttons (the menu button in the bar on mobile, the sidebar button at the top of the sidebar on desktop) and `headerSnippet` is the rest of the bar. In v4 `headerSnippet` replaced the whole bar, so every app copied the hamburger and the dock icon by hand.',
		action:
			'In `headerSnippet` delete the hand-made toggles (the `mdi-menu` icon that set `drawerOpened`, the `mdi-dock-left` icon that set `sidebarExpanded`, and the `MediaQuery` around them) and keep only the rest (theme switch, avatar, tenant pill, actions). A spacer that pushed them to the right is still needed (`<div style="flex: 1"></div>`). Use `toggleSnippet` only if the toggle must look different.',
		when: { snippets: ['headerSnippet'], contains: ['mdi-menu(?![\\w-])', 'mdi-dock-left(?![\\w-])', '\\bmdiMenu\\b', '\\bmdiDockLeft\\b'] }
	},
	{
		id: 'sidebar-layout-links',
		kind: 'edit',
		summary:
			'The menu drawn from `options` is a HierarchyMenu: options with `href` are links, `currentPath` selects the option of the page and closes the mobile drawer when the page changes.',
		action:
			'Give each option its route as `href`, pass `currentPath={page.url.pathname}` (from `$app/state`), and delete the `goto` chain in `onmenuSelect` / `onoptionClick`, the code that derives the selection from the URL and the code that sets `drawerOpened = false` after a click or a navigation. Where the app drew its own HierarchyMenu in `menuSnippet` only to get nesting or icons-only, pass the options to the layout instead.',
		when: { events: ['onmenuSelect'], props: ['options', 'selectedIndex'], snippets: ['menuSnippet'] },
		unless: { props: ['currentPath'] }
	}
];

const unstable = {
	from: 'UnstableDividedSideBarLayout',
	to: 'SidebarLayout',
	props: {
		defaults: [
			{
				name: 'expandOn',
				v4: "'hover'",
				v5: "'toggle'",
				keepV4: 'expandOn="hover"',
				behaviour: true,
				note: 'v5 widens the sidebar with a button at the top of the sidebar by default (or a click on an empty spot of the narrow rail). With `hover` and `click` it now widens over the content instead of pushing it; with `click` choosing an option narrows it again (v4 reopened it).'
			}
		],
		types: [
			{
				name: 'options',
				v4: '{ label: string; name: string; icon?: string }[] (ColorInvertedSelector options, icon = MDI class)',
				v5: 'HierarchyMenuOption[] (icon = SVG path; href, nested options, badge, disabled)',
				note: 'Drawn with HierarchyMenu: soft selected option with a bar, as the prototype (v4: solid pill). Apply the global icon transform to `icon`.'
			}
		],
		removed: [
			{
				name: 'selectedIndex',
				replacement: 'selected',
				note: 'The selection is the `name` of the option, not its index (`bind:selected`), or comes from `currentPath`. Replace `selectedIndex = options.findIndex(o => o.name == x)` with `selected = x`.'
			}
		],
		changed: [
			classChange('`container` (unchanged), `header` → `sidebar` (it was the sidebar element), `mainSection` → `content` (the `<main>`), `overlay` removed (the drawer has its own backdrop), `header` is now the bar, `drawer` the panel of the mobile drawer.')
		]
	},
	events: { changed: [drawerChange, menuSelect] },
	snippets: {
		renamed: [
			{
				from: 'innerMenuSnippet',
				to: 'headerSnippet',
				note: 'Content of the bar after the toggle button, as in v4. Parameters: `{ hamburgerVisible, sidebarExpanded, collapsed }`.'
			}
		],
		removed: [
			{
				name: 'prependSnippet',
				replacement: 'menuSnippet',
				note: 'Icons of the options are drawn from `option.icon` and counters from `option.badge`. For anything else draw your own `HierarchyMenu` in `menuSnippet` and use its `prependSnippet`.'
			},
			{
				name: 'optionSnippet',
				replacement: 'menuSnippet',
				note: 'Draw your own `HierarchyMenu` in `menuSnippet` and use its `optionSnippet`.'
			}
		],
		parameters: [
			{
				name: 'headerSnippet',
				v4: '{ hamburgerVisible, sidebarExpanded } — replaced the whole bar, hamburger included',
				v5: '{ hamburgerVisible, sidebarExpanded, collapsed } — content after the toggle button',
				note: 'See `sidebar-layout-header`. With v4 `headerSnippet` and `innerMenuSnippet` together, only `headerSnippet` was shown.'
			},
			...stateSnippets(['sidebarSnippet', 'logoSnippet', 'menuSnippet', 'userSnippet'])
		]
	},
	cssVars: {
		renamed: both('unstable-divided-side-bar-layout', railVars),
		removed: gone('unstable-divided-side-bar-layout', railGone)
	},
	manual: [
		...shellManual,
		{
			id: 'sidebar-layout-color-inverted-selector',
			kind: 'review',
			summary:
				'The default menu is no longer ColorInvertedSelector, so its style props on the layout (`--color-inverted-selector-selected-background-color` and friends, also the `-default-` ones in app.css) have no effect.',
			action:
				'Drop them. To keep a solid selected option set `--hierarchy-menu-option-selected-background` and `--hierarchy-menu-option-selected-color` on the layout.',
			when: { cssVars: ['--color-inverted-selector-selected-background-color', '--color-inverted-selector-selected-color'] },
			scope: 'usage'
		}
	],
	added: [
		'`expandOn="none"`, `currentPath`, `locale`, `menuLabel`, `sidebarLabel`, `skipLabel`, `toggleSnippet`, `onsidebarToggle`.',
		'A "Skip to content" link on the first Tab; the content is a `<main>` landmark.',
		'`data-expand-on` and `data-expanded` on the root; every other `--sidebar-layout-*` variable.'
	]
} satisfies ComponentMigration;

const collapsible = {
	from: 'CollapsibleSideBarLayout',
	to: 'SidebarLayout',
	props: {
		changed: [
			classChange('`container` (unchanged), `header` → `sidebar` (it was the sidebar element), `mainSection` → `content` (the `<main>`), `overlay` removed (the drawer has its own backdrop), `header` is now the bar, `drawer` the panel of the mobile drawer.'),
			{
				name: 'sidebarExpanded',
				note: 'Same meaning (default `expandOn="toggle"` is the v4 behaviour). On mobile it is left as it is instead of being forced to `false`, so the desktop state comes back when the window grows.'
			}
		]
	},
	events: {
		changed: [
			drawerChange,
			menuSelect,
			{
				name: 'onsidebarToggle',
				argument: { 'detail.expanded': 'expanded', detail: '' },
				type: '{ expanded: boolean }',
				note: 'The same object without `detail`.'
			}
		],
		removed: [
			{
				name: 'onpinnedChange',
				note: 'v4 declared it but never called it: drop it.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'innerMenuSnippet',
				to: 'headerSnippet',
				note: 'Content of the bar after the toggle button. Parameters: `{ hamburgerVisible, sidebarExpanded, collapsed }`.'
			}
		],
		parameters: [
			{
				name: 'headerSnippet',
				v4: '{ hamburgerVisible, sidebarExpanded } — replaced the whole bar, toggles included',
				v5: '{ hamburgerVisible, sidebarExpanded, collapsed } — content after the toggle button',
				note: 'See `sidebar-layout-header`.'
			},
			...stateSnippets(['sidebarSnippet', 'logoSnippet', 'menuSnippet', 'userSnippet'])
		]
	},
	cssVars: {
		renamed: [
			...both('collapsible-divided-side-bar-layout', railVars),
			...both('collapsible-divided-side-bar-layout', [
				['background-color', 'sidebar-background', 'Background of the sidebar (v4: the same variable).']
			])
		],
		removed: [
			...gone('collapsible-divided-side-bar-layout', railGone),
			...gone('collapsible-divided-side-bar-layout', [
				['expanded-background-color', 'v4 declared it but never read it: drop it.']
			]),
			{
				name: '--collapsible-side-bar-layout-drawer-background-color',
				note: 'Wrong prefix in the apps: v4 never read it. Drop it, do not map it (it would change the look).'
			},
			{
				name: '--collapsible-side-bar-layout-header-menu-padding',
				note: 'Wrong prefix in the apps: v4 never read it. Drop it, do not map it (it would change the look).'
			}
		]
	},
	manual: [
		...shellManual,
		{
			id: 'sidebar-layout-menu-select',
			kind: 'review',
			summary:
				'v4 declared `onmenuSelect` on CollapsibleSideBarLayout but never called it (it had no menu of its own). In v5 it is called when an option of the menu drawn from `options` is chosen.',
			action:
				'Delete the handler if the app passes its own HierarchyMenu in `menuSnippet`; if the app moves its options to the layout (`sidebar-layout-links`), keep it only for side effects.',
			when: { events: ['onmenuSelect'] }
		}
	],
	added: [
		'`expandOn` (`hover`, `click`, `none`), `options`, `selected`, `currentPath`, `onmenuSelect`, `locale`, `menuLabel`, `sidebarLabel`, `skipLabel`, `toggleSnippet`.',
		'A "Skip to content" link on the first Tab; the content is a `<main>` landmark.',
		'`data-expand-on` and `data-expanded` on the root; every other `--sidebar-layout-*` variable.'
	]
} satisfies ComponentMigration;

const stable = {
	from: 'StableDividedSideBarLayout',
	to: 'SidebarLayout',
	props: {
		defaults: [
			{
				name: 'expandOn',
				v4: '"none" with a wide sidebar (StableDividedSideBarLayout)',
				v5: '"toggle"',
				keepV4: 'expandOn="none" sidebarExpanded',
				behaviour: true,
				note: 'An always wide sidebar without a button, as StableDividedSideBarLayout.'
			}
		],
		changed: [
			classChange('`container` (unchanged), `header` → `sidebar` (it was the sidebar element), `mainSection` → `content` (the `<main>`), `overlay` removed, `header` is now the bar, `drawer` the panel of the mobile drawer.')
		]
	},
	events: { changed: [drawerChange] },
	snippets: {
		renamed: [
			{
				from: 'innerMenuSnippet',
				to: 'headerSnippet',
				note: 'Content of the bar after the toggle button.'
			}
		],
		parameters: [
			{
				name: 'menuSnippet',
				v4: '() — replaced the whole bar, hamburger included',
				v5: '{ hamburgerVisible, sidebarExpanded, collapsed } — the menu inside the sidebar',
				note: 'Same name, other place: see `sidebar-layout-stable`.'
			},
			{
				name: 'sidebarSnippet',
				v4: '{ hamburgerVisible }',
				v5: state,
				note: 'Same place. The "Sidebar" placeholder is gone.'
			}
		]
	},
	cssVars: {
		renamed: both('stable-divided-side-bar-layout', [
			['side-bar-width', 'sidebar-expanded-width', 'The always wide sidebar is the expanded one (default 18rem, as in v4).'],
			['side-bar-background-color', 'sidebar-background'],
			['side-bar-padding', 'sidebar-padding', 'Now the top and bottom padding; the side padding is `--sidebar-layout-sidebar-inline-padding`.'],
			['content-padding', 'content-padding'],
			['header-menu-height', 'header-height'],
			['header-menu-padding', 'header-padding'],
			['inner-header-menu-background-color', 'header-background'],
			['drawer-width', 'drawer-width']
		]),
		removed: gone('stable-divided-side-bar-layout', [
			['side-bar-border-color', 'The border is a full shorthand now.', '--sidebar-layout-sidebar-border'],
			['header-menu-border-color', 'The border is a full shorthand now.', '--sidebar-layout-header-border'],
			['drawer-background-color', 'The mobile drawer is the library Drawer: style its panel with `--drawer-background`.', '--drawer-background']
		])
	},
	manual: [
		...shellManual,
		{
			id: 'sidebar-layout-stable',
			kind: 'edit',
			summary:
				'StableDividedSideBarLayout is `SidebarLayout expandOn="none" sidebarExpanded` (the codemod adds them): an always wide sidebar without a button. Its `menuSnippet` was the top bar, which is `headerSnippet` in v5.',
			action:
				'Move the content of `menuSnippet` into `headerSnippet` without the hand-made hamburger (the bar keeps the menu button on mobile). The menu inside the sidebar can stay in `sidebarSnippet`, or move to `logoSnippet` + `menuSnippet` + `userSnippet` to keep the layout scrolling only the menu.',
			when: { snippets: ['menuSnippet'] },
			scope: 'usage'
		}
	],
	added: [
		'`expandOn`, `sidebarExpanded`, `options`, `selected`, `currentPath`, `onmenuSelect`, `onsidebarToggle`, `logoSnippet`, `userSnippet`, `toggleSnippet`, `locale` and the labels.',
		'A "Skip to content" link on the first Tab; the content is a `<main>` landmark.'
	]
} satisfies ComponentMigration;

export default [unstable, collapsible, stable] satisfies ComponentMigration[];
