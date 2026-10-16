import { getContext, setContext } from 'svelte';

const KEY = Symbol('aurora-title');

export interface TitleContext {
	format: (title: string) => string;
	owner: object | null;
	base: string | undefined;
}

/**
 * Lets every `PageHeader` rendered inside the component that calls it write the title of the browser tab, in the
 * format of the app: `setTitleTemplate('{title} · Tatum')` turns a page titled "Users" into "Users · Tatum". Call it
 * while a component initializes, like `setContext`, usually in the root `+layout.svelte` next to the `<title>` the
 * pages without a `PageHeader` keep: when a page with a `PageHeader` is left for one without, that title comes back.
 * A function receives the title and returns the whole text. Only a `PageHeader` with `headingLevel` 1 writes it;
 * its `documentTitle` prop gives another text for that page, or `false` to leave the title alone.
 * Without this call `PageHeader` never touches the title.
 */
export function setTitleTemplate(template: string | ((title: string) => string)): void {
	const format = typeof template === 'function' ? template : (title: string) => template.replaceAll('{title}', title);
	setContext<TitleContext>(KEY, { format, owner: null, base: undefined });
}

export function titleContext(): TitleContext | undefined {
	return getContext<TitleContext | undefined>(KEY);
}
