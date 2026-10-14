import { MediaQuery } from 'svelte/reactivity';
import { toStore, type Readable } from 'svelte/store';

/** `system` follows the operating system (`prefers-color-scheme`). */
export type ThemeMode = 'light' | 'dark' | 'system';

/** The appearance of the page, reactive. */
export interface ThemeState {
	/** The page is dark: the forced mode, or the one of the operating system with `system`. Use it for logos, chart colors and images. */
	readonly dark: boolean;
	/** The chosen mode: `system` when none is forced. */
	readonly mode: ThemeMode;
	/** Name of the active theme, `null` for the default one. */
	readonly name: string | null;
}

/** Where `rememberAppearance` and `appearanceScript` keep the choice in `localStorage`. */
export interface AppearanceStorage {
	/** Key of the mode (`light` or `dark`; missing for `system`). Defaults to `theme`, the key of v4, so users keep the choice they made with v4. */
	modeKey?: string;
	/** Key of the theme name. Defaults to `theme-name`. */
	themeKey?: string;
}

const browser = typeof document !== 'undefined';
const systemDark = new MediaQuery('prefers-color-scheme: dark', false);
const state = $state<{ mode: ThemeMode; name: string | null }>({
	mode: browser ? modeOnPage() : 'system',
	name: browser ? (document.documentElement.dataset.theme ?? null) : null
});
let storage: Required<AppearanceStorage> | undefined;
let store: Readable<ThemeState> | undefined;

function modeOnPage(): ThemeMode {
	const mode = document.documentElement.dataset.mode;
	return mode === 'light' || mode === 'dark' ? mode : 'system';
}

if (browser) {
	new MutationObserver(() => {
		const mode = modeOnPage();
		const name = document.documentElement.dataset.theme ?? null;
		if (state.mode !== mode) state.mode = mode;
		if (state.name !== name) state.name = name;
	}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode', 'data-theme'] });
}

function snapshot(): ThemeState {
	return { dark: theme.dark, mode: state.mode, name: state.name };
}

/** The mode and the theme of the page, reactive in templates, `$derived` and `$effect` (`theme.dark`), and also a store as in v4 (`$theme.dark`). */
export const theme: ThemeState & Readable<ThemeState> = {
	get dark() {
		return state.mode === 'dark' || (state.mode === 'system' && systemDark.current);
	},
	get mode() {
		return state.mode;
	},
	get name() {
		return state.name;
	},
	subscribe(run, invalidate) {
		store ??= toStore(snapshot);
		return store.subscribe(run, invalidate);
	}
};

function withoutTransitions(change: (root: HTMLElement) => void) {
	const root = document.documentElement;
	root.dataset.switching = '';
	change(root);
	void root.offsetWidth;
	delete root.dataset.switching;
}

function save(key: string, value: string | null) {
	try {
		if (value) localStorage.setItem(key, value);
		else localStorage.removeItem(key);
	} catch {
		return;
	}
}

function load(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

/** Activates a theme (`data-theme` on `<html>`); the app must import its CSS. `null` goes back to the default theme. Colors change at once: transitions are paused during the switch, which would otherwise animate every component. Saved in the browser after `rememberAppearance()`. */
export function setTheme(name: string | null): void {
	state.name = name;
	if (storage) save(storage.themeKey, name);
	if (!browser) return;
	withoutTransitions((root) => {
		if (name) root.dataset.theme = name;
		else delete root.dataset.theme;
	});
}

/** Name of the active theme, `null` for the default one. */
export function getTheme(): string | null {
	return state.name;
}

/** Forces light or dark (`data-mode` on `<html>`), or goes back to following the operating system. Saved in the browser after `rememberAppearance()`. Like `setTheme`, it pauses transitions during the switch. */
export function setMode(mode: ThemeMode): void {
	state.mode = mode;
	if (storage) save(storage.modeKey, mode === 'system' ? null : mode);
	if (!browser) return;
	withoutTransitions((root) => {
		if (mode === 'system') delete root.dataset.mode;
		else root.dataset.mode = mode;
	});
}

/** Current mode: `system` when none is forced. `theme.mode` is the same value, reactive. */
export function getMode(): ThemeMode {
	return state.mode;
}

/** Switches between light and dark, starting from what the page shows now (with `system`, from the mode of the operating system). */
export function toggleMode(): void {
	setMode(theme.dark ? 'light' : 'dark');
}

/** Keeps the mode and the theme the user chose: puts back the ones saved in the browser (`localStorage`) now, and saves every later change made with `setMode`, `setTheme` or `toggleMode`. Call it once, in the root layout. To avoid a flash of the wrong mode while the page loads, also put `appearanceScript()` in the head of the page. */
export function rememberAppearance(options: AppearanceStorage = {}): void {
	storage = { modeKey: options.modeKey ?? 'theme', themeKey: options.themeKey ?? 'theme-name' };
	if (!browser) return;
	const mode = load(storage.modeKey);
	const name = load(storage.themeKey);
	if ((mode === 'light' || mode === 'dark') && mode !== state.mode) setMode(mode);
	if (name && name !== state.name) setTheme(name);
}

/** Code for a `<script>` in the head of the page that applies the saved mode and theme before the first paint, so the page does not flash in the wrong mode: `<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>` in the root layout. Use the same keys as `rememberAppearance`. */
export function appearanceScript(options: AppearanceStorage = {}): string {
	const modeKey = JSON.stringify(options.modeKey ?? 'theme');
	const themeKey = JSON.stringify(options.themeKey ?? 'theme-name');
	return `(function(){try{var d=document.documentElement,m=localStorage.getItem(${modeKey}),t=localStorage.getItem(${themeKey});if(m==='light'||m==='dark')d.dataset.mode=m;if(t)d.dataset.theme=t}catch(e){}})();`;
}
