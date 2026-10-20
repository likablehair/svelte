import { getMode, getTheme, setMode, setTheme, type ThemeMode } from '#lib/theme.svelte.js';

export const appearance = $state({ theme: '', mode: 'system' as ThemeMode });

export function syncAppearance() {
	appearance.theme = getTheme() ?? '';
	appearance.mode = getMode();
	const follow = (event: StorageEvent) => {
		if (event.key === 'aurora-docs-theme') {
			appearance.theme = event.newValue ?? '';
			setTheme(event.newValue || null);
		} else if (event.key === 'aurora-docs-mode' && event.newValue) {
			appearance.mode = event.newValue as ThemeMode;
			setMode(event.newValue as ThemeMode);
		}
	};
	window.addEventListener('storage', follow);
	return () => window.removeEventListener('storage', follow);
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
