import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CircularLoader from '#lib/components/simple/loaders/CircularLoader.svelte';

type Content = { value: number | undefined; total: number; percent: number };

const percentage = createRawSnippet((content: () => Content) => ({
	render: () => `<span>${Math.round(content().percent)}%</span>`
}));

function part(root: Element, name: string) {
	return root.querySelector(`.aurora-circular-loader-${name}`) as HTMLElement;
}

describe('CircularLoader', () => {
	test('without value it is an indeterminate progressbar named "Loading"', async () => {
		const screen = await render(CircularLoader);
		const loader = screen.getByRole('progressbar', { name: 'Loading' });
		await expect.element(loader).toHaveAttribute('data-indeterminate');
		await expect.element(loader).not.toHaveAttribute('aria-valuenow');
		await expect.element(loader).not.toHaveAttribute('aria-valuemin');
		await expect.element(loader).not.toHaveAttribute('aria-valuemax');
		expect(getComputedStyle(part(loader.element(), 'arc')).animationName).toContain('spin');
	});

	test('with value it is a determinate ring with aria-value*', async () => {
		const screen = await render(CircularLoader, { value: 30, total: 60, label: 'Photos' });
		const loader = screen.getByRole('progressbar', { name: 'Photos' });
		await expect.element(loader).not.toHaveAttribute('data-indeterminate');
		await expect.element(loader).toHaveAttribute('aria-valuenow', '30');
		await expect.element(loader).toHaveAttribute('aria-valuemin', '0');
		await expect.element(loader).toHaveAttribute('aria-valuemax', '60');
		expect(loader.element().style.getPropertyValue('--aurora-circular-loader-percent')).toBe('50');
		expect(getComputedStyle(part(loader.element(), 'arc')).animationName).toBe('none');
	});

	test('the percentage is clamped and a total of 0 means full', async () => {
		const screen = await render(CircularLoader, { value: 150 });
		const loader = screen.getByRole('progressbar').element() as HTMLElement;
		expect(loader.style.getPropertyValue('--aurora-circular-loader-percent')).toBe('100');
		await screen.rerender({ value: -5 });
		expect(loader.style.getPropertyValue('--aurora-circular-loader-percent')).toBe('0');
		await screen.rerender({ value: 3, total: 0 });
		expect(loader.style.getPropertyValue('--aurora-circular-loader-percent')).toBe('100');
	});

	test('aria-valuenow stays within aria-valuemin and aria-valuemax', async () => {
		const screen = await render(CircularLoader, { value: 150, total: 100 });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
	});

	test('label="" makes it decorative', async () => {
		const screen = await render(CircularLoader, { label: '', value: 40 });
		const loader = screen.container.querySelector('.aurora-circular-loader')!;
		expect(loader.getAttribute('aria-hidden')).toBe('true');
		expect(loader.hasAttribute('role')).toBe(false);
		expect(loader.hasAttribute('aria-label')).toBe(false);
		expect(loader.hasAttribute('aria-valuenow')).toBe(false);
		await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
	});

	test('children receive value, total and percent and sit at the centre', async () => {
		const screen = await render(CircularLoader, {
			value: 18,
			total: 24,
			label: 'Uploaded',
			style: '--circular-loader-size: 80px',
			children: percentage
		});
		const loader = screen.getByRole('progressbar', { name: 'Uploaded' });
		await expect.element(loader).toHaveTextContent('75%');
		const outer = loader.element().getBoundingClientRect();
		const inner = part(loader.element(), 'content').getBoundingClientRect();
		expect(Math.abs(inner.x + inner.width / 2 - (outer.x + outer.width / 2))).toBeLessThan(1);
		expect(Math.abs(inner.y + inner.height / 2 - (outer.y + outer.height / 2))).toBeLessThan(1);
	});

	test('forwards native attributes and class to the root', async () => {
		const screen = await render(CircularLoader, {
			id: 'sync',
			title: 'Syncing',
			class: 'app-loader',
			'aria-describedby': 'hint'
		});
		const loader = screen.getByRole('progressbar');
		await expect.element(loader).toHaveAttribute('id', 'sync');
		await expect.element(loader).toHaveAttribute('title', 'Syncing');
		await expect.element(loader).toHaveAttribute('aria-describedby', 'hint');
		await expect.element(loader).toHaveClass('aurora-circular-loader', 'app-loader');
	});

	test('is 32px by default and --circular-loader-size sets both sides', async () => {
		const small = await render(CircularLoader, { label: 'Default' });
		const rect = small.getByRole('progressbar', { name: 'Default' }).element().getBoundingClientRect();
		expect([rect.width, rect.height]).toEqual([32, 32]);

		const big = await render(CircularLoader, {
			label: 'Big',
			style: '--circular-loader-size: 72px'
		});
		const bigRect = big.getByRole('progressbar', { name: 'Big' }).element().getBoundingClientRect();
		expect([bigRect.width, bigRect.height]).toEqual([72, 72]);
	});

	test('instance CSS variables color the arc, the track and the content', async () => {
		const screen = await render(CircularLoader, {
			value: 10,
			children: percentage,
			style:
				'--circular-loader-color: rgb(1, 2, 3); --circular-loader-track-color: rgb(4, 5, 6); --circular-loader-content-color: rgb(7, 8, 9)'
		});
		const loader = screen.getByRole('progressbar').element();
		expect(getComputedStyle(part(loader, 'arc')).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(part(loader, 'track')).backgroundColor).toBe('rgb(4, 5, 6)');
		expect(getComputedStyle(part(loader, 'content')).color).toBe('rgb(7, 8, 9)');
	});

	test('takes the theme gradient by default, and currentColor on request', async () => {
		const host = document.createElement('div');
		host.style.color = 'rgb(200, 0, 0)';
		document.body.append(host);
		const themed = await render(CircularLoader, { target: host, props: { label: 'Themed' } });
		const arc = part(themed.getByRole('progressbar', { name: 'Themed' }).element(), 'arc');
		expect(getComputedStyle(arc).backgroundImage).toContain('gradient');
		expect(getComputedStyle(arc).backgroundColor).not.toBe('rgb(200, 0, 0)');

		const inherited = await render(CircularLoader, {
			target: host,
			props: { label: 'Inherited', style: '--circular-loader-color: currentColor' }
		});
		const loader = inherited.getByRole('progressbar', { name: 'Inherited' }).element();
		expect(getComputedStyle(part(loader, 'arc')).backgroundColor).toBe('rgb(200, 0, 0)');
		host.remove();
	});

	test('v4 bug: --circular-loader-color colors the ring and leaves the size alone', async () => {
		const screen = await render(CircularLoader, {
			style: '--circular-loader-color: rgb(10, 20, 30); --circular-loader-size: 40px'
		});
		const loader = screen.getByRole('progressbar').element();
		expect(getComputedStyle(part(loader, 'arc')).backgroundColor).toBe('rgb(10, 20, 30)');
		expect(loader.getBoundingClientRect().width).toBe(40);
	});

	test('v4 bug: it has a role and an accessible name (v4 rendered a bare <svg>)', async () => {
		const screen = await render(CircularLoader);
		const loader = screen.getByRole('progressbar', { name: 'Loading' });
		await expect.element(loader).toBeInTheDocument();
		expect(loader.element().querySelector('svg')).toBeNull();
	});
});
