import { mdiArrowLeft, mdiClose } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PageHeader from '#lib/components/simple/common/PageHeader.svelte';
import WithConfirmButtons from '../fixtures/page-header/WithConfirmButtons.svelte';
import { renderWithDefaultLocale, snippet } from '../helpers.js';

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const root = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('.aurora-page-header')!;

afterEach(() => {
	vi.restoreAllMocks();
	if (location.hash) history.replaceState(null, '', location.pathname + location.search);
});

describe('PageHeader', () => {
	test('renders a header with the title as h1, subtitle and description', async () => {
		const screen = await render(PageHeader, {
			title: 'Bookings',
			subtitle: 'Every appointment',
			description: 'Past and upcoming'
		});
		const element = root(screen.container);
		expect(element.tagName).toBe('HEADER');
		expect(element.getAttribute('data-size')).toBe('md');
		await expect.element(screen.getByRole('heading', { level: 1, name: 'Bookings' })).toBeVisible();
		await expect
			.element(screen.getByText('Every appointment'))
			.toHaveClass('aurora-page-header-subtitle');
		await expect
			.element(screen.getByText('Past and upcoming'))
			.toHaveClass('aurora-page-header-description');
		expect(element.querySelector('.aurora-page-header-back')).toBeNull();
	});

	test('headingLevel changes the heading element', async () => {
		const screen = await render(PageHeader, { title: 'Invoices', headingLevel: 2 });
		await expect.element(screen.getByRole('heading', { level: 2, name: 'Invoices' })).toBeVisible();
		expect(screen.container.querySelector('h1')).toBeNull();
	});

	test('without title, subtitle or description no heading and no text block are rendered', async () => {
		const screen = await render(PageHeader, { title: '', backHref: '#list' });
		const element = root(screen.container);
		expect(element.querySelector('h1')).toBeNull();
		expect(element.querySelector('.aurora-page-header-main')).toBeNull();
		await expect.element(screen.getByRole('link', { name: 'Back' })).toBeVisible();
	});

	test('empty subtitle and description render nothing', async () => {
		const screen = await render(PageHeader, { title: 'Clients', subtitle: '', description: '' });
		const element = root(screen.container);
		expect(element.querySelector('.aurora-page-header-subtitle')).toBeNull();
		expect(element.querySelector('.aurora-page-header-description')).toBeNull();
	});

	test('backHref renders a native link with the arrow icon', async () => {
		const screen = await render(PageHeader, { title: 'Client', backHref: '#clients' });
		const link = screen.getByRole('link', { name: 'Back' });
		await expect.element(link).toHaveAttribute('href', '#clients');
		expect(link.element().querySelector('svg path')?.getAttribute('d')).toBe(mdiArrowLeft);
		await link.click();
		expect(location.hash).toBe('#clients');
	});

	test('onback runs before the link and preventDefault stops it', async () => {
		const onback = vi.fn((event: MouseEvent) => event.preventDefault());
		const screen = await render(PageHeader, { title: 'Client', backHref: '#elsewhere', onback });
		await screen.getByRole('link', { name: 'Back' }).click();
		expect(onback).toHaveBeenCalledOnce();
		expect(onback.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(location.hash).toBe('');
	});

	test('back without backHref is a button that goes back in the history', async () => {
		const historyBack = vi.spyOn(history, 'back').mockImplementation(() => {});
		const onback = vi.fn();
		const screen = await render(PageHeader, { title: 'New client', back: true, onback });
		const button = screen.getByRole('button', { name: 'Back' });
		await expect.element(button).toHaveAttribute('type', 'button');
		await button.click();
		expect(onback).toHaveBeenCalledOnce();
		expect(historyBack).toHaveBeenCalledOnce();
	});

	test('onback with preventDefault keeps the page', async () => {
		const historyBack = vi.spyOn(history, 'back').mockImplementation(() => {});
		const screen = await render(PageHeader, {
			title: 'New client',
			back: true,
			onback: (event: MouseEvent) => event.preventDefault()
		});
		await screen.getByRole('button', { name: 'Back' }).click();
		expect(historyBack).not.toHaveBeenCalled();
	});

	test('the back control is reachable with the keyboard and shows the focus ring', async () => {
		const historyBack = vi.spyOn(history, 'back').mockImplementation(() => {});
		const screen = await render(PageHeader, { title: 'Client', back: true });
		await userEvent.keyboard('{Tab}');
		const button = screen.getByRole('button', { name: 'Back' });
		await expect.element(button).toHaveFocus();
		expect(getComputedStyle(button.element()).outlineStyle).toBe('solid');
		await userEvent.keyboard('{Enter}');
		expect(historyBack).toHaveBeenCalledOnce();
	});

	test('backLabel and backIcon change the back control', async () => {
		const screen = await render(PageHeader, {
			title: 'Billing',
			backHref: '#settings',
			backLabel: 'Settings',
			backIcon: mdiClose
		});
		const link = screen.getByRole('link', { name: 'Settings' });
		expect(link.element().querySelector('svg path')?.getAttribute('d')).toBe(mdiClose);
	});

	test('the back label follows locale, and backLabel wins', async () => {
		const it = await render(PageHeader, { title: 'Cliente', back: true, locale: 'it' });
		await expect.element(it.getByRole('button', { name: 'Indietro' })).toBeVisible();
		await it.unmount();
		const own = await render(PageHeader, { title: 'Cliente', back: true, locale: 'it', backLabel: 'Clienti' });
		await expect.element(own.getByRole('button', { name: 'Clienti' })).toBeVisible();
	});

	test('the back label follows setDefaultLocale, and the locale prop wins', async () => {
		const inherited = await renderWithDefaultLocale('it', PageHeader, { title: 'Cliente', back: true });
		await expect.element(inherited.getByRole('button', { name: 'Indietro' })).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', PageHeader, {
			title: 'Client',
			back: true,
			locale: 'en'
		});
		await expect.element(own.getByRole('button', { name: 'Back' })).toBeVisible();
	});

	test('actions sit on the right of the title and wrap under it when narrow', async () => {
		const wide = await render(PageHeader, {
			title: 'Bookings',
			style: 'width: 800px',
			actionsSnippet: snippet('<button type="button">New booking</button>')
		});
		const action = wide.getByRole('button', { name: 'New booking' }).element();
		const title = wide.getByRole('heading').element();
		expect(action.parentElement?.classList.contains('aurora-page-header-actions')).toBe(true);
		expect(action.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().right);
		await wide.unmount();

		const narrow = await render(PageHeader, {
			title: 'Bookings',
			subtitle: 'Every appointment of the salon',
			style: 'width: 300px',
			actionsSnippet: snippet('<button type="button">New booking</button>')
		});
		const wrapped = narrow.getByRole('button', { name: 'New booking' }).element();
		const subtitle = narrow.getByText('Every appointment of the salon').element();
		expect(wrapped.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			subtitle.getBoundingClientRect().bottom
		);
	});

	test('ConfirmOrCancelButtons in the actions stay in a row', async () => {
		const screen = await render(WithConfirmButtons, {});
		const save = screen.getByRole('button', { name: 'Save' }).element().getBoundingClientRect();
		const cancel = screen.getByRole('button', { name: 'Cancel' }).element().getBoundingClientRect();
		expect(Math.abs(save.top - cancel.top)).toBeLessThan(2);
		expect(save.left).toBeGreaterThan(cancel.right);
	});

	test('snippets replace their parts', async () => {
		const screen = await render(PageHeader, {
			title: 'Sales',
			subtitle: 'Weekly',
			description: 'All shops',
			backHref: '#dashboards',
			titleSnippet: withArgs<{ title: string | undefined }>(({ title }) => `<em>${title} board</em>`),
			subtitleSnippet: withArgs<{ subtitle: string | undefined }>(({ subtitle }) => `<b>${subtitle}!</b>`),
			descriptionSnippet: withArgs<{ description: string | undefined }>(
				({ description }) => `<i>${description}.</i>`
			),
			backSnippet: withArgs<{ backLabel: string; backIcon: string }>(
				({ backLabel }) => `<span>${backLabel} to dashboards</span>`
			),
			prependSnippet: snippet('<span data-testid="avatar">AV</span>')
		});
		await expect.element(screen.getByRole('heading', { level: 1, name: 'Sales board' })).toBeVisible();
		await expect.element(screen.getByText('Weekly!')).toBeVisible();
		await expect.element(screen.getByText('All shops.')).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Back to dashboards' })).toBeVisible();
		const avatar = screen.getByTestId('avatar').element();
		expect(avatar.parentElement?.classList.contains('aurora-page-header-prepend')).toBe(true);
		expect(avatar.getBoundingClientRect().right).toBeLessThanOrEqual(
			screen.getByRole('heading').element().getBoundingClientRect().left
		);
	});

	test('titleSnippet alone renders the heading', async () => {
		const screen = await render(PageHeader, {
			titleSnippet: snippet('<input aria-label="Dashboard name" value="Sales" />')
		});
		const input = screen.getByRole('textbox', { name: 'Dashboard name' }).element();
		expect(input.closest('h1')).not.toBeNull();
	});

	test('class takes one entry per part; native attributes reach the header', async () => {
		const screen = await render(PageHeader, {
			id: 'top',
			'aria-label': 'Page',
			title: 'Clients',
			subtitle: 'All',
			description: 'Active and archived',
			backHref: '#home',
			actionsSnippet: snippet('<button type="button">Add</button>'),
			class: {
				container: 'c-root',
				back: 'c-back',
				title: 'c-title',
				subtitle: 'c-subtitle',
				description: 'c-description',
				actions: 'c-actions'
			}
		});
		const element = root(screen.container);
		expect(element.id).toBe('top');
		expect(element.getAttribute('aria-label')).toBe('Page');
		expect(element.classList.contains('c-root')).toBe(true);
		for (const [part, name] of [
			['back', 'c-back'],
			['title', 'c-title'],
			['subtitle', 'c-subtitle'],
			['description', 'c-description'],
			['actions', 'c-actions']
		]) {
			expect(element.querySelector(`.aurora-page-header-${part}`)?.classList.contains(name)).toBe(true);
		}
	});

	test('size sm makes the text smaller', async () => {
		const md = await render(PageHeader, { title: 'Page', subtitle: 'Sub' });
		const mdTitle = parseFloat(getComputedStyle(md.getByRole('heading').element()).fontSize);
		await md.unmount();
		const sm = await render(PageHeader, { title: 'Section', subtitle: 'Sub', size: 'sm' });
		expect(root(sm.container).getAttribute('data-size')).toBe('sm');
		const smTitle = parseFloat(getComputedStyle(sm.getByRole('heading').element()).fontSize);
		expect(smTitle).toBeLessThan(mdTitle);
	});

	test('CSS variables style one instance', async () => {
		const screen = await render(PageHeader, {
			title: 'Clients',
			back: true,
			style:
				'--page-header-title-color: rgb(200, 0, 0); --page-header-title-font-size: 40px; --page-header-back-color: rgb(0, 120, 0)'
		});
		const title = getComputedStyle(screen.getByRole('heading').element());
		expect(title.color).toBe('rgb(200, 0, 0)');
		expect(title.fontSize).toBe('40px');
		expect(getComputedStyle(screen.getByRole('button', { name: 'Back' }).element()).color).toBe(
			'rgb(0, 120, 0)'
		);
	});
});
