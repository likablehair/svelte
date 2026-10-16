import type { ComponentMigration } from '../types.js';

export default {
	from: 'DashboardShaper',
	to: 'DashboardShaper',
	props: {
		renamed: [
			{ from: 'layoutWidth', to: 'columns' },
			{
				from: 'layoutHeight',
				to: 'rows',
				note: 'Now a maximum, and optional: without it the dashboard grows downwards. Read-only, only the rows in use are shown (v4 always drew `layoutHeight` rows, empty ones included); while editing, a free band as tall as the tallest catalog size stays below the widgets. A `layoutHeight` computed from the rows in use (used rows + tallest widget) is no longer needed: drop it.'
			},
			{
				from: 'availableWidgetCells',
				to: 'catalog',
				note: 'Each entry: `availableSizes: [height, width][]` → `sizes: { width, height }[]` (mind the order), `icon: "mdi-..."` → an SVG path from `@mdi/js`. New optional `category` and `unique`. Entries are shown in the given order (v4 sorted them by title with "Placeholder" first).'
			},
			{
				from: 'someRowSlotEmpty',
				to: 'hasEmptySlots',
				note: 'Same meaning: true when a row in use has an empty cell.'
			},
			{
				from: 'canAdd',
				to: 'editing',
				note: '`editing` also turns on removing, moving and resizing. `canAdd={false}` → nothing (read-only is the default).'
			},
			{ from: 'lang', to: 'locale' }
		],
		defaults: [
			{
				name: 'editing',
				v4: 'true',
				v5: 'false',
				keepV4: 'editing',
				note: 'v4 `canAdd` was on by default: a DashboardShaper without `canAdd` showed the "Add widget" spaces. Add `editing` where the page arranges the dashboard.'
			}
		],
		changed: [
			{
				name: 'widgets',
				note: 'Same shape as v4 (`{ id, name, width, height, left, top, data }`, places from 1), so saved layouts work as they are. Widgets added by the user get a random string id (v4: a cuid), still to be replaced by the backend.'
			},
			{
				name: 'preview',
				note: 'Still plain blocks for thumbnails; now they keep the grid at every width (v4 stacked them below 800px) and never show the editing controls.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onaddWidgetCell',
				to: 'onchange',
				argument: { 'widgetCell.widget': 'added[0]', widgetCell: null },
				type: '{ widgets: DashboardWidget[]; added: DashboardWidget[]; removed: DashboardWidget[]; changed: DashboardWidget[] }',
				note: 'Called for every change (add, remove, move, resize) with the widgets themselves (v4 passed an internal cell): check `added.length > 0` to react to additions only.'
			},
			{
				name: 'onremoveWidgetCell',
				to: 'onchange',
				argument: { 'widgetCell.widget': 'removed[0]', widgetCell: null },
				type: '{ widgets: DashboardWidget[]; added: DashboardWidget[]; removed: DashboardWidget[]; changed: DashboardWidget[] }',
				note: 'Called for every change: check `removed.length > 0`. When both v4 callbacks are used, merge them in one `onchange`.'
			}
		]
	},
	snippets: {
		renamed: [
			{ from: 'widgetCellSnippet', to: 'widgetSnippet' },
			{ from: 'addWidgetButtonSnippet', to: 'slotSnippet' },
			{ from: 'widgetSelectionDialogHeaderSnippet', to: 'catalogHeaderSnippet' }
		],
		parameters: [
			{
				name: 'widgetSnippet',
				v4: '{ widgetCell: { widget, title, columnSpanFrom, columnSpanTo, rowSpanFrom, rowSpanTo }, removeWidgetCell }',
				v5: '{ widget, item, editing, remove }',
				note: '`widgetCell.widget` → `widget`, `widgetCell.title` → `item?.title`, `removeWidgetCell({ id })` → `remove()`. While editing the content is inert and the dashboard draws its own remove button: delete remove overlays shown in edit mode.'
			},
			{
				name: 'slotSnippet',
				v4: '{ handleAddClick, slot }',
				v5: '{ width, height, add }',
				note: '`handleAddClick({ slot })` → `add()`; `slot.availableWidth`/`availableHeight` → `width`/`height`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--dashboard-shaper-widget-height', to: '--dashboard-shaper-row-height', note: 'It was the height of a row.' },
			{ from: '--dashboard-shaper-default-widget-height', to: '--dashboard-shaper-default-row-height' },
			{ from: '--dashboard-shaper-cell-preview-background-color', to: '--dashboard-shaper-preview-background' },
			{
				from: '--dashboard-shaper-default-cell-preview-background-color',
				to: '--dashboard-shaper-default-preview-background'
			},
			{ from: '--dashboard-shaper-widget-preview-border-radius', to: '--dashboard-shaper-preview-border-radius' },
			{
				from: '--dashboard-shaper-default-widget-preview-border-radius',
				to: '--dashboard-shaper-default-preview-border-radius'
			},
			{ from: '--dashboard-shaper-add-widget-button-background-color', to: '--dashboard-shaper-slot-background' },
			{
				from: '--dashboard-shaper-default-add-widget-button-background-color',
				to: '--dashboard-shaper-default-slot-background'
			}
		],
		removed: [
			...['display-mobile', 'flex-direction-mobile', 'default-display-mobile', 'default-flex-direction-mobile'].map(
				(suffix) => ({
					name: `--dashboard-shaper-${suffix}`,
					note: 'Narrower than `stackBelow` (640px of the component) the widgets go in one column on their own to be read, keeping their height; while editing the dashboard shows the grid in small, where a tapped block drags at once and resizes from its handle, and any block drags after a hold. `stackBelow={false}` keeps the grid.',
					replacement: 'stackBelow'
				})
			),
			...['dialog-background-color', 'default-dialog-background-color'].map((suffix) => ({
				name: `--dashboard-shaper-${suffix}`,
				note: 'The catalog is a `Dialog` (a bottom `Drawer` on mobile): set `--dialog-background` / `--drawer-background` on the DashboardShaper.',
				replacement: '--dialog-background'
			})),
			...['dialog-header-background-color', 'default-dialog-header-background-color'].map((suffix) => ({
				name: `--dashboard-shaper-${suffix}`,
				note: 'The catalog header has no background of its own anymore; use `catalogHeaderSnippet` for a custom header.'
			}))
		],
		changed: [
			{ name: '--dashboard-shaper-gap', note: 'Default 10px (v4: 4px). Set `--dashboard-shaper-gap="4px"` to keep v4 spacing.' },
			{ name: '--dashboard-shaper-default-gap', note: 'Default 10px (v4: 4px).' }
		]
	},
	items: [
		{
			prop: 'availableWidgetCells',
			pairs: [{ from: 'availableSizes', to: 'sizes', keys: ['height', 'width'] }],
			note: '`availableSizes: [height, width][]` → `sizes: { width, height }[]`'
		}
	],
	manual: [
		{
			id: 'dashboard-shaper-editing',
			kind: 'edit',
			summary:
				'A DashboardShaper is read-only unless `editing` is set; while editing, widgets can also be moved and resized (v4: only added and removed).',
			action:
				'On the pages that create or edit a dashboard add `editing` (replacing `canAdd`, `canDelete` and similar app props). The layout is saved as before (`left`, `top`, `width`, `height`); to keep exactly the v4 behaviour pass `movable={false} resizable={false}`. Remove delete overlays drawn in `widgetCellSnippet`: the dashboard shows its own remove button while editing.',
			unless: { props: ['editing'] }
		},
		{
			id: 'dashboard-shaper-catalog',
			kind: 'review',
			summary:
				'`availableWidgetCells` became `catalog`, with `sizes: { width, height }[]` instead of `availableSizes: [height, width][]` (the codemod converts the entries written in the same file), and a new `unique`.',
			action:
				'For widget types the backend keeps once per dashboard (saved by `name`) add `unique: true`. Catalogs filtered by permission stay as they are.',
			when: { props: ['availableWidgetCells'] }
		},
		{
			id: 'dashboard-shaper-local-copies',
			kind: 'review',
			summary: 'Apps with their own copy of DashboardShaper (with a DashboardEditor wrapper and `componentName`) can use the library one.',
			action:
				'Replace the local DashboardShaper/DashboardEditor/DashboardAddButton with the library DashboardShaper: map `componentName` to `name` when loading and back when saving (or keep `componentName` in `data`), move the catalog to `catalog`, the widget switch to `widgetSnippet`, and the data loading to `onchange` (`added`).',
			scope: 'app'
		}
	],
	added: [
		'Moving widgets by dragging (mouse, or touch after a hold) and with the arrow keys; swapping two widgets of the same size.',
		'Resizing among the `sizes` of the catalog with the corner handle or Shift and the arrow keys; `movable` and `resizable` to turn them off.',
		'`stackBelow`, `catalogItemSnippet`, `labels`, `class` per part, `category` and `unique` in the catalog.',
		'Announcements for screen readers and a keyboard handle on each widget while editing.',
		'On narrow screens, editing on a small version of the grid: tap a block to select it, then drag it, resize it from its handle or remove it; holding any block drags it too.',
		'On touch screens, holding a widget starts the drag, so swiping still scrolls the page.',
		'`--dashboard-shaper-*` variables for slots, editing controls, drop target, catalog and min height.'
	]
} satisfies ComponentMigration;
