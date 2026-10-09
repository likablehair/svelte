/** `system` follows the operating system (`prefers-color-scheme`). */
export type ThemeMode = 'light' | 'dark' | 'system';

function withoutTransitions(change: (root: HTMLElement) => void) {
	const root = document.documentElement;
	root.dataset.switching = '';
	change(root);
	void root.offsetWidth;
	delete root.dataset.switching;
}

/** Activates a theme (`data-theme` on `<html>`); the app must import its CSS. `null` goes back to the default theme. Colors change at once: transitions are paused during the switch, which would otherwise animate every component. */
export function setTheme(name: string | null): void {
	withoutTransitions((root) => {
		if (name) root.dataset.theme = name;
		else delete root.dataset.theme;
	});
}

/** Name of the active theme, `null` for the default one. */
export function getTheme(): string | null {
	return document.documentElement.dataset.theme ?? null;
}

/** Forces light or dark (`data-mode` on `<html>`), or goes back to following the operating system. It does not store the choice: persistence is up to the app. Like `setTheme`, it pauses transitions during the switch. */
export function setMode(mode: ThemeMode): void {
	withoutTransitions((root) => {
		if (mode === 'system') delete root.dataset.mode;
		else root.dataset.mode = mode;
	});
}

/** Current mode: `system` when none is forced. */
export function getMode(): ThemeMode {
	const mode = document.documentElement.dataset.mode;
	return mode === 'light' || mode === 'dark' ? mode : 'system';
}
