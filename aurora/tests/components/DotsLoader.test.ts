import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DotsLoader from '#lib/components/simple/loaders/DotsLoader.svelte';

function resolve(property: string, value: string) {
	const probe = document.createElement('div');
	probe.style.setProperty(property, value);
	document.body.append(probe);
	const result = getComputedStyle(probe).getPropertyValue(property);
	probe.remove();
	return result;
}

function dots(root: Element) {
	return [...root.querySelectorAll('.aurora-dots-loader-dot')].map((dot) => getComputedStyle(dot));
}

describe('DotsLoader', () => {
	test('is a progressbar named "Loading" with three dots and no value', async () => {
		const screen = await render(DotsLoader);
		const loader = screen.getByRole('progressbar', { name: 'Loading' });
		await expect.element(loader).not.toHaveAttribute('aria-valuenow');
		expect(dots(loader.element())).toHaveLength(3);
	});

	test('label names it', async () => {
		const screen = await render(DotsLoader, { label: 'Giulia is typing' });
		await expect.element(screen.getByRole('progressbar', { name: 'Giulia is typing' })).toBeVisible();
	});

	test('label="" makes it decorative', async () => {
		const screen = await render(DotsLoader, { label: '' });
		const loader = screen.container.querySelector('.aurora-dots-loader')!;
		expect(loader.getAttribute('aria-hidden')).toBe('true');
		expect(loader.hasAttribute('role')).toBe(false);
		expect(loader.hasAttribute('aria-label')).toBe(false);
		await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
	});

	test('forwards native attributes and class to the root', async () => {
		const screen = await render(DotsLoader, { id: 'typing', title: 'Typing', class: 'app-dots' });
		const loader = screen.getByRole('progressbar');
		await expect.element(loader).toHaveAttribute('id', 'typing');
		await expect.element(loader).toHaveAttribute('title', 'Typing');
		await expect.element(loader).toHaveClass('aurora-dots-loader', 'app-dots');
	});

	test('the dots take colors 1, 3 and 2 of the data palette', async () => {
		const screen = await render(DotsLoader);
		const colors = dots(screen.getByRole('progressbar').element()).map((dot) => dot.backgroundColor);
		expect(colors).toEqual(
			[1, 3, 2].map((index) => resolve('background-color', `var(--global-color-data-${index})`))
		);
	});

	test('--dots-loader-color sets every dot, --dots-loader-color-N one of them', async () => {
		const screen = await render(DotsLoader, {
			style: '--dots-loader-color: rgb(1, 2, 3); --dots-loader-color-2: rgb(4, 5, 6)'
		});
		const colors = dots(screen.getByRole('progressbar').element()).map((dot) => dot.backgroundColor);
		expect(colors).toEqual(['rgb(1, 2, 3)', 'rgb(4, 5, 6)', 'rgb(1, 2, 3)']);
	});

	test('size and gap come from CSS variables', async () => {
		const screen = await render(DotsLoader, {
			style: '--dots-loader-size: 12px; --dots-loader-gap: 10px'
		});
		const loader = screen.getByRole('progressbar').element();
		const rects = [...loader.querySelectorAll('.aurora-dots-loader-dot')].map((dot) =>
			dot.getBoundingClientRect()
		);
		expect(rects.map((rect) => [rect.width, rect.height])).toEqual([
			[12, 12],
			[12, 12],
			[12, 12]
		]);
		expect(rects[1].left - rects[0].right).toBe(10);
		expect(loader.getBoundingClientRect().width).toBe(56);
	});

	test('the dots light up in turn', async () => {
		const screen = await render(DotsLoader, { style: '--dots-loader-duration: 800ms' });
		const styles = dots(screen.getByRole('progressbar').element());
		expect(styles.map((dot) => dot.animationName.includes('blink'))).toEqual([true, true, true]);
		expect(styles.map((dot) => parseFloat(dot.animationDelay))).toEqual([0, 0.1, 0.2]);
		expect(styles.map((dot) => dot.animationDuration)).toEqual(['0.8s', '0.8s', '0.8s']);
	});
});
