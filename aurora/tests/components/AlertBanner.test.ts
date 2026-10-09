import {
	mdiAlert,
	mdiCheckBold,
	mdiClose,
	mdiCloseOctagonOutline,
	mdiGiftOutline,
	mdiInformationVariant
} from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AlertBanner from '#lib/components/simple/notifiers/AlertBanner.svelte';
import { snippet, text } from '../helpers.js';

type Variant = 'info' | 'success' | 'warning' | 'error';

type CloseArgs = { close: (event: MouseEvent) => void; closeLabel: string };

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const iconPath = (root: Element) =>
	root.querySelector('.aurora-alert-banner-icon svg path')?.getAttribute('d');

describe('AlertBanner', () => {
	test('defaults to an info status with its icon, title and description', async () => {
		const screen = await render(AlertBanner, {
			title: 'New version',
			description: 'Reload to update.'
		});
		const banner = screen.getByRole('status');
		await expect.element(banner).toHaveAttribute('data-variant', 'info');
		await expect.element(banner).toHaveClass('aurora-alert-banner');
		await expect.element(banner.getByText('New version')).toHaveClass('aurora-alert-banner-title');
		await expect
			.element(banner.getByText('Reload to update.'))
			.toHaveClass('aurora-alert-banner-description');
		expect(iconPath(banner.element())).toBe(mdiInformationVariant);
		const box = banner.element().querySelector('.aurora-alert-banner-icon');
		expect(box?.getAttribute('aria-hidden')).toBe('true');
		expect(banner.element().querySelector('button')).toBeNull();
	});

	test.each<[Variant, string, string]>([
		['info', 'status', mdiInformationVariant],
		['success', 'status', mdiCheckBold],
		['warning', 'alert', mdiAlert],
		['error', 'alert', mdiCloseOctagonOutline]
	])('variant %s has role %s and its own default icon', async (variant, role, icon) => {
		const screen = await render(AlertBanner, { variant, title: variant });
		const banner = screen.getByRole(role as 'status' | 'alert');
		await expect.element(banner).toHaveAttribute('data-variant', variant);
		expect(iconPath(banner.element())).toBe(icon);
	});

	test('role can be overridden', async () => {
		const screen = await render(AlertBanner, { variant: 'error', role: 'note', title: 'Note' });
		await expect.element(screen.getByRole('note')).toHaveAttribute('data-variant', 'error');
		expect(screen.container.querySelector('[role="alert"]')).toBeNull();
	});

	test('icon replaces the default icon; icon="" removes the icon box', async () => {
		const custom = await render(AlertBanner, { icon: mdiGiftOutline, title: 'Offer' });
		expect(iconPath(custom.container)).toBe(mdiGiftOutline);

		const none = await render(AlertBanner, { icon: '', title: 'Plain' });
		expect(none.container.querySelector('.aurora-alert-banner-icon')).toBeNull();
	});

	test('iconSnippet replaces the icon and receives the variant', async () => {
		const screen = await render(AlertBanner, {
			variant: 'success',
			title: 'Done',
			iconSnippet: withArgs<{ variant: Variant }>(
				({ variant }) => `<i data-testid="icon">${variant}</i>`
			)
		});
		const icon = screen.getByTestId('icon');
		await expect.element(icon).toHaveTextContent('success');
		expect(icon.element().parentElement?.classList.contains('aurora-alert-banner-icon')).toBe(true);
		expect(screen.container.querySelector('svg')).toBeNull();
	});

	test('closable adds a labelled close button that calls onclose with the native event', async () => {
		const onclose = vi.fn();
		const screen = await render(AlertBanner, { title: 'Saved', closable: true, onclose });
		const close = screen.getByRole('button', { name: 'Dismiss' });
		await expect.element(close).toHaveAttribute('type', 'button');
		expect(close.element().querySelector('svg path')?.getAttribute('d')).toBe(mdiClose);
		await close.click();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	test('closeLabel names the close button, which is reachable with Tab and Enter', async () => {
		const onclose = vi.fn();
		const screen = await render(AlertBanner, {
			title: 'Saved',
			closable: true,
			closeLabel: 'Chiudi',
			onclose
		});
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Chiudi' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onclose).toHaveBeenCalledOnce();
	});

	test('closeSnippet replaces the close button even without closable', async () => {
		const onclose = vi.fn();
		const screen = await render(AlertBanner, {
			title: 'Saved',
			onclose,
			closeSnippet: createRawSnippet<[CloseArgs]>((args) => ({
				render: () => `<button type="button">${args().closeLabel} now</button>`,
				setup: (node) => {
					node.addEventListener('click', (event) => args().close(event as MouseEvent));
				}
			}))
		});
		await screen.getByRole('button', { name: 'Dismiss now' }).click();
		expect(onclose).toHaveBeenCalledOnce();
		expect(screen.container.querySelector('.aurora-alert-banner-close')).toBeNull();
	});

	test('children replace the title and the description', async () => {
		const screen = await render(AlertBanner, {
			title: 'Hidden title',
			description: 'Hidden description',
			children: snippet('<strong>Custom content</strong>')
		});
		const body = screen.container.querySelector('.aurora-alert-banner-body')!;
		expect(body.textContent?.trim()).toBe('Custom content');
		expect(screen.container.querySelector('.aurora-alert-banner-title')).toBeNull();
		expect(screen.container.querySelector('.aurora-alert-banner-description')).toBeNull();
	});

	test('titleSnippet and descriptionSnippet render even without title and description', async () => {
		const screen = await render(AlertBanner, {
			titleSnippet: withArgs<{ title: string | undefined }>(
				({ title }) => `<span>Title: ${title ?? 'none'}</span>`
			),
			descriptionSnippet: withArgs<{ description: string | undefined }>(
				({ description }) => `<span>Description: ${description ?? 'none'}</span>`
			)
		});
		await expect.element(screen.getByText('Title: none')).toBeInTheDocument();
		await expect.element(screen.getByText('Description: none')).toBeInTheDocument();
		const title = screen.getByText('Title: none').element().parentElement;
		expect(title?.classList.contains('aurora-alert-banner-title')).toBe(true);
	});

	test('appendSnippet sits on the right of the text, before the close button', async () => {
		const screen = await render(AlertBanner, {
			title: 'Low stock',
			closable: true,
			appendSnippet: snippet('<button type="button">Reorder</button>')
		});
		const action = screen.getByRole('button', { name: 'Reorder' }).element();
		const close = screen.getByRole('button', { name: 'Dismiss' }).element();
		const title = screen.getByText('Low stock').element();
		expect(action.parentElement?.classList.contains('aurora-alert-banner-append')).toBe(true);
		expect(action.getBoundingClientRect().left).toBeGreaterThan(
			title.getBoundingClientRect().left
		);
		expect(close.getBoundingClientRect().left).toBeGreaterThan(
			action.getBoundingClientRect().right
		);
	});

	test('forwards native attributes to the root and the class object to each part', async () => {
		const screen = await render(AlertBanner, {
			id: 'banner',
			'aria-label': 'Update',
			'data-kind': 'update',
			title: 'Title',
			description: 'Description',
			class: {
				container: 'app-container',
				icon: 'app-icon',
				body: 'app-body',
				title: 'app-title',
				description: 'app-description'
			}
		});
		const banner = screen.getByRole('status', { name: 'Update' }).element();
		expect(banner.id).toBe('banner');
		expect(banner.getAttribute('data-kind')).toBe('update');
		expect(banner.classList.contains('app-container')).toBe(true);
		for (const part of ['icon', 'body', 'title', 'description']) {
			expect(banner.querySelector(`.aurora-alert-banner-${part}`)?.classList).toContain(
				`app-${part}`
			);
		}
	});

	test('v4 bug: the banner is announced and is not a clickable, unreachable presentation div', async () => {
		const screen = await render(AlertBanner, { variant: 'warning', title: 'Careful' });
		const banner = screen.getByRole('alert');
		await expect.element(banner).not.toHaveAttribute('role', 'presentation');
		await expect.element(banner).not.toHaveAttribute('tabindex');
		expect(getComputedStyle(banner.element()).cursor).not.toBe('pointer');
	});

	test('the description keeps its line breaks', async () => {
		const screen = await render(AlertBanner, { description: 'First line\nSecond line' });
		const description = screen.container.querySelector('.aurora-alert-banner-description')!;
		expect(getComputedStyle(description).whiteSpace).toBe('pre-wrap');
		expect(description.getBoundingClientRect().height).toBeGreaterThan(
			parseFloat(getComputedStyle(description).lineHeight) * 1.5
		);
	});

	test('instance CSS variables set the colors, the padding and the border', async () => {
		const screen = await render(AlertBanner, {
			title: 'Custom',
			style: [
				'--alert-banner-background: rgb(1, 2, 3)',
				'--alert-banner-border-color: rgb(4, 5, 6)',
				'--alert-banner-border-width: 3px',
				'--alert-banner-padding: 7px 9px',
				'--alert-banner-icon-background: rgb(7, 8, 9)',
				'--alert-banner-icon-color: rgb(10, 11, 12)'
			].join(';')
		});
		const banner = screen.getByRole('status').element();
		const style = getComputedStyle(banner);
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.borderTopColor).toBe('rgb(4, 5, 6)');
		expect(style.borderTopWidth).toBe('3px');
		expect(style.paddingTop).toBe('7px');
		expect(style.paddingLeft).toBe('9px');
		const icon = getComputedStyle(banner.querySelector('.aurora-alert-banner-icon')!);
		expect(icon.backgroundColor).toBe('rgb(7, 8, 9)');
		expect(icon.color).toBe('rgb(10, 11, 12)');
	});
});
