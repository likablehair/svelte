import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FlagIcon from '#lib/components/simple/media/FlagIcon.svelte';

function host(style = '') {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

const flag = (container: HTMLElement) => container.querySelector('span')!;
const drawn = (span: HTMLElement) => decodeURIComponent(getComputedStyle(span).backgroundImage);
const wide = (code: string) =>
	new RegExp(`/4x3/${code}\\.svg|id='flag-icons-${code}' viewBox='0 0 640 480'`);
const squared = (code: string) =>
	new RegExp(`/1x1/${code}\\.svg|id='flag-icons-${code}' viewBox='0 0 512 512'`);

describe('FlagIcon', () => {
	test('renders the flag-icons classes for the lowercased code, plus the app class', async () => {
		const screen = await render(FlagIcon, { alpha2: 'IT', class: 'app-class' });
		const span = flag(screen.container);
		expect(span).toHaveClass('aurora-flag-icon', 'fi', 'fi-it', 'app-class');
		expect(span).not.toHaveClass('fis');
	});

	test('draws the 4:3 flag by default and the 1:1 one with square', async () => {
		const target = host('--flag-icon-size: 30px');
		const four = await render(FlagIcon, { target, props: { alpha2: 'it' } });
		const rect = flag(four.container).getBoundingClientRect();
		expect(rect.height).toBeCloseTo(30, 0);
		expect(rect.width).toBeCloseTo(40, 0);
		expect(drawn(flag(four.container))).toMatch(wide('it'));
		four.unmount();

		const square = await render(FlagIcon, { target, props: { alpha2: 'it', square: true } });
		const span = flag(square.container);
		expect(span).toHaveClass('fis');
		expect(span.getBoundingClientRect().width).toBeCloseTo(30, 0);
		expect(drawn(span)).toMatch(squared('it'));
		target.remove();
	});

	test('keeps the v4 aliases that the flag-icons package does not have', async () => {
		const aliases = {
			uk: 'gb',
			UK: 'gb',
			el: 'gr',
			xs: 'rs',
			xi: 'gb-nir',
			ac: 'sh-ac',
			ta: 'sh-ta'
		};
		for (const [alpha2, code] of Object.entries(aliases)) {
			const screen = await render(FlagIcon, { alpha2 });
			const span = flag(screen.container);
			expect(span).toHaveClass(`fi-${code}`);
			expect(drawn(span)).toMatch(wide(code));
			screen.unmount();
		}
	});

	test('is decorative without title', async () => {
		const screen = await render(FlagIcon, { alpha2: 'fr' });
		const span = flag(screen.container);
		expect(span.getAttribute('aria-hidden')).toBe('true');
		expect(span.hasAttribute('role')).toBe(false);
		expect(span.hasAttribute('aria-label')).toBe(false);
		expect(span.hasAttribute('title')).toBe(false);
	});

	test('title gives it the img role, an accessible name and a tooltip', async () => {
		const screen = await render(FlagIcon, { alpha2: 'fr', title: 'France' });
		const img = screen.getByRole('img', { name: 'France' });
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute('title', 'France');
		await expect.element(img).not.toHaveAttribute('aria-hidden');
	});

	test('follows the surrounding font size by default (1.2em)', async () => {
		const target = host('font-size: 20px');
		const screen = await render(FlagIcon, { target, props: { alpha2: 'de' } });
		expect(getComputedStyle(flag(screen.container)).fontSize).toBe('24px');
		target.remove();
	});

	test('instance CSS variables override size, radius and ring', async () => {
		const target = host(
			'--flag-icon-size: 18px; --flag-icon-border-radius: 50%; --flag-icon-box-shadow: none'
		);
		const screen = await render(FlagIcon, { target, props: { alpha2: 'es', square: true } });
		const style = getComputedStyle(flag(screen.container));
		expect(style.fontSize).toBe('18px');
		expect(style.borderTopLeftRadius).toBe('50%');
		expect(style.boxShadow).toBe('none');
		target.remove();
	});

	test('draws a 1px ring around the flag by default', async () => {
		const screen = await render(FlagIcon, { alpha2: 'jp' });
		expect(getComputedStyle(flag(screen.container)).boxShadow).toMatch(/0px 0px 0px 1px/);
	});
});
