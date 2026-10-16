import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Divider from '#lib/components/simple/common/Divider.svelte';
import { text } from '../helpers.js';

function style(element: Element) {
	return getComputedStyle(element);
}

describe('Divider', () => {
	test('renders a native hr, a separator for assistive technology', async () => {
		const screen = await render(Divider, {});
		const separator = screen.getByRole('separator');
		await expect.element(separator).toBeInTheDocument();
		expect(separator.element().tagName).toBe('HR');
		await expect.element(separator).toHaveClass('aurora-divider');
		await expect.element(separator).not.toHaveAttribute('aria-orientation');
	});

	test('forwards native attributes and class to the root', async () => {
		const screen = await render(Divider, { id: 'split', title: 'Section end', class: 'app-class' });
		const separator = screen.getByRole('separator');
		await expect.element(separator).toHaveAttribute('id', 'split');
		await expect.element(separator).toHaveAttribute('title', 'Section end');
		await expect.element(separator).toHaveClass('aurora-divider', 'app-class');
	});

	test('exposes variant and orientation as data attributes', async () => {
		const screen = await render(Divider, { variant: 'gradient', orientation: 'vertical' });
		const separator = screen.getByRole('separator');
		await expect.element(separator).toHaveAttribute('data-variant', 'gradient');
		await expect.element(separator).toHaveAttribute('data-orientation', 'vertical');
		await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
	});

	test('defaults to a solid horizontal line, 1px tall, with 10px above and below and none on the sides', async () => {
		const screen = await render(Divider, {});
		const separator = screen.getByRole('separator').element();
		expect(separator.getAttribute('data-variant')).toBe('solid');
		expect(separator.getAttribute('data-orientation')).toBe('horizontal');
		const computed = style(separator);
		expect(computed.height).toBe('1px');
		expect(computed.marginTop).toBe('10px');
		expect(computed.marginBottom).toBe('10px');
		expect(computed.marginLeft).toBe('0px');
		expect(computed.marginRight).toBe('0px');
		expect(computed.borderTopStyle).toBe('none');
	});

	test('a vertical divider is as tall as its flex row, with the spacing on the sides', async () => {
		const row = document.createElement('div');
		row.style.cssText = 'display: flex; align-items: center; height: 40px';
		document.body.append(row);
		const screen = await render(Divider, { target: row, props: { orientation: 'vertical' } });
		const separator = screen.getByRole('separator').element();
		const computed = style(separator);
		expect(computed.width).toBe('1px');
		expect(computed.height).toBe('40px');
		expect(computed.marginLeft).toBe('10px');
		expect(computed.marginRight).toBe('10px');
		expect(computed.marginTop).toBe('0px');
		row.remove();
	});

	test('with label it is a div whose text is read', async () => {
		const screen = await render(Divider, { label: 'or' });
		await expect.element(screen.getByText('or')).toBeInTheDocument();
		expect(screen.container.querySelector('hr')).toBeNull();
		expect(screen.container.querySelector('[role="separator"]')).toBeNull();
		const root = screen.container.querySelector('.aurora-divider')!;
		expect(root.tagName).toBe('DIV');
		expect(style(root).display).toBe('flex');
		expect(getComputedStyle(root, '::before').content).toBe('""');
		expect(getComputedStyle(root, '::after').content).toBe('""');
	});

	test('children replace the label', async () => {
		const screen = await render(Divider, { label: 'or', children: text('Already a client?') });
		await expect.element(screen.getByText('Already a client?')).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('or');
	});

	test('the gradient variant paints the theme gradient faded at both ends', async () => {
		const screen = await render(Divider, { variant: 'gradient' });
		const computed = style(screen.getByRole('separator').element());
		expect(computed.backgroundImage).toContain('linear-gradient');
		expect(computed.maskImage).toContain('linear-gradient');
	});

	test('instance CSS variables style the line', async () => {
		const screen = await render(Divider, {
			style:
				'--divider-color: rgb(1, 2, 3); --divider-weight: 3px; --divider-spacing: 24px; --divider-margin-top: 4px'
		});
		const computed = style(screen.getByRole('separator').element());
		expect(computed.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(computed.height).toBe('3px');
		expect(computed.marginTop).toBe('4px');
		expect(computed.marginBottom).toBe('24px');
	});

	test('label CSS variables style the text', async () => {
		const screen = await render(Divider, {
			label: 'or',
			style: '--divider-label-color: rgb(9, 8, 7); --divider-label-text-transform: none'
		});
		const root = screen.container.querySelector('.aurora-divider')!;
		expect(style(root).color).toBe('rgb(9, 8, 7)');
		expect(style(root).textTransform).toBe('none');
	});

	test('bind:dividerElement exposes the root', async () => {
		let element: HTMLElement | undefined;
		await render(Divider, {
			get dividerElement() {
				return element;
			},
			set dividerElement(value) {
				element = value;
			}
		});
		expect(element?.tagName).toBe('HR');
	});
});
