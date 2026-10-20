import { mdiArrowRight, mdiBookOpenVariant } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LinkButton from '#lib/components/simple/buttons/LinkButton.svelte';
import { text } from '../helpers.js';

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const initialUrl = location.href;

describe('LinkButton', () => {
	afterEach(() => history.replaceState(null, '', initialUrl));

	test('renders a native link with its href, text and class', async () => {
		const screen = await render(LinkButton, {
			href: '/docs',
			children: text('Docs'),
			class: 'app-class'
		});
		const link = screen.getByRole('link', { name: 'Docs' });
		await expect.element(link).toHaveAttribute('href', '/docs');
		await expect.element(link).toHaveClass('aurora-link-button', 'app-class');
		await expect.element(link).not.toHaveAttribute('rel');
		await expect.element(link).not.toHaveAttribute('aria-disabled');
		await expect.element(link).not.toHaveAttribute('data-disabled');
	});

	test('v4 bug: forwards every native anchor attribute', async () => {
		const screen = await render(LinkButton, {
			props: {
				href: '/report.pdf',
				children: text('Report'),
				target: '_self',
				download: 'report.pdf',
				hreflang: 'en',
				id: 'report',
				title: 'Download the report',
				'aria-describedby': 'hint',
				'data-kind': 'file'
			}
		});
		const link = screen.getByRole('link', { name: 'Report' });
		await expect.element(link).toHaveAttribute('target', '_self');
		await expect.element(link).toHaveAttribute('download', 'report.pdf');
		await expect.element(link).toHaveAttribute('hreflang', 'en');
		await expect.element(link).toHaveAttribute('id', 'report');
		await expect.element(link).toHaveAttribute('title', 'Download the report');
		await expect.element(link).toHaveAttribute('aria-describedby', 'hint');
		await expect.element(link).toHaveAttribute('data-kind', 'file');
	});

	test('target="_blank" defaults rel to noopener noreferrer; an explicit rel wins', async () => {
		const blank = await render(LinkButton, {
			props: { href: 'https://example.com', target: '_blank', children: text('Out') }
		});
		await expect
			.element(blank.getByRole('link', { name: 'Out' }))
			.toHaveAttribute('rel', 'noopener noreferrer');

		const explicit = await render(LinkButton, {
			props: {
				href: 'https://example.com',
				target: '_blank',
				rel: 'external',
				children: text('External')
			}
		});
		await expect
			.element(explicit.getByRole('link', { name: 'External' }))
			.toHaveAttribute('rel', 'external');
	});

	test('onclick receives the native MouseEvent and the link navigates', async () => {
		const onclick = vi.fn();
		const screen = await render(LinkButton, {
			href: '#link-button-clicked',
			children: text('Go'),
			onclick
		});
		await screen.getByRole('link', { name: 'Go' }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(location.hash).toBe('#link-button-clicked');
	});

	test('v4 bug: keyboard callbacks are the native ones; Tab and Enter follow the link', async () => {
		const onkeydown = vi.fn();
		const screen = await render(LinkButton, {
			href: '#link-button-keyboard',
			children: text('Go'),
			onkeydown
		});
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('link', { name: 'Go' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onkeydown).toHaveBeenCalled();
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		await expect.poll(() => location.hash).toBe('#link-button-keyboard');
	});

	test('v4 bug: disabled removes the href, sets aria-disabled and really does not navigate', async () => {
		const screen = await render(LinkButton, {
			href: '#link-button-disabled',
			disabled: true,
			children: text('Go')
		});
		const link = screen.getByRole('link', { name: 'Go' });
		await expect.element(link).not.toHaveAttribute('href');
		await expect.element(link).toHaveAttribute('aria-disabled', 'true');
		await expect.element(link).toHaveAttribute('data-disabled', 'true');
		await link.click({ force: true });
		expect(location.href).toBe(initialUrl);
		await userEvent.keyboard('{Tab}');
		await expect.element(link).not.toHaveFocus();
	});

	test('disabled does not call onclick, as in v4', async () => {
		const onclick = vi.fn();
		const screen = await render(LinkButton, {
			href: '#link-button-disabled',
			disabled: true,
			children: text('Go'),
			onclick
		});
		await screen.getByRole('link', { name: 'Go' }).click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	test('prependIcon sits before the text, appendIcon after it in the sliding wrapper', async () => {
		const screen = await render(LinkButton, {
			href: '#',
			prependIcon: mdiBookOpenVariant,
			appendIcon: mdiArrowRight,
			children: text('Read')
		});
		const link = screen.getByRole('link', { name: 'Read' }).element();
		const paths = [...link.querySelectorAll('svg path')].map((path) => path.getAttribute('d'));
		expect(paths).toEqual([mdiBookOpenVariant, mdiArrowRight]);
		expect(link.firstElementChild?.tagName.toLowerCase()).toBe('svg');
		const append = link.querySelector('.aurora-link-button-append');
		expect(append?.querySelector('path')?.getAttribute('d')).toBe(mdiArrowRight);
		expect(link.lastElementChild).toBe(append);
	});

	test('prependSnippet and appendSnippet replace the icons and receive them', async () => {
		const screen = await render(LinkButton, {
			href: '#',
			prependIcon: 'M1 1',
			appendIcon: 'M2 2',
			children: text('Read'),
			prependSnippet: withArgs<{ prependIcon: string | undefined }>(
				({ prependIcon }) => `<i data-testid="prepend">${prependIcon}</i>`
			),
			appendSnippet: withArgs<{ appendIcon: string | undefined }>(
				({ appendIcon }) => `<i data-testid="append">${appendIcon}</i>`
			)
		});
		await expect.element(screen.getByTestId('prepend')).toHaveTextContent('M1 1');
		await expect.element(screen.getByTestId('append')).toHaveTextContent('M2 2');
		expect(screen.container.querySelector('svg')).toBeNull();
		const append = screen.getByTestId('append').element();
		expect(append.parentElement?.classList.contains('aurora-link-button-append')).toBe(true);
	});

	test('binds the native element', async () => {
		let element: HTMLAnchorElement | undefined;
		await render(LinkButton, {
			href: '#',
			children: text('Go'),
			get linkElement() {
				return element;
			},
			set linkElement(value) {
				element = value;
			}
		});
		expect(element).toBeInstanceOf(HTMLAnchorElement);
	});

	test('v4 bug: sits inline in text with centered icons', async () => {
		const screen = await render(LinkButton, {
			href: '#',
			appendIcon: mdiArrowRight,
			children: text('Inline')
		});
		const style = getComputedStyle(screen.getByRole('link', { name: 'Inline' }).element());
		expect(style.display).toBe('inline-flex');
		expect(style.alignItems).toBe('center');
	});

	test('instance CSS variables override the defaults', async () => {
		const screen = await render(LinkButton, {
			href: '#',
			children: text('Go'),
			style: '--link-button-color: rgb(1, 2, 3); --link-button-background: rgb(4, 5, 6)'
		});
		const style = getComputedStyle(screen.getByRole('link', { name: 'Go' }).element());
		expect(style.color).toBe('rgb(1, 2, 3)');
		expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
	});
});
