/** An option of a picker (Autocomplete, Select, ...). */
export type Item<Data = unknown> = {
	/** Identity of the option: two items are the same option when their `value`s are equal (`===`). */
	value: string | number;
	/** Text shown and searched. Defaults to `value`. */
	label?: string | number;
	/** SVG path of an icon shown before the label, for example from `@mdi/js`. */
	icon?: string;
	/** Any extra data, available in snippets and callbacks. */
	data?: Data;
};

/** An option of a `RadioGroup`: an `Item` with a secondary line and its own disabled state. */
export type RadioItem<Data = unknown> = Item<Data> & {
	/** Secondary text below the label. */
	description?: string;
	/** Disables only this option. */
	disabled?: boolean;
};
