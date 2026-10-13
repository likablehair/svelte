import { getContext, setContext } from 'svelte';

const KEY = Symbol('aurora-locale');

/**
 * Sets the locale of every library component rendered inside the component that calls it: the language of their
 * texts (`it` and `en` are built in, other languages fall back to English) and the format of dates and numbers.
 * Call it while a component initializes, like `setContext`, usually in the root `+layout.svelte`. A component's own
 * `locale` prop wins over it. Pass a function to follow a locale that changes (`setDefaultLocale(() => getLocale())`).
 */
export function setDefaultLocale(locale: string | (() => string | undefined)): void {
	setContext(KEY, typeof locale === 'function' ? locale : () => locale);
}

export function inheritedLocale(): () => string {
	const read = getContext<(() => string | undefined) | undefined>(KEY);
	return () => read?.() || 'en';
}

export function languageOf(locale: string): string {
	return locale.split(/[-_]/)[0].toLowerCase();
}
