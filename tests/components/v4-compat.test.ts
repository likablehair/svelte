import { afterEach, describe, expect, test } from 'vitest';
import '#lib/css/tokens.css';
import '#lib/css/v4-compat.css';

const root = document.documentElement;
const probe = (color: string) => {
	const el = document.createElement('div');
	el.style.color = color;
	document.body.append(el);
	const value = getComputedStyle(el).color;
	el.remove();
	return value;
};

afterEach(() => {
	root.removeAttribute('data-mode');
	root.style.removeProperty('--global-color-light-primary-500');
	root.style.removeProperty('--global-color-dark-primary-500');
	root.style.removeProperty('--global-color-light-background-100');
});

describe('v4-compat.css', () => {
	test('v4 names work in rgb(var()) and follow the Aurora colors', () => {
		root.dataset.mode = 'light';
		expect(probe('rgb(var(--global-color-primary-500))')).toBe('rgb(31, 90, 240)');
		expect(probe('rgb(var(--global-color-primary-500), .4)')).toBe('rgba(31, 90, 240, 0.4)');
		expect(probe('var(--global-color-primary)')).toBe('rgb(31, 90, 240)');
	});

	test('dark mode switches the v4 names too', () => {
		root.dataset.mode = 'dark';
		expect(probe('rgb(var(--global-color-primary-500))')).toBe('rgb(77, 141, 255)');
		expect(probe('var(--global-color-primary)')).toBe('rgb(77, 141, 255)');
	});

	test('an app override of v4 changes the v4 name and the v5 brand color', () => {
		root.dataset.mode = 'light';
		root.style.setProperty('--global-color-light-primary-500', '200, 10, 20');
		root.style.setProperty('--global-color-light-background-100', '1, 2, 3');
		expect(probe('rgb(var(--global-color-primary-500))')).toBe('rgb(200, 10, 20)');
		expect(probe('var(--global-color-primary)')).toBe('rgb(200, 10, 20)');
		expect(probe('rgb(var(--global-color-background-100))')).toBe('rgb(1, 2, 3)');
	});

	test('another theme keeps its own brand colors', () => {
		root.dataset.mode = 'light';
		root.dataset.theme = 'classic';
		root.style.setProperty('--global-color-light-primary-500', '200, 10, 20');
		expect(probe('var(--global-color-primary)')).not.toBe('rgb(200, 10, 20)');
		root.removeAttribute('data-theme');
	});
});
