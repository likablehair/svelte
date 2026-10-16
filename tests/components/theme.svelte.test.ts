import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	appearanceScript,
	getMode,
	rememberAppearance,
	setMode,
	setTheme,
	theme,
	toggleMode
} from '#lib/theme.svelte.js';

const root = document.documentElement;
const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;

describe('theme', () => {
	afterEach(() => {
		setMode('system');
		setTheme(null);
		localStorage.clear();
	});

	test('setMode and setTheme change the page and the reactive state', () => {
		setMode('dark');
		expect(root.dataset.mode).toBe('dark');
		expect(theme.mode).toBe('dark');
		expect(theme.dark).toBe(true);
		setMode('light');
		expect(theme.dark).toBe(false);
		setMode('system');
		expect(root.dataset.mode).toBeUndefined();
		expect(theme.dark).toBe(systemDark());
		setTheme('classic');
		expect(root.dataset.theme).toBe('classic');
		expect(theme.name).toBe('classic');
	});

	test('theme is reactive in effects and a store as in v4 ($theme.dark)', async () => {
		const seen: boolean[] = [];
		const cleanup = $effect.root(() => {
			$effect(() => {
				seen.push(theme.dark);
			});
		});
		const values: boolean[] = [];
		const unsubscribe = theme.subscribe((value) => values.push(value.dark));
		setMode('dark');
		await vi.waitFor(() => expect([seen.at(-1), values.at(-1)]).toEqual([true, true]));
		setMode('light');
		await vi.waitFor(() => expect([seen.at(-1), values.at(-1)]).toEqual([false, false]));
		unsubscribe();
		cleanup();
	});

	test('the store is up to date right after a change, as in v4', () => {
		const values: boolean[] = [];
		const unsubscribe = theme.subscribe((value) => values.push(value.dark));
		setMode('light');
		expect(values.at(-1)).toBe(false);
		toggleMode();
		expect(values.at(-1)).toBe(true);
		const count = values.length;
		setMode('dark');
		expect(values.length).toBe(count);
		unsubscribe();
	});

	test('toggleMode switches from what the page shows', () => {
		setMode('system');
		toggleMode();
		expect(getMode()).toBe(systemDark() ? 'light' : 'dark');
		toggleMode();
		expect(getMode()).toBe(systemDark() ? 'dark' : 'light');
	});

	test('changes made to <html> by the app reach the state', async () => {
		root.dataset.mode = 'dark';
		await vi.waitFor(() => expect(theme.mode).toBe('dark'));
		delete root.dataset.mode;
		await vi.waitFor(() => expect(theme.mode).toBe('system'));
	});

	test('rememberAppearance puts back the saved choice and saves the next ones, in the v4 key', () => {
		localStorage.setItem('theme', 'dark');
		localStorage.setItem('theme-name', 'classic');
		rememberAppearance();
		expect(theme.mode).toBe('dark');
		expect(theme.name).toBe('classic');
		setMode('light');
		expect(localStorage.getItem('theme')).toBe('light');
		setMode('system');
		expect(localStorage.getItem('theme')).toBeNull();
		setTheme(null);
		expect(localStorage.getItem('theme-name')).toBeNull();
	});

	test('appearanceScript applies the saved choice, with the same keys', () => {
		localStorage.setItem('my-mode', 'dark');
		localStorage.setItem('my-theme', 'classic');
		new Function(appearanceScript({ modeKey: 'my-mode', themeKey: 'my-theme' }))();
		expect(root.dataset.mode).toBe('dark');
		expect(root.dataset.theme).toBe('classic');
		localStorage.setItem('my-mode', 'nonsense');
		delete root.dataset.mode;
		new Function(appearanceScript({ modeKey: 'my-mode', themeKey: 'my-theme' }))();
		expect(root.dataset.mode).toBeUndefined();
	});
});
