/** A widget placed on a `DashboardShaper`: its type, where it starts and how many cells it takes. The same shape as v4, so layouts saved by the backends keep working. */
export interface DashboardWidget<Data = unknown, Name extends string = string> {
	/** Unique id of the widget. Widgets added by the user get a random string id; the backend can replace it with its own when it saves. */
	id: string | number;
	/** Type of the widget: the `name` of its entry in `catalog`. */
	name: Name;
	/** Width in columns. */
	width: number;
	/** Height in rows. */
	height: number;
	/** First column, counted from 1. */
	left: number;
	/** First row, counted from 1. */
	top: number;
	/** Anything the app needs to draw the widget, such as its settings or its title. The dashboard only passes it to `widgetSnippet`. */
	data?: Data;
}

/** A size a widget can take, in columns and rows. */
export interface DashboardWidgetSize {
	/** Width in columns. */
	width: number;
	/** Height in rows. */
	height: number;
}

/** A type of widget the user can add to a `DashboardShaper`, and the sizes it comes in. */
export interface DashboardCatalogItem<Name extends string = string> {
	/** Type of the widget, saved in the `name` of every widget of this type. */
	name: Name;
	/** Name shown in the catalog and to screen readers. */
	title: string;
	/** Line under the title in the catalog. */
	description?: string;
	/** SVG path of the icon shown in the catalog, for example one from `@mdi/js`. */
	icon?: string;
	/** Sizes the widget comes in: the catalog offers the ones that fit the chosen space, and resizing moves between them. One size means the widget cannot be resized. */
	sizes: DashboardWidgetSize[];
	/** Group of the widget in the catalog: with two or more groups the catalog shows a tab for each, plus "All". */
	category?: string;
	/** The widget can be on the dashboard only once: the catalog hides it while it is there. */
	unique?: boolean;
}

/** What changed on a `DashboardShaper`, passed to its `onchange`. */
export interface DashboardChange<Data = unknown, Name extends string = string> {
	/** All the widgets after the change. */
	widgets: DashboardWidget<Data, Name>[];
	/** The widget added from the catalog, if any. */
	added: DashboardWidget<Data, Name>[];
	/** The widget removed, if any. */
	removed: DashboardWidget<Data, Name>[];
	/** Widgets moved or resized: one, or two when two widgets swapped places. */
	changed: DashboardWidget<Data, Name>[];
}
