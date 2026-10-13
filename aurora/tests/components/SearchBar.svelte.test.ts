import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SearchBar from '#lib/components/composed/search/SearchBar.svelte';
import { renderWithDefaultLocale, snippet } from '../helpers.js';

function bound<T>(initial: T) {
	let value = $state(initial);
	return {
		get value() {
			return value;
		},
		set value(next) {
			value = next;
		}
	};
}

function withValue<T extends object>(props: T, state: { value: string | undefined }) {
	Object.defineProperty(props, 'value', {
		enumerable: true,
		configurable: true,
		get: () => state.value,
		set: (next) => {
			state.value = next;
		}
	});
	return props as T & { value?: string };
}

function rootOf(container: HTMLElement) {
	return container.querySelector<HTMLElement>('.aurora-search-bar')!;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SearchBar', () => {
	test('is a search landmark with a search input, both named by label', async () => {
		const screen = await render(SearchBar, { label: 'Search clients', placeholder: 'Name or phone' });
		const landmark = screen.getByRole('search', { name: 'Search clients' });
		await expect.element(landmark).toHaveClass('aurora-search-bar');
		const input = screen.getByRole('searchbox', { name: 'Search clients' });
		await expect.element(input).toHaveAttribute('type', 'search');
		await expect.element(input).toHaveAttribute('placeholder', 'Name or phone');
		await expect.element(input).toHaveAttribute('autocomplete', 'off');
		await expect.element(input).toHaveAttribute('enterkeyhint', 'search');
		await expect.element(input).toHaveAttribute('spellcheck', 'false');
		expect(landmark.element().contains(input.element())).toBe(true);
	});

	test('without label it is named by aria-label, else by the placeholder', async () => {
		const labelled = await render(SearchBar, { 'aria-label': 'Find products', placeholder: 'Type…' });
		await expect.element(labelled.getByRole('search', { name: 'Find products' })).toBeVisible();
		await expect.element(labelled.getByRole('searchbox', { name: 'Find products' })).toBeVisible();
		await labelled.unmount();

		const placeholder = await render(SearchBar, { placeholder: 'Search services' });
		await expect.element(placeholder.getByRole('search', { name: 'Search services' })).toBeVisible();
		await expect.element(placeholder.getByRole('searchbox', { name: 'Search services' })).toBeVisible();
	});

	test('forwards native attributes and events to the input', async () => {
		const oninput = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		const onkeydown = vi.fn();
		const screen = await render(SearchBar, {
			label: 'Search',
			id: 'clients-search',
			name: 'q',
			maxlength: 5,
			required: true,
			autocomplete: 'on',
			'aria-describedby': 'hint',
			oninput,
			onfocus,
			onblur,
			onkeydown
		});
		const input = screen.getByRole('searchbox', { name: 'Search' });
		await expect.element(input).toHaveAttribute('id', 'clients-search');
		await expect.element(input).toHaveAttribute('name', 'q');
		await expect.element(input).toHaveAttribute('maxlength', '5');
		await expect.element(input).toHaveAttribute('autocomplete', 'on');
		await expect.element(input).toHaveAttribute('aria-describedby', 'hint');
		await expect.element(input).toBeRequired();
		await input.click();
		expect(onfocus).toHaveBeenCalledOnce();
		await userEvent.keyboard('abcdefg');
		await expect.element(input).toHaveValue('abcde');
		expect(oninput).toHaveBeenCalledTimes(5);
		expect(oninput.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		await userEvent.keyboard('{Tab}');
		expect(onblur).toHaveBeenCalledOnce();
	});

	test('name submits the text with the form', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(SearchBar, { target: form, props: { label: 'Search', name: 'q' } });
		await userEvent.fill(screen.getByRole('searchbox'), 'rossi');
		expect([...new FormData(form).entries()]).toEqual([['q', 'rossi']]);
		form.remove();
	});

	test('bind:value follows the typing and changes from outside', async () => {
		const value = bound<string | undefined>('Giulia');
		const screen = await render(SearchBar, withValue({ label: 'Search' }, value));
		const input = screen.getByRole('searchbox');
		await expect.element(input).toHaveValue('Giulia');
		await input.click();
		await userEvent.keyboard(' M');
		expect(value.value).toBe('Giulia M');
		value.value = 'Luca';
		await expect.element(input).toHaveValue('Luca');
		value.value = '';
		await expect.element(input).toHaveValue('');
	});

	test('binds the native input', async () => {
		let element: HTMLInputElement | undefined;
		const screen = await render(SearchBar, {
			label: 'Search',
			get input() {
				return element;
			},
			set input(next) {
				element = next;
			}
		});
		expect(element).toBe(screen.getByRole('searchbox').element());
	});

	describe('onsearch', () => {
		test('is called with the text 300 ms after the last keystroke, once', async () => {
			let lastInput = 0;
			let calledAt = 0;
			const onsearch = vi.fn(() => (calledAt = performance.now()));
			const screen = await render(SearchBar, { label: 'Search', onsearch });
			const searchbox = screen.getByRole('searchbox');
			searchbox.element().addEventListener('input', (event) => (lastInput = event.timeStamp));
			await searchbox.click();
			await userEvent.keyboard('ros');
			await expect.poll(() => onsearch.mock.calls.length, { timeout: 2000, interval: 20 }).toBe(1);
			expect(calledAt - lastInput).toBeGreaterThanOrEqual(290);
			expect(onsearch).toHaveBeenCalledWith('ros');
			await wait(400);
			expect(onsearch).toHaveBeenCalledOnce();
		});

		test('debounce changes the delay; 0 calls it at every change', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', debounce: 0, onsearch });
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('ab');
			expect(onsearch.mock.calls).toEqual([['a'], ['ab']]);
			await screen.unmount();

			const slow = vi.fn();
			const other = await render(SearchBar, { label: 'Search', debounce: 50, onsearch: slow });
			await other.getByRole('searchbox').click();
			await userEvent.keyboard('x');
			await expect.poll(() => slow.mock.calls).toEqual([['x']]);
		});

		test('is not repeated when the text comes back to the one already searched', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', debounce: 400, onsearch });
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('ab');
			await expect.poll(() => onsearch.mock.calls).toEqual([['ab']]);
			await userEvent.keyboard('c{Backspace}');
			await wait(700);
			expect(onsearch).toHaveBeenCalledOnce();
			await userEvent.keyboard('d');
			await expect.poll(() => onsearch.mock.calls).toEqual([['ab'], ['abd']]);
		});

		test('a text the bar started with counts as searched', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', value: 'ab', debounce: 400, onsearch });
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('c{Backspace}');
			await wait(700);
			expect(onsearch).not.toHaveBeenCalled();
			await screen.unmount();

			const empty = await render(SearchBar, { label: 'Search', debounce: 400, onsearch });
			await empty.getByRole('searchbox').click();
			await userEvent.keyboard('a{Backspace}');
			await wait(700);
			expect(onsearch).not.toHaveBeenCalled();
		});

		test('Enter and Escape while composing text (IME) do not search nor clear', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', value: 'かな', searchOnType: false, onsearch });
			const input = screen.getByRole('searchbox').element() as HTMLInputElement;
			for (const key of ['Enter', 'Escape']) {
				const event = new KeyboardEvent('keydown', { key, isComposing: true, bubbles: true, cancelable: true });
				input.dispatchEvent(event);
				expect(event.defaultPrevented).toBe(false);
			}
			expect(onsearch).not.toHaveBeenCalled();
			expect(input.value).toBe('かな');
		});

		test('Enter searches at once, without waiting nor repeating later, and does not submit the form', async () => {
			const form = document.createElement('form');
			const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
			form.addEventListener('submit', onsubmit);
			form.append(document.createElement('button'));
			document.body.append(form);
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { target: form, props: { label: 'Search', onsearch } });
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('rossi{Enter}');
			expect(onsearch.mock.calls).toEqual([['rossi']]);
			await wait(450);
			expect(onsearch).toHaveBeenCalledOnce();
			await userEvent.keyboard('{Enter}');
			expect(onsearch).toHaveBeenCalledTimes(2);
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('an onkeydown that prevents Enter stops the search', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, {
				label: 'Search',
				searchOnType: false,
				onsearch,
				onkeydown: (event: KeyboardEvent) => {
					if (event.key === 'Enter') event.preventDefault();
				}
			});
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('ab{Enter}');
			expect(onsearch).not.toHaveBeenCalled();
		});

		test('buttonLabel adds a search button', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', buttonLabel: 'Go', debounce: 5000, onsearch });
			const button = screen.getByRole('button', { name: 'Go' });
			await expect.element(button).toHaveAttribute('type', 'button');
			await userEvent.fill(screen.getByRole('searchbox'), 'color');
			await button.click();
			expect(onsearch.mock.calls).toEqual([['color']]);
			await screen.unmount();

			const without = await render(SearchBar, { label: 'Search' });
			await expect.element(without.getByRole('searchbox')).toBeVisible();
			expect(without.container.querySelector('.aurora-button')).toBeNull();
		});

		test('buttonSnippet replaces the button and gets search', async () => {
			const onsearch = vi.fn();
			const buttonSnippet = createRawSnippet<[{ search: () => void }]>((params) => ({
				render: () => '<button type="button">Find</button>',
				setup: (node) => node.addEventListener('click', () => params().search())
			}));
			const screen = await render(SearchBar, {
				label: 'Search',
				buttonLabel: 'Go',
				searchOnType: false,
				buttonSnippet,
				onsearch
			});
			await expect.element(screen.getByRole('button', { name: 'Go' })).not.toBeInTheDocument();
			await userEvent.fill(screen.getByRole('searchbox'), 'cut');
			await screen.getByRole('button', { name: 'Find' }).click();
			expect(onsearch.mock.calls).toEqual([['cut']]);
		});

		test('searchOnType={false} searches only on Enter, the button and the clear button', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, {
				label: 'Search',
				searchOnType: false,
				debounce: 20,
				buttonLabel: 'Search',
				onsearch
			});
			const input = screen.getByRole('searchbox');
			await input.click();
			await userEvent.keyboard('balayage');
			await wait(150);
			expect(onsearch).not.toHaveBeenCalled();
			await userEvent.keyboard('{Enter}');
			await screen.getByRole('button', { name: 'Search', exact: true }).click();
			await screen.getByRole('button', { name: 'Clear search' }).click();
			expect(onsearch.mock.calls).toEqual([['balayage'], ['balayage'], ['']]);
		});

		test('an unmounted bar does not search', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', debounce: 500, onsearch });
			await screen.getByRole('searchbox').click();
			await userEvent.keyboard('ab');
			await screen.unmount();
			await wait(700);
			expect(onsearch).not.toHaveBeenCalled();
		});
	});

	describe('clearing', () => {
		test('the clear button appears with text, empties the field, searches "" and keeps the focus', async () => {
			const onsearch = vi.fn();
			const value = bound<string | undefined>(undefined);
			const screen = await render(SearchBar, withValue({ label: 'Search', debounce: 5000, onsearch }, value));
			const input = screen.getByRole('searchbox');
			await expect.element(screen.getByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
			await input.click();
			await userEvent.keyboard('rossi');
			const clear = screen.getByRole('button', { name: 'Clear search' });
			await expect.element(clear).toHaveAttribute('type', 'button');
			await clear.click();
			await expect.element(input).toHaveValue('');
			expect(value.value).toBe('');
			expect(onsearch.mock.calls).toEqual([['']]);
			await expect.element(input).toHaveFocus();
			await expect.element(clear).not.toBeInTheDocument();
		});

		test('clearLabel names the button; clearable={false} removes it', async () => {
			const named = await render(SearchBar, { label: 'Cerca', value: 'abc', clearLabel: 'Svuota' });
			await expect.element(named.getByRole('button', { name: 'Svuota' })).toBeVisible();
			await named.unmount();

			const plain = await render(SearchBar, { label: 'Search', value: 'abc', clearable: false });
			await expect.element(plain.getByRole('searchbox')).toHaveValue('abc');
			expect(plain.container.querySelector('button')).toBeNull();
		});

		test('Escape empties the field and searches; with no text it does nothing and is not prevented', async () => {
			const onsearch = vi.fn();
			const screen = await render(SearchBar, { label: 'Search', debounce: 5000, onsearch });
			const prevented: boolean[] = [];
			const listener = (event: KeyboardEvent) => {
				if (event.key === 'Escape') prevented.push(event.defaultPrevented);
			};
			document.addEventListener('keydown', listener);
			const input = screen.getByRole('searchbox');
			await input.click();
			await userEvent.keyboard('rossi{Escape}');
			await expect.element(input).toHaveValue('');
			expect(onsearch.mock.calls).toEqual([['']]);
			await userEvent.keyboard('{Escape}');
			expect(onsearch).toHaveBeenCalledOnce();
			expect(prevented).toEqual([true, false]);
			document.removeEventListener('keydown', listener);
		});
	});

	test('loading shows a spinner instead of the clear button; data-filled and data-loading reflect the state', async () => {
		const screen = await render(SearchBar, { label: 'Search', value: 'abc', loading: true });
		const root = rootOf(screen.container);
		expect(root).toHaveAttribute('data-filled', '');
		expect(root).toHaveAttribute('data-loading', 'true');
		const spinner = root.querySelector('.aurora-search-bar-spinner');
		expect(spinner).toHaveAttribute('aria-hidden', 'true');
		await expect.element(screen.getByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
		await screen.rerender({ loading: false });
		await expect.element(screen.getByRole('button', { name: 'Clear search' })).toBeVisible();
		expect(root).not.toHaveAttribute('data-loading');
		expect(root.querySelector('.aurora-search-bar-spinner')).toBeNull();
		await screen.rerender({ value: '' });
		expect(root).not.toHaveAttribute('data-filled');
	});

	test('iconSnippet and inputSnippet replace the magnifier and the input', async () => {
		const screen = await render(SearchBar, {
			label: 'Search',
			iconSnippet: snippet('<i data-testid="icon"></i>'),
			inputSnippet: snippet('<input aria-label="App field" />')
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-search-bar-icon')).toBeNull();
		await expect.element(screen.getByRole('textbox', { name: 'App field' })).toBeVisible();
		expect(screen.container.querySelector('input[type="search"]')).toBeNull();
		await expect.element(screen.getByRole('search', { name: 'Search' })).toBeVisible();
	});

	test('class reaches each part', async () => {
		const screen = await render(SearchBar, {
			label: 'Search',
			class: { container: 'c', icon: 'i', input: 'n' }
		});
		const root = rootOf(screen.container);
		expect(root).toHaveClass('aurora-search-bar', 'c');
		expect(root.querySelector('.aurora-search-bar-icon')).toHaveClass('i');
		await expect.element(screen.getByRole('searchbox')).toHaveClass('n');
	});

	test('instance variables change the look', async () => {
		const host = document.createElement('div');
		host.style.setProperty('--search-bar-height', '48px');
		host.style.setProperty('--search-bar-max-width', '300px');
		document.body.append(host);
		const screen = await render(SearchBar, { target: host, props: { label: 'Search' } });
		const style = getComputedStyle(rootOf(screen.container));
		expect(style.height).toBe('48px');
		expect(style.maxWidth).toBe('300px');
		host.remove();
	});

	test('v4 bug: no fixed id, so two bars on a page have no duplicate ids and are named by their label', async () => {
		const first = await render(SearchBar, { label: 'Search clients' });
		const second = await render(SearchBar, { label: 'Search products' });
		await expect.element(page.getByRole('searchbox', { name: 'Search clients' })).toBeVisible();
		await expect.element(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
		for (const screen of [first, second]) {
			const input = screen.container.querySelector('input')!;
			expect(input.id).not.toBe('search-content');
			expect(input).not.toHaveAttribute('aria-labelledby');
		}
		expect(document.getElementById('search-content')).toBeNull();
		const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test('v4 bug: the input is type="search" and has a clear button', async () => {
		const screen = await render(SearchBar, { label: 'Search', value: 'x' });
		await expect.element(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
		await expect.element(screen.getByRole('button', { name: 'Clear search' })).toBeVisible();
	});
});

describe('SearchBar texts', () => {
	test('follow locale, and clearLabel wins', async () => {
		const italian = await render(SearchBar, { label: 'Cerca', value: 'taglio', locale: 'it' });
		await expect.element(italian.getByRole('button', { name: 'Cancella la ricerca' })).toBeVisible();
		await italian.unmount();
		const own = await render(SearchBar, { label: 'Cerca', value: 'taglio', locale: 'it', clearLabel: 'Svuota' });
		await expect.element(own.getByRole('button', { name: 'Svuota' })).toBeVisible();
	});

	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const props = { label: 'Cerca', value: 'taglio' };
		const inherited = await renderWithDefaultLocale('it', SearchBar, props);
		await expect.element(inherited.getByRole('button', { name: 'Cancella la ricerca' })).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', SearchBar, { ...props, locale: 'en' });
		await expect.element(own.getByRole('button', { name: 'Clear search' })).toBeVisible();
	});
});
