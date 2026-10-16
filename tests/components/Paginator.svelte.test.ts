import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Paginator from '#lib/components/simple/navigation/Paginator.svelte';
import { renderWithDefaultLocale } from '../helpers.js';

function bound(initial?: number) {
	let page = $state(initial);
	return {
		get page() {
			return page;
		},
		set page(value) {
			page = value;
		}
	};
}

function labels(nav: Element) {
	return [...nav.querySelectorAll('.aurora-paginator-button, .aurora-paginator-ellipsis')].map(
		(node) => node.getAttribute('aria-label') ?? node.textContent?.trim()
	);
}

describe('Paginator', () => {
	test('renders a nav with the arrows, the page window and the current page', async () => {
		const screen = await render(Paginator, { page: 7, pageCount: 24 });
		const nav = screen.getByRole('navigation', { name: 'Pagination' });
		expect(labels(nav.element())).toEqual([
			'First page',
			'Previous page',
			'Page 1',
			'…',
			'Page 6',
			'Page 7',
			'Page 8',
			'…',
			'Page 24',
			'Next page',
			'Last page'
		]);
		const current = screen.getByRole('button', { name: 'Page 7' });
		await expect.element(current).toHaveAttribute('aria-current', 'page');
		await expect.element(current).toHaveAttribute('data-current', '');
		await expect.element(current).toHaveTextContent('7');
		await expect.element(screen.getByRole('button', { name: 'Page 6' })).not.toHaveAttribute('aria-current');
		for (const ellipsis of nav.element().querySelectorAll('.aurora-paginator-ellipsis'))
			expect(ellipsis.getAttribute('aria-hidden')).toBe('true');
	});

	test('forwards native attributes to the nav and the class parts to their elements', async () => {
		const screen = await render(Paginator, {
			page: 2,
			pageCount: 3,
			id: 'pages',
			title: 'Pages',
			'data-testid': 'paginator',
			class: { container: 'app-root', button: 'app-button', current: 'app-current' }
		});
		const root = screen.getByTestId('paginator').element();
		expect(root.tagName).toBe('NAV');
		expect(root.id).toBe('pages');
		expect(root.getAttribute('title')).toBe('Pages');
		expect(root.classList).toContain('aurora-paginator');
		expect(root.classList).toContain('app-root');
		expect(root.querySelectorAll('.app-button')).toHaveLength(7);
		expect(root.querySelector('.app-current')?.getAttribute('aria-label')).toBe('Page 2');
	});

	test('binds the root element', async () => {
		const props = $state({ pageCount: 3, paginatorElement: undefined as HTMLElement | undefined });
		await render(Paginator, props);
		expect(props.paginatorElement?.tagName).toBe('NAV');
	});

	test('a click on a page updates page and calls onchange with the page', async () => {
		const onchange = vi.fn();
		const state = bound(1);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 10,
			onchange
		});
		await screen.getByRole('button', { name: 'Page 3' }).click();
		expect(state.page).toBe(3);
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ page: 3 });
		await expect.element(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
	});

	test('a click on the current page does nothing', async () => {
		const onchange = vi.fn();
		const screen = await render(Paginator, { page: 4, pageCount: 10, onchange });
		await screen.getByRole('button', { name: 'Page 4' }).click();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('the arrows go to the first, previous, next and last page', async () => {
		const onchange = vi.fn();
		const state = bound(5);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 10,
			onchange
		});
		await screen.getByRole('button', { name: 'Next page' }).click();
		expect(state.page).toBe(6);
		await screen.getByRole('button', { name: 'Previous page' }).click();
		expect(state.page).toBe(5);
		await screen.getByRole('button', { name: 'Last page' }).click();
		expect(state.page).toBe(10);
		await screen.getByRole('button', { name: 'First page' }).click();
		expect(state.page).toBe(1);
		expect(onchange.mock.calls.map(([event]) => event.page)).toEqual([6, 5, 10, 1]);
	});

	test('v4 bug: first and previous are disabled on the first page, next and last on the last one', async () => {
		const onchange = vi.fn();
		const first = await render(Paginator, { page: 1, pageCount: 5, onchange });
		for (const name of ['First page', 'Previous page']) {
			const button = first.getByRole('button', { name });
			await expect.element(button).toHaveAttribute('aria-disabled', 'true');
			expect((button.element() as HTMLButtonElement).disabled).toBe(false);
			(button.element() as HTMLButtonElement).click();
		}
		await expect.element(first.getByRole('button', { name: 'Next page' })).not.toHaveAttribute('aria-disabled');
		first.unmount();

		const last = await render(Paginator, { page: 5, pageCount: 5, onchange });
		for (const name of ['Next page', 'Last page']) {
			const button = last.getByRole('button', { name });
			await expect.element(button).toHaveAttribute('aria-disabled', 'true');
			(button.element() as HTMLButtonElement).click();
		}
		await expect.element(last.getByRole('button', { name: 'First page' })).not.toHaveAttribute('aria-disabled');
		expect(onchange).not.toHaveBeenCalled();
	});

	test('the focus stays on an arrow that becomes disabled', async () => {
		const state = bound(3);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 4
		});
		const next = screen.getByRole('button', { name: 'Next page' });
		next.element().focus();
		await userEvent.keyboard('{Enter}');
		expect(state.page).toBe(4);
		await expect.element(next).toHaveAttribute('aria-disabled', 'true');
		expect(document.activeElement).toBe(next.element());
		await userEvent.keyboard('{Enter}');
		expect(state.page).toBe(4);
	});

	test('the focus stays on a page button when the window moves', async () => {
		const state = bound(6);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 24
		});
		const seven = screen.getByRole('button', { name: 'Page 7' });
		seven.element().focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(seven).toHaveAttribute('aria-current', 'page');
		expect(document.activeElement).toBe(seven.element());
		expect(screen.getByRole('button', { name: 'Page 8' }).element()).toBeTruthy();
	});

	test('v4 bug: a page past pageCount is not changed, nothing is marked and previous goes to the last page', async () => {
		const onchange = vi.fn();
		const state = bound(9);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 4,
			onchange
		});
		expect(state.page).toBe(9);
		expect(onchange).not.toHaveBeenCalled();
		expect(screen.container.querySelector('[aria-current]')).toBeNull();
		await expect.element(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
		await expect.element(screen.getByRole('button', { name: 'Last page' })).not.toHaveAttribute('aria-disabled');
		await screen.getByRole('button', { name: 'Previous page' }).click();
		expect(state.page).toBe(4);
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ page: 4 });
	});

	test('an empty page counts as 1, and a pageCount below 1 as one page', async () => {
		const screen = await render(Paginator, { pageCount: 0 });
		await expect.element(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
		for (const name of ['First page', 'Previous page', 'Next page', 'Last page'])
			await expect.element(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true');
	});

	test('without pageCount shows the neighbours, keeps next enabled and has no last button', async () => {
		const state = bound(3);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			}
		});
		const nav = screen.getByRole('navigation').element();
		expect(labels(nav)).toEqual(['First page', 'Previous page', 'Page 2', 'Page 3', 'Page 4', 'Next page']);
		await screen.getByRole('button', { name: 'Next page' }).click();
		await screen.getByRole('button', { name: 'Next page' }).click();
		expect(state.page).toBe(5);
		await expect.element(screen.getByRole('button', { name: 'Next page' })).not.toHaveAttribute('aria-disabled');
	});

	test('siblingCount and showFirstLast change the window', async () => {
		const screen = await render(Paginator, { page: 10, pageCount: 40, siblingCount: 0, showFirstLast: false });
		expect(labels(screen.getByRole('navigation').element())).toEqual([
			'Previous page',
			'Page 1',
			'…',
			'Page 10',
			'…',
			'Page 40',
			'Next page'
		]);
	});

	test('pageHref renders links, a plain click updates page and calls onchange', async () => {
		const onchange = vi.fn();
		const state = bound(1);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 5,
			pageHref: (page: number) => `#results-${page}`,
			onchange
		});
		const two = screen.getByRole('link', { name: 'Page 2' });
		await expect.element(two).toHaveAttribute('href', '#results-2');
		await expect.element(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
		await expect.element(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '#results-2');
		await expect.element(screen.getByRole('link', { name: 'Last page' })).toHaveAttribute('href', '#results-5');
		const first = screen.getByRole('link', { name: 'First page' });
		await expect.element(first).not.toHaveAttribute('href');
		await expect.element(first).toHaveAttribute('aria-disabled', 'true');
		await two.click();
		expect(state.page).toBe(2);
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ page: 2 });
		expect(location.hash).toBe('#results-2');
		history.replaceState(null, '', location.pathname + location.search);
	});

	test('pageHref leaves a click with a modifier key to the browser', async () => {
		const onchange = vi.fn();
		const state = bound(1);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 5,
			pageHref: (page: number) => `#results-${page}`,
			onchange
		});
		const link = screen.getByRole('link', { name: 'Page 3' }).element();
		link.addEventListener('click', (event) => event.preventDefault());
		link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
		expect(state.page).toBe(1);
		expect(onchange).not.toHaveBeenCalled();
	});

	test('compact shows the page and the count between the arrows, with a live text for screen readers', async () => {
		const state = bound(3);
		const screen = await render(Paginator, {
			get page() {
				return state.page;
			},
			set page(value) {
				state.page = value;
			},
			pageCount: 12,
			compact: true
		});
		const nav = screen.getByRole('navigation').element();
		expect(nav.hasAttribute('data-compact')).toBe(true);
		expect(nav.querySelectorAll('.aurora-paginator-page')).toHaveLength(0);
		const status = nav.querySelector('.aurora-paginator-status')!;
		expect(status.getAttribute('aria-live')).toBe('polite');
		expect(status.querySelector('[aria-hidden="true"]')?.textContent).toBe('3 / 12');
		expect(status.querySelector('.aurora-paginator-status-text')?.textContent).toBe('Page 3 of 12');
		await screen.getByRole('button', { name: 'Next page' }).click();
		await expect.element(screen.getByText('Page 4 of 12')).toBeInTheDocument();
	});

	test('compact without pageCount shows only the page', async () => {
		const screen = await render(Paginator, { page: 3, compact: true });
		const status = screen.getByRole('navigation').element().querySelector('.aurora-paginator-status')!;
		expect(status.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
		expect(status.querySelector('.aurora-paginator-status-text')?.textContent).toBe('Page 3');
	});

	test('pageSnippet replaces the number of every page', async () => {
		const pageSnippet = createRawSnippet((args: () => { page: number; current: boolean }) => ({
			render: () => `<b>${args().current ? '[' + args().page + ']' : args().page}</b>`
		}));
		const screen = await render(Paginator, { page: 2, pageCount: 3, pageSnippet });
		await expect.element(screen.getByRole('button', { name: 'Page 2' })).toHaveTextContent('[2]');
		await expect.element(screen.getByRole('button', { name: 'Page 3' })).toHaveTextContent('3');
	});

	test('the icons can be replaced', async () => {
		const screen = await render(Paginator, { page: 2, pageCount: 3, nextIcon: 'M0,0H24V24H0Z' });
		const next = screen.getByRole('button', { name: 'Next page' }).element();
		expect(next.querySelector('svg path')?.getAttribute('d')).toBe('M0,0H24V24H0Z');
	});

	test('the texts follow locale, and the label props win', async () => {
		const italian = await render(Paginator, { page: 2, pageCount: 5, locale: 'it', nextLabel: 'Avanti' });
		await expect.element(italian.getByRole('navigation', { name: 'Paginazione' })).toBeInTheDocument();
		await expect.element(italian.getByRole('button', { name: 'Prima pagina' })).toBeInTheDocument();
		await expect.element(italian.getByRole('button', { name: 'Pagina precedente' })).toBeInTheDocument();
		await expect.element(italian.getByRole('button', { name: 'Pagina 3' })).toBeInTheDocument();
		await expect.element(italian.getByRole('button', { name: 'Avanti' })).toBeInTheDocument();
		await expect.element(italian.getByRole('button', { name: 'Ultima pagina' })).toBeInTheDocument();
		italian.unmount();

		const own = await render(Paginator, {
			page: 2,
			pageCount: 5,
			compact: true,
			'aria-label': 'Results',
			statusLabel: '{page}/{count}',
			firstLabel: 'Start',
			lastLabel: 'End',
			previousLabel: 'Back'
		});
		await expect.element(own.getByRole('navigation', { name: 'Results' })).toBeInTheDocument();
		await expect.element(own.getByRole('button', { name: 'Start' })).toBeInTheDocument();
		await expect.element(own.getByRole('button', { name: 'Back' })).toBeInTheDocument();
		await expect.element(own.getByRole('button', { name: 'End' })).toBeInTheDocument();
		await expect.element(own.getByText('2/5')).toBeInTheDocument();
		own.unmount();

		const pages = await render(Paginator, { page: 1, pageCount: 2, pageLabel: 'Go to {page}' });
		await expect.element(pages.getByRole('button', { name: 'Go to 2' })).toBeInTheDocument();
	});

	test('aria-labelledby replaces the default name', async () => {
		const screen = await render(Paginator, { pageCount: 2, 'aria-labelledby': 'heading' });
		expect(screen.getByRole('navigation').element().hasAttribute('aria-label')).toBe(false);
	});

	test('the texts follow setDefaultLocale, and the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', Paginator, { pageCount: 3 });
		await expect.element(inherited.getByRole('navigation', { name: 'Paginazione' })).toBeInTheDocument();
		inherited.unmount();
		const own = await renderWithDefaultLocale('it', Paginator, { pageCount: 3, locale: 'en' });
		await expect.element(own.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
	});

	test('instance CSS variables style the buttons and the current page', async () => {
		const screen = await render(Paginator, {
			page: 2,
			pageCount: 3,
			style:
				'--paginator-button-size: 40px; --paginator-button-color: rgb(1, 2, 3); --paginator-current-background: rgb(4, 5, 6); --paginator-current-color: rgb(7, 8, 9)'
		});
		const other = getComputedStyle(screen.getByRole('button', { name: 'Page 1' }).element());
		expect(other.height).toBe('40px');
		expect(other.color).toBe('rgb(1, 2, 3)');
		const current = getComputedStyle(screen.getByRole('button', { name: 'Page 2' }).element());
		expect(current.backgroundColor).toBe('rgb(4, 5, 6)');
		expect(current.color).toBe('rgb(7, 8, 9)');
	});

	test('the default look uses mono digits and fills the current page', async () => {
		const screen = await render(Paginator, { page: 2, pageCount: 3 });
		const current = getComputedStyle(screen.getByRole('button', { name: 'Page 2' }).element());
		expect(current.backgroundImage).toContain('gradient');
		expect(current.fontFamily).toContain('mono');
		const other = getComputedStyle(screen.getByRole('button', { name: 'Page 1' }).element());
		expect(other.backgroundImage).toBe('none');
	});
});
