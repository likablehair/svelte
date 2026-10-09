import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AsyncAutocomplete from '#lib/components/composed/forms/AsyncAutocomplete.svelte';
import type { Item } from '#lib/components/simple/forms/item.js';

const CLIENTS = ['Giulia Marini', 'Marco Rossi', 'Martina Galli', 'Sara Bianchi', 'Marta Romano'];

type Params = { searchText: string; signal: AbortSignal };

const find = (text: string): Item[] =>
	CLIENTS.filter((name) => name.toLowerCase().includes(text.toLowerCase())).map((name) => ({
		value: name,
		label: name
	}));

const instant = () => vi.fn(async ({ searchText }: Params) => find(searchText));

function deferred() {
	const calls: (Params & { resolve: (items: Item[]) => void })[] = [];
	const searcher = vi.fn(
		({ searchText, signal }: Params) =>
			new Promise<Item[]>((resolve, reject) => {
				calls.push({ searchText, signal, resolve });
				signal.addEventListener('abort', () => reject(signal.reason));
			})
	);
	return { searcher, calls };
}

const MAR = ['Giulia Marini', 'Marco Rossi', 'Martina Galli', 'Marta Romano'];

const optionLabels = () =>
	[...document.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim());

describe('AsyncAutocomplete', () => {
	test('searcher gets the trimmed text and an AbortSignal; its items fill the list', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0
		});
		await screen.getByRole('combobox', { name: 'Client' }).click();
		await userEvent.keyboard(' mar ');
		await expect.poll(optionLabels).toEqual(MAR);
		const params = searcher.mock.lastCall![0];
		expect(params.searchText).toBe('mar');
		expect(params.signal).toBeInstanceOf(AbortSignal);
		expect(params.signal.aborted).toBe(false);
	});

	test('v4 bug: a newer search aborts the older one, whose late answer is ignored', async () => {
		const { searcher, calls } = deferred();
		const onerror = vi.fn();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			onerror
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('ma');
		await expect.poll(() => calls.length).toBe(1);
		await userEvent.keyboard('r');
		await expect.poll(() => calls.length).toBe(2);
		expect(calls.map((call) => call.searchText)).toEqual(['ma', 'mar']);
		expect(calls[0].signal.aborted).toBe(true);
		expect(calls[1].signal.aborted).toBe(false);

		calls[1].resolve(find('marco'));
		await expect.poll(optionLabels).toEqual(['Marco Rossi']);
		calls[0].resolve([{ value: 'old', label: 'Old result' }]);
		await new Promise((resolve) => setTimeout(resolve));
		expect(optionLabels()).toEqual(['Marco Rossi']);
		expect(onerror).not.toHaveBeenCalled();
	});

	test('while searching, the field shows a spinner and the list skeleton rows', async () => {
		const { searcher, calls } = deferred();
		const onchange = vi.fn();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			onchange
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('mar');
		const root = screen.container.querySelector('.aurora-autocomplete')!;
		await expect.poll(() => root.hasAttribute('data-loading')).toBe(true);
		expect(root.querySelector('.aurora-autocomplete-spinner')).not.toBeNull();
		await expect.element(screen.getByRole('status')).toHaveTextContent('Loading…');
		expect(document.querySelectorAll('.aurora-async-autocomplete-skeleton-row')).toHaveLength(3);
		await userEvent.keyboard('{ArrowDown}{Enter}');
		expect(onchange).not.toHaveBeenCalled();

		await expect.poll(() => calls.length).toBeGreaterThan(0);
		calls.at(-1)!.resolve(find('mar'));
		await expect.poll(optionLabels).toEqual(MAR);
		expect(root).not.toHaveAttribute('data-loading');
	});

	test('waits debounceTimeout after the last keystroke, and is searching meanwhile', async () => {
		const searcher = instant();
		let searching: boolean | undefined;
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 400,
			get searching() {
				return searching;
			},
			set searching(value) {
				searching = value;
			}
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('marco');
		expect(searcher).not.toHaveBeenCalled();
		expect(searching).toBe(true);
		await expect.poll(() => searcher.mock.calls.length).toBe(1);
		expect(searcher.mock.calls[0][0].searchText).toBe('marco');
		await expect.poll(() => searching).toBe(false);
	});

	test('v4 bug: searching is real and bindable', async () => {
		const { searcher, calls } = deferred();
		const values: (boolean | undefined)[] = [];
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			get searching() {
				return values.at(-1);
			},
			set searching(value) {
				values.push(value);
			}
		});
		await screen.getByRole('combobox').click();
		await userEvent.fill(screen.getByRole('combobox'), 'mar');
		await expect.poll(() => calls.length).toBe(1);
		expect(values.at(-1)).toBe(true);
		calls[0].resolve(find('mar'));
		await expect.poll(() => values.at(-1)).toBe(false);
	});

	test('below searchThreshold it asks for more characters and does not search', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, { label: 'Client', searcher });
		await screen.getByRole('combobox').click();
		await expect
			.element(screen.getByRole('status'))
			.toHaveTextContent('Type at least 2 characters');
		await userEvent.keyboard('m');
		await expect
			.element(screen.getByRole('status'))
			.toHaveTextContent('Type at least 2 characters');
		expect(searcher).not.toHaveBeenCalled();
		await screen.unmount();

		const custom = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			searchThreshold: 3,
			thresholdText: 'Keep typing'
		});
		await custom.getByRole('combobox').click();
		await expect.element(custom.getByRole('status')).toHaveTextContent('Keep typing');
	});

	test('below the threshold, items are suggestions filtered locally', async () => {
		const searcher = instant();
		const recent: Item[] = ['Haircut', 'Color', 'Beard trim'].map((name) => ({
			value: name,
			label: name
		}));
		const screen = await render(AsyncAutocomplete, { label: 'Service', searcher, items: recent });
		await screen.getByRole('combobox').click();
		await expect.poll(optionLabels).toEqual(['Haircut', 'Color', 'Beard trim']);
		await userEvent.keyboard('c');
		await expect.poll(optionLabels).toEqual(['Haircut', 'Color']);
		await expect
			.element(screen.getByRole('option', { name: 'Haircut' }))
			.toHaveAttribute('data-highlighted');
		expect(searcher).not.toHaveBeenCalled();
	});

	test('v4 bug: old results are not shown once the text is below the threshold', async () => {
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher: instant(),
			debounceTimeout: 0
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('mar');
		await expect.poll(optionLabels).toEqual(MAR);
		await userEvent.keyboard('{Backspace}{Backspace}');
		await expect
			.element(screen.getByRole('status'))
			.toHaveTextContent('Type at least 2 characters');
		expect(optionLabels()).toEqual([]);
	});

	test('v4 bug: a failed search shows an error row and calls onerror', async () => {
		const error = new Error('Service unavailable');
		const searcher = vi.fn(async () => {
			throw error;
		});
		const onerror = vi.fn();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			onerror
		});
		await screen.getByRole('combobox').click();
		await userEvent.fill(screen.getByRole('combobox'), 'mar');
		await expect.element(screen.getByRole('status')).toHaveTextContent("Couldn't load results");
		expect(onerror).toHaveBeenCalledExactlyOnceWith(error);
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
	});

	test('errorSnippet gets the error and a search function that retries', async () => {
		let fail = true;
		const searcher = vi.fn(async ({ searchText }: Params) => {
			if (fail) throw new Error('Service unavailable');
			return find(searchText);
		});
		const errorSnippet = createRawSnippet<[{ error: unknown; search: () => void }]>((params) => ({
			render: () => `<button type="button">Retry: ${(params().error as Error).message}</button>`,
			setup: (button) => button.addEventListener('click', () => params().search())
		}));
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			errorSnippet
		});
		await screen.getByRole('combobox').click();
		await userEvent.fill(screen.getByRole('combobox'), 'mar');
		const retry = screen.getByRole('button', { name: 'Retry: Service unavailable' });
		await expect.element(retry).toBeVisible();
		fail = false;
		await retry.click();
		await expect.poll(optionLabels).toEqual(MAR);
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
	});

	test('v4 bug: search() searches the current text again, ignoring the threshold', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, { label: 'Client', searcher });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('g');
		expect(searcher).not.toHaveBeenCalled();
		screen.component.search();
		await expect.poll(() => searcher.mock.calls.length).toBe(1);
		expect(searcher.mock.calls[0][0].searchText).toBe('g');
		await expect.poll(optionLabels).toEqual(['Giulia Marini', 'Martina Galli']);
	});

	test('searchThreshold={0} loads on open; reopening with the same text reuses results', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			searchThreshold: 0
		});
		const input = screen.getByRole('combobox');
		await input.click();
		await expect.poll(() => searcher.mock.calls.length).toBe(1);
		expect(searcher.mock.calls[0][0].searchText).toBe('');
		await expect.poll(optionLabels).toEqual(CLIENTS);

		await userEvent.keyboard('{Escape}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(optionLabels).toEqual(CLIENTS);
		expect(searcher).toHaveBeenCalledOnce();

		screen.component.search();
		await expect.poll(() => searcher.mock.calls.length).toBe(2);
	});

	test('searches only while the list is open, and at once when it opens', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			searchText: 'sara'
		});
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(searcher).not.toHaveBeenCalled();
		await screen.getByRole('combobox').click();
		await expect.poll(() => searcher.mock.calls.length, { timeout: 300 }).toBe(1);
		await expect.poll(optionLabels).toEqual(['Sara Bianchi']);
	});

	test('v4 bug: closeOnSelect defaults to true with single selection', async () => {
		const onchange = vi.fn();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher: instant(),
			debounceTimeout: 0,
			onchange
		});
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('rossi');
		await screen.getByRole('option', { name: 'Marco Rossi' }).click();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			select: { value: 'Marco Rossi', label: 'Marco Rossi' },
			unselect: undefined,
			selection: [{ value: 'Marco Rossi', label: 'Marco Rossi' }]
		});
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect
			.element(screen.getByRole('button', { name: 'Remove Marco Rossi' }))
			.toBeInTheDocument();
	});

	test('a magnifier starts the field by default; icon="" removes it', async () => {
		const screen = await render(AsyncAutocomplete, { label: 'Client', searcher: instant() });
		const path = screen.container.querySelector('.aurora-autocomplete-start svg path');
		expect(path?.getAttribute('d')).toMatch(/^M9\.5,3A6\.5/);
		await screen.unmount();

		const plain = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher: instant(),
			icon: ''
		});
		expect(plain.container.querySelector('.aurora-autocomplete-start')).toBeNull();
	});

	test('v4 bug: many searches in a row keep working', async () => {
		const searcher = instant();
		const screen = await render(AsyncAutocomplete, { label: 'Client', searcher });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('m');
		for (let count = 1; count <= 25; count++) {
			screen.component.search();
			await expect.poll(() => searcher.mock.calls.length).toBe(count);
		}
		await expect.poll(optionLabels).toEqual(MAR);
	});

	test('destroying the component aborts the running search', async () => {
		const { searcher, calls } = deferred();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0
		});
		await screen.getByRole('combobox').click();
		await userEvent.fill(screen.getByRole('combobox'), 'mar');
		await expect.poll(() => calls.length).toBe(1);
		await screen.unmount();
		expect(calls[0].signal.aborted).toBe(true);
	});

	test('a search aborted by destroying the component is not an error', async () => {
		const { searcher, calls } = deferred();
		const onerror = vi.fn();
		const screen = await render(AsyncAutocomplete, {
			label: 'Client',
			searcher,
			debounceTimeout: 0,
			onerror
		});
		await screen.getByRole('combobox').click();
		await userEvent.fill(screen.getByRole('combobox'), 'mar');
		await expect.poll(() => calls.length).toBe(1);
		await screen.unmount();
		await new Promise((resolve) => setTimeout(resolve));
		expect(onerror).not.toHaveBeenCalled();
	});
});
