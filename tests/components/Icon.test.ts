import { mdiCalendarOutline, mdiMagnify } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Icon from '#lib/components/simple/media/Icon.svelte';
import ClickableExample from '../../src/docs/examples/icon/02-clickable.svelte';

function host(style = '') {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

describe('Icon', () => {
	test('renders the path in a 24×24 svg with the class on the svg', async () => {
		const screen = await render(Icon, { path: mdiMagnify, class: 'app-class' });
		const svg = screen.container.querySelector('svg')!;
		expect(svg).toHaveClass('aurora-icon', 'app-class');
		expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
		expect(svg.querySelector('path')?.getAttribute('d')).toBe(mdiMagnify);
	});

	test('is decorative without title: hidden from screen readers and never focusable', async () => {
		const screen = await render(Icon, { path: mdiMagnify });
		const svg = screen.container.querySelector('svg')!;
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.hasAttribute('role')).toBe(false);
		expect(svg.getAttribute('focusable')).toBe('false');
		expect(svg.querySelector('title')).toBeNull();
		await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
	});

	test('title makes it an image with an accessible name', async () => {
		const screen = await render(Icon, { path: mdiMagnify, title: 'Search' });
		const img = screen.getByRole('img', { name: 'Search' });
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).not.toHaveAttribute('aria-hidden');
		expect(img.element().querySelector('title')?.textContent).toBe('Search');
	});

	test('follows the path and title when they change', async () => {
		const screen = await render(Icon, { path: mdiMagnify });
		await screen.rerender({ path: mdiCalendarOutline, title: 'Date' });
		const img = screen.getByRole('img', { name: 'Date' });
		await expect.element(img).toBeInTheDocument();
		expect(img.element().querySelector('path')?.getAttribute('d')).toBe(mdiCalendarOutline);
	});

	test('inherits size and color from the surrounding text', async () => {
		const target = host('font-size: 20px; color: rgb(1, 2, 3)');
		const screen = await render(Icon, { target, props: { path: mdiMagnify } });
		const svg = screen.container.querySelector('svg')!;
		const style = getComputedStyle(svg);
		expect(style.width).toBe('20px');
		expect(style.height).toBe('20px');
		expect(style.fill).toBe('rgb(1, 2, 3)');
		target.remove();
	});

	test('instance CSS variables override size and color', async () => {
		const target = host('font-size: 20px; --icon-size: 32px; --icon-color: rgb(4, 5, 6)');
		const screen = await render(Icon, { target, props: { path: mdiMagnify } });
		const style = getComputedStyle(screen.container.querySelector('svg')!);
		expect(style.width).toBe('32px');
		expect(style.height).toBe('32px');
		expect(style.fill).toBe('rgb(4, 5, 6)');
		target.remove();
	});

	test('v4 bug: the icon is only an image, never a button nor a tab stop', async () => {
		const screen = await render(Icon, { path: mdiMagnify, title: 'Search' });
		await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
		await expect.element(screen.getByRole('img')).not.toHaveAttribute('tabindex');
		await userEvent.keyboard('{Tab}');
		expect(screen.container.contains(document.activeElement)).toBe(false);
	});

	test('a clickable icon is a text Button named by aria-label (docs example)', async () => {
		const screen = await render(ClickableExample);
		const close = screen.getByRole('button', { name: 'Close' }).first();
		await expect.element(close).toBeEnabled();
		expect(close.element().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
		await userEvent.keyboard('{Tab}');
		await expect.element(close).toHaveFocus();
		await expect.element(screen.getByRole('button', { name: 'Close' }).last()).toBeDisabled();
	});
});
