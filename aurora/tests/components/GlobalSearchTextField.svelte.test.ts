import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import GlobalSearchTextField, {
	type GlobalSearchItem
} from '#lib/components/composed/search/GlobalSearchTextField.svelte';
import { renderWithDefaultLocale } from '../helpers.js';

const everything: GlobalSearchItem[] = [
	{ value: 1, label: 'Giulia Marini', description: 'Milano', group: 'Clients', href: '#giulia' },
	{ value: 2, label: 'Giuseppe Verdi', group: 'Clients' },
	{ value: 3, label: 'Agenda · Giugno', group: 'Pages', href: '#june' },
	{ value: 4, label: 'Settings' }
];

function searcherOf(items = everything) {
	return vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) =>
		items.filter((item) => item.label.toLowerCase().includes(searchText.toLowerCase()))
	);
}

async function openAndType(text: string) {
	await page.getByRole('button', { name: /Search/ }).click();
	const box = page.getByRole('combobox', { name: 'Search' });
	await expect.element(box).toHaveFocus();
	await userEvent.type(box, text);
	return box;
}

beforeEach(async () => {
	document.documentElement.style.setProperty('--dialog-duration', '0s');
	await page.viewport(1280, 800);
});

afterEach(() => {
	document.documentElement.style.removeProperty('--dialog-duration');
});

