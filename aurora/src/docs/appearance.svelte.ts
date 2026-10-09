import { getMode, getTheme, setMode, setTheme, type ThemeMode } from '#lib/theme.js';

export const appearance = $state({ theme: '', mode: 'system' as ThemeMode });

export function syncAppearance() {
	appearance.theme = getTheme() ?? '';
	appearance.mode = getMode();
}

export function changeTheme(value: string) {
	appearance.theme = value;
	setTheme(value || null);
	try {
		if (value) localStorage.setItem('aurora-docs-theme', value);
		else localStorage.removeItem('aurora-docs-theme');
	} catch {}
}

export function changeMode(value: ThemeMode) {
	appearance.mode = value;
	setMode(value);
	try {
		localStorage.setItem('aurora-docs-mode', value);
	} catch {}
}
