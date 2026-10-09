import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Skeleton from '#lib/components/simple/loaders/Skeleton.svelte';

function box(width: string, height?: string) {
	const host = document.createElement('div');
	host.style.width = width;
	if (height) host.style.height = height;
	document.body.append(host);
	return host;
}

function root(container: Element) {
	return container.querySelector('.aurora-skeleton') as HTMLElement;
}

describe('Skeleton', () => {
	test('is a rect hidden from screen readers, with native attributes and class', async () => {
		const screen = await render(Skeleton, { id: 'avatar', class: 'app-skeleton' });
		const skeleton = root(screen.container);
		expect(skeleton.tagName).toBe('DIV');
		expect(skeleton.getAttribute('aria-hidden')).toBe('true');
		expect(skeleton.dataset.shape).toBe('rect');
		expect(skeleton.id).toBe('avatar');
		expect(skeleton.classList.contains('app-skeleton')).toBe(true);
	});

	test('a rect fills its parent', async () => {
		const host = box('200px', '64px');
		const screen = await render(Skeleton, { target: host });
		const rect = root(screen.container).getBoundingClientRect();
		expect([rect.width, rect.height]).toEqual([200, 64]);
		host.remove();
	});

	test('--skeleton-width and --skeleton-height size a rect', async () => {
		const host = box('300px', '100px');
		const screen = await render(Skeleton, {
			target: host,
			props: { style: '--skeleton-width: 50%; --skeleton-height: 24px' }
		});
		const rect = root(screen.container).getBoundingClientRect();
		expect([rect.width, rect.height]).toEqual([150, 24]);
		host.remove();
	});

	test('--skeleton-height below 1em is not raised by the default min-height', async () => {
		const screen = await render(Skeleton, { style: '--skeleton-height: 10px' });
		expect(root(screen.container).getBoundingClientRect().height).toBe(10);
	});

	test('a circle is round and --skeleton-size wide (40px by default)', async () => {
		const screen = await render(Skeleton, { shape: 'circle' });
		const circle = root(screen.container);
		expect(circle.dataset.shape).toBe('circle');
		expect([circle.offsetWidth, circle.offsetHeight]).toEqual([40, 40]);
		expect(getComputedStyle(circle).borderRadius).toBe('50%');

		const big = await render(Skeleton, { shape: 'circle', style: '--skeleton-size: 64px' });
		expect([root(big.container).offsetWidth, root(big.container).offsetHeight]).toEqual([64, 64]);
	});

	test('text draws `lines` bars with a shorter last one', async () => {
		const host = box('400px');
		const screen = await render(Skeleton, { target: host, props: { shape: 'text', lines: 3 } });
		const lines = [...root(screen.container).querySelectorAll('.aurora-skeleton-line')];
		expect(lines).toHaveLength(3);
		const widths = lines.map((line) => line.getBoundingClientRect().width);
		expect(widths[0]).toBe(400);
		expect(widths[1]).toBe(400);
		expect(widths[2]).toBe(240);
		host.remove();
	});

	test('text with one line, or fewer than one, draws a single full bar', async () => {
		const host = box('300px');
		const one = await render(Skeleton, { target: host, props: { shape: 'text' } });
		const single = root(one.container).querySelectorAll('.aurora-skeleton-line');
		expect(single).toHaveLength(1);
		expect(single[0].getBoundingClientRect().width).toBe(300);
		const none = await render(Skeleton, { shape: 'text', lines: 0 });
		expect(root(none.container).querySelectorAll('.aurora-skeleton-line')).toHaveLength(1);
		host.remove();
	});

	test('only text has lines', async () => {
		const screen = await render(Skeleton, { shape: 'rect', lines: 3 });
		expect(root(screen.container).querySelectorAll('.aurora-skeleton-line')).toHaveLength(0);
	});

	test('instance CSS variables set colors, radius and shimmer', async () => {
		const screen = await render(Skeleton, {
			style:
				'--skeleton-background: rgb(1, 2, 3); --skeleton-highlight-color: rgb(4, 5, 6); --skeleton-border-radius: 9px; --skeleton-duration: 3s'
		});
		const style = getComputedStyle(root(screen.container));
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.backgroundImage).toContain('rgb(4, 5, 6)');
		expect(style.borderRadius).toBe('9px');
		expect(style.animationDuration).toBe('3s');
		expect(style.animationName).toContain('shimmer');
	});

	test('v4 bug: visible in a parent without height (v4 was 0px tall)', async () => {
		const host = box('200px');
		const screen = await render(Skeleton, { target: host });
		expect(root(screen.container).getBoundingClientRect().height).toBeGreaterThan(10);
		const other = box('200px');
		const collapsed = await render(Skeleton, {
			target: other,
			props: { style: '--skeleton-min-height: 0px' }
		});
		expect(root(collapsed.container).getBoundingClientRect().height).toBe(0);
		host.remove();
		other.remove();
	});

	test('v4 bug: no 0 10px 100px drop shadow around the placeholder', async () => {
		const screen = await render(Skeleton);
		expect(getComputedStyle(root(screen.container)).boxShadow).toBe('none');
	});
});