describe('GlobalSearchTextField', () => {
	test('the button looks like a field with the shortcut and opens a search dialog', async () => {
		const screen = await render(GlobalSearchTextField, { searcher: searcherOf(), id: 'search', class: { container: 'mine' } });
		const button = screen.getByRole('button', { name: /Search/ });
		await expect.element(button).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(button).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
		await expect.poll(() => button.element().querySelector('kbd')?.textContent).toMatch(/^(Ctrl K|⌘K)$/);
		const root = screen.container.querySelector('.aurora-global-search')!;
		expect(root.id).toBe('search');
		expect(root.classList.contains('mine')).toBe(true);
		await button.click();
		await expect.element(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
		await expect.element(page.getByRole('combobox', { name: 'Search' })).toHaveFocus();
	});

	test('Ctrl+K opens and closes the dialog, but not from another text field', async () => {
		const input = document.createElement('input');
		document.body.append(input);
		await render(GlobalSearchTextField, { searcher: searcherOf() });
		await userEvent.keyboard('{Control>}k{/Control}');
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Control>}k{/Control}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		input.focus();
		await userEvent.keyboard('{Control>}k{/Control}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		input.remove();
	});

	test('v4 bug: the shortcut prevents the browser default; shortcut={false} turns it off', async () => {
		const screen = await render(GlobalSearchTextField, { searcher: searcherOf() });
		const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		screen.unmount();
		await render(GlobalSearchTextField, { searcher: searcherOf(), shortcut: false });
		const ignored = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
		window.dispatchEvent(ignored);
		expect(ignored.defaultPrevented).toBe(false);
	});

	test('searches after the debounce, once, with the last text, and aborts the older search', async () => {
		const signals: AbortSignal[] = [];
		const searcher = vi.fn(async ({ searchText, signal }: { searchText: string; signal: AbortSignal }) => {
			signals.push(signal);
			await new Promise((resolve) => setTimeout(resolve, searchText === 'gi' ? 200 : 0));
			return everything.filter((item) => item.label.toLowerCase().includes(searchText));
		});
		await render(GlobalSearchTextField, { searcher, debounceTimeout: 50 });
		const box = await openAndType('gi');
		await expect.poll(() => searcher.mock.calls.length).toBe(1);
		await userEvent.type(box, 'u');
		await expect.poll(() => searcher.mock.calls.length).toBe(2);
		expect(searcher.mock.calls.map(([params]) => params.searchText)).toEqual(['gi', 'giu']);
		expect(signals[0].aborted).toBe(true);
		await expect.element(page.getByRole('option', { name: /Giulia Marini/ })).toBeVisible();
	});

	test('results are grouped, highlighted, and the first one is active', async () => {
		await render(GlobalSearchTextField, { searcher: searcherOf(), debounceTimeout: 0 });
		const box = await openAndType('giu');
		await expect.element(page.getByRole('group', { name: 'Clients' })).toBeVisible();
		await expect.element(page.getByRole('group', { name: 'Pages' })).toBeVisible();
		const first = page.getByRole('option', { name: /Giulia Marini/ });
		await expect.element(first).toHaveAttribute('aria-selected', 'true');
		await expect.element(box).toHaveAttribute('aria-activedescendant', first.element().id);
		expect(first.element().querySelector('mark')?.textContent).toBe('Giu');
		await expect.element(first).toHaveAttribute('href', '#giulia');
		await expect.element(page.getByRole('option', { name: /Giuseppe/ })).not.toHaveAttribute('href');
	});

	test('v4 bug: choosing a result calls onselect with the result and closes the dialog', async () => {
		const onselect = vi.fn();
		const onclose = vi.fn();
		await render(GlobalSearchTextField, { searcher: searcherOf(), debounceTimeout: 0, onselect, onclose });
		await openAndType('giu');
		await expect.element(page.getByRole('option', { name: /Giulia/ })).toBeVisible();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(page.getByRole('option', { name: /Giuseppe/ })).toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('{Enter}');
		expect(onselect).toHaveBeenCalledTimes(1);
		expect(onselect.mock.calls[0][0].item).toBe(everything[1]);
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	test('Enter on a result with href follows the link', async () => {
		const onselect = vi.fn();
		await render(GlobalSearchTextField, { searcher: searcherOf(), debounceTimeout: 0, onselect });
		await openAndType('giulia');
		await expect.element(page.getByRole('option', { name: /Giulia/ })).toBeVisible();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => location.hash).toBe('#giulia');
		expect(onselect).toHaveBeenCalledTimes(1);
		history.replaceState(null, '', location.pathname + location.search);
	});

	test('the arrows wrap around and a click chooses a result', async () => {
		const onselect = vi.fn();
		await render(GlobalSearchTextField, { searcher: searcherOf(), debounceTimeout: 0, onselect });
		await openAndType('giu');
		await expect.element(page.getByRole('option', { name: /Giulia/ })).toBeVisible();
		await userEvent.keyboard('{ArrowUp}');
		await expect.element(page.getByRole('option', { name: /Agenda/ })).toHaveAttribute('aria-selected', 'true');
		await page.getByRole('option', { name: /Giuseppe/ }).click();
		expect(onselect.mock.calls[0][0].item.value).toBe(2);
	});

	test('nothing found, and a failed search with onerror', async () => {
		const onerror = vi.fn();
		const screen = await render(GlobalSearchTextField, { searcher: searcherOf(), debounceTimeout: 0 });
		await openAndType('zzz');
		await expect.element(page.getByText('No results for “zzz”')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		screen.unmount();
		await render(GlobalSearchTextField, {
			searcher: () => Promise.reject(new Error('down')),
			debounceTimeout: 0,
			onerror,
			errorText: 'Search is down'
		});
		await openAndType('x');
		await expect.element(page.getByText('Search is down')).toHaveAttribute('role', 'alert');
		expect(onerror).toHaveBeenCalledTimes(1);
	});

	test('below searchThreshold nothing is searched; closing clears the text', async () => {
		const searcher = searcherOf();
		await render(GlobalSearchTextField, { searcher, debounceTimeout: 0, searchThreshold: 3 });
		const box = await openAndType('gi');
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(searcher).not.toHaveBeenCalled();
		await userEvent.keyboard('{Escape}');
		await page.getByRole('button', { name: /Search/ }).click();
		await expect.element(box).toHaveValue('');
	});

	test('bind:open drives the dialog', async () => {
		const state = $state({ open: true });
		await render(GlobalSearchTextField, {
			searcher: searcherOf(),
			get open() {
				return state.open;
			},
			set open(value) {
				state.open = value ?? false;
			}
		});
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => state.open).toBe(false);
	});

	test('on screens up to 768px the button is only the magnifier and the dialog fills the screen with Cancel', async () => {
		await page.viewport(390, 760);
		await render(GlobalSearchTextField, { searcher: searcherOf() });
		const button = page.getByRole('button', { name: 'Search' });
		await expect.element(button).toBeVisible();
		expect(button.element().textContent?.trim()).toBe('');
		await button.click();
		await expect.element(page.getByRole('dialog')).toHaveAttribute('data-fullscreen', 'true');
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('texts follow locale and the default locale; text props win', async () => {
		const screen = await render(GlobalSearchTextField, { searcher: searcherOf(), locale: 'it', label: 'Trova' });
		await screen.getByRole('button', { name: /Trova/ }).click();
		await expect.element(page.getByRole('combobox', { name: 'Trova' })).toHaveAttribute('placeholder', 'Cerca…');
		await expect.element(page.getByText('naviga')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		screen.unmount();
		const inherited = await renderWithDefaultLocale('it', GlobalSearchTextField, { searcher: searcherOf() });
		await expect.element(inherited.getByRole('button', { name: /Cerca/ })).toBeVisible();
	});

	test('instance CSS variables restyle the button', async () => {
		const screen = await render(GlobalSearchTextField, {
			searcher: searcherOf(),
			style: '--global-search-text-field-max-width: 300px; --global-search-text-field-border-radius: 2px; --global-search-text-field-background: rgb(1, 2, 3)'
		});
		const button = screen.getByRole('button', { name: /Search/ }).element();
		expect(getComputedStyle(button.parentElement!).maxWidth).toBe('300px');
		expect(getComputedStyle(button).borderTopLeftRadius).toBe('2px');
		expect(getComputedStyle(button).backgroundColor).toBe('rgb(1, 2, 3)');
	});
});
